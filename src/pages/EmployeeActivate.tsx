import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function EmployeeActivate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [invite, setInvite] = useState<{ email: string; status: string; expires_at: string | null; company: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) { setError("Token inválido"); setLoading(false); return; }
      try {
        const { data, error: dbErr } = await db
          .from("employee_invites")
          .select("employee_email, status, expires_at, company_card_orders!inner(company_id, companies!inner(legal_name, trade_name))")
          .eq("invite_token", token)
          .single();
        if (dbErr || !data) { setError("Convite não encontrado"); setLoading(false); return; }
        const company = (data as any).company_card_orders?.companies?.trade_name
          ?? (data as any).company_card_orders?.companies?.legal_name
          ?? "—";
        setInvite({
          email: (data as any).employee_email,
          status: (data as any).status,
          expires_at: (data as any).expires_at,
          company,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao buscar convite");
      } finally { setLoading(false); }
    })();
  }, [token]);

  const activate = async () => {
    if (!user) {
      navigate(`/paciente?redirect=/funcionario/ativar/${token}`);
      return;
    }
    setActivating(true);
    try {
      const { data, error: fnErr } = await db.functions.invoke("activate-employee-invite", {
        body: { invite_token: token },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error(data?.error || "Falha ao ativar");
      toast.success("Cartão ativado! Redirecionando...");
      navigate("/cartao-beneficios");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar");
    } finally { setActivating(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <h2 className="text-lg font-bold mb-2">Convite indisponível</h2>
            <p className="text-sm text-muted-foreground mb-4">{error || "Convite não encontrado ou já utilizado."}</p>
            <Link to="/"><Button variant="outline">Ir para início</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expired = invite.expires_at && new Date(invite.expires_at) < new Date();
  const used = invite.status === "accepted";

  return (
    <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>Ativar Pingo Card</CardTitle>
              <CardDescription>Cortesia da empresa <strong>{invite.company}</strong></CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 rounded p-3 text-sm">
            <p>Convite para: <strong>{invite.email}</strong></p>
            {invite.expires_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Válido até {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          {used ? (
            <div className="text-center text-green-600 flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-10 h-10" />
              <p className="text-sm font-medium">Cartão já está ativo!</p>
              <Link to="/cartao-beneficios"><Button>Acessar carteirinha</Button></Link>
            </div>
          ) : expired ? (
            <div className="text-center text-amber-600">
              <AlertCircle className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Este convite expirou. Peça um novo ao RH.</p>
            </div>
          ) : !user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Faça login ou crie sua conta com o email <strong>{invite.email}</strong> para ativar o cartão.
              </p>
              <Link to={`/paciente?redirect=/funcionario/ativar/${token}`}>
                <Button className="w-full">Fazer Login / Criar Conta</Button>
              </Link>
            </div>
          ) : (
            <Button onClick={activate} disabled={activating} className="w-full" size="lg">
              {activating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ativar Meu Cartão
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
