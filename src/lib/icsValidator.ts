// Validador leve de arquivos .ics (RFC 5545) usado para garantir compatibilidade
// com Google Calendar, Apple iCal/Calendar e Outlook antes do download.
//
// Não substitui um parser completo; foca nas regras que mais quebram importação:
//   - terminadores de linha CRLF
//   - blocos BEGIN/END pareados (VCALENDAR, VEVENT, VTIMEZONE, VALARM)
//   - propriedades obrigatórias (VERSION, PRODID, UID, DTSTAMP, DTSTART)
//   - DTEND ou DURATION no VEVENT
//   - VTIMEZONE presente quando alguma propriedade usa TZID
//   - VALARM contendo ACTION e TRIGGER
//   - linhas com mais de 75 octetos (aviso — deveriam ser dobradas)

export interface IcsValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  info: {
    bytes: number;
    lines: number;
    crlf: boolean;
    events: number;
    hasTimezone: boolean;
    hasAlarms: number;
    uid?: string;
    dtstart?: string;
    dtend?: string;
    duration?: string;
    summary?: string;
    url?: string;
    location?: string;
  };
}

const PROP = (line: string) => line.split(/[;:]/, 1)[0]?.toUpperCase() ?? "";
const VALUE = (line: string) => {
  const idx = line.indexOf(":");
  return idx === -1 ? "" : line.slice(idx + 1);
};

export function validateIcs(ics: string): IcsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const crlf = ics.includes("\r\n");
  if (!crlf) errors.push("Linhas devem terminar em CRLF (\\r\\n) — RFC 5545 §3.1.");

  // Normaliza para análise tolerante mas mantém contagem de octetos por linha original
  const rawLines = ics.split(/\r?\n/);
  // Desdobra continuações (linha que começa com espaço/tab é continuação da anterior)
  const lines: string[] = [];
  for (const l of rawLines) {
    if (l.length > 0 && (l[0] === " " || l[0] === "\t") && lines.length > 0) {
      lines[lines.length - 1] += l.slice(1);
    } else {
      lines.push(l);
    }
  }

  // Limite de 75 octetos por linha (RFC 5545 §3.1) — só aviso, não erro
  for (let i = 0; i < rawLines.length; i++) {
    const bytes = new TextEncoder().encode(rawLines[i]).length;
    if (bytes > 75) {
      warnings.push(`Linha ${i + 1} tem ${bytes} octetos (>75); recomenda-se dobrar.`);
    }
  }

  // Stack de blocos BEGIN/END
  const stack: string[] = [];
  let events = 0;
  let alarms = 0;
  let hasTimezone = false;
  let currentEvent: Record<string, string> | null = null;
  let currentAlarm: Record<string, string> | null = null;
  const usedTzids = new Set<string>();
  const tzidsDeclared = new Set<string>();
  let topVersion = false;
  let topProdId = false;
  let firstEvent: Record<string, string> | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const prop = PROP(line);
    const value = VALUE(line);

    if (prop === "BEGIN") {
      stack.push(value);
      if (value === "VEVENT") {
        events += 1;
        currentEvent = {};
      } else if (value === "VALARM") {
        alarms += 1;
        currentAlarm = {};
      } else if (value === "VTIMEZONE") {
        hasTimezone = true;
      }
      continue;
    }
    if (prop === "END") {
      const open = stack.pop();
      if (open !== value) {
        errors.push(`BEGIN/END desalinhados: esperava END:${open}, recebi END:${value}.`);
      }
      if (value === "VTIMEZONE") {
        // captura TZID declarado
      }
      if (value === "VEVENT" && currentEvent) {
        for (const req of ["UID", "DTSTAMP", "DTSTART"]) {
          if (!currentEvent[req]) errors.push(`VEVENT sem propriedade obrigatória ${req}.`);
        }
        if (!currentEvent.DTEND && !currentEvent.DURATION) {
          errors.push("VEVENT sem DTEND e sem DURATION.");
        }
        // URL e LOCATION não são obrigatórios por RFC, mas são essenciais para teleconsulta
        if (!currentEvent.URL) {
          warnings.push("VEVENT sem URL — link da sala não estará disponível no calendário.");
        } else if (!/^https?:\/\//i.test(currentEvent.URL)) {
          warnings.push(`URL "${currentEvent.URL}" não parece ser um endereço web válido.`);
        }
        if (!currentEvent.LOCATION) {
          warnings.push("VEVENT sem LOCATION — campo de localização ficará vazio no calendário.");
        }
        if (!firstEvent) firstEvent = currentEvent;
        currentEvent = null;
      }
      if (value === "VALARM" && currentAlarm) {
        if (!currentAlarm.ACTION) errors.push("VALARM sem ACTION.");
        if (!currentAlarm.TRIGGER) errors.push("VALARM sem TRIGGER.");
        currentAlarm = null;
      }
      continue;
    }

    // Captura TZIDs usados em parâmetros como DTSTART;TZID=...:value
    const tzidMatch = line.match(/;TZID=([^:;]+)/i);
    if (tzidMatch) usedTzids.add(tzidMatch[1]);
    if (prop === "TZID" && stack[stack.length - 1] === "VTIMEZONE") {
      tzidsDeclared.add(value);
    }

    if (stack.length === 1 && stack[0] === "VCALENDAR") {
      if (prop === "VERSION") {
        topVersion = true;
        if (value.trim() !== "2.0") errors.push(`VERSION deve ser 2.0 (recebido: "${value}").`);
      }
      if (prop === "PRODID") topProdId = true;
    }

    if (currentEvent && currentAlarm == null) {
      currentEvent[prop] = value;
    }
    if (currentAlarm) {
      currentAlarm[prop] = value;
    }
  }

  if (stack.length > 0) errors.push(`Blocos não fechados: ${stack.join(" > ")}.`);
  if (!ics.startsWith("BEGIN:VCALENDAR")) errors.push("Arquivo deve começar com BEGIN:VCALENDAR.");
  if (!ics.trimEnd().endsWith("END:VCALENDAR")) errors.push("Arquivo deve terminar com END:VCALENDAR.");
  if (!topVersion) errors.push("VCALENDAR sem VERSION:2.0.");
  if (!topProdId) errors.push("VCALENDAR sem PRODID.");
  if (events === 0) errors.push("Nenhum VEVENT encontrado.");

  for (const tz of usedTzids) {
    if (!tzidsDeclared.has(tz)) {
      warnings.push(
        `TZID "${tz}" usado mas não declarado em VTIMEZONE — Apple iCal pode interpretar como floating time.`,
      );
    }
  }

  const info: IcsValidationResult["info"] = {
    bytes: new TextEncoder().encode(ics).length,
    lines: rawLines.length,
    crlf,
    events,
    hasTimezone,
    hasAlarms: alarms,
    uid: firstEvent?.UID,
    dtstart: firstEvent?.DTSTART,
    dtend: firstEvent?.DTEND,
    duration: firstEvent?.DURATION,
    summary: firstEvent?.SUMMARY,
    url: firstEvent?.URL,
    location: firstEvent?.LOCATION,
  };

  return { ok: errors.length === 0, errors, warnings, info };
}

/**
 * Loga o resultado da validação no console de forma agrupada, com prefixo claro
 * para facilitar o debug em produção (Google Calendar / Apple iCal).
 */
export function logIcsValidation(label: string, ics: string, result: IcsValidationResult) {
  const tag = result.ok ? "✅" : "❌";

  console.groupCollapsed(`[ICS] ${tag} ${label} — ${result.info.bytes}B, ${result.info.events} evento(s)`);

  console.log("info:", result.info);
  if (result.errors.length) console.error("errors:", result.errors);
  if (result.warnings.length) console.warn("warnings:", result.warnings);

  console.log("preview:\n" + ics.split(/\r?\n/).slice(0, 40).join("\n"));

  console.groupEnd();
}
