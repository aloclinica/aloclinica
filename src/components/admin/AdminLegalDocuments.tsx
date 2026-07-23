/**
 * /dashboard/admin/legal — CRUD dos contratos/termos versionados.
 * Admin cria nova versão, define qual está ativa por kind. Só uma ativa
 * por kind (trigger no banco garante).
 */
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import AdminPageHeader from "./AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, FileText, Plus, CheckCircle2, ScrollText } from "lucide-react";
import { LegalMarkdown } from "@/components/ui/legal-markdown";

type Kind = "platform_terms" | "telemed_scheduled" | "telemed_ondemand" | "telemed_contract";
const KIND_LABELS: Record<Kind, string> = {
  platform_terms: "Termos da Plataforma",
  telemed_scheduled: "Teleconsulta Agendada",
  telemed_ondemand: "Pronto-Atendimento (on-demand)",
  telemed_contract: "Consulta via Contrato (B2B/B2G)",
};

interface Doc {
  id: string;
  kind: Kind;
  version: number;
  title: string;
  body_md: string;
  is_active: boolean;
  effective_at: string;
  updated_at: string;
}

const AdminLegalDocuments = () => {
  const [tab, setTab] = useState<Kind>("platform_terms");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ title: "", body_md: "", activate: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("legal_documents")
      .select("*")
      .order("kind", { ascending: true })
      .order("version", { ascending: false });
    if (!error) setDocs((data ?? []) as Doc[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const byKind = docs.filter((d) => d.kind === tab);
  const active = byKind.find((d) => d.is_active);

  const openCreate = () => {
    setForm({
      title: active?.title ?? KIND_LABELS[tab],
      body_md: active?.body_md ?? "",
      activate: true,
    });
    setOpenNew(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body_md.trim()) {
      toast.info("Preencha título e conteúdo."); return;
    }
    setSaving(true);
    try {
      const nextVersion = (byKind[0]?.version ?? 0) + 1;
      const { error } = await db.from("legal_documents").insert({
        kind: tab,
        version: nextVersion,
        title: form.title.trim(),
        body_md: form.body_md,
        is_active: form.activate,
      });
      if (error) throw error;
      toast.success(`Versão ${nextVersion} criada${form.activate ? " e ativada" : ""}.`);
      setOpenNew(false);
      await load();
    } catch (e: any) {
      toast.error("Falha ao salvar", { description: e?.message });
    } finally { setSaving(false); }
  };

  const activate = async (id: string) => {
    const { error } = await db.from("legal_documents").update({ is_active: true }).eq("id", id);
    if (error) toast.error("Falha ao ativar", { description: error.message });
    else { toast.success("Versão ativada"); load(); }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ScrollText}
        title="Contratos & Termos Legais"
        description="Versionamento dos termos da plataforma e dos termos de consentimento clínico (CFM 2.314/2022 + LGPD)."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)}>
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4">
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <TabsTrigger key={k} value={k} className="text-xs lg:text-sm">{KIND_LABELS[k]}</TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
          <TabsContent key={k} value={k} className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{KIND_LABELS[k]}</h2>
                <p className="text-xs text-muted-foreground">Apenas a versão ativa é apresentada aos usuários.</p>
              </div>
              <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Nova versão</Button>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : byKind.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma versão cadastrada.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {byKind.map((d) => (
                  <Card key={d.id} className={d.is_active ? "border-primary/40" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          v{d.version} — {d.title}
                        </CardTitle>
                        {d.is_active ? (
                          <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> Ativa</Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => activate(d.id)}>Ativar</Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Vigente desde {new Date(d.effective_at).toLocaleString("pt-BR")} · atualizado {new Date(d.updated_at).toLocaleString("pt-BR")}
                      </p>
                      <div className="max-h-48 overflow-auto bg-muted/30 rounded p-3 border border-border">
                        <LegalMarkdown source={d.body_md} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova versão — {KIND_LABELS[tab]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Conteúdo (Markdown)</Label>
              <Textarea rows={16} value={form.body_md} onChange={(e) => setForm({ ...form, body_md: e.target.value })} className="font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Select value={form.activate ? "yes" : "no"} onValueChange={(v) => setForm({ ...form, activate: v === "yes" })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Ativar imediatamente</SelectItem>
                  <SelectItem value="no">Salvar como rascunho</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Ativar substitui a versão anterior automaticamente.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLegalDocuments;