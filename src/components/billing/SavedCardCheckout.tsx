/**
 * SavedCardCheckout — seletor "pagar em 1 toque" com cartão salvo (vault MP).
 *
 * Reaproveita o vault (saved_cards) e cobra via edge function
 * `mercadopago-charge-saved-card` (valor resolvido no SERVIDOR pelo reference_id).
 *
 * Não faz tokenização nem cria backend de pagamento — só seleciona um cartão
 * salvo e dispara a cobrança. O fluxo pai é dono do `processing`, do consentimento
 * (quando houver) e da finalização pós-aprovação (onPay).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/supabase/untyped";
import type { SavedCard } from "./useSavedCards";

const brandColor: Record<string, string> = {
  VISA: "bg-blue-600 text-white",
  MASTERCARD: "bg-orange-600 text-white",
  AMEX: "bg-emerald-600 text-white",
  ELO: "bg-yellow-500 text-yellow-950",
  HIPERCARD: "bg-red-600 text-white",
  UNKNOWN: "bg-muted text-muted-foreground",
};

export type ChargeSavedCardResult = {
  ok: boolean;
  status?: string; // approved | pending | refused | ...
  payment_id?: string;
  message?: string;
  error?: string;
};

/**
 * Cobra um cartão salvo. O valor é SEMPRE resolvido no servidor a partir do
 * reference_id (nunca enviamos amount). Cupom é revalidado no servidor.
 */
export async function chargeSavedCard(opts: {
  savedCardId: string;
  referenceId: string;
  description?: string;
  securityCode?: string;
  installments?: number;
  couponCode?: string | null;
}): Promise<ChargeSavedCardResult> {
  const body: Record<string, any> = {
    saved_card_id: opts.savedCardId,
    reference_id: opts.referenceId,
    description: opts.description,
    installments: opts.installments ?? 1,
  };
  if (opts.securityCode) body.security_code = opts.securityCode;
  if (opts.couponCode) body.coupon_code = opts.couponCode;

  const { data, error } = await db.functions.invoke("mercadopago-charge-saved-card", { body });
  if (error || !data?.payment_id || data?.error) {
    return {
      ok: false,
      error: data?.error || error?.message || "pagamento_falhou",
      status: data?.status,
      message: data?.message,
    };
  }
  return { ok: true, status: data.status, payment_id: String(data.payment_id), message: data.message };
}

type Props = {
  cards: SavedCard[];
  /** Texto do botão de pagar (ex.: "Pagar R$ 89,00") */
  payLabel: string;
  /** Classe do botão de pagar (para casar com o tema de cada fluxo) */
  payClassName?: string;
  /** Lock de processamento — dono é o fluxo pai */
  processing: boolean;
  /** Dispara a cobrança do cartão escolhido (o pai trata consentimento/finalização) */
  onPay: (savedCardId: string, securityCode?: string) => void;
  /** Trocar para o formulário de novo cartão do fluxo */
  onUseNewCard: () => void;
};

export function SavedCardCheckout({ cards, payLabel, payClassName, processing, onPay, onUseNewCard }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cvv, setCvv] = useState("");

  // Seleção padrão: cartão default → primeiro da lista
  const effectiveId = selectedId ?? cards.find((c) => c.is_default)?.id ?? cards[0]?.id ?? null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {cards.map((c) => {
          const selected = effectiveId === c.id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                selected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <div className={cn("w-10 h-7 rounded flex items-center justify-center text-[10px] font-bold", brandColor[c.brand] ?? brandColor.UNKNOWN)}>
                {c.brand?.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">•••• {c.last4}</span>
                  {c.is_default && (
                    <Badge variant="outline" className="text-[10px] gap-0.5 border-amber-200 text-amber-700">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> padrão
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {c.holder_name} · {c.expiry_month}/{c.expiry_year.slice(-2)}
                </div>
              </div>
              <div className={cn("w-4 h-4 rounded-full border-2 shrink-0", selected ? "border-primary bg-primary" : "border-muted-foreground/30")} />
            </button>
          );
        })}
      </div>

      <div className="flex items-end gap-3">
        <div className="w-24">
          <Label className="text-[11px] text-muted-foreground">CVV</Label>
          <Input
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="•••"
            maxLength={4}
            type="password"
            className="mt-1 h-11 rounded-xl font-mono text-center"
          />
        </div>
        <p className="text-[11px] text-muted-foreground flex-1 pb-2.5">
          Se o seu banco solicitar, informe o CVV do cartão.
        </p>
      </div>

      <Button
        className={cn("w-full h-12 rounded-2xl font-bold", payClassName)}
        disabled={processing || !effectiveId}
        onClick={() => effectiveId && onPay(effectiveId, cvv || undefined)}
      >
        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
        {payLabel}
      </Button>

      <Button type="button" variant="outline" className="w-full h-11 rounded-2xl gap-1.5" onClick={onUseNewCard} disabled={processing}>
        <Plus className="w-4 h-4" /> Usar outro cartão
      </Button>
    </div>
  );
}

export default SavedCardCheckout;
