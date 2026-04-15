import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ophthalmologyService } from "@/lib/services/ophthalmology-service";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getOphthalmologyNav } from "@/components/ophthalmology/ophthalmologyNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const prescriptionSchema = z.object({
  patient_name: z.string().min(3, "Nome obrigatório"),
  patient_cpf: z.string().optional(),
  od_spherical: z.coerce.number().optional(),
  od_cylindrical: z.coerce.number().optional(),
  od_axis: z.coerce.number().min(0).max(180).optional(),
  od_addition: z.coerce.number().optional(),
  od_prism: z.coerce.number().optional(),
  od_prism_base: z.string().optional(),
  oe_spherical: z.coerce.number().optional(),
  oe_cylindrical: z.coerce.number().optional(),
  oe_axis: z.coerce.number().min(0).max(180).optional(),
  oe_addition: z.coerce.number().optional(),
  oe_prism: z.coerce.number().optional(),
  oe_prism_base: z.string().optional(),
  interpupillary_distance: z.coerce.number().optional(),
  lens_type: z.string().optional(),
  lens_material: z.string().optional(),
  lens_treatment: z.string().optional(),
  observations: z.string().optional(),
});

type PrescriptionValues = z.infer<typeof prescriptionSchema>;

const OphthalmologyPrescriptionForm = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doctorProfile } = useQuery({
    queryKey: ["my-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await db.from("doctor_profiles").select("id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["ophthalmology-exam", examId],
    queryFn: () => ophthalmologyService.getExamById(examId!),
    enabled: !!examId,
  });

  const form = useForm<PrescriptionValues>({
    resolver: zodResolver(prescriptionSchema),
    values: exam
      ? {
          patient_name: exam.patient_name,
          patient_cpf: exam.patient_cpf ?? "",
          od_spherical: exam.od_spherical ?? undefined,
          od_cylindrical: exam.od_cylindrical ?? undefined,
          od_axis: exam.od_axis ?? undefined,
          oe_spherical: exam.oe_spherical ?? undefined,
          oe_cylindrical: exam.oe_cylindrical ?? undefined,
          oe_axis: exam.oe_axis ?? undefined,
          od_addition: undefined,
          od_prism: undefined,
          od_prism_base: "",
          oe_addition: undefined,
          oe_prism: undefined,
          oe_prism_base: "",
          interpupillary_distance: undefined,
          lens_type: "",
          lens_material: "",
          lens_treatment: "",
          observations: "",
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (values: PrescriptionValues) =>
      ophthalmologyService.createPrescription({
        ...values,
        exam_id: examId!,
        doctor_id: doctorProfile!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ophthalmology-prescriptions", examId] });
      toast.success("Receita oftalmológica criada com sucesso!");
      navigate(`/dashboard/ophthalmology/exam/${examId}?role=doctor`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (examLoading) {
    return (
      <DashboardLayout role="doctor" title="Carregando..." nav={getOphthalmologyNav("queue")}>
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="doctor"
      title="Receita Oftalmológica"
      
      nav={getOphthalmologyNav("queue")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-6">
            {/* Patient */}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Paciente</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="patient_name" render={({ field }) => (
                  <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="patient_cpf" render={({ field }) => (
                  <FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* OD */}
            <Card>
              <CardHeader><CardTitle className="text-base">🔵 Olho Direito (OD)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="od_spherical" render={({ field }) => (
                  <FormItem><FormLabel>Esférico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_cylindrical" render={({ field }) => (
                  <FormItem><FormLabel>Cilíndrico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_axis" render={({ field }) => (
                  <FormItem><FormLabel>Eixo (°)</FormLabel><FormControl><Input type="number" min="0" max="180" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_addition" render={({ field }) => (
                  <FormItem><FormLabel>Adição</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_prism" render={({ field }) => (
                  <FormItem><FormLabel>Prisma</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="od_prism_base" render={({ field }) => (
                  <FormItem><FormLabel>Base do Prisma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="up">Superior</SelectItem>
                        <SelectItem value="down">Inferior</SelectItem>
                        <SelectItem value="in">Nasal</SelectItem>
                        <SelectItem value="out">Temporal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* OE */}
            <Card>
              <CardHeader><CardTitle className="text-base">🟢 Olho Esquerdo (OE)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="oe_spherical" render={({ field }) => (
                  <FormItem><FormLabel>Esférico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_cylindrical" render={({ field }) => (
                  <FormItem><FormLabel>Cilíndrico</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_axis" render={({ field }) => (
                  <FormItem><FormLabel>Eixo (°)</FormLabel><FormControl><Input type="number" min="0" max="180" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_addition" render={({ field }) => (
                  <FormItem><FormLabel>Adição</FormLabel><FormControl><Input type="number" step="0.25" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_prism" render={({ field }) => (
                  <FormItem><FormLabel>Prisma</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="oe_prism_base" render={({ field }) => (
                  <FormItem><FormLabel>Base do Prisma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="up">Superior</SelectItem>
                        <SelectItem value="down">Inferior</SelectItem>
                        <SelectItem value="in">Nasal</SelectItem>
                        <SelectItem value="out">Temporal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Lens specs */}
            <Card>
              <CardHeader><CardTitle className="text-base">Especificações da Lente</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="interpupillary_distance" render={({ field }) => (
                  <FormItem><FormLabel>DNP (mm)</FormLabel><FormControl><Input type="number" step="0.5" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="lens_type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de Lente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="monofocal">Monofocal</SelectItem>
                        <SelectItem value="bifocal">Bifocal</SelectItem>
                        <SelectItem value="multifocal">Multifocal</SelectItem>
                        <SelectItem value="contact">Lente de Contato</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="lens_material" render={({ field }) => (
                  <FormItem><FormLabel>Material</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="cr39">CR-39</SelectItem>
                        <SelectItem value="policarbonato">Policarbonato</SelectItem>
                        <SelectItem value="trivex">Trivex</SelectItem>
                        <SelectItem value="alto_indice">Alto Índice</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="lens_treatment" render={({ field }) => (
                  <FormItem><FormLabel>Tratamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="antirreflexo">Antirreflexo</SelectItem>
                        <SelectItem value="fotossensivel">Fotossensível</SelectItem>
                        <SelectItem value="blue_cut">Filtro de Luz Azul</SelectItem>
                        <SelectItem value="hidrofobico">Hidrofóbico</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="observations" render={({ field }) => (
                  <FormItem><FormControl><Textarea rows={3} placeholder="Instruções adicionais..." {...field} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || !doctorProfile} className="gap-2">
                <Save className="w-4 h-4" />
                {createMutation.isPending ? "Salvando..." : "Emitir Receita"}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </DashboardLayout>
  );
};

export default OphthalmologyPrescriptionForm;
