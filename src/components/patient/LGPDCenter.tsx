import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, DownloadSimple, Trash, Eye, Clock, Warning,
         CheckCircle, Info, Lock, FileText, Database } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccessLog {
  id: string;
  accessor_role?: string;
  action: string;
  resource: string;
  created_at: string;
}

interface DeletionRequest {
  id: string;
  status: string;
  reason?: string;
  requested_at: string;
  scheduled_deletion_at?: string;
}

const actionLabels: Record<string, string> = {
  read: "Visualizado",
  write: "Atualizado",
  export: "Exportado",
  delete: "Excluído",
};

const resourceLabels: Record<string, string> = {
  medical_records: "Prontuário",
  prescriptions: "Receitas",
  appointments: "Consultas",
  health_metrics: "Métricas de saúde",
  exams: "Exames",
  profiles: "Perfil",
  health_cards: "Cartão Saúde",
};

export default function LGPDCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: accessLog = [] } = useQuery({
    queryKey: ["lgpd-access-log", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lgpd_access_log" as any)
        .select("id, accessor_role, action, resource, created_at")
        .eq("data_owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as unknown as AccessLog[];
    },
    enabled: !!user,
  });

  const { data: deletionReqs = [] } = useQuery({
    queryKey: ["lgpd-deletion", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lgpd_deletion_requests" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("requested_at", { ascending: false });
      return (data ?? []) as unknown as DeletionRequest[];
    },
    enabled: !!user,
  });

  const pendingDeletion = deletionReqs.find(r => r.status === "pending");

  const exportData = async () => {
    toast.info("Preparando exportação...");
    const [profileRes, appointmentsRes, prescriptionsRes, metricsRes] = await Promise.all([
      db.from("profiles").select("*").eq("user_id", user!.id).single(),
      db.from("appointments").select("*").eq("patient_id", user!.id),
      db.from("prescriptions").select("*").eq("patient_id", user!.id),
      db.from("health_metrics").select("*").eq("patient_id", user!.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      appointments: appointmentsRes.data ?? [],
      prescriptions: prescriptionsRes.data ?? [],
      health_metrics: metricsRes.data ?? [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aloclinica-meus-dados-${format(new Date(), "dd-MM-yyyy")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso!");

    // Log the export
    await db.from("lgpd_access_log" as any).insert({
      data_owner_id: user!.id,
      accessor_id: user!.id,
      accessor_role: "patient",
      action: "export",
      resource: "all_data",
    });
  };

  const requestDeletion = async () => {
    if (!deleteReason.trim()) { toast.error("Por favor, informe o motivo"); return; }
    setSubmitting(true);
    const { error } = await db.from("lgpd_deletion_requests" as any).insert({
      user_id: user!.id,
      reason: deleteReason,
      status: "pending",
    });
    if (error) { toast.error("Erro ao enviar solicitação"); }
    else {
      toast.success("Solicitação enviada. Será processada em até 30 dias conforme a LGPD.");
      qc.invalidateQueries({ queryKey: ["lgpd-deletion"] });
      setShowDeleteDialog(false);
      setDeleteReason("");
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("lgpd")}>
      <div className="max-w-2xl mx-auto pb-24 md:pb-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield size={24} weight="fill" className="text-amber-500" /> Privacidade e LGPD
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle seus dados conforme a Lei Geral de Proteção de Dados
          </p>
        </div>

        {/* Rights */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Eye, label: "Acesso", desc: "Veja todos os seus dados", color: "blue" },
            { icon: DownloadSimple, label: "Portabilidade", desc: "Exporte seus dados em JSON", color: "emerald" },
            { icon: FileText, label: "Correção", desc: "Edite informações incorretas", color: "violet" },
            { icon: Trash, label: "Exclusão", desc: "Solicite a exclusão dos dados", color: "red" },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg bg-${color}-50 dark:bg-${color}-950/30 flex items-center justify-center shrink-0`}>
                <Icon size={16} weight="fill" className={`text-${color}-500`} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={exportData}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <DownloadSimple size={18} weight="fill" className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Exportar todos os meus dados</p>
              <p className="text-xs text-muted-foreground mt-0.5">Baixar relatório completo em formato JSON (portabilidade LGPD)</p>
            </div>
          </motion.button>

          {!pendingDeletion ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-200 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <Trash size={18} weight="fill" className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Solicitar exclusão da conta</p>
                <p className="text-xs text-red-600/70 dark:text-red-500/70 mt-0.5">
                  Solicita a exclusão de todos os dados em até 30 dias
                </p>
              </div>
            </motion.button>
          ) : (
            <div className="w-full flex items-center gap-4 p-4 rounded-2xl border border-amber-200 bg-amber-50/50">
              <Warning size={20} weight="fill" className="text-amber-500 shrink-0" />
              <div>
                <p className="font-semibold text-amber-700 text-sm">Solicitação de exclusão pendente</p>
                <p className="text-xs text-amber-600/80">
                  Solicitada em {format(new Date(pendingDeletion.requested_at), "dd/MM/yyyy")} · Prazo: {pendingDeletion.scheduled_deletion_at ? format(new Date(pendingDeletion.scheduled_deletion_at), "dd/MM/yyyy") : "30 dias"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Data retention info */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 p-4">
          <div className="flex items-start gap-3">
            <Info size={18} weight="fill" className="text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Retenção de Dados</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700/70 dark:text-blue-500/70">
                {[
                  ["Prontuário médico", "20 anos (CFM)"],
                  ["Prescrições", "5 anos"],
                  ["Dados de pagamento", "5 anos (BACEN)"],
                  ["Logs de acesso", "2 anos"],
                  ["Dados de autenticação", "6 meses após encerramento"],
                  ["Gravações de consulta", "90 dias"],
                ].map(([label, period]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span>{label}</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">{period}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Access Log */}
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
            <Database size={16} className="text-muted-foreground" /> Histórico de Acesso aos Dados
          </h3>
          {accessLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum acesso registrado.</p>
          ) : (
            <div className="space-y-2">
              {accessLog.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Lock size={12} className="text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{resourceLabels[log.resource] ?? log.resource}</span>
                      <span className="text-muted-foreground"> · </span>
                      <Badge variant="outline" className="text-[10px]">{actionLabels[log.action] ?? log.action}</Badge>
                      {log.accessor_role && (
                        <span className="text-xs text-muted-foreground ml-1.5">por {log.accessor_role}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(log.created_at), "dd/MM · HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Warning size={18} weight="fill" /> Solicitar Exclusão de Conta
            </DialogTitle>
            <DialogDescription>
              Seus dados serão excluídos em até 30 dias após a confirmação, conforme artigo 18 da LGPD.
              Dados com obrigação legal de retenção (prontuário, financeiro) serão mantidos pelo período exigido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da exclusão (obrigatório)"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">Cancelar</Button>
              <Button variant="destructive" onClick={requestDeletion} disabled={submitting} className="flex-1">
                {submitting ? "Enviando..." : "Confirmar Solicitação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
