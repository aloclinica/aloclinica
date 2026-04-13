import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Home, Sparkles, Clock, Stethoscope, FileText, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { ChatCircleDots } from "@phosphor-icons/react";

/* CSS confetti */
const ConfettiPiece = ({ i }: { i: number }) => {
  const colors = ["bg-primary", "bg-secondary", "bg-yellow-400", "bg-emerald-400", "bg-pink-400", "bg-blue-400"];
  const color = colors[i % colors.length];
  const left = 10 + Math.random() * 80;
  const delay = Math.random() * 0.6;
  const dur = 1.2 + Math.random() * 0.8;
  return (
    <motion.div
      className={`absolute w-2 h-2 rounded-sm ${color}`}
      style={{ left: `${left}%`, top: "-5%" }}
      initial={{ opacity: 1, y: 0, rotate: 0 }}
      animate={{ y: [0, 500], x: [(Math.random() - 0.5) * 150], rotate: [0, 360], opacity: [1, 1, 0] }}
      transition={{ duration: dur, delay, ease: "easeIn" }}
    />
  );
};

const checklist = [
  { icon: Stethoscope, text: "Tenha seus exames recentes em mãos" },
  { icon: FileText, text: "Liste seus medicamentos atuais" },
  { icon: Smartphone, text: "Teste câmera e microfone antes" },
  { icon: Clock, text: "Esteja pronto 5 minutos antes" },
];

const AppointmentConfirmed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doctorName = searchParams.get("doctor") || "seu médico";
  const appointmentDate = searchParams.get("date") || "em breve";
  const appointmentTime = searchParams.get("time") || "";

  const handleAddToCalendar = () => {
    // Google Calendar URL template
    const title = encodeURIComponent("Teleconsulta — AloClínica");
    const details = encodeURIComponent("Sua teleconsulta na AloClínica. Acesse: https://aloclinica.com.br/dashboard");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(url, "_blank");
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `📋 *Consulta Confirmada na AloClínica* 📋\n\n` +
      `👨‍⚕️ Médico: ${doctorName}\n` +
      `📅 Data: ${appointmentDate}\n` +
      (appointmentTime ? `⏰ Horário: ${appointmentTime}\n\n` : `\n`) +
      `Clique aqui para acessar sua consulta:\n` +
      `https://aloclinica.com.br/dashboard\n\n` +
      `✅ Sua consulta está confirmada!`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background relative overflow-hidden">
      <SEOHead title="Consulta Confirmada — AloClínica" description="Sua consulta foi confirmada com sucesso." />

      {/* Confetti */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <ConfettiPiece key={i} i={i} />
        ))}
      </div>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/[0.03] blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-emerald-500/[0.04] blur-[60px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Animated checkmark */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="relative"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute inset-0 rounded-full bg-emerald-500/20"
            />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <motion.path
                  d="M10 20L17 27L30 13"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                />
              </svg>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 mb-3">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold text-primary">Confirmado</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-foreground">Tudo pronto!</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Sua consulta na AloClínica foi confirmada com sucesso.
          </p>
        </motion.div>

        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl p-5 border border-border/30 shadow-sm mb-6"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            O que levar para a consulta
          </p>
          <div className="space-y-3">
            {checklist.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            className="w-full h-[52px] rounded-full font-bold text-[15px] gap-2"
            onClick={handleAddToCalendar}
          >
            <Calendar className="w-4 h-4" /> Adicionar ao Google Calendar
          </Button>
          <Button
            className="w-full h-[52px] rounded-full font-semibold text-[15px] gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleShareWhatsApp}
          >
            <ChatCircleDots className="w-4 h-4" weight="fill" /> Compartilhar no WhatsApp
          </Button>
          <Button
            variant="outline"
            className="w-full h-[52px] rounded-full font-semibold text-[15px] gap-2 border-border/30"
            onClick={() => navigate("/dashboard?role=patient")}
          >
            <Home className="w-4 h-4" /> Ver no dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AppointmentConfirmed;
