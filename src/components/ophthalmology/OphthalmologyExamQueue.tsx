import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ophthalmologyService } from "@/lib/services/ophthalmology-service";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getOphthalmologyNav } from "@/components/ophthalmology/ophthalmologyNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, Plus, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  in_progress: { label: "Em andamento", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const examTypeLabels: Record<string, string> = {
  refraction: "Refração",
  tonometry: "Tonometria",
  fundoscopy: "Fundoscopia",
  biomicroscopy: "Biomicroscopia",
  oct: "OCT",
  campimetry: "Campimetria",
  topography: "Topografia",
  retinography: "Retinografia",
  complete: "Exame Completo",
};

const OphthalmologyExamQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: doctorProfile } = useQuery({
    queryKey: ["my-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await db.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["ophthalmology-exams", statusFilter],
    queryFn: () => ophthalmologyService.getExams(statusFilter !== "all" ? { status: statusFilter } : undefined),
    enabled: !!user?.id,
  });

  const filteredExams = exams?.filter((exam) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      exam.patient_name.toLowerCase().includes(q) ||
      exam.patient_cpf?.toLowerCase().includes(q) ||
      exam.exam_type.toLowerCase().includes(q)
    );
  });

  const assignMutation = useMutation({
    mutationFn: async (examId: string) => {
      if (!doctorProfile?.id) throw new Error("Perfil médico não encontrado");
      return ophthalmologyService.updateExam(examId, {
        assigned_doctor_id: doctorProfile.id,
        status: "in_progress",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-exams"] });
      toast.success("Exame atribuído a você com sucesso!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashboardLayout
      role="doctor"
      title="Oftalmologia"
      
      nav={getOphthalmologyNav("queue")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, CPF ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/dashboard/ophthalmology/new-exam?role=doctor")} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Exame</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pendentes", value: exams?.filter((e) => e.status === "pending").length ?? 0, color: "text-amber-600" },
            { label: "Em andamento", value: exams?.filter((e) => e.status === "in_progress").length ?? 0, color: "text-primary" },
            { label: "Concluídos", value: exams?.filter((e) => e.status === "completed").length ?? 0, color: "text-emerald-600" },
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Exames Oftalmológicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !filteredExams?.length ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum exame encontrado</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/dashboard/ophthalmology/new-exam?role=doctor")}
                >
                  Criar novo exame
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
                    {filteredExams.map((exam) => (
                      <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{exam.patient_name}</p>
                              {exam.patient_cpf && (
                                <p className="text-xs text-muted-foreground">{exam.patient_cpf}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{examTypeLabels[exam.exam_type] || exam.exam_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMap[exam.status]?.variant ?? "outline"}>
                            {statusMap[exam.status]?.label ?? exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(exam.created_at!), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {exam.status === "pending" && !exam.assigned_doctor_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => assignMutation.mutate(exam.id)}
                                disabled={assignMutation.isPending}
                              >
                                Assumir
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/dashboard/ophthalmology/exam/${exam.id}?role=doctor`)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
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

export default OphthalmologyExamQueue;
