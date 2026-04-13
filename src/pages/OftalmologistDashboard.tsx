import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, Calendar, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface OftalmologistAppointment {
  id: string;
  patient_name: string;
  scheduled_at: string;
  status: string;
}

export default function OftalmologistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<OftalmologistAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        const { data } = await supabase
          .from("appointments")
          .select("id, patient:profiles(full_name), scheduled_at, status")
          .eq("doctor_id", user.id)
          .eq("appointment_type", "oftalmologia")
          .order("scheduled_at", { ascending: true })
          .limit(20);

        if (data) {
          setAppointments(
            data.map((apt: any) => ({
              id: apt.id,
              patient_name: apt.patient?.full_name || "Paciente",
              scheduled_at: apt.scheduled_at,
              status: apt.status,
            }))
          );
        }
      } catch (error) {
        console.error("Erro ao buscar consultas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  if (!user) return null;

  const scheduled = appointments.filter(a => a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-full -mr-10 -mt-10`} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
              <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Dashboard Oftalmológico</h1>
          <p className="text-gray-600 mt-2">Gerencie suas consultas e prescrições</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Calendar} label="Próximas Consultas" value={scheduled.length} color="bg-blue-500" />
          <StatCard icon={CheckCircle2} label="Completadas" value={completed.length} color="bg-green-500" />
          <StatCard icon={Eye} label="Prescrições Emitidas" value={appointments.length} color="bg-purple-500" />
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Próximas Consultas</span>
                  <span className="sm:hidden">Próximas</span>
                  <span className="ml-2 text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {scheduled.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Histórico</span>
                  <span className="sm:hidden">Histórico</span>
                  <span className="ml-2 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {completed.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Upcoming Tab */}
            <TabsContent value="upcoming" className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                </div>
              ) : scheduled.length === 0 ? (
                <Card className="border-dashed border-2 bg-blue-50 border-blue-200">
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-700 font-medium">Nenhuma consulta agendada</p>
                    <p className="text-sm text-blue-600">Suas próximas consultas aparecerão aqui</p>
                  </CardContent>
                </Card>
              ) : (
                scheduled.map((apt, idx) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300 group">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {apt.patient_name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(apt.scheduled_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => navigate(`/oftalmologista/consulta/${apt.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Abrir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-3">
              {completed.length === 0 ? (
                <Card className="border-dashed border-2 bg-green-50 border-green-200">
                  <CardContent className="pt-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Nenhuma consulta completada</p>
                    <p className="text-sm text-green-600">O histórico aparecerá aqui</p>
                  </CardContent>
                </Card>
              ) : (
                completed.map((apt, idx) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow hover:border-green-300 group">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                              {apt.patient_name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              {new Date(apt.scheduled_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => navigate(`/oftalmologista/consulta/${apt.id}`)}
                          >
                            Ver Prescrição
                          </Button>
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
