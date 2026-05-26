import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { AdminPageHeader } from "./AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Users, Ticket, Briefcase } from "lucide-react";

type Contrato = {
  id: string;
  nome: string;
  tipo: "empresa" | "prefeitura" | "ong" | "plano_proprio";
  cnpj: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  modelo_cobranca: "mensal" | "pacote_pre_pago" | "gratuito_patrocinado";
  valor_consulta: number | null;
  cota_total: number | null;
  cota_utilizada: number;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  subdominio: string | null;
  status: "ativo" | "pausado" | "encerrado";
  observacoes: string | null;
};

const emptyForm = {
  nome: "",
  tipo: "empresa" as Contrato["tipo"],
  cnpj: "",
  contato_nome: "",
  contato_email: "",
  contato_telefone: "",
  modelo_cobranca: "pacote_pre_pago" as Contrato["modelo_cobranca"],
  valor_consulta: "",
  cota_total: "",
  vigencia_inicio: new Date().toISOString().slice(0, 10),
  vigencia_fim: "",
  subdominio: "",
  observacoes: "",
};

const AdminContratos = () => {
  const nav = getAdminNav("contratos");
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Contrato | null>(null);
  const [benefOpen, setBenefOpen] = useState(false);
  const [vouchOpen, setVouchOpen] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await db.from("contratos").select("*").order("created_at", { ascending: false });
    setContratos((data ?? []) as Contrato[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.nome.trim()) { toast.error("Nome obrigatório"); return; }
    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cnpj: form.cnpj || null,
      contato_nome: form.contato_nome || null,
      contato_email: form.contato_email || null,
      contato_telefone: form.contato_telefone || null,
      modelo_cobranca: form.modelo_cobranca,
      valor_consulta: form.valor_consulta ? Number(form.valor_consulta) : null,
      cota_total: form.cota_total ? Number(form.cota_total) : null,
      vigencia_inicio: form.vigencia_inicio,
      vigencia_fim: form.vigencia_fim || null,
      subdominio: form.subdominio || null,
      observacoes: form.observacoes || null,
    };
    const { error } = await db.from("contratos").insert(payload);
    if (error) { toast.error("Erro ao criar", { description: error.message }); return; }
    toast.success("Contrato criado");
    setOpen(false);
    setForm(emptyForm);
    fetch();
  };

  const updateStatus = async (id: string, status: Contrato["status"]) => {
    await db.from("contratos").update({ status }).eq("id", id);
    fetch();
  };

  const removerContrato = async (id: string) => {
    if (!confirm("Excluir este contrato? Isso remove beneficiários e vouchers vinculados.")) return;
    await db.from("contratos").delete().eq("id", id);
    toast.success("Removido");
    fetch();
  };

  const statusBadge = (s: Contrato["status"]) => {
    const map = { ativo: "default", pausado: "secondary", encerrado: "destructive" } as const;
    return <Badge variant={map[s]}>{s}</Badge>;
  };

  return (
    <DashboardLayout title="Contratos & Ações" nav={nav}>
      <AdminPageHeader title="Contratos e Ações Sociais" description="Empresas, prefeituras, ONGs e campanhas sociais que usam a plataforma." />

      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo contrato</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : contratos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-30" />
              Nenhum contrato cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead>Cota</TableHead>
                  <TableHead>Subdomínio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.tipo}</TableCell>
                    <TableCell className="text-xs">{c.modelo_cobranca.replace(/_/g, " ")}</TableCell>
                    <TableCell>{c.cota_utilizada}{c.cota_total ? ` / ${c.cota_total}` : ""}</TableCell>
                    <TableCell className="text-xs">{c.subdominio ?? "—"}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(c); setBenefOpen(true); }} title="Beneficiários">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(c); setVouchOpen(true); }} title="Vouchers">
                        <Ticket className="h-4 w-4" />
                      </Button>
                      <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v as Contrato["status"])}>
                        <SelectTrigger className="inline-flex w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">ativo</SelectItem>
                          <SelectItem value="pausado">pausado</SelectItem>
                          <SelectItem value="encerrado">encerrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => removerContrato(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: novo contrato */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo contrato</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome*</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Contrato["tipo"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="prefeitura">Prefeitura / órgão público</SelectItem>
                  <SelectItem value="ong">ONG / ação social</SelectItem>
                  <SelectItem value="plano_proprio">Plano próprio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modelo de cobrança</Label>
              <Select value={form.modelo_cobranca} onValueChange={(v) => setForm({ ...form, modelo_cobranca: v as Contrato["modelo_cobranca"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal pós-pago</SelectItem>
                  <SelectItem value="pacote_pre_pago">Pacote pré-pago</SelectItem>
                  <SelectItem value="gratuito_patrocinado">Gratuito patrocinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div><Label>Subdomínio (ex: prefeitura-x)</Label><Input value={form.subdominio} onChange={(e) => setForm({ ...form, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></div>
            <div><Label>Contato — nome</Label><Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} /></div>
            <div><Label>Contato — e-mail</Label><Input type="email" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.contato_telefone} onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })} /></div>
            <div><Label>Valor por consulta (R$)</Label><Input type="number" step="0.01" value={form.valor_consulta} onChange={(e) => setForm({ ...form, valor_consulta: e.target.value })} /></div>
            <div><Label>Cota total de consultas</Label><Input type="number" value={form.cota_total} onChange={(e) => setForm({ ...form, cota_total: e.target.value })} /></div>
            <div><Label>Início vigência</Label><Input type="date" value={form.vigencia_inicio} onChange={(e) => setForm({ ...form, vigencia_inicio: e.target.value })} /></div>
            <div><Label>Fim vigência</Label><Input type="date" value={form.vigencia_fim} onChange={(e) => setForm({ ...form, vigencia_fim: e.target.value })} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && <BeneficiariosDialog open={benefOpen} onOpenChange={setBenefOpen} contrato={selected} />}
      {selected && <VouchersDialog open={vouchOpen} onOpenChange={setVouchOpen} contrato={selected} />}
    </DashboardLayout>
  );
};

/* ─── Beneficiários (sub-dialog) ─────────────────────────────────────────── */

function BeneficiariosDialog({ open, onOpenChange, contrato }: { open: boolean; onOpenChange: (v: boolean) => void; contrato: Contrato }) {
  const [list, setList] = useState<any[]>([]);
  const [bulk, setBulk] = useState("");

  const load = async () => {
    const { data } = await db.from("contrato_beneficiarios").select("*").eq("contrato_id", contrato.id).order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { if (open) load(); }, [open, contrato.id]);

  const importar = async () => {
    const linhas = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!linhas.length) return;
    const rows = linhas.map((line) => {
      const [email, cpf, nome] = line.split(",").map((s) => s?.trim());
      return { contrato_id: contrato.id, email: email || null, cpf: cpf || null, nome: nome || null, ativo: true };
    });
    const { error } = await db.from("contrato_beneficiarios").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} beneficiário(s) importado(s)`);
    setBulk("");
    load();
  };

  const remover = async (id: string) => {
    await db.from("contrato_beneficiarios").delete().eq("id", id);
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Beneficiários — {contrato.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Importar (uma linha por pessoa: <code>email,cpf,nome</code>)</Label>
            <Textarea rows={4} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="joao@empresa.com,12345678900,João Silva" />
            <Button size="sm" className="mt-2" onClick={importar}>Importar</Button>
          </div>
          <div className="max-h-72 overflow-auto border rounded">
            <Table>
              <TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>CPF</TableHead><TableHead>Nome</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {list.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.email}</TableCell><TableCell>{b.cpf}</TableCell><TableCell>{b.nome}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" onClick={() => remover(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
                {!list.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhum beneficiário</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Vouchers (sub-dialog) ──────────────────────────────────────────────── */

function VouchersDialog({ open, onOpenChange, contrato }: { open: boolean; onOpenChange: (v: boolean) => void; contrato: Contrato }) {
  const [list, setList] = useState<any[]>([]);
  const [codigo, setCodigo] = useState("");
  const [usos, setUsos] = useState("1");
  const [validade, setValidade] = useState("");

  const load = async () => {
    const { data } = await db.from("vouchers").select("*").eq("contrato_id", contrato.id).order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { if (open) load(); }, [open, contrato.id]);

  const criar = async () => {
    if (!codigo.trim()) return;
    const { error } = await db.from("vouchers").insert({
      contrato_id: contrato.id,
      codigo: codigo.trim().toUpperCase(),
      usos_maximos: Number(usos) || 1,
      validade_fim: validade || null,
      ativo: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Voucher criado");
    setCodigo(""); setUsos("1"); setValidade("");
    load();
  };

  const remover = async (id: string) => {
    await db.from("vouchers").delete().eq("id", id);
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Vouchers — {contrato.nome}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-2"><Label>Código</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EX: SAUDE2026" /></div>
          <div><Label>Usos máx</Label><Input type="number" value={usos} onChange={(e) => setUsos(e.target.value)} /></div>
          <div><Label>Validade</Label><Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} /></div>
          <div className="col-span-4"><Button size="sm" onClick={criar}>Gerar voucher</Button></div>
        </div>
        <div className="max-h-72 overflow-auto border rounded mt-3">
          <Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Usos</TableHead><TableHead>Validade</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">{v.codigo}</TableCell>
                  <TableCell>{v.usos_atuais}/{v.usos_maximos}</TableCell>
                  <TableCell>{v.validade_fim ?? "—"}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => remover(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
              {!list.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhum voucher</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdminContratos;