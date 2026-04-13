import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Glasses, Save } from "lucide-react";

interface PrescriptionData {
  prescription_type: string;
  od_sphere: number | null;
  od_cylinder: number | null;
  od_axis: number | null;
  od_add: number | null;
  os_sphere: number | null;
  os_cylinder: number | null;
  os_axis: number | null;
  os_add: number | null;
  pupillary_distance: number | null;
  recommended_use: string;
  observations: string;
  expiry_date: string;
}

export default function OftalmologyPrescription() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examId, setExamId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [prescription, setPrescription] = useState<Partial<PrescriptionData>>({
    prescription_type: "glasses",
    recommended_use: "Uso geral",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appointmentId || !user) return;

    const fetch = async () => {
      const { data: appointment } = await supabase
        .from("appointments")
        .select("patient_id, patient:profiles(full_name)")
        .eq("id", appointmentId)
        .single();

      if (appointment) {
        setPatientName(appointment.patient?.full_name || "");
        setPatientId(appointment.patient_id);
      }

      const { data: exam } = await supabase
        .from("ophthalmology_exams")
        .select("id, od_sphere, od_cylinder, od_axis, os_sphere, os_cylinder, os_axis")
        .eq("appointment_id", appointmentId)
        .single();

      if (exam) {
        setExamId(exam.id);
        setPrescription(prev => ({
          ...prev,
          od_sphere: exam.od_sphere,
          od_cylinder: exam.od_cylinder,
          od_axis: exam.od_axis,
          os_sphere: exam.os_sphere,
          os_cylinder: exam.os_cylinder,
          os_axis: exam.os_axis,
        }));
      }
    };

    fetch();
  }, [appointmentId, user]);

  const savePrescription = async () => {
    if (!examId || !patientId || !user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("ophthalmology_prescriptions")
        .insert([
          {
            exam_id: examId,
            patient_id: patientId,
            doctor_id: user.id,
            ...prescription,
          },
        ]);

      if (error) throw error;

      toast.success("Prescrição emitida com sucesso");
      navigate(`/oftalmologista`);
    } catch (error) {
      toast.error("Erro ao emitir prescrição");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof PrescriptionData, value: any) => {
    setPrescription(prev => ({ ...prev, [key]: value === "" ? null : value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Prescrição de Óculos/Lentes</h1>
          <p className="text-gray-600 mt-2">Paciente: <span className="font-semibold">{patientName}</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Tipo de Prescrição */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
              <div className="flex items-center gap-2">
                <Glasses className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg text-gray-900">Tipo de Prescrição</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Select
                value={prescription.prescription_type || "glasses"}
                onValueChange={(value) => updateField("prescription_type", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glasses">Óculos</SelectItem>
                  <SelectItem value="contact_lens">Lente de Contato</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Olho Direito (OD) */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
              <CardTitle className="text-lg text-blue-900">👁️ Olho Direito (OD)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="od_sphere" className="text-gray-700 font-medium mb-2 block">Esfera (D)</Label>
                <Input
                  id="od_sphere"
                  type="number"
                  step="0.25"
                  value={prescription.od_sphere ?? ""}
                  onChange={(e) => updateField("od_sphere", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="+0.00"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="od_cylinder" className="text-gray-700 font-medium mb-2 block">Cilindro (D)</Label>
                <Input
                  id="od_cylinder"
                  type="number"
                  step="0.25"
                  value={prescription.od_cylinder ?? ""}
                  onChange={(e) => updateField("od_cylinder", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="+0.00"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="od_axis" className="text-gray-700 font-medium mb-2 block">Eixo (°)</Label>
                <Input
                  id="od_axis"
                  type="number"
                  min="0"
                  max="180"
                  value={prescription.od_axis ?? ""}
                  onChange={(e) => updateField("od_axis", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="od_add" className="text-gray-700 font-medium mb-2 block">Adição (D)</Label>
                <Input
                  id="od_add"
                  type="number"
                  step="0.25"
                  value={prescription.od_add ?? ""}
                  onChange={(e) => updateField("od_add", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Progressiva"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Olho Esquerdo (OS) */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
              <CardTitle className="text-lg text-green-900">👁️ Olho Esquerdo (OS)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="os_sphere" className="text-gray-700 font-medium mb-2 block">Esfera (D)</Label>
                <Input
                  id="os_sphere"
                  type="number"
                  step="0.25"
                  value={prescription.os_sphere ?? ""}
                  onChange={(e) => updateField("os_sphere", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="+0.00"
                  className="border-gray-300 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="os_cylinder" className="text-gray-700 font-medium mb-2 block">Cilindro (D)</Label>
                <Input
                  id="os_cylinder"
                  type="number"
                  step="0.25"
                  value={prescription.os_cylinder ?? ""}
                  onChange={(e) => updateField("os_cylinder", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="+0.00"
                  className="border-gray-300 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="os_axis" className="text-gray-700 font-medium mb-2 block">Eixo (°)</Label>
                <Input
                  id="os_axis"
                  type="number"
                  min="0"
                  max="180"
                  value={prescription.os_axis ?? ""}
                  onChange={(e) => updateField("os_axis", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0"
                  className="border-gray-300 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="os_add" className="text-gray-700 font-medium mb-2 block">Adição (D)</Label>
                <Input
                  id="os_add"
                  type="number"
                  step="0.25"
                  value={prescription.os_add ?? ""}
                  onChange={(e) => updateField("os_add", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Progressiva"
                  className="border-gray-300 focus:border-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent pb-4">
              <CardTitle className="text-lg text-amber-900">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="pd" className="text-gray-700 font-medium mb-2 block">Distância Pupilar (mm)</Label>
                <Input
                  id="pd"
                  type="number"
                  step="0.1"
                  value={prescription.pupillary_distance ?? ""}
                  onChange={(e) => updateField("pupillary_distance", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="64"
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="use" className="text-gray-700 font-medium mb-2 block">Recomendação de Uso</Label>
                <Select
                  value={prescription.recommended_use || "Uso geral"}
                  onValueChange={(value) => updateField("recommended_use", value)}
                >
                  <SelectTrigger className="border-gray-300 focus:border-amber-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uso geral">Uso geral</SelectItem>
                    <SelectItem value="Distância">Visão de distância</SelectItem>
                    <SelectItem value="Leitura">Leitura/Perto</SelectItem>
                    <SelectItem value="Computador">Computador</SelectItem>
                    <SelectItem value="Esportes">Esportes</SelectItem>
                    <SelectItem value="Progressiva">Progressiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiry" className="text-gray-700 font-medium mb-2 block">Data de Vencimento</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={prescription.expiry_date ?? ""}
                  onChange={(e) => updateField("expiry_date", e.target.value)}
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="obs" className="text-gray-700 font-medium mb-2 block">Observações</Label>
                <Textarea
                  id="obs"
                  value={prescription.observations ?? ""}
                  onChange={(e) => updateField("observations", e.target.value)}
                  placeholder="Instruções especiais, compatibilidades, etc."
                  rows={3}
                  className="border-gray-300 focus:border-amber-500 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-end pt-6"
          >
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={savePrescription}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Emitindo..." : "Emitir Prescrição"}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
