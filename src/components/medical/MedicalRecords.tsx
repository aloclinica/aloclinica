import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "../patient/patientNav";
import { getDoctorNav } from "../doctor/doctorNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Pill, Activity, FileText, Plus, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface MedicalRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  cid_code: string | null;
  severity: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  doctor_id: string | null;
}

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  mild: { label: "Leve", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  moderate: { label: "Moderada", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  severe: { label: "Grave", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  allergy: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  medication: <Pill className="w-4 h-4 text-primary" />,
  condition: <Activity className="w-4 h-4 text-destructive" />,
  evolution: <FileText className="w-4 h-4 text-secondary" />,
};

const TYPE_LABELS: Record<string, string> = {
  allergy: "Alergia",
  medication: "Medicamento Contínuo",
  condition: "Condição / Diagnóstico",
  evolution: "Evolução / Nota Clínica",
};

const MedicalRecords = ({ patientId, isDoctor = false }: { patientId?: string; isDoctor?: boolean }) => {
  const { user, roles } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("timeline");
  const [form, setForm] = useState({
    record_type: "allergy",
    title: "",
    description: "",
    cid_code: "",
    severity: "",
    start_date: "",
  });

  const targetPatientId = patientId ?? user?.id;
  const isDoctorRole = isDoctor || roles.includes("doctor");

  useEffect(() => {
    if (targetPatientId) {
      fetchRecords();
      // Log access for CFM compliance
      if (user && patientId && isDoctorRole) {
        db.from("medical_record_access_logs" as any).insert({
          patient_id: patientId,
          accessed_by: user.id,
          access_type: "view",
          user_agent: navigator.userAgent,
        })
        .then(() => {});
      }
    }
  }, [targetPatientId]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("medical_records")
      .select("id, record_type, title, description, cid_code, severity, is_active, start_date, end_date, created_at, doctor_id")
      .eq("patient_id", targetPatientId!)
      .order("created_at", { ascending: false });
    setRecords((data as MedicalRecord[]) ?? []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }

    let doctorId: string | null = null;
    if (isDoctorRole && user) {
      const { data: doc } = await db.from("doctor_profiles").select("id").eq("user_id", user.id).single();
      doctorId = doc?.id ?? null;
    }

    const { error } = await db.from("medical_records").insert({
      patient_id: targetPatientId!,
      record_type: form.record_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      cid_code: form.cid_code.trim() || null,
      severity: form.severity || null,
      start_date: form.start_date || null,
      doctor_id: doctorId,
    });

    if (error) {
      toast.error("Erro ao salvar registro");
    } else {
      toast.success("Registro salvo!");
      setShowAdd(false);
      setForm({ record_type: "allergy", title: "", description: "", cid_code: "", severity: "", start_date: "" });
      fetchRecords();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await db.from("medical_records").update({ is_active: !currentActive }).eq("id", id);
    fetchRecords();
  };

  const filtered = useMemo(() => records.filter(r =>
    !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cid_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [records, searchQuery]);

  const allergies = filtered.filter(r => r.record_type === "allergy");
  const medications = filtered.filter(r => r.record_type === "medication");
  const conditions = filtered.filter(r => r.record_type === "condition");
  const evolutions = filtered.filter(r => r.record_type === "evolution");

  // Group records by month for timeline
  const timelineGroups = filtered.reduce<Record<string, MedicalRecord[]>>((acc, r) => {
    const key = format(new Date(r.created_at), "MMMM yyyy", { locale: ptBR });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const renderTimelineItem = (r: MedicalRecord) => (
    <div key={r.id} className={`relative pl-8 pb-6 ${!r.is_active ? "opacity-50" : ""}`}>
      {/* Timeline dot and line */}
      <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-primary bg-background z-10 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>
      <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-border" />

      <Card className="border-border">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              {TYPE_ICONS[r.record_type]}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[r.record_type]}</Badge>
                  {r.cid_code && <Badge variant="secondary" className="text-[10px]">CID: {r.cid_code}</Badge>}
                  {r.severity && SEVERITY_MAP[r.severity] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEVERITY_MAP[r.severity].color}`}>
                      {SEVERITY_MAP[r.severity].label}
                    </span>
                  )}
                  {!r.is_active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                </div>
                {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {r.start_date && ` · Início: ${format(new Date(r.start_date), "dd/MM/yyyy")}`}
                </p>
              </div>
            </div>
            {(isDoctorRole || !patientId) && (
              <Button size="sm" variant="ghost" onClick={() => toggleActive(r.id, r.is_active)} className="text-xs shrink-0">
                {r.is_active ? "Desativar" : "Reativar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecordList = (items: MedicalRecord[], emptyMsg: string) => (
    items.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-6">{emptyMsg}</p>
    ) : (
      <div className="space-y-2">
        {items.map(r => (
          <Card key={r.id} className={`border-border ${!r.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {TYPE_ICONS[r.record_type]}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      {r.cid_code && <Badge variant="outline" className="text-[10px]">CID: {r.cid_code}</Badge>}
                      {r.severity && SEVERITY_MAP[r.severity] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEVERITY_MAP[r.severity].color}`}>
                          {SEVERITY_MAP[r.severity].label}
                        </span>
                      )}
                      {!r.is_active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {r.start_date && `Início: ${format(new Date(r.start_date), "dd/MM/yyyy")} · `}
                      Registrado em {format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {(isDoctorRole || !patientId) && (
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(r.id, r.is_active)} className="text-xs shrink-0">
                    {r.is_active ? "Desativar" : "Reativar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  );

  const nav = isDoctorRole ? getDoctorNav("patients") : getPatientNav("health");

  return (
    <>
      {!patientId && (
        <DashboardLayout title={isDoctorRole ? "Médico" : "Paciente"} nav={nav}>
          <InnerContent />
        </DashboardLayout>
      )}
      {patientId && <InnerContent />}
    </>
  );

  function InnerContent() {
    return (
      <div className="max-w-3xl pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Prontuário Eletrônico</h2>
            <p className="text-sm text-muted-foreground">Histórico médico completo com timeline</p>
          </div>
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Novo Registro
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, CID ou descrição..."
            className="pl-9"
          />
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="w-4 h-4 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{allergies.filter(a => a.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Alergias ativas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Pill className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{medications.filter(m => m.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Medicamentos</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/5">
            <Activity className="w-4 h-4 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-foreground">{conditions.filter(c => c.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Condições</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/5">
            <FileText className="w-4 h-4 mx-auto text-secondary mb-1" />
            <p className="text-lg font-bold text-foreground">{evolutions.length}</p>
            <p className="text-[10px] text-muted-foreground">Evoluções</p>
          </div>
        </div>

        {loading ? <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" /> : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="allergies">Alergias</TabsTrigger>
              <TabsTrigger value="medications">Medicamentos</TabsTrigger>
              <TabsTrigger value="conditions">Condições</TabsTrigger>
              <TabsTrigger value="evolutions">Evolução</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              {Object.keys(timelineGroups).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro encontrado.</p>
              ) : (
                <div>
                  {Object.entries(timelineGroups).map(([month, items]) => (
                    <div key={month} className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {month}
                      </h3>
                      <div>{items.map(renderTimelineItem)}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="allergies" className="mt-4">{renderRecordList(allergies, "Nenhuma alergia registrada.")}</TabsContent>
            <TabsContent value="medications" className="mt-4">{renderRecordList(medications, "Nenhum medicamento contínuo.")}</TabsContent>
            <TabsContent value="conditions" className="mt-4">{renderRecordList(conditions, "Nenhuma condição registrada.")}</TabsContent>
            <TabsContent value="evolutions" className="mt-4">{renderRecordList(evolutions, "Nenhuma nota de evolução.")}</TabsContent>
          </Tabs>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Registro Médico</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={form.record_type} onValueChange={v => setForm(f => ({ ...f, record_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allergy">🚨 Alergia</SelectItem>
                    <SelectItem value="medication">💊 Medicamento Contínuo</SelectItem>
                    <SelectItem value="condition">🩺 Condição / Diagnóstico</SelectItem>
                    <SelectItem value="evolution">📋 Evolução / Nota Clínica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Título *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Penicilina, Diabetes Tipo 2..." />
              </div>
              {(form.record_type === "condition" || form.record_type === "evolution") && (
                <div>
                  <label className="text-sm font-medium text-foreground">Código CID-10</label>
                  <Input value={form.cid_code} onChange={e => setForm(f => ({ ...f, cid_code: e.target.value }))} placeholder="Ex: E11, J45, I10..." />
                </div>
              )}
              {form.record_type === "allergy" && (
                <div>
                  <label className="text-sm font-medium text-foreground">Gravidade</label>
                  <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Leve</SelectItem>
                      <SelectItem value="moderate">Moderada</SelectItem>
                      <SelectItem value="severe">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground">Descrição / Detalhes</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes adicionais..." rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data de Início</label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <Button onClick={handleAdd} className="w-full">Salvar Registro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
};

export default MedicalRecords;
