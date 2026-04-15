import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Users, Clock, CheckCircle, XCircle, ArrowRight, Plus, Warning, FileText } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SecondOpinion {
  id: string;
  status: "pending" | "accepted" | "completed" | "declined";
  priority: "normal" | "urgent";
  reason?: string;
  original_report?: string;
  second_report?: string;
  consensus_notes?: string;
  deadline?: string;
  created_at: string;
  exam_request_id?: string;
  requesting_user_id: string;
  assigned_laudista_id?: string;
}

const statusConfig = {
  pending: { label: "Aguardando", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  accepted: { label: "Em análise", className: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText },
  completed: { label: "Concluído", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  declined: { label: "Recusado", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

interface Props {
  examRequestId?: string;
  originalReport?: string;
  onCompleted?: () => void;
}

export default function SecondOpinionManager({ examRequestId, originalReport, onCompleted }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showRequest, setShowRequest] = useState(false);
  const [showRespond, setShowRespond] = useState<SecondOpinion | null>(null);
  const [form, setForm] = useState({ reason: "", priority: "normal" as "normal" | "urgent" });
  const [responseText, setResponseText] = useState("");
  const [consensusNotes, setConsensusNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: opinions = [], isLoading } = useQuery({
    queryKey: ["second-opinions", examRequestId, user?.id],
    queryFn: async () => {
      let query = db.from("second_opinion_requests" as any).select("*").order("created_at", { ascending: false });
      if (examRequestId) query = query.eq("exam_request_id", examRequestId);
      const { data } = await query;
      return (data ?? []) as unknown as SecondOpinion[];
    },
    enabled: !!user,
  });

  const requestOpinion = async () => {
    if (!form.reason.trim()) { toast.error("Descreva o motivo"); return; }
    setSaving(true);
    const { error } = await db.from("second_opinion_requests" as any).insert({
      exam_request_id: examRequestId ?? null,
      requesting_user_id: user!.id,
      reason: form.reason,
      priority: form.priority,
      original_report: originalReport ?? null,
      status: "pending",
    });
    if (error) toast.error("Erro ao solicitar segunda opinião");
    else {
      toast.success("Segunda opinião solicitada!");
      qc.invalidateQueries({ queryKey: ["second-opinions"] });
      setShowRequest(false);
      setForm({ reason: "", priority: "normal" });
    }
    setSaving(false);
  };

  const acceptOpinion = async (opinion: SecondOpinion) => {
    await db.from("second_opinion_requests" as any)
      .update({ status: "accepted", assigned_laudista_id: user!.id, accepted_at: new Date().toISOString() })
      .eq("id", opinion.id);
    qc.invalidateQueries({ queryKey: ["second-opinions"] });
    toast.success("Segunda opinião aceita!");
  };

  const submitResponse = async () => {
    if (!responseText.trim() || !showRespond) return;
    setSaving(true);
    await db.from("second_opinion_requests" as any)
      .update({
        status: "completed",
        second_report: responseText,
        consensus_notes: consensusNotes || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", showRespond.id);
    qc.invalidateQueries({ queryKey: ["second-opinions"] });
    toast.success("Segunda opinião submetida!");
    setShowRespond(null);
    setResponseText("");
    setConsensusNotes("");
    setSaving(false);
    if (onCompleted) onCompleted();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
          <Users size={16} className="text-blue-500" /> Segunda Opinião
          {opinions.filter(o => o.status === "pending").length > 0 && (
            <Badge className="bg-amber-500 text-white text-[10px] h-4 w-4 rounded-full p-0 flex items-center justify-center">
              {opinions.filter(o => o.status === "pending").length}
            </Badge>
          )}
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowRequest(true)} className="gap-1.5 text-xs">
          <Plus size={12} /> Solicitar
        </Button>
      </div>

      {isLoading ? (
        <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
      ) : opinions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma segunda opinião solicitada.</p>
      ) : (
        <div className="space-y-2">
          {opinions.map((op, i) => {
            const cfg = statusConfig[op.status];
            const Icon = cfg.icon;
            const isAssignedToMe = op.assigned_laudista_id === user?.id;
            const isRequester = op.requesting_user_id === user?.id;

            return (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Icon size={16} className={cn("mt-0.5 shrink-0",
                      op.status === "completed" ? "text-emerald-500" :
                      op.status === "declined" ? "text-red-500" :
                      op.status === "accepted" ? "text-blue-500" : "text-amber-500"
                    )} />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge className={cn("text-[10px] border font-bold", cfg.className)}>{cfg.label}</Badge>
                        {op.priority === "urgent" && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                            <Warning size={8} className="mr-0.5" /> Urgente
                          </Badge>
                        )}
                      </div>
                      {op.reason && <p className="text-xs text-muted-foreground line-clamp-1">{op.reason}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(op.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        {op.deadline && ` · Prazo: ${format(new Date(op.deadline), "dd/MM")}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {op.status === "pending" && !isRequester && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => acceptOpinion(op)}>
                        Aceitar
                      </Button>
                    )}
                    {op.status === "accepted" && isAssignedToMe && (
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowRespond(op)}>
                        Responder <ArrowRight size={10} />
                      </Button>
                    )}
                    {op.status === "completed" && op.second_report && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowRespond(op)}>
                        Ver <ArrowRight size={10} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Show second report summary if completed */}
                {op.status === "completed" && op.second_report && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100">
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-0.5">Segunda Opinião:</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{op.second_report}</p>
                    {op.consensus_notes && <p className="text-[10px] text-muted-foreground mt-1 italic">Consenso: {op.consensus_notes}</p>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Request Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={18} className="text-blue-500" /> Solicitar Segunda Opinião
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prioridade</label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (48h)</SelectItem>
                  <SelectItem value="urgent">Urgente (6h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Motivo da solicitação *</label>
              <Textarea
                placeholder="Ex: Achado inconclusivo na região X, necessito confirmação sobre..."
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
              />
            </div>
            <Button onClick={requestOpinion} disabled={saving} className="w-full">
              {saving ? "Solicitando..." : "Solicitar Segunda Opinião"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Respond / View Dialog */}
      <Dialog open={!!showRespond} onOpenChange={v => !v && setShowRespond(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              {showRespond?.status === "completed" ? "Segunda Opinião" : "Responder Segunda Opinião"}
            </DialogTitle>
          </DialogHeader>
          {showRespond && (
            <div className="space-y-4">
              {showRespond.original_report && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Laudo Original</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground max-h-32 overflow-y-auto">
                    {showRespond.original_report}
                  </div>
                </div>
              )}

              {showRespond.status === "completed" ? (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Segunda Opinião</p>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 text-xs text-foreground max-h-40 overflow-y-auto">
                    {showRespond.second_report}
                  </div>
                  {showRespond.consensus_notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">Notas de consenso: {showRespond.consensus_notes}</p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Sua segunda opinião *</label>
                    <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={5}
                      placeholder="Descreva sua análise e conclusões..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Notas de consenso (opcional)</label>
                    <Textarea value={consensusNotes} onChange={e => setConsensusNotes(e.target.value)} rows={2}
                      placeholder="Pontos de convergência/divergência com o laudo original..." />
                  </div>
                  <Button onClick={submitResponse} disabled={saving} className="w-full">
                    {saving ? "Enviando..." : "Submeter Segunda Opinião"}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
