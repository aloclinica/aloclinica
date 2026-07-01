import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
// SECURITY: throttle this paid LLM endpoint. Public but rate-limited (per-user when a JWT is present, else per-IP).
import { getCaller, checkRateLimit } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    // SECURITY: rate limit — prefer authenticated user id, fall back to client IP.
    const caller = await getCaller(req)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rlKey = caller.user?.id ?? ip
    if (!(await checkRateLimit(rlKey, 'ai-symptom-triage', 12, 10))) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { symptoms } = await req.json()
    if (!symptoms || typeof symptoms !== 'string') {
      return new Response(JSON.stringify({ error: 'symptoms required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const apiKey = Deno.env.get('LOVABLE_API_KEY')!
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é assistente de triagem médica. Dado um sintoma, sugira a especialidade mais adequada (apenas o nome em PT-BR, ex: "Clínico Geral", "Cardiologia", "Dermatologia") e nível de urgência (baixa/media/alta). Responda APENAS JSON: {"specialty":"...","urgency":"...","reason":"..."}' },
          { role: 'user', content: symptoms }
        ]
      })
    })
    const data = await res.json()
    let parsed: any = {}
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content?.replace(/```json|```/g,'').trim() || '{}') } catch {}
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})