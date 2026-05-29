/**
 * /parceiros/aceitar/:token — gestor abre o link recebido. Se já está logado,
 * chama fn_accept_manager_invite e cai no painel do contrato. Se não está,
 * orienta a criar conta antes (link já carrega o token para uso pós-login).
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const AceitarConvite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<{ email: string; contrato_nome: string; expires_at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      const { data, error } = await db.from("contract_manager_invites")
        .select("email, expires_at, used_at, contrato_id, contratos!inner(nome)")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) { setError("Convite não encontrado."); setLoading(false); return; }
      const i: any = data;
      if (i.used_at) { setError("Este convite já foi usado."); setLoading(false); return; }
      if (new Date(i.expires_at).getTime() < Date.now()) { setError("Este convite expirou. Solicite um novo."); setLoading(false); return; }
      setInviteInfo({ email: i.email, contrato_nome: i.contratos?.nome ?? "Contrato", expires_at: i.expires_at });
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const { data, error } = await db.rpc("fn_accept_manager_invite", { p_token: token } as any);
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) { setError(`Não foi possível aceitar: ${r?.error ?? "erro desconhecido"}`); return; }
      navigate("/dashboard/orgao");
    } catch (e: any) {
      setError(e?.message ?? "Erro ao aceitar convite");
    } finally { setAccepting(false); }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <SEOHead title="Aceitar convite | AloClínica" description="Aceite o convite para gerenciar um contrato AloClínica" />
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          {loading || authLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          ) : error ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <p className="font-semibold text-foreground">{error}</p>
              <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">Voltar à home</Button>
            </>
          ) : !inviteInfo ? null : !user ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Convite para gerenciar o contrato</p>
                <p className="text-lg font-bold text-primary mt-1">{inviteInfo.contrato_nome}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Crie sua conta usando o e-mail <strong>{inviteInfo.email}</strong> ou faça login. Ao concluir, voltamos automaticamente para esta página para você aceitar.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate(`/paciente/cadastro?redirect=${encodeURIComponent(`/parceiros/aceitar/${token}`)}`)}
                  className="rounded-xl">
                  Criar conta com {inviteInfo.email}
                </Button>
                <Button variant="outline"
                  onClick={() => navigate(`/paciente?redirect=${encodeURIComponent(`/parceiros/aceitar/${token}`)}`)}
                  className="rounded-xl">
                  Já tenho conta — fazer login
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <p className="font-semibold text-foreground">Convite para gerenciar</p>
              <p className="text-lg font-bold text-primary">{inviteInfo.contrato_nome}</p>
              <p className="text-sm text-muted-foreground">
                Você está logado como <strong>{user.email}</strong>.
                {user.email?.toLowerCase() !== inviteInfo.email.toLowerCase() && (
                  <span className="block mt-1 text-amber-600 text-xs">
                    ⚠️ Convite originalmente para <strong>{inviteInfo.email}</strong>. Verifique se é a conta correta.
                  </span>
                )}
              </p>
              <Button onClick={accept} disabled={accepting} className="w-full rounded-xl">
                {accepting ? "Aceitando…" : "Aceitar e entrar no painel"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AceitarConvite;
