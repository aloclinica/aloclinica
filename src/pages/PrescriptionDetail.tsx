import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Download, ArrowLeft, Eye } from "lucide-react";

interface PrescriptionDetail {
  id: string;
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
  expiry_date: string;
  observations: string | null;
  prescribed_at: string;
  doctor: { full_name: string; crm: string; crm_state: string };
  patient: { full_name: string };
}

export default function PrescriptionDetail() {
  const { prescriptionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!prescriptionId || !user) return;

    const fetch = async () => {
      try {
        const { data } = await (db as any)
          .from("ophthalmology_prescriptions")
          .select("*, doctor:doctor_id(full_name, crm, crm_state), patient:patient_id(full_name)")
          .eq("id", prescriptionId)
          .single();

        if (data) {
          setPrescription(data as any);
        }
      } catch (error) {
        console.error("Erro ao buscar prescrição:", error);
        toast.error("Prescrição não encontrada");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [prescriptionId, user]);

  const downloadPDF = async () => {
    if (!prescription) return;
    setDownloading(true);

    try {
      const response = await fetch(
        `${(db as any).supabaseUrl}/functions/v1/generate-ophthalmology-prescription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await db.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ prescription_id: prescription.id }),
        }
      );

      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const { html } = await response.json();

      // Use html2pdf library (must be installed: npm install html2pdf.js)
      const element = document.createElement("div");
      element.innerHTML = html;

      // Dynamic import of html2pdf
      const html2pdf = (await import("html2pdf.js")).default;
      (html2pdf() as any).setOptions({
        margin: 10,
        filename: `prescricao_oftalmologica_${prescription.id}.pdf`,
        image: { type: "PNG", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      }).from(element).save();

      toast.success("Prescrição baixada com sucesso");
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Prescrição não encontrada</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isExpired = new Date(prescription.expiry_date) < new Date();
  const typeLabel = prescription.prescription_type === "glasses" ? "Óculos" : "Lente de Contato";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Prescrição Oftalmológica</h1>
          <p className="text-gray-600 mt-2">{new Date(prescription.prescribed_at).toLocaleDateString("pt-BR")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Status Badge */}
          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-red-600 font-semibold">⚠️ Esta prescrição expirou</span>
            </div>
          )}

          {/* Patient & Doctor Card */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Paciente</p>
                  <p className="text-lg font-semibold text-gray-900">{prescription.patient?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Oftalmologista</p>
                  <p className="text-lg font-semibold text-gray-900">{prescription.doctor?.full_name}</p>
                  <p className="text-xs text-gray-600 mt-1">CRM {prescription.doctor?.crm}/{prescription.doctor?.crm_state}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Type Card */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
              <CardTitle className="text-base text-purple-900">Tipo de Prescrição</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-xl font-bold text-gray-900">{typeLabel}</p>
            </CardContent>
          </Card>

          {/* Refraction Data */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-900">Refração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OD - Blue */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">👁️ Olho Direito (OD)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Esfera</p>
                    <p className="font-bold text-blue-900">
                      {prescription.od_sphere ? (prescription.od_sphere > 0 ? "+" : "") + prescription.od_sphere : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Cilindro</p>
                    <p className="font-bold text-blue-900">
                      {prescription.od_cylinder ? (prescription.od_cylinder > 0 ? "+" : "") + prescription.od_cylinder : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Eixo</p>
                    <p className="font-bold text-blue-900">{prescription.od_axis || "—"}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Adição</p>
                    <p className="font-bold text-blue-900">{prescription.od_add ? "+" + prescription.od_add : "—"}</p>
                  </div>
                </div>
              </div>

              {/* OS - Green */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">👁️ Olho Esquerdo (OS)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Esfera</p>
                    <p className="font-bold text-green-900">
                      {prescription.os_sphere ? (prescription.os_sphere > 0 ? "+" : "") + prescription.os_sphere : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Cilindro</p>
                    <p className="font-bold text-green-900">
                      {prescription.os_cylinder ? (prescription.os_cylinder > 0 ? "+" : "") + prescription.os_cylinder : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Eixo</p>
                    <p className="font-bold text-green-900">{prescription.os_axis || "—"}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Adição</p>
                    <p className="font-bold text-green-900">{prescription.os_add ? "+" + prescription.os_add : "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-transparent pb-4">
              <CardTitle className="text-base text-gray-900">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Distância Pupilar</p>
                  <p className="font-semibold text-gray-900">{prescription.pupillary_distance || "—"} mm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Recomendação de Uso</p>
                  <p className="font-semibold text-gray-900">{prescription.recommended_use}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Validade</p>
                  <p className={`font-semibold ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                    {new Date(prescription.expiry_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          {prescription.observations && (
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-transparent pb-4">
                <CardTitle className="text-base text-yellow-900">Observações</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm whitespace-pre-wrap text-gray-700">{prescription.observations}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-end pt-6"
          >
            <Button
              onClick={downloadPDF}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Gerando..." : "Baixar PDF"}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
