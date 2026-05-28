import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { Heart, AlertCircle, CheckCircle2 } from "lucide-react";
import { useContrato } from "@/contexts/ContratoContext";

/**
 * Página de entrada para ações sociais.
 * Paciente entra um código de voucher fornecido pelo patrocinador
 * (prefeitura, ONG, etc). Voucher dá direito a N consultas gratuitas
 * em especialidades específicas.
 */
const AcoesEntrar = () => {
  const navigate = useNavigate();
  const { setVoucherContrato } = useContrato();
  const [codigo, setCodigo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const handleValidar = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codigo.trim().toUpperCase();
    setErrMsg(null);
    setOkMsg(null);
    if (!clean) { setErrMsg("Digite o código do voucher."); return; }
    if (clean.length < 4) { setErrMsg("Código muito curto — verifique e tente novamente."); return; }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("validate-voucher", {
      body: { codigo: clean },
    });
    setSubmitting(false);

    if (error || !data?.valid) {
      const msg = data?.error ?? error?.message ?? "Voucher inválido ou expirado";
      setErrMsg(msg);
      toast.error(msg);
      return;
    }

    // Guarda voucher na sessão para o fluxo de agendamento usar
    sessionStorage.setItem("aloclinica_voucher", JSON.stringify(data));
    // Ativa o contrato no contexto (branding + modo voucher no agendamento)
    if (data.contrato) {
      setVoucherContrato({
        id: data.contrato.id,
        nome: data.contrato.nome,
        tipo: data.contrato.tipo,
        modelo_cobranca: "gratuito_patrocinado",
        especialidades_permitidas: data.contrato.especialidades_permitidas ?? [],
        branding: data.contrato.branding ?? {},
        status: "ativo",
        subdominio: null,
      });
    }
    setOkMsg(`Programa: ${data.contrato.nome}`);
    toast.success(`Voucher validado! Programa: ${data.contrato.nome}`);
    navigate("/paciente?voucher=1");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEOHead title="Ações Sociais | AloClínica" description="Use seu voucher de campanha de saúde" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="text-primary" />
            <CardTitle>Ações Sociais</CardTitle>
          </div>
          <CardDescription>
            Insira o código do voucher fornecido pelo patrocinador da campanha para
            agendar sua consulta gratuita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleValidar}>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código do voucher</Label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.toUpperCase()); if (errMsg) setErrMsg(null); }}
                placeholder="EX: SAUDE2026"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={!!errMsg}
                aria-describedby={errMsg ? "voucher-erro" : okMsg ? "voucher-ok" : undefined}
                required
              />
              {errMsg && (
                <p id="voucher-erro" className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errMsg}
                </p>
              )}
              {okMsg && (
                <p id="voucher-ok" className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {okMsg}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !codigo.trim()}>
              {submitting ? "Validando..." : "Validar e continuar"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Não tem voucher? Volte para o site e use o agendamento normal.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcoesEntrar;