import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
// SECURITY: authenticate the caller before generating a document with service-role.
import { getCaller, isInternalOrService, checkRateLimit } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { prescription_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // SECURITY: trusted server-to-server callers (internal secret / service role) bypass
    // the per-user check. Otherwise require an authenticated caller (JWT). No token => 401.
    const internal = isInternalOrService(req)
    const caller = await getCaller(req)
    if (!internal && !caller.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    // Rate limit (não-interno): evita spam de geração de documentos.
    if (!internal && caller.user) {
      const ok = await checkRateLimit(caller.user.id, 'generate-prescription-pdf', 30, 10)
      if (!ok) return new Response(JSON.stringify({ error: 'Muitas gerações de documento. Aguarde alguns minutos.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: rx, error } = await supabase.from('prescriptions').select('*').eq('id', prescription_id).maybeSingle()
    if (error || !rx) throw new Error('Prescription not found')

    // SECURITY (IDOR gate): allow internal/service, the prescribing doctor (owner),
    // the patient (owner, read-only), or an admin. Everyone else => 403.
    const { data: callerDoctor } = caller.user
      ? await supabase.from('doctor_profiles').select('id').eq('user_id', caller.user.id).maybeSingle()
      : { data: null }
    const isDoctorOwner = !!callerDoctor && callerDoctor.id === rx.doctor_id
    const isPatientOwner = !!caller.user && rx.patient_id === caller.user.id
    if (!internal && !isDoctorOwner && !isPatientOwner && !caller.isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: patient } = await supabase.from('profiles').select('first_name,last_name,cpf,address_street,address_city,address_state,address_zip,city,state').eq('user_id', rx.patient_id).maybeSingle()
    const { data: doctor } = await supabase.from('doctor_profiles').select('crm,crm_state,user_id,professional_address').eq('id', rx.doctor_id).maybeSingle()
    const { data: doctorProfile } = doctor ? await supabase.from('profiles').select('first_name,last_name').eq('user_id', doctor.user_id).maybeSingle() : { data: null }

    // SECURITY: keep a verification code for lookup, but do NOT fabricate a signature hash.
    // A real signature must come from the ICP-Brasil flow (register-signature); this PDF is unsigned.
    const code = rx.verification_code || crypto.randomUUID().slice(0, 8).toUpperCase()

    // CFM 2.314/2022 Art. 13: endereço do paciente. doctor_profiles NÃO possui
    // coluna de endereço profissional — usa-se um valor configurável (env) com
    // fallback explícito. Ver relatório: falta coluna de endereço em doctor_profiles.
    const patientAddress = [
      patient?.address_street,
      patient?.address_city || patient?.city,
      patient?.address_state || patient?.state,
      patient?.address_zip ? `CEP ${patient.address_zip}` : null,
    ].filter(Boolean).join(', ')
    const doctorAddress = (doctor as any)?.professional_address || Deno.env.get('DOCTOR_PROFESSIONAL_ADDRESS') || '[Endereço profissional do médico não cadastrado]'
    const emittedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842])
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    let y = 800
    const draw = (t: string, f = font, s = 11) => { page.drawText(t, { x: 50, y, size: s, font: f, color: rgb(0.1, 0.1, 0.2) }); y -= s + 6 }

    draw('RECEITUÁRIO MÉDICO', bold, 16); y -= 6
    draw(`Dr(a). ${doctorProfile?.first_name || ''} ${doctorProfile?.last_name || ''} — CRM ${doctor?.crm || ''}/${doctor?.crm_state || ''}`, bold)
    draw(`Endereço profissional: ${doctorAddress}`, font, 9)
    y -= 8
    draw(`Paciente: ${patient?.first_name || ''} ${patient?.last_name || ''}`)
    if (patient?.cpf) draw(`CPF: ${patient.cpf}`)
    if (patientAddress) draw(`Endereço: ${patientAddress}`, font, 9)
    draw('Local do atendimento: Telemedicina (atendimento remoto)', font, 9)
    draw(`Data e hora de emissão: ${emittedAt}`, font, 9)
    if (rx.diagnosis) draw(`Diagnóstico: ${rx.diagnosis}`)
    y -= 10
    draw('Medicamentos:', bold, 13)
    const meds = Array.isArray(rx.medications) ? rx.medications : []
    meds.forEach((m: any, i: number) => {
      draw(`${i + 1}. ${m.name || ''} ${m.dosage || ''}`)
      if (m.posology) draw(`   ${m.posology}`)
    })
    if (rx.instructions) { y -= 8; draw('Instruções:', bold); draw(rx.instructions) }
    y = 100
    // HONESTY: this PDF is NOT an ICP-Brasil digital signature. Show an honest SHA-256
    // integrity code plus an explicit disclaimer instead of a fake "digital signature".
    const integrityBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${prescription_id}|${code}`))
    const integrityHash = Array.from(new Uint8Array(integrityBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
    draw(`Código de integridade (SHA-256): ${integrityHash.slice(0, 32)}`, font, 9)
    draw('Documento emitido eletronicamente — sem assinatura digital ICP-Brasil.', font, 9)
    draw('Documento emitido em modalidade de Telemedicina — Resolução CFM nº 2.314/2022.', font, 9)
    draw(`Código de verificação: ${code}`, font, 9)
    draw(`Verifique em: aloclinica.com.br/verify/${code}`, font, 9)

    const bytes = await pdf.save()
    const path = `${rx.patient_id}/${prescription_id}.pdf`
    await supabase.storage.from('prescriptions').upload(path, bytes, { contentType: 'application/pdf', upsert: true })
    // Sigilo (CFM Art. 3 / LGPD): bucket privado + URL ASSINADA (não pública/enumerável).
    const { data: signed } = await supabase.storage.from('prescriptions').createSignedUrl(path, 60 * 60 * 24 * 365)
    const pdfUrl = signed?.signedUrl ?? null

    // SECURITY: persist only the generated PDF url + verification code. Do NOT set
    // is_signed / signature_hash / signed_at here — signing is done by register-signature
    // (ICP-Brasil). Generating a PDF must never mark a prescription as signed.
    await supabase.from('prescriptions').update({
      pdf_url: pdfUrl, verification_code: code,
    }).eq('id', prescription_id)

    // SECURITY: removed the document_verifications upsert that asserted is_valid=true.
    // A verification record must only be created by the real signing flow, otherwise
    // an unsigned PDF would appear "valid" at the public /verify endpoint.

    return new Response(JSON.stringify({ ok: true, url: pdfUrl, code }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})