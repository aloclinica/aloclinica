/**
 * Marketplace de exames.
 *
 * Paciente vê os exames solicitados pelo médico (exam_requests) e pode
 * agendar com um laboratório parceiro (exam_labs). Cada agendamento cria
 * uma exam_order vinculada ao pedido original — o resultado depois entra
 * no prontuário automaticamente quando o laboratório fizer upload.
 *
 * MVP — sem pagamento integrado ainda; status pending → o laboratório
 * confirma horário e cobra direto (a integração com PSP é evolução).
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FlaskConical, MapPin, Phone, CalendarPlus, CheckCircle2, Clock, FileSearch, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logError } from "@/lib/logger";

type ExamReq = {
  id: string;
  exam_name: string | null;
  reason: string | null;
  created_at: string;
  appointment_id: string | null;
};

type Lab = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  description: string | null;
  exam_types: string[];
};

type Order = {
  id: string;
  exam_request_id: string | null;
  lab_id: string;
  status: string;
  preferred_date: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando confirmação", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  confirmed: { label: "Confirmado", color: "bg-primary/10 text-primary" },
  completed: { label: "Concluído", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
};

const ExamMarketplace = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ExamReq[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookingFor, setBookingFor] = useState<ExamReq | null>(null);
  const [labChosen, setLabChosen] = useState<string>("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reqRes, labsRes, ordersRes] = await Promise.all([
        db.from("exam_requests").select("id, exam_name, reason, created_at, appointment_id")
          .eq("patient_id", user.id).order("created_at", { ascending: false }).limit(50),
        db.from("exam_labs").select("id, name, city, state, phone, description, exam_types").eq("is_active", true).limit(50),
        db.from("exam_orders").select("id, exam_request_id, lab_id, status, preferred_date, created_at")
          .eq("patient_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      setRequests((reqRes.data ?? []) as ExamReq[]);
      setLabs((labsRes.data ?? []) as Lab[]);
      setOrders((ordersRes.data ?? []) as Order[]);
    } catch (e) {
      logError("ExamMarketplace load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openBook = (req: ExamReq) => {
    setBookingFor(req);
    setLabChosen(labs[0]?.id ?? "");
    setPreferredDate("");
  };

  const submitBooking = async () => {
    if (!user || !bookingFor || !labChosen) { toast.info("Escolha um laboratório."); return; }
    setSubmitting(true);
    try {
      const { error } = await db.from("exam_orders").insert({
        exam_request_id: bookingFor.id,
        patient_id: user.id,
        lab_id: labChosen,
        status: "pending",
        preferred_date: preferredDate || null,
      } as any);
      if (error) throw error;
      toast.success("Pedido enviado ao laboratório", { description: "Eles entrarão em contato para confirmar o horário." });
      setBookingFor(null);
      load();
    } catch (e: any) {
      toast.error("Erro ao agendar", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const orderByRequest = new Map<string, Order>(orders.map((o) => [o.exam_request_id ?? "", o]));

  return (
    <DashboardLayout title="Exames" nav={getPatientNav("exams")} role="patient">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FlaskConical className="w-5 h-5 text-primary" /> Meus exames</h1>
          <p className="text-sm text-muted-foreground">Agende os exames solicitados pelo seu médico em laboratórios parceiros.</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : requests.length === 0 ? (
          <EmptyState icon={FileSearch} title="Nenhum exame solicitado"
            description="Quando seu médico solicitar exames durante a consulta, eles aparecem aqui para você agendar." />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const ord = orderByRequest.get(r.id);
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{r.exam_name || "Exame"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {r.reason || "Solicitado em "}{format(new Date(r.created_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                    {ord ? (
                      <Badge className={`${STATUS_LABEL[ord.status]?.color ?? "bg-muted"} border-0 rounded-full gap-1.5 px-3`}>
                        {ord.status === "confirmed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {STATUS_LABEL[ord.status]?.label || ord.status}
                      </Badge>
                    ) : (
                      <Button size="sm" className="rounded-xl gap-1.5" onClick={() => openBook(r)}>
                        <CalendarPlus className="w-4 h-4" /> Agendar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!bookingFor} onOpenChange={(o) => !o && setBookingFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar {bookingFor?.exam_name || "exame"}</DialogTitle></DialogHeader>
            {labs.length === 0 ? (
              <EmptyState icon={FlaskConical} title="Sem laboratórios disponíveis ainda"
                description="Estamos expandindo a rede de parceiros. Em breve novos laboratórios disponíveis na sua região." />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Escolha o laboratório</p>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {labs.map((l) => (
                      <button key={l.id} type="button" onClick={() => setLabChosen(l.id)}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${labChosen === l.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <p className="text-sm font-semibold text-foreground">{l.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                          {l.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.city}{l.state ? `/${l.state}` : ""}</span>}
                          {l.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {l.phone}</span>}
                        </p>
                        {l.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{l.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Data preferida (opcional)</p>
                  <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
                </div>
                <Button onClick={submitBooking} disabled={submitting || !labChosen} className="w-full rounded-xl gap-2" size="lg">
                  {submitting ? "Enviando…" : <>Confirmar pedido <ArrowRight className="w-4 h-4" /></>}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">O laboratório entra em contato com você para confirmar horário e valor.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ExamMarketplace;
