import { useQuery } from "@tanstack/react-query";
import { ophthalmologyService } from "@/lib/services/ophthalmology-service";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getOphthalmologyNav } from "@/components/ophthalmology/ophthalmologyNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  in_progress: { label: "Em andamento", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const examTypeLabels: Record<string, string> = {
  refraction: "Refração", tonometry: "Tonometria", fundoscopy: "Fundoscopia",
  biomicroscopy: "Biomicroscopia", oct: "OCT", campimetry: "Campimetria",
  topography: "Topografia", retinography: "Retinografia", complete: "Exame Completo",
};

const OphthalmologyMyExams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: doctorProfile } = useQuery({
    queryKey: ["my-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await db.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["ophthalmology-my-exams", doctorProfile?.id],
    queryFn: () => ophthalmologyService.getMyExams(doctorProfile!.id),
    enabled: !!doctorProfile?.id,
  });

  const activeExams = exams?.filter((e) => e.status === "in_progress") ?? [];
  const completedExams = exams?.filter((e) => e.status === "completed") ?? [];

  return (
    <DashboardLayout role="doctor" title="Meus Exames Oftalmológicos" nav={getOphthalmologyNav("my-exams")}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Em andamento", value: activeExams.length, color: "text-primary" },
            { label: "Concluídos", value: completedExams.length, color: "text-emerald-600" },
            { label: "Total", value: exams?.length ?? 0, color: "text-foreground" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Exames Atribuídos a Mim</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !exams?.length ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum exame atribuído a você</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/ophthalmology/queue?role=doctor")}>
                  Ver fila geral
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{exam.patient_name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{examTypeLabels[exam.exam_type] || exam.exam_type}</Badge></TableCell>
                        <TableCell><Badge variant={statusMap[exam.status]?.variant ?? "outline"}>{statusMap[exam.status]?.label ?? exam.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(exam.created_at!), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/ophthalmology/exam/${exam.id}?role=doctor`)}>
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default OphthalmologyMyExams;
