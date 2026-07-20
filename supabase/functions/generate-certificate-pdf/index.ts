import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
// SECURITY: authenticate the caller before issuing a medical certificate with service-role.
import { getCaller, isInternalOrService } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { appointment_id, days_off, cid_code, reason } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // SECURITY: trusted server-to-server callers (internal secret / service role) bypass
    // the per-user check. Otherwise require an authenticated caller (JWT). No token => 401.
    const internal = isInternalOrService(req)
    const caller = await getCaller(req)
    if (!internal && !caller.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: appt } = await supabase.from('appointments').select('*').eq('id', appointment_id).maybeSingle()
    if (!appt) throw new Error('Appointment not found')

    // SECURITY (IDOR gate): allow internal/service, the doctor assigned to this
    // appointment (owner), or an admin. Everyone else => 403.
    const { data: callerDoctor } = caller.user
      ? await supabase.from('doctor_profiles').select('id').eq('user_id', caller.user.id).maybeSingle()
      : { data: null }
    const isDoctorOwner = !!callerDoctor && callerDoctor.id === appt.doctor_id
    if (!internal && !isDoctorOwner && !caller.isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: patient } = await supabase.from('profiles').select('first_name,last_name,cpf,address_street,address_city,address_state,address_zip,city,state').eq('user_id', appt.patient_id).maybeSingle()
    const { data: doctor } = await supabase.from('doctor_profiles').select('crm,crm_state,user_id,professional_address').eq('id', appt.doctor_id).maybeSingle()
    const { data: dProf } = doctor ? await supabase.from('profiles').select('first_name,last_name').eq('user_id', doctor.user_id).maybeSingle() : { data: null }

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

    const code = crypto.randomUUID().slice(0, 8).toUpperCase()
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(appointment_id + code))
    const sigHash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32)

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842])
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    let y = 780
    const draw = (t: string, f = font, s = 11) => { page.drawText(t, { x: 50, y, size: s, font: f, color: rgb(0.1,0.1,0.2) }); y -= s + 8 }

    draw('ATESTADO MÉDICO', bold, 18); y -= 10
    draw(`Atesto, para os devidos fins, que o(a) paciente ${patient?.first_name||''} ${patient?.last_name||''}${patient?.cpf?` (CPF ${patient.cpf})`:''}`, font, 12)
    if (patientAddress) draw(`Endereço do paciente: ${patientAddress}`, font, 9)
    draw(`esteve sob meus cuidados profissionais em ${new Date().toLocaleDateString('pt-BR')},`, font, 12)
    draw(`necessitando de afastamento de suas atividades por ${days_off} dia(s).`, font, 12)
    if (cid_code) { y -= 6; draw(`CID: ${cid_code}`, font, 11) }
    if (reason) { y -= 6; draw(`Observação: ${reason}`, font, 11) }
    y -= 6
    draw('Local do atendimento: Telemedicina (atendimento remoto)', font, 10)
    draw(`Data e hora de emissão: ${emittedAt}`, font, 10)
    y = 200
    draw(`Dr(a). ${dProf?.first_name||''} ${dProf?.last_name||''}`, bold, 12)
    draw(`CRM ${doctor?.crm||''}/${doctor?.crm_state||''}`, font, 11)
    draw(`Endereço profissional: ${doctorAddress}`, font, 9)
    y -= 30
    draw(`Código de integridade (SHA-256): ${sigHash}`, font, 9)
    draw('Documento emitido eletronicamente — sem assinatura digital ICP-Brasil.', font, 9)
    draw('Documento emitido em modalidade de Telemedicina — Resolução CFM nº 2.314/2022.', font, 9)
    draw(`Código de verificação: ${code}`, font, 9)
    draw(`Verifique em: aloclinica.com.br/verify/${code}`, font, 9)

    const bytes = await pdf.save()
    const path = `${appt.patient_id}/${appointment_id}-${code}.pdf`
    await supabase.storage.from('prescriptions').upload(path, bytes, { contentType: 'application/pdf', upsert: true })
    const { data: pub } = supabase.storage.from('prescriptions').getPublicUrl(path)

    const { data: cert } = await supabase.from('medical_certificates').insert({
      appointment_id, patient_id: appt.patient_id, doctor_id: appt.doctor_id,
      days_off, cid_code, reason, pdf_url: pub.publicUrl,
      verification_code: code, signature_hash: sigHash, signed_at: new Date().toISOString(),
    }).select().maybeSingle()

    await supabase.from('document_verifications').upsert({
      verification_code: code, document_type: 'certificate', document_id: cert?.id,
      is_valid: true,
      patient_name: `${patient?.first_name||''} ${patient?.last_name||''}`.trim(),
      doctor_name: `${dProf?.first_name||''} ${dProf?.last_name||''}`.trim(),
      doctor_crm: `${doctor?.crm||''}/${doctor?.crm_state||''}`,
      verified_at: new Date().toISOString(),
    }, { onConflict: 'verification_code' })

    await supabase.from('notifications').insert({
      user_id: appt.patient_id, title: '📄 Atestado médico disponível',
      message: `${days_off} dia(s) de afastamento.`, type: 'document',
      link: pub.publicUrl,
    })

    return new Response(JSON.stringify({ ok: true, url: pub.publicUrl, code }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})