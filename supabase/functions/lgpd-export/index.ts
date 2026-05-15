import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ',''))
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

    const tables = ['profiles','appointments','prescriptions','medical_certificates','exam_requests','notifications','satisfaction_surveys','document_verifications']
    const exportData: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: user.id }
    for (const t of tables) {
      const col = t === 'profiles' ? 'user_id' : (t === 'appointments' || t === 'prescriptions' || t === 'medical_certificates' || t === 'exam_requests' || t === 'satisfaction_surveys' ? 'patient_id' : 'user_id')
      const { data } = await supabase.from(t).select('*').eq(col, user.id)
      exportData[t] = data || []
    }
    const json = JSON.stringify(exportData, null, 2)
    const path = `lgpd-exports/${user.id}-${Date.now()}.json`
    await supabase.storage.from('backups').upload(path, new Blob([json], { type: 'application/json' }), { upsert: true })
    const { data: signed } = await supabase.storage.from('backups').createSignedUrl(path, 60 * 60 * 24 * 7)

    await supabase.from('notifications').insert({
      user_id: user.id, title: '📦 Seus dados estão prontos',
      message: 'Exportação LGPD disponível por 7 dias.',
      type: 'document', link: signed?.signedUrl,
    })
    return new Response(JSON.stringify({ ok: true, url: signed?.signedUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})