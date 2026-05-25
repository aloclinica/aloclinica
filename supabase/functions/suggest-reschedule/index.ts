import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { safeEqual } from '../_shared/auth.ts'

/** Only the DB trigger (via invoke_edge_function) may call this. */
function internalAuthorized(req: Request): boolean {
  const secret = Deno.env.get('INTERNAL_FUNCTION_SECRET')
  return !!secret && safeEqual(req.headers.get('x-internal-secret'), secret)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (!internalAuthorized(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const { appointment_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: appt } = await supabase.from('appointments').select('patient_id, doctor_id, scheduled_at').eq('id', appointment_id).maybeSingle()
    if (!appt?.patient_id || !appt?.doctor_id) return new Response('skip', { headers: corsHeaders })

    // Find next 3 available slots from doctor_availability for the same doctor (next 14 days, after now)
    const { data: avail } = await supabase.from('doctor_availability').select('day_of_week, start_time, end_time').eq('doctor_id', appt.doctor_id).eq('is_active', true)
    const slots: string[] = []
    const now = new Date()
    for (let i = 1; i <= 14 && slots.length < 3; i++) {
      const d = new Date(now); d.setDate(d.getDate() + i)
      const dow = d.getDay()
      const match = (avail || []).find((a: any) => a.day_of_week === dow)
      if (match) {
        const [h, m] = String(match.start_time).split(':').map(Number)
        d.setHours(h, m || 0, 0, 0)
        slots.push(d.toISOString())
      }
    }

    const linkBase = `/dashboard/book?doctor=${appt.doctor_id}`
    const msg = slots.length
      ? `Sugestões de novo horário: ${slots.map(s => new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })).join(' | ')}`
      : 'Veja os próximos horários disponíveis.'

    await supabase.from('notifications').insert({
      user_id: appt.patient_id,
      title: '🔄 Que tal reagendar?',
      message: msg,
      type: 'info',
      link: linkBase,
    })

    return new Response(JSON.stringify({ ok: true, slots }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})