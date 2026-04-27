import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Heart, ArrowLeft } from "lucide-react";

export default function FuneralRequest() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    deceased_name: "",
    deceased_cpf: "",
    relationship: "",
    death_date: "",
    death_certificate_url: "",
    city: "",
    state: "",
    contact_phone: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await db.functions.invoke("request-funeral-assistance", { body: form });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao enviar pedido");
      toast.success("Pedido registrado. Entraremos em contato em até 4 horas.");
      navigate("/cartao-beneficios");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-rose-500" />
              <CardTitle>Solicitar Assistência Funeral</CardTitle>
            </div>
            <CardDescription>
              Benefício do seu plano Pingo Card. Após enviar, nossa equipe entrará em contato em até 4 horas
              para coordenar com a funerária parceira.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="deceased_name">Nome do(a) falecido(a) *</Label>
                <Input
                  id="deceased_name" required
                  value={form.deceased_name}
                  onChange={(e) => update("deceased_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deceased_cpf">CPF do(a) falecido(a)</Label>
                  <Input
                    id="deceased_cpf"
                    placeholder="000.000.000-00"
                    value={form.deceased_cpf}
                    onChange={(e) => update("deceased_cpf", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relação com você *</Label>
                  <Input
                    id="relationship" required
                    placeholder="Pai, mãe, cônjuge, filho..."
                    value={form.relationship}
                    onChange={(e) => update("relationship", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="death_date">Data do falecimento *</Label>
                  <Input
                    id="death_date" type="date" required
                    value={form.death_date}
                    onChange={(e) => update("death_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Seu telefone *</Label>
                  <Input
                    id="contact_phone" required
                    placeholder="(11) 99999-9999"
                    value={form.contact_phone}
                    onChange={(e) => update("contact_phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input id="city" required value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="state">UF *</Label>
                  <Input id="state" required maxLength={2} value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} />
                </div>
              </div>

              <div>
                <Label htmlFor="death_certificate_url">Link da certidão de óbito (opcional)</Label>
                <Input
                  id="death_certificate_url"
                  type="url"
                  placeholder="https://..."
                  value={form.death_certificate_url}
                  onChange={(e) => update("death_certificate_url", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pode ser enviado depois pela equipe de suporte.
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                Enviar Pedido
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
