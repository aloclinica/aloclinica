import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getClinicNav } from "@/components/clinic/clinicNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Upload, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  assigned: "Atribuído",
  in_progress: "Em Laudação",
  in_review: "Em Laudação",
  completed: "Laudado",
  reported: "Laudado",
  delivered: "Laudado",
  cancelled: "Cancelado",
};

const statusVariant: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  assigned: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  reported: "bg-success/10 text-success border-success/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const priorityLabels: Record<string, string> = {
  normal: "Normal",
  urgent: "Urgente",
  stat: "STAT",
};

const isCompleted = (s: string) => ["completed", "reported", "delivered"].includes(s);

const ClinicExamList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ["clinic-exam-list", user?.id],
    queryFn: async () => {
      const { data: clinic } = await db
        .from("clinic_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!clinic) return [];

      const { data, error } = await db
        .from("exam_requests")
        .select("*")
        .eq("requesting_clinic_id", clinic.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const completedIds = (data ?? [])
        .filter((e: any) => isCompleted(e.status))
        .map((e: any) => e.id);

      const reportsMap: Record<string, any> = {};
      if (completedIds.length > 0) {
        const { data: reports } = await db
          .from("exam_reports" as any)
          .select("*")
          .in("exam_request_id", completedIds);
        if (reports) {
          (reports as any[]).forEach((r) => {
            reportsMap[r.exam_request_id] = r;
          });
        }
      }

      return (data ?? []).map((e: any) => ({ ...e, report: reportsMap[e.id] || null }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const report = selectedExam?.report;

  return (
    <DashboardLayout nav={getClinicNav("exam-list")} title="Meus Exames" role="clinic">
      <div className="max-w-5xl mx-auto space-y-4 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Exames Enviados</h1>
          <Button onClick={() => navigate("/dashboard/clinic/exam-upload?role=clinic")} className="gap-2">
            <Upload className="w-4 h-4" />
            Enviar Exame
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !exams?.length ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum exame enviado ainda</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard/clinic/exam-upload?role=clinic")}>
                  <Upload className="w-4 h-4 mr-2" /> Enviar Exame
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo de Exame</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Laudo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.patient_name || "—"}</TableCell>
                        <TableCell className="text-sm">{exam.exam_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(exam.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={exam.priority === "stat" ? "destructive" : exam.priority === "urgent" ? "destructive" : "secondary"}>
                            {priorityLabels[exam.priority] || exam.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusVariant[exam.status] || ""} variant="outline">
                            {statusLabels[exam.status] || exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isCompleted(exam.status) ? (
                            <Button size="sm" variant="outline" onClick={() => setSelectedExam(exam)}>
                              <Eye className="w-3 h-3 mr-1" /> Ver Laudo
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laudo — {selectedExam?.exam_type}</DialogTitle>
          </DialogHeader>
          {report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Paciente:</span> {selectedExam?.patient_name ?? "—"}</div>
                <div>
                  <span className="text-muted-foreground">Assinado em:</span>{" "}
                  {report.signed_at
                    ? format(new Date(report.signed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : report.completed_at
                    ? format(new Date(report.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "—"}
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-medium mb-2">Texto do Laudo</p>
                <p className="text-sm whitespace-pre-wrap">
                  {report.content_text ?? report.clinical_info ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Laudo ainda não disponível.</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClinicExamList;
