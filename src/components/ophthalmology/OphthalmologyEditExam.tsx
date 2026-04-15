import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ophthalmologyService } from "@/lib/services/ophthalmology-service";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getOphthalmologyNav } from "@/components/ophthalmology/ophthalmologyNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const examSchema = z.object({
  patient_name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  patient_cpf: z.string().optional(),
  patient_birth_date: z.string().optional(),
  exam_type: z.string().min(1, "Selecione o tipo de exame"),
  od_spherical: z.coerce.number().optional(),
  od_cylindrical: z.coerce.number().optional(),
  od_axis: z.coerce.number().min(0).max(180).optional(),
  od_acuity: z.string().optional(),
  oe_spherical: z.coerce.number().optional(),
  oe_cylindrical: z.coerce.number().optional(),
  oe_axis: z.coerce.number().min(0).max(180).optional(),
  oe_acuity: z.string().optional(),
  intraocular_pressure_od: z.coerce.number().optional(),
  intraocular_pressure_oe: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;

const examTypes = [
  { value: "refraction", label: "Refração" },
  { value: "tonometry", label: "Tonometria" },
  { value: "fundoscopy", label: "Fundoscopia" },
  { value: "biomicroscopy", label: "Biomicroscopia" },
  { value: "oct", label: "OCT" },
  { value: "campimetry", label: "Campimetria" },
  { value: "topography", label: "Topografia" },
  { value: "retinography", label: "Retinografia" },
  { value: "complete", label: "Exame Completo" },
];

const OphthalmologyEditExam = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: exam, isLoading } = useQuery({
    queryKey: ["ophthalmology-exam", examId],
    queryFn: () => ophthalmologyService.getExamById(examId!),
    enabled: !!examId,
  });

  const examAny = exam as any;

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    values: examAny
      ? {
          patient_name: examAny.patient_name ?? "",
          patient_cpf: examAny.patient_cpf ?? "",
          patient_birth_date: examAny.patient_birth_date ?? "",
          exam_type: examAny.exam_type ?? "refraction",
          od_spherical: examAny.od_spherical ?? undefined,
          od_cylindrical: examAny.od_cylindrical ?? undefined,
          od_axis: examAny.od_axis ?? undefined,
          od_acuity: examAny.od_acuity ?? "",
          oe_spherical: examAny.oe_spherical ?? undefined,
          oe_cylindrical: examAny.oe_cylindrical ?? undefined,
          oe_axis: examAny.oe_axis ?? undefined,
          oe_acuity: examAny.oe_acuity ?? "",
          intraocular_pressure_od: examAny.intraocular_pressure_od ?? undefined,
          intraocular_pressure_oe: examAny.intraocular_pressure_os ?? undefined,
          notes: examAny.notes ?? "",
          status: examAny.status ?? "draft",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (values: ExamFormValues) => ophthalmologyService.updateExam(examId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-exam", examId] });
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-exams"] });
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-my-exams"] });
      toast.success("Exame atualizado com sucesso!");
      navigate(`/dashboard/ophthalmology/exam/${examId}?role=doctor`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <DashboardLayout role="doctor" title="Carregando..." nav={getOphthalmologyNav("queue")}>
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="doctor" title="Editar Exame Oftalmológico" nav={getOphthalmologyNav("queue")}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v as any))} className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Eye className="w-5 h-5 text-primary" /> Dados do Paciente</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="patient_name" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Nome *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="patient_cpf" render={({ field }) => (
                  <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="patient_birth_date" render={({ field }) => (
                  <FormItem><FormLabel>Data de nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="exam_type" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Tipo de exame *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{examTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* OD */}
            <Card>
              <CardHeader><CardTitle className="text-lg">🔵 Olho Direito (OD)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="od_spherical" render={({ field }) => (
                  <FormItem><FormLabel>Esférico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_cylindrical" render={({ field }) => (
                  <FormItem><FormLabel>Cilíndrico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_axis" render={({ field }) => (
                  <FormItem><FormLabel>Eixo (°)</FormLabel><FormControl><Input type="number" min="0" max="180" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_acuity" render={({ field }) => (
                  <FormItem><FormLabel>Acuidade</FormLabel><FormControl><Input placeholder="20/20" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="intraocular_pressure_od" render={({ field }) => (
                  <FormItem><FormLabel>PIO (mmHg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* OE */}
            <Card>
              <CardHeader><CardTitle className="text-lg">🟢 Olho Esquerdo (OE)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="oe_spherical" render={({ field }) => (
                  <FormItem><FormLabel>Esférico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_cylindrical" render={({ field }) => (
                  <FormItem><FormLabel>Cilíndrico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_axis" render={({ field }) => (
                  <FormItem><FormLabel>Eixo (°)</FormLabel><FormControl><Input type="number" min="0" max="180" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_acuity" render={({ field }) => (
                  <FormItem><FormLabel>Acuidade</FormLabel><FormControl><Input placeholder="20/20" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="intraocular_pressure_oe" render={({ field }) => (
                  <FormItem><FormLabel>PIO (mmHg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Observações</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormControl><Textarea rows={4} placeholder="Observações clínicas..." {...field} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </DashboardLayout>
  );
};

export default OphthalmologyEditExam;
