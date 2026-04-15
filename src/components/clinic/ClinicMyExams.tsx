import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getClinicNav } from "@/components/clinic/clinicNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Upload, Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em Laudação",
  reported: "Laudado",
};

const statusVariant: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_review: "bg-primary/10 text-primary border-primary/20",
  reported: "bg-success/10 text-success border-success/20",
};

const ClinicMyExams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["clinic-my-exams", user?.id],
    queryFn: async () => {
      const { data: clinic } = await supabase
        .from("clinic_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!clinic) return [];

      const { data, error } = await supabase
        .from("exam_requests")
        .select("*")
        .eq("requesting_clinic_id", clinic.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // For reported exams, fetch reports
      const reportedIds = (data ?? []).filter((e: any) => e.status === "reported").map((e: any) => e.id);
      const reportsMap: Record<string, any> = {};
      if (reportedIds.length > 0) {
        const { data: reports } = await supabase
          .from("exam_reports")
          .select("*, doctor_profiles:reporter_id(crm, crm_state, user_id)")
          .in("exam_request_id", reportedIds);
        if (reports) {
          // Fetch reporter names
          const userIds = [...new Set(reports.map((r: any) => (r as any).doctor_profiles?.user_id).filter(Boolean))];
          const profileMap: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await db.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
            if (profiles) profiles.forEach((p: any) => { profileMap[p.user_id] = `Dr(a). ${p.first_name} ${p.last_name}`.trim(); });
          }
          reports.forEach((r: any) => {
            reportsMap[r.exam_request_id] = {
              ...r,
              reporter_name: profileMap[(r as any).doctor_profiles?.user_id] || "Laudista",
            };
          });
        }
      }

      return (data ?? []).map((e: any) => ({
        ...e,
        report: reportsMap[e.id] || null,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const report = selectedExam?.report;

  return (
    <DashboardLayout nav={getClinicNav("my-exams")} title="Meus Laudos" role="clinic">
      <div className="max-w-5xl mx-auto space-y-4 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Exames Enviados</h1>
          <Button onClick={() => navigate("/dashboard/clinic/exam-request?role=clinic")} className="gap-2">
            <Upload className="w-4 h-4" />
            Solicitar Exame
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !examRequests?.length ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum exame enviado ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Envie seu primeiro exame para receber o laudo</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard/clinic/exam-request?role=clinic")}>
                  <Upload className="w-4 h-4 mr-2" /> Solicitar Exame
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo de Exame</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Laudo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examRequests.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.patient_name || "—"}</TableCell>
                        <TableCell className="text-sm">{exam.exam_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(exam.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={exam.priority === "urgent" ? "destructive" : "secondary"}>
                            {exam.priority === "urgent" ? "🚨 Urgente" : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusVariant[exam.status] || ""} variant="outline">
                            {statusLabels[exam.status] || exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {exam.status === "reported" ? (
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

      {/* Report Dialog */}
      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laudo — {selectedExam?.exam_type}</DialogTitle>
          </DialogHeader>
          {report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Paciente:</span> {selectedExam?.patient_name ?? "—"}</div>
                <div><span className="text-muted-foreground">Status:</span> Laudado</div>
                <div><span className="text-muted-foreground">Médico:</span> {report.reporter_name}</div>
                <div><span className="text-muted-foreground">CRM:</span> {(report as any).doctor_profiles?.crm}/{(report as any).doctor_profiles?.crm_state}</div>
                <div><span className="text-muted-foreground">Assinado em:</span> {report.signed_at ? format(new Date(report.signed_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}</div>
                <div><span className="text-muted-foreground">Código:</span> {report.verification_code ?? "—"}</div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-medium mb-2">Texto do Laudo</p>
                <p className="text-sm whitespace-pre-wrap">{report.content_text ?? "—"}</p>
              </div>
              {report.pdf_url && (
                <Button variant="outline" className="w-full" onClick={() => window.open(report.pdf_url, "_blank")}>
                  <Download className="w-4 h-4 mr-2" /> Baixar PDF do Laudo
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Laudo não encontrado.</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClinicMyExams;
