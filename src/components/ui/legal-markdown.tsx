import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * Renderiza o corpo (Markdown) de um documento legal — termos, TCLE, contratos.
 * Antes esses textos eram exibidos como texto cru dentro de <pre>, o que quebrava
 * títulos, listas, negrito e links. Aqui usamos o mesmo react-markdown já adotado
 * no resto do app, com a tipografia `prose` do Tailwind.
 *
 * Sem HTML embutido (react-markdown ignora HTML por padrão), então o conteúdo do
 * admin não pode injetar <script> — seguro para renderizar no navegador.
 */
export function LegalMarkdown({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-foreground",
        "prose-headings:font-semibold prose-headings:text-foreground",
        "prose-a:text-primary prose-strong:text-foreground",
        className,
      )}
    >
      <ReactMarkdown>{source || "_Documento sem conteúdo._"}</ReactMarkdown>
    </div>
  );
}

export default LegalMarkdown;
