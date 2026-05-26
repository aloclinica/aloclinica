import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useContrato } from "@/contexts/ContratoContext";
import SEOHead from "@/components/SEOHead";

/**
 * Página de entrada para beneficiários de contrato corporativo / órgão público.
 * Acessada via subdomínio `parceiros.aloclinica.com.br` (ou rota direta).
 * Beneficiário entra com e-mail/senha; o ContratoContext já carregou
 * o contrato vinculado ao subdomínio.
 */
const ParceirosEntrar = () => {
  const navigate = useNavigate();
  const { contratoAtivo, loading } = useContrato();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error || !data.user) {
      toast.error("Não foi possível entrar", { description: error?.message });
      return;
    }
    // Verifica se é beneficiário ativo do contrato
    if (contratoAtivo) {
      const { data: benef } = await db
        .from("contrato_beneficiarios")
        .select("id, ativo")
        .eq("contrato_id", contratoAtivo.id)
        .or(`user_id.eq.${data.user.id},email.eq.${email.toLowerCase()}`)
        .maybeSingle();
      if (!benef || !benef.ativo) {
        toast.error("Seu e-mail não está vinculado a este contrato. Procure o RH/responsável.");
        await supabase.auth.signOut();
        return;
      }
      // Vincula user_id se ainda não estava
      await db.from("contrato_beneficiarios").update({ user_id: data.user.id }).eq("id", benef.id);
    }
    navigate("/dashboard?role=patient");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEOHead title="Acesso Beneficiário | AloClínica" description="Portal de acesso para beneficiários de contratos" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {loading ? "Carregando..." : contratoAtivo?.nome ?? "Portal de Parceiros"}
          </CardTitle>
          <CardDescription>
            {contratoAtivo
              ? `Acesso exclusivo para beneficiários de ${contratoAtivo.nome}. Consultas pagas pelo contratante.`
              : "Acesso para beneficiários de contratos corporativos e órgãos públicos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Primeiro acesso? Use o e-mail cadastrado pelo seu RH e clique em "Esqueci minha senha".
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParceirosEntrar;