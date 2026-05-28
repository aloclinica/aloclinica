/**
 * Mapa de calor — grid regional dos 27 UFs do Brasil.
 * Cada tile é uma UF posicionada de acordo com sua macrorregião (Norte no
 * topo, Sul embaixo). A cor reflete a intensidade do uso (consultas).
 * Visualmente "mapa", sem custo de SVG geográfico.
 */
import { useMemo } from "react";

interface Props {
  counts: Map<string, number>;
}

// Layout regional em grid 5x7 (linhas × colunas). Ordem aproxima a geografia.
const LAYOUT: (string | null)[][] = [
  // Norte
  [null, "RR", "AP", null,  null, null, null],
  ["AC", "AM", "PA", "MA",  "CE", "RN", null ],
  ["RO", "MT", "TO", "PI",  "PE", "PB", null ],
  // Centro-Oeste + Nordeste sul
  [null, "MS", "GO", "DF",  "BA", "AL", "SE"],
  // Sudeste
  [null, null, "MG", "ES",  null, null, null],
  [null, null, "SP", "RJ",  null, null, null],
  // Sul
  [null, "PR", "SC", "RS",  null, null, null],
];

const UF_NAME: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

export default function BrazilHeatGrid({ counts }: Props) {
  const max = useMemo(() => Math.max(0, ...[...counts.values()]), [counts]);
  const total = useMemo(() => [...counts.values()].reduce((a, b) => a + b, 0), [counts]);

  const intensity = (n: number) => {
    if (max === 0) return 0;
    return Math.min(1, n / max);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {LAYOUT.flat().map((uf, i) => {
          if (!uf) return <div key={i} aria-hidden="true" />;
          const count = counts.get(uf) ?? 0;
          const t = intensity(count);
          const bg = t === 0
            ? "hsl(var(--muted) / 0.4)"
            : `hsl(var(--primary) / ${0.18 + t * 0.62})`;
          const fg = t > 0.55 ? "white" : "hsl(var(--foreground))";
          return (
            <div
              key={uf}
              title={`${UF_NAME[uf] ?? uf}: ${count} consulta${count === 1 ? "" : "s"}`}
              role="img"
              aria-label={`${UF_NAME[uf] ?? uf}: ${count} consultas`}
              className="aspect-square rounded-lg flex flex-col items-center justify-center border border-border/30 transition-transform hover:scale-105"
              style={{ background: bg, color: fg }}
            >
              <span className="text-[10px] font-bold leading-none">{uf}</span>
              {count > 0 && <span className="text-[10px] tabular-nums mt-0.5 leading-none">{count}</span>}
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{total} consultas geolocalizadas</span>
          <div className="flex items-center gap-1.5">
            <span>menor</span>
            <div className="flex gap-0.5">
              {[0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                <span key={t} className="w-3 h-3 rounded-sm" style={{ background: `hsl(var(--primary) / ${0.18 + t * 0.62})` }} />
              ))}
            </div>
            <span>maior</span>
          </div>
        </div>
      )}
    </div>
  );
}
