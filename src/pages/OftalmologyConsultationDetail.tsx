import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, Microscope, FileText, ArrowLeft, Save } from "lucide-react";

interface ExamData {
  od_sphere: number | null;
  od_cylinder: number | null;
  od_axis: number | null;
  os_sphere: number | null;
  os_cylinder: number | null;
  os_axis: number | null;
  va_od: string;
  va_os: string;
  va_ou: string;
  intraocular_pressure_od: number | null;
  intraocular_pressure_os: number | null;
  tonometry_method: string;
  anterior_segment: string;
  posterior_segment: string;
  pupil_reaction: string;
  other_findings: string;
}

export default function OftalmologyConsultationDetail() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [exam, setExam] = useState<Partial<ExamData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appointmentId || !user) return;

    const fetch = async () => {
      const { data: appointment } = await (db as any)
        .from("appointments")
        .select("patient:profiles(full_name)")
        .eq("id", appointmentId)
        .single();

      if (appointment) {
        setPatientName((appointment as any).patient?.full_name || "");
      }

      const { data: existingExam } = await (db as any)
        .from("ophthalmology_exams")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (existingExam) {
        setExam(existingExam);
      }
    };

    fetch();
  }, [appointmentId, user]);

  const saveExam = async () => {
    if (!appointmentId || !user) return;
    setSaving(true);

    try {
      const existingExam = (exam as any).id;

      if (existingExam) {
        await db
          .from("ophthalmology_exams")
          .update(exam)
          .eq("id", existingExam);
      } else {
        await (db as any)
          .from("ophthalmology_exams")
          .insert([
            {
              appointment_id: appointmentId,
              doctor_id: user.id,
              patient_id: (await db.auth.getUser()).data.user?.id,
              ...exam,
            },
          ]);
      }

      toast.success("Exame salvo com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar exame");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof ExamData, value: any) => {
    setExam(prev => ({ ...prev, [key]: value === "" ? null : value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Voltar</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Consulta Oftalmológica</h1>
          <p className="text-gray-600 mt-2">Paciente: <span className="font-semibold">{patientName}</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="refraction" className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="refraction" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Refração</span>
                </TabsTrigger>
                <TabsTrigger value="tonometry" className="flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  <span className="hidden sm:inline">Tonometria</span>
                </TabsTrigger>
                <TabsTrigger value="findings" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Achados</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="refraction" className="space-y-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
                    <CardTitle className="text-lg text-blue-900">👁️ Olho Direito (OD)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Esfera (D)</Label>
                      <Input type="number" step="0.25" value={exam.od_sphere ?? ""} onChange={(e) => updateField("od_sphere", e.target.value ? parseFloat(e.target.value) : null)} placeholder="+0.00" className="border-gray-300 focus:border-blue-500" />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Cilindro (D)</Label>
                      <Input type="number" step="0.25" value={exam.od_cylinder ?? ""} onChange={(e) => updateField("od_cylinder", e.target.value ? parseFloat(e.target.value) : null)} placeholder="+0.00" className="border-gray-300 focus:border-blue-500" />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Eixo (°)</Label>
                      <Input type="number" min="0" max="180" value={exam.od_axis ?? ""} onChange={(e) => updateField("od_axis", e.target.value ? parseInt(e.target.value) : null)} placeholder="0" className="border-gray-300 focus:border-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
                    <CardTitle className="text-lg text-green-900">👁️ Olho Esquerdo (OS)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Esfera (D)</Label>
                      <Input type="number" step="0.25" value={exam.os_sphere ?? ""} onChange={(e) => updateField("os_sphere", e.target.value ? parseFloat(e.target.value) : null)} placeholder="+0.00" className="border-gray-300 focus:border-green-500" />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Cilindro (D)</Label>
                      <Input type="number" step="0.25" value={exam.os_cylinder ?? ""} onChange={(e) => updateField("os_cylinder", e.target.value ? parseFloat(e.target.value) : null)} placeholder="+0.00" className="border-gray-300 focus:border-green-500" />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Eixo (°)</Label>
                      <Input type="number" min="0" max="180" value={exam.os_axis ?? ""} onChange={(e) => updateField("os_axis", e.target.value ? parseInt(e.target.value) : null)} placeholder="0" className="border-gray-300 focus:border-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
                    <CardTitle className="text-base text-purple-900">Acuidade Visual</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">AV OD</Label>
                      <Input value={exam.va_od ?? ""} onChange={(e) => updateField("va_od", e.target.value)} placeholder="20/20" className="border-gray-300 focus:border-purple-500" />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">AV OS</Label>
                      <Input value={exam.va_os ?? ""} onChange={(e) => updateField("va_os", e.target.value)} placeholder="20/20" className="border-gray-300 focus:border-purple-500" />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">AV OU</Label>
                      <Input value={exam.va_ou ?? ""} onChange={(e) => updateField("va_ou", e.target.value)} placeholder="20/20" className="border-gray-300 focus:border-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="tonometry" className="space-y-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-transparent pb-4">
                    <CardTitle className="text-base text-red-900">Pressão Intraocular</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-700 font-medium mb-2 block">PIO OD (mmHg)</Label>
                        <Input type="number" step="0.1" value={exam.intraocular_pressure_od ?? ""} onChange={(e) => updateField("intraocular_pressure_od", e.target.value ? parseFloat(e.target.value) : null)} placeholder="15" className="border-gray-300 focus:border-red-500" />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium mb-2 block">PIO OS (mmHg)</Label>
                        <Input type="number" step="0.1" value={exam.intraocular_pressure_os ?? ""} onChange={(e) => updateField("intraocular_pressure_os", e.target.value ? parseFloat(e.target.value) : null)} placeholder="15" className="border-gray-300 focus:border-red-500" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Método</Label>
                      <Input value={exam.tonometry_method ?? ""} onChange={(e) => updateField("tonometry_method", e.target.value)} placeholder="Goldmann, Tonopen, etc." className="border-gray-300 focus:border-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="findings" className="space-y-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Segmento Anterior</Label>
                      <Textarea value={exam.anterior_segment ?? ""} onChange={(e) => updateField("anterior_segment", e.target.value)} placeholder="Descrição..." className="border-gray-300 focus:border-gray-500 resize-none" rows={3} />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Segmento Posterior</Label>
                      <Textarea value={exam.posterior_segment ?? ""} onChange={(e) => updateField("posterior_segment", e.target.value)} placeholder="Descrição..." className="border-gray-300 focus:border-gray-500 resize-none" rows={3} />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Reação Pupilar</Label>
                      <Textarea value={exam.pupil_reaction ?? ""} onChange={(e) => updateField("pupil_reaction", e.target.value)} placeholder="Descrição..." className="border-gray-300 focus:border-gray-500 resize-none" rows={2} />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Outros Achados</Label>
                      <Textarea value={exam.other_findings ?? ""} onChange={(e) => updateField("other_findings", e.target.value)} placeholder="Outros..." className="border-gray-300 focus:border-gray-500 resize-none" rows={3} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 justify-end pt-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</Button>
            <Button onClick={saveExam} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Exame"}
            </Button>
            <Button onClick={() => navigate(`/oftalmologista/consulta/${appointmentId}/prescricao`)} className="bg-green-600 hover:bg-green-700 text-white">Emitir Prescrição</Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}