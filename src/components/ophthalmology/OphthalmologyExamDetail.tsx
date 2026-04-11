import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ophthalmologyService } from "@/lib/services/ophthalmology-service";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Eye, ArrowLeft, FileText, CheckCircle, Printer, Pencil, Download } from "lucide-react";
import { generateOphthalmologyPrescriptionPDF } from "@/lib/ophthalmology-pdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";

const OphthalmologyExamDetail = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doctorProfile } = useQuery({
    queryKey: ["my-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: exam, isLoading } = useQuery({
    queryKey: ["ophthalmology-exam", examId],
    queryFn: () => ophthalmologyService.getExamById(examId!),
    enabled: !!examId,
  });

  const { data: prescriptions } = useQuery({
    queryKey: ["ophthalmology-prescriptions", examId],
    queryFn: () => ophthalmologyService.getPrescriptionsByExam(examId!),
    enabled: !!examId,
  });

  const completeMutation = useMutation({
    mutationFn: () => ophthalmologyService.updateExam(examId!, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-exam", examId] });
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-exams"] });
      toast.success("Exame concluído!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const RefField = ({ label, value, unit }: { label: string; value: number | string | null | undefined; unit?: string }) => (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums">
        {value != null ? `${value}${unit ?? ""}` : "—"}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="doctor" title="Carregando..." nav={getDoctorNav("ophthalmology")}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout role="doctor" title="Exame não encontrado" nav={getDoctorNav("ophthalmology")}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Exame não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="doctor"
      title={`Exame — ${exam.patient_name}`}
      
      nav={getDoctorNav("ophthalmology")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex gap-2 flex-wrap">
            {exam.status !== "completed" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/ophthalmology/edit/${exam.id}?role=doctor`)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
                <Button
                  variant="default"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Concluir Exame
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/ophthalmology/prescription/${exam.id}?role=doctor`)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" /> Emitir Receita
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Dados do Paciente
              </CardTitle>
              <Badge variant={exam.status === "completed" ? "secondary" : exam.status === "in_progress" ? "default" : "outline"}>
                {exam.status === "completed" ? "Concluído" : exam.status === "in_progress" ? "Em andamento" : "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="font-medium">{exam.patient_name}</p>
            </div>
            {exam.patient_cpf && (
              <div>
                <p className="text-xs text-muted-foreground">CPF</p>
                <p className="font-medium">{exam.patient_cpf}</p>
              </div>
            )}
            {exam.patient_birth_date && (
              <div>
                <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">{format(new Date(exam.patient_birth_date), "dd/MM/yyyy")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Tipo de Exame</p>
              <p className="font-medium capitalize">{exam.exam_type}</p>
            </div>
          </CardContent>
        </Card>

        {/* Refraction — OD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🔵 Olho Direito (OD)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <RefField label="Esférico" value={exam.od_spherical} />
              <RefField label="Cilíndrico" value={exam.od_cylindrical} />
              <RefField label="Eixo" value={exam.od_axis} unit="°" />
              <RefField label="Acuidade" value={exam.od_acuity} />
              <RefField label="PIO" value={exam.intraocular_pressure_od} unit=" mmHg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🟢 Olho Esquerdo (OE)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <RefField label="Esférico" value={exam.oe_spherical} />
              <RefField label="Cilíndrico" value={exam.oe_cylindrical} />
              <RefField label="Eixo" value={exam.oe_axis} unit="°" />
              <RefField label="Acuidade" value={exam.oe_acuity} />
              <RefField label="PIO" value={exam.intraocular_pressure_oe} unit=" mmHg" />
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {exam.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Prescriptions */}
        {prescriptions && prescriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" /> Receitas Emitidas ({prescriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{rx.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rx.lens_type && `Lente: ${rx.lens_type}`}
                      {rx.signed_at && ` · Assinada em ${format(new Date(rx.signed_at), "dd/MM/yyyy")}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Baixar PDF"
                      onClick={() => generateOphthalmologyPrescriptionPDF(rx, "Dr(a). Médico", "000000")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {rx.pdf_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={rx.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Printer className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default OphthalmologyExamDetail;
