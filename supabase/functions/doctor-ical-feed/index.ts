/**
 * doctor-ical-feed — devolve um feed iCalendar (.ics) com as consultas do médico,
 * para ser assinado em Google Calendar / Apple Calendar.
 *
 * URL pública:
 *   GET /functions/v1/doctor-ical-feed?token=<DOCTOR_ICAL_TOKEN>
 *
 * O token é o doctor_profiles.ical_token (UUID), gerado on-demand quando
 * o médico clica "Sincronizar com calendário" no painel.
 * O feed inclui as próximas 90 dias + 30 passados.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAY_MS = 86_400_000;

function esc(s: string) {
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return new Response("Missing token", { status: 400 });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: doc } = await sb.from("doctor_profiles")
      .select("id, user_id")
      .eq("ical_token", token)
      .maybeSingle();
    if (!doc) return new Response("Invalid token", { status: 404 });

    const now = Date.now();
    const from = new Date(now - 30 * DAY_MS).toISOString();
    const to   = new Date(now + 90 * DAY_MS).toISOString();

    // SECURITY: do not select free-text `notes` — it is PHI and this feed is
    // reachable with only a URL token.
    const { data: appts } = await sb.from("appointments")
      .select("id, scheduled_at, duration_minutes, status, patient_id")
      .eq("doctor_id", (doc as any).id)
      .gte("scheduled_at", from).lte("scheduled_at", to)
      .order("scheduled_at", { ascending: true })
      .limit(500);

    const patientIds = [...new Set((appts ?? []).map((a: any) => a.patient_id).filter(Boolean))] as string[];
    let nameMap = new Map<string, string>();
    if (patientIds.length) {
      // SECURITY: minimize PHI — expose first name + last-name initial only.
      const { data: profs } = await sb.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
      nameMap = new Map<string, string>((profs ?? []).map((p: any) => {
        const first = (p.first_name ?? "").trim();
        const initial = (p.last_name ?? "").trim().charAt(0);
        return [p.user_id, [first, initial ? `${initial}.` : ""].filter(Boolean).join(" ")];
      }));
    }

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AloClinica//Doctor Schedule//PT-BR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:AloClínica — Agenda`,
      `X-WR-TIMEZONE:America/Sao_Paulo`,
    ];

    for (const a of (appts ?? []) as any[]) {
      const start = new Date(a.scheduled_at);
      const dur = Number(a.duration_minutes) || 30;
      const end = new Date(start.getTime() + dur * 60_000);
      const name = a.patient_id ? (nameMap.get(a.patient_id) || "Paciente") : "Paciente avulso";
      const isCancelled = a.status === "cancelled" || a.status === "no_show";

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:appt-${a.id}@aloclinica.com.br`);
      lines.push(`DTSTAMP:${icsDate(new Date())}`);
      lines.push(`DTSTART:${icsDate(start)}`);
      lines.push(`DTEND:${icsDate(end)}`);
      lines.push(`SUMMARY:${esc(`Consulta — ${name}`)}`);
      // SECURITY: no free-text notes in the feed; keep name + status + link only.
      lines.push(`DESCRIPTION:${esc(`Status: ${a.status}\n\nAcessar: https://aloclinica.com.br/dashboard/consultation/${a.id}`)}`);
      lines.push(`URL:https://aloclinica.com.br/dashboard/consultation/${a.id}`);
      lines.push(`STATUS:${isCancelled ? "CANCELLED" : "CONFIRMED"}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");

    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "inline; filename=aloclinica.ics",
        // SECURITY: token-in-URL PHI feed must not be cached by proxies/CDNs.
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("doctor-ical-feed error:", e?.message);
    return new Response("Internal error", { status: 500 });
  }
});
