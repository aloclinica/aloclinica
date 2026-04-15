import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";
import { motion } from "framer-motion";

interface Oftalmologist {
  id: string;
  full_name: string;
  crm: string;
}

export default function BookOftalmologyAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [oftalmologists, setOftalmologists] = useState<Oftalmologist[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchOftalmologists = async () => {
      try {
        const { data } = await db
          .from("doctor_profiles")
          .select("user_id, full_name, crm")
          .eq("doctor_type", "oftalmologia")
          .eq("kyc_status", "approved");

        if (data) {
          setOftalmologists(
            data.map(doc => ({
              id: doc.user_id,
              full_name: doc.full_name || "Dr(a). (perfil incompleto)",
              crm: doc.crm || "",
            }))
          );
        }
      } catch (error) {
        console.error("Erro ao buscar oftalmologistas:", error);
        toast.error("Erro ao carregar médicos");
      } finally {
        setLoading(false);
      }
    };

    fetchOftalmologists();
  }, []);

  const bookAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !appointmentTime || !user) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setBooking(true);
    try {
      const scheduledAt = new Date(`${appointmentDate}T${appointmentTime}`).toISOString();

      const { error } = await db
        .from("appointments")
        .insert([
          {
            patient_id: user.id,
            doctor_id: selectedDoctor,
            scheduled_at: scheduledAt,
            appointment_type: "oftalmologia",
            status: "scheduled",
            notes: reason || null,
          },
        ]);

      if (error) throw error;

      toast.success("Consulta agendada com sucesso!");
      navigate("/meu-perfil/consultas");
    } catch (error) {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar consulta");
    } finally {
      setBooking(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Voltar</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Agendar Consulta Oftalmológica</h1>
          <p className="text-gray-600 mt-2">Escolha seu oftalmologista e melhor horário</p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Doctor Selection */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-gray-900">Médico</CardTitle>
              </div>
              <CardDescription>Selecione um oftalmologista</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : oftalmologists.length === 0 ? (
                <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-amber-700 font-medium">Nenhum oftalmologista disponível</p>
                  <p className="text-sm text-amber-600">Tente novamente mais tarde</p>
                </div>
              ) : (
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione um oftalmologista" />
                  </SelectTrigger>
                  <SelectContent>
                    {oftalmologists.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>{doc.full_name}</span>
                          <span className="text-xs text-gray-500">(CRM: {doc.crm})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg text-gray-900">Data e Horário</CardTitle>
              </div>
              <CardDescription>Escolha quando deseja atender</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="date" className="text-gray-700 font-medium mb-2 block">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={minDate}
                  max={maxDateStr}
                  className="border-gray-300 focus:border-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="time" className="text-gray-700 font-medium mb-2 block">
                  Horário
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="border-gray-300 focus:border-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reason */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
              <CardTitle className="text-lg text-gray-900">Motivo da Consulta</CardTitle>
              <CardDescription>Opcional - descreva brevemente</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Revisão de óculos, pressão ocular alta, desconforto visual..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-green-500 resize-none"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={bookAppointment}
              disabled={booking || !selectedDoctor || !appointmentDate || !appointmentTime}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {booking ? "Agendando..." : "Agendar Consulta"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
