import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { AlertCircle, Download, Eye } from "lucide-react";

interface Exam {
  id: string;
  exam_date: string;
  doctor: { full_name: string };
  od_sphere: number | null;
  od_cylinder: number | null;
  os_sphere: number | null;
  os_cylinder: number | null;
  va_od: string;
  va_os: string;
}

interface Prescription {
  id: string;
  prescribed_at: string;
  prescription_type: string;
  doctor: { full_name: string };
  od_sphere: number | null;
  os_sphere: number | null;
  expiry_date: string;
}

export default function PatientOftalmologyExams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      try {
        const { data: examsData } = await db
          .from("ophthalmology_exams")
          .select("id, exam_date, doctor:doctor_id(full_name), od_sphere, od_cylinder, os_sphere, os_cylinder, va_od, va_os")
          .eq("patient_id", user.id)
          .order("exam_date", { ascending: false });

        if (examsData) {
          setExams(examsData as any);
        }

        const { data: prescData } = await db
          .from("ophthalmology_prescriptions")
          .select("id, prescribed_at, prescription_type, doctor:doctor_id(full_name), od_sphere, os_sphere, expiry_date")
          .eq("patient_id", user.id)
          .order("prescribed_at", { ascending: false });

        if (prescData) {
          setPrescriptions(prescData as any);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  if (!user) return null;

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Meus Exames Oftalmológicos</h1>
          <p className="text-gray-600 mt-2">Histórico de exames e prescrições</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="exams" className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="exams" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Exames</span>
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Prescrições</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* EXAMS TAB */}
            <TabsContent value="exams" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
              ) : exams.length === 0 ? (
                <Card className="border-dashed border-2 bg-blue-50 border-blue-200">
                  <CardContent className="pt-6 text-center">
                    <Eye className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-700 font-medium">Nenhum exame registrado</p>
                    <p className="text-sm text-blue-600">Seus exames aparecerão aqui após serem realizados</p>
                  </CardContent>
                </Card>
              ) : (
                exams.map((exam, idx) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow hover:border-blue-300 group">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg text-gray-900">
                              Exame de {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Dr(a). {exam.doctor?.full_name || "—"}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            onClick={() => navigate(`/meu-perfil/exame/${exam.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-3 bg-blue-50 rounded">
                            <p className="text-xs text-blue-600 font-medium mb-1">OD Esfera</p>
                            <p className="font-bold text-blue-900">
                              {exam.od_sphere ? (exam.od_sphere > 0 ? "+" : "") + exam.od_sphere : "—"} D
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded">
                            <p className="text-xs text-green-600 font-medium mb-1">OS Esfera</p>
                            <p className="font-bold text-green-900">
                              {exam.os_sphere ? (exam.os_sphere > 0 ? "+" : "") + exam.os_sphere : "—"} D
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded">
                            <p className="text-xs text-purple-600 font-medium mb-1">AV OD</p>
                            <p className="font-bold text-purple-900">{exam.va_od || "—"}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded">
                            <p className="text-xs text-purple-600 font-medium mb-1">AV OS</p>
                            <p className="font-bold text-purple-900">{exam.va_os || "—"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* PRESCRIPTIONS TAB */}
            <TabsContent value="prescriptions" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
                </div>
              ) : prescriptions.length === 0 ? (
                <Card className="border-dashed border-2 bg-green-50 border-green-200">
                  <CardContent className="pt-6 text-center">
                    <Download className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Nenhuma prescrição registrada</p>
                    <p className="text-sm text-green-600">Suas prescrições aparecerão aqui após emissão</p>
                  </CardContent>
                </Card>
              ) : (
                prescriptions.map((presc, idx) => (
                  <motion.div
                    key={presc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card
                      className={`border-0 shadow-sm hover:shadow-md transition-shadow hover:border-green-300 group ${
                        isExpired(presc.expiry_date) ? "opacity-75" : ""
                      }`}
                    >
                      <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg text-gray-900">
                                Prescrição de {new Date(presc.prescribed_at).toLocaleDateString('pt-BR')}
                              </CardTitle>
                              {isExpired(presc.expiry_date) && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                  VENCIDA
                                </span>
                              )}
                            </div>
                            <CardDescription className="mt-1">
                              Dr(a). {presc.doctor?.full_name || "—"} • {presc.prescription_type === "glasses" ? "Óculos" : "Lente de Contato"}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            onClick={() => navigate(`/meu-perfil/prescricao/${presc.id}`)}
                          >
                            <Download className="h-4 w-4" />
                            Ver/Baixar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 bg-blue-50 rounded">
                            <p className="text-xs text-blue-600 font-medium mb-1">OD Esfera</p>
                            <p className="font-bold text-blue-900">
                              {presc.od_sphere ? (presc.od_sphere > 0 ? "+" : "") + presc.od_sphere : "—"}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded">
                            <p className="text-xs text-green-600 font-medium mb-1">OS Esfera</p>
                            <p className="font-bold text-green-900">
                              {presc.os_sphere ? (presc.os_sphere > 0 ? "+" : "") + presc.os_sphere : "—"}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600 font-medium mb-1">Válida até</p>
                            <p className={`font-bold ${isExpired(presc.expiry_date) ? "text-red-600" : "text-gray-900"}`}>
                              {new Date(presc.expiry_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600 font-medium mb-1">Status</p>
                            <p className={`font-bold ${isExpired(presc.expiry_date) ? "text-red-600" : "text-green-600"}`}>
                              {isExpired(presc.expiry_date) ? "Expirada" : "Válida"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
