import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { triggerAppointmentConfirmed } from "@/lib/whatsapp";
import { notifyNewAppointment, notifyPaymentConfirmed } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { logError } from "@/lib/logger";
import { validateCard } from "@/lib/card-utils";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft, Clock, Star, Check, UserPlus, UserCheck, AlertTriangle,
  CalendarDays, CheckCircle2, ChevronRight, Stethoscope, QrCode, CreditCard,
  FileBarChart, Lock, Shield, Copy
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, setHours, setMinutes, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getFeriadosNacionais } from "@/lib/feriados";

import { getPatientNav } from "./patientNav";
const patientNav = getPatientNav("schedule");

type PaymentMethod = "pix" | "card" | "boleto";

interface DoctorInfo {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  bio: string | null;
  consultation_price: number;
  rating: number;
  experience_years: number | null;
  doctor_type?: "telemedicina" | "oftalmologia" | "laudista"; // Added for service type detection
  first_name: string;
  last_name: string;
  specialties: string[];
  slots: { day_of_week: number; start_time: string; end_time: string }[];
}

const STEPS = [
  { key: "date", label: "Data", icon: CalendarDays },
  { key: "time", label: "Horário", icon: Clock },
  { key: "confirm", label: "Confirmar", icon: CheckCircle2 },
  { key: "payment", label: "Pagamento", icon: CreditCard },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Sem recorrência" },
  { value: "weekly", label: "Semanal (mesmo dia/hora)" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

const RECURRENCE_WEEKS: Record<string, number> = { weekly: 1, biweekly: 2, monthly: 4 };

const KYC_PENDING_KEY = "aloclinica_kyc_pending";

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const kycPending = localStorage.getItem(KYC_PENDING_KEY) === "true";

  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string>("first_visit");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [dependents, setDependents] = useState<{ id: string; name: string; relationship: string }[]>([]);
  const [bookingFor, setBookingFor] = useState<string>("self");
  const [feriados, setFeriados] = useState<Date[]>([]);
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  // Return eligibility
  const [returnEligible, setReturnEligible] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);

  // Payment state
  const [paymentStep, setPaymentStep] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [processing, setProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSecondsLeft, setPixSecondsLeft] = useState(0);
  const [pixExpired, setPixExpired] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardDiscount, setCardDiscount] = useState(0);

  const currentStep = paymentStep ? 3 : !selectedDate ? 0 : !selectedTime ? 1 : 2;

  useEffect(() => {
    if (user) {
      db.from("dependents").select("id, name, relationship").eq("user_id", user.id)
        .then(({ data }) => setDependents(data ?? []));
    }
    const currentYear = new Date().getFullYear();
    Promise.all([getFeriadosNacionais(currentYear), getFeriadosNacionais(currentYear + 1)])
      .then(([f1, f2]) => setFeriados([...f1, ...f2]));
  }, [user]);

  useEffect(() => {
    if (doctorId) fetchDoctor();
  }, [doctorId]);

  // Check return eligibility
  useEffect(() => {
    const checkReturn = async () => {
      if (appointmentType !== "return" || !user || !doctorId) {
        setReturnEligible(false);
        setOriginalPrice(null);
        return;
      }
      const { data } = await supabase
        .from("appointments")
        .select("id, price_at_booking, return_deadline")
        .eq("patient_id", user.id)
        .eq("doctor_id", doctorId)
        .eq("status", "completed")
        .not("return_deadline", "is", null)
        .gte("return_deadline", new Date().toISOString())
        .order("scheduled_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setReturnEligible(true);
        setOriginalPrice(data[0].price_at_booking);
      } else {
        setReturnEligible(false);
        setOriginalPrice(null);
      }
    };
    checkReturn();
  }, [appointmentType, user, doctorId]);

  useEffect(() => {
    if (selectedDate && doctorId) fetchBookedSlots();
  }, [selectedDate]);

  // PIX expiry countdown (Asaas QR codes expire after 30 minutes)
  useEffect(() => {
    if (!pixQrCode) return;
    setPixSecondsLeft(1800);
    setPixExpired(false);
    const timer = setInterval(() => {
      setPixSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPixExpired(true);
          toast.error("PIX expirado", { description: "O QR Code expirou. Clique em 'Gerar novo PIX' para continuar." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixQrCode]);

  // Realtime payment confirmation with fallback polling
  useEffect(() => {
    if (!paymentStep || !appointmentId) return;
    const hasPending = pixQrCode || boletoUrl;
    if (!hasPending) return;

    let pollTimeout: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    // Realtime listener
    const channel = supabase
      .channel(`payment-${appointmentId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "appointments",
        filter: `id=eq.${appointmentId}`
      }, (payload) => {
        if (isSubscribed && ["approved", "confirmed", "received"].includes(payload.new.payment_status)) {
          cleanup();
          toast.success("✅ Pagamento confirmado! Consulta garantida.");
          navigate("/dashboard/appointments");
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Reset fallback when realtime connects
          if (pollInterval) clearInterval(pollInterval);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Start fallback polling if realtime fails
          startFallbackPoll();
        }
      });

    const cleanup = () => {
      isSubscribed = false;
      if (pollTimeout) clearTimeout(pollTimeout);
      if (pollInterval) clearInterval(pollInterval);
      channel.unsubscribe();
    };

    const startFallbackPoll = () => {
      if (!isSubscribed) return;
      pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from("appointments")
          .select("payment_status")
          .eq("id", appointmentId)
          .in("payment_status", ["approved", "confirmed", "received"])
          .limit(1);
        if (data && data.length > 0) {
          cleanup();
          toast.success("✅ Pagamento confirmado! Consulta garantida.");
          navigate("/dashboard/appointments");
        }
      }, 8000);
    };

    // Start fallback polling after 10 seconds if realtime not connected
    pollTimeout = setTimeout(() => {
      if ((channel as any).state !== "SUBSCRIBED") {
        startFallbackPoll();
      }
    }, 10000);

    return cleanup;
  }, [paymentStep, appointmentId, pixQrCode, boletoUrl]);

  const fetchDoctor = async () => {
    try {
      const { data: doc, error } = await supabase
        .from("doctor_profiles")
        .select("id, user_id, crm, crm_state, bio, consultation_price, rating, experience_years, doctor_type")
        .eq("id", doctorId!)
        .single();

      if (error || !doc) {
        toast.error("Médico não encontrado", { description: "Verifique o link e tente novamente." });
        navigate(-1);
        setLoading(false);
        return;
      }

      const [profileRes, specsRes, slotsRes] = await Promise.all([
        db.from("profiles").select("first_name, last_name").eq("user_id", doc.user_id).single(),
        db.from("doctor_specialties").select("specialties(name)").eq("doctor_id", doc.id),
        db.from("availability_slots").select("day_of_week, start_time, end_time").eq("doctor_id", doc.id).eq("is_active", true),
      ]);

      setDoctor({
        ...doc,
        consultation_price: Number(doc.consultation_price),
        rating: Number(doc.rating),
        first_name: profileRes.data?.first_name ?? "",
        last_name: profileRes.data?.last_name ?? "",
        specialties: specsRes.data?.map((s: { specialties?: { name?: string } | null }) => s.specialties?.name).filter(Boolean) as string[] ?? [],
        slots: slotsRes.data ?? [],
      });
    } catch (err) {
      logError("[BookAppointment] fetchDoctor error", err);
      toast.error("Erro ao carregar médico", { description: "Tente novamente." });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    if (!selectedDate || !doctorId) return;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("doctor_id", doctorId)
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .neq("status", "cancelled");

    setBookedSlots(data?.map(a => format(new Date(a.scheduled_at), "HH:mm")) ?? []);
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    if (!doctor) return [];
    const dayOfWeek = date.getDay();
    const daySlots = doctor.slots.filter(s => s.day_of_week === dayOfWeek);

    const times: string[] = [];
    daySlots.forEach(slot => {
      const [startH, startM] = slot.start_time.split(":").map(Number);
      const [endH, endM] = slot.end_time.split(":").map(Number);
      let h = startH, m = startM;

      while (h < endH || (h === endH && m < endM)) {
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const slotDateTime = setMinutes(setHours(new Date(date), h), m);

        if (!bookedSlots.includes(timeStr) && !isBefore(slotDateTime, new Date())) {
          times.push(timeStr);
        }
        m += 30;
        if (m >= 60) { h++; m = 0; }
      }
    });

    return times;
  };

  const isDayAvailable = (date: Date): boolean => {
    if (!doctor) return false;
    if (isBefore(date, new Date()) && date.toDateString() !== new Date().toDateString()) return false;
    const isFeriado = feriados.some(f => f.getFullYear() === date.getFullYear() && f.getMonth() === date.getMonth() && f.getDate() === date.getDate());
    if (isFeriado) return false;
    const dayOfWeek = date.getDay();
    return doctor.slots.some(s => s.day_of_week === dayOfWeek);
  };

  const fullPrice = doctor?.consultation_price ?? 89;
  const basePrice = (appointmentType === "return" && returnEligible) ? Math.round(fullPrice * 0.5 * 100) / 100 : fullPrice;
  const discountAmount = basePrice * (cardDiscount / 100);
  const totalPrice = Math.max(basePrice - discountAmount, 0);

  // Step 1: Create appointment, then move to payment
  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !doctor || !user) return;
    setBooking(true);

    const [h, m] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(new Date(selectedDate), h), m);

    const dependentInfo = bookingFor !== "self" ? dependents.find(d => d.id === bookingFor) : null;
    const notesText = dependentInfo ? `Consulta para dependente: ${dependentInfo.name} (${dependentInfo.relationship})` : null;

    // Build list of dates (single or recurring)
    const datesToBook: Date[] = [scheduledAt];
    if (recurrence !== "none") {
      const weeksGap = RECURRENCE_WEEKS[recurrence] ?? 1;
      for (let i = 1; i < recurrenceCount; i++) {
        datesToBook.push(addDays(scheduledAt, weeksGap * 7 * i));
      }
    }

    let firstApptId: string | null = null;
    let errorOccurred = false;

    for (const dt of datesToBook) {
      // Use doctor_type as appointment_type if available (telemedicina/oftalmologia),
      // otherwise use appointmentType (first_visit/return)
      const apptType = firstApptId
        ? "return"
        : (doctor.doctor_type && ["telemedicina", "oftalmologia"].includes(doctor.doctor_type))
          ? doctor.doctor_type
          : appointmentType;

      const { data: insertedAppt, error } = await db.from("appointments").insert({
        patient_id: user.id,
        doctor_id: doctor.id,
        scheduled_at: dt.toISOString(),
        status: "scheduled",
        payment_status: "pending",
        appointment_type: apptType,
        notes: notesText ? notesText + (firstApptId ? ` | Recorrente` : "") : (firstApptId ? "Agendamento recorrente" : null),
        original_appointment_id: firstApptId || null,
        price_at_booking: basePrice,
      }).select("id").single();

      if (error || !insertedAppt) {
        errorOccurred = true;
        break;
      }

      if (!firstApptId) firstApptId = insertedAppt.id;
    }

    setBooking(false);

    if (errorOccurred || !firstApptId) {
      toast.error("Erro", { description: "Não foi possível agendar. Tente novamente." });
    } else {
      setAppointmentId(firstApptId);
      setPaymentStep(true);
      toast.success("Consulta reservada! Agora finalize o pagamento.");
    }
  };

  // Step 2: Process payment via Asaas
  const handlePayment = async () => {
    if (!user || !doctor || !appointmentId) return;
    if (paymentMethod === "card") {
      const cardError = validateCard(cardName, cardNumber, cardExpiry, cardCvv);
      if (cardError) { toast.error(cardError); return; }
    }
    setProcessing(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, cpf, phone")
        .eq("user_id", user.id)
        .single();

      if (!profile?.cpf) {
        toast.error("CPF obrigatório", { description: "Complete seu perfil com o CPF antes de pagar." });
        setProcessing(false);
        return;
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();
      const billingTypeMap: Record<PaymentMethod, string> = { pix: "PIX", card: "CREDIT_CARD", boleto: "BOLETO" };

      const payload: Record<string, any> = {
        customerName,
        customerCpf: profile.cpf,
        customerEmail: user.email || "",
        customerMobilePhone: profile.phone || "",
        billingType: billingTypeMap[paymentMethod],
        value: totalPrice,
        description: `Consulta Médica - AloClinica`,
        appointmentId,
        doctorProfileId: doctor.id,
      };

      // Card tokenization
      if (paymentMethod === "card") {
        const [expiryMonth, expiryYear] = cardExpiry.split("/");
        const { data: tokenData, error: tokenError } = await db.functions.invoke("tokenize-card", {
          body: {
            customerName,
            customerCpf: profile.cpf,
            customerEmail: user.email || "",
            customerPhone: profile.phone || "",
            cardHolderName: cardName,
            cardNumber: cardNumber.replace(/\s/g, ""),
            cardExpiryMonth: expiryMonth,
            cardExpiryYear: `20${expiryYear}`,
            cardCcv: cardCvv,
            cardHolderCpf: profile.cpf,
            cardHolderPhone: profile.phone || "",
            remoteIp: "0.0.0.0",
          },
        });
        if (tokenError || !tokenData?.success) {
          toast.error("Erro no cartão", { description: tokenData?.error || "Não foi possível processar." });
          setProcessing(false);
          return;
        }
        payload.creditCardToken = tokenData.creditCardToken;
      }

      const { data, error } = await db.functions.invoke("create-asaas-payment", { body: payload });

      if (error || !data?.success) {
        toast.error("Erro no pagamento", { description: data?.error || "Tente novamente." });
        setProcessing(false);
        return;
      }

      // Handle PIX→BOLETO fallback
      if (data.fallbackUsed && data.billingType === "BOLETO") {
        setBoletoUrl(data.bankSlipUrl || data.invoiceUrl || null);
        setPaymentMethod("boleto");
        setProcessing(false);
        toast.warning("PIX indisponível", { description: "Boleto gerado automaticamente." });
        return;
      }

      if (paymentMethod === "pix") {
        setPixQrCode(data.pixQrCode || null);
        setPixCopyPaste(data.pixCopyPaste || null);
        setProcessing(false);
        toast.success("PIX gerado! 🎉", { description: "Escaneie o QR Code para pagar." });
        return;
      }

      if (paymentMethod === "boleto") {
        setBoletoUrl(data.bankSlipUrl || data.invoiceUrl || null);
        setProcessing(false);
        toast.success("Boleto gerado! 📄");
        return;
      }

      // Card — usually instant
      if (data.status === "CONFIRMED" || data.status === "RECEIVED") {
        await db.from("appointments").update({
          payment_status: "approved",
          payment_confirmed_at: new Date().toISOString(),
        }).eq("id", appointmentId);

        // Trigger notifications
        triggerAppointmentConfirmed(appointmentId).catch(err => logError("triggerAppointmentConfirmed", err));
        const pName = `${profile.first_name} ${profile.last_name}`.trim();
        const doctorFullName = `Dr(a). ${doctor.first_name} ${doctor.last_name}`;
        if (selectedDate && selectedTime) {
          notifyNewAppointment(appointmentId, doctor.id, pName, format(selectedDate, "dd/MM/yyyy", { locale: ptBR }), selectedTime)
            .catch(err => logError("notifyNewAppointment", err));
        }
        notifyPaymentConfirmed(user.id, doctorFullName, selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "", `R$ ${totalPrice.toFixed(2)}`)
          .catch(err => logError("notifyPaymentConfirmed", err));

        toast.success("Pagamento confirmado! ✅");
        navigate("/dashboard/appointments");
      } else {
        toast.success("Pagamento criado!", { description: "Aguardando confirmação." });
      }
    } catch (err: unknown) {
      logError("BookAppointment payment error", err);
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro inesperado." });
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  if (loading) return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="w-full max-w-lg mx-auto space-y-4 pb-24 md:pb-6">
        <div className="h-6 w-20 rounded-lg shimmer-v2" />
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/30">
          <div className="w-14 h-14 rounded-xl shimmer-v2" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded shimmer-v2" />
            <div className="h-3 w-28 rounded shimmer-v2" />
          </div>
          <div className="h-6 w-16 rounded shimmer-v2" />
        </div>
        <div className="flex items-center justify-between px-2">
          {[1,2,3,4].map(i => <div key={i} className="flex flex-col items-center gap-1"><div className="w-9 h-9 rounded-full shimmer-v2" /><div className="h-2 w-8 rounded shimmer-v2" /></div>)}
        </div>
        <div className="h-64 rounded-2xl shimmer-v2" />
      </div>
    </DashboardLayout>
  );

  if (!doctor) return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="text-center py-20">
        <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Médico não encontrado</p>
      </div>
    </DashboardLayout>
  );

  if (kycPending) {
    return (
      <DashboardLayout title="Paciente" nav={patientNav}>
        <div className="w-full max-w-lg mx-auto text-center py-20 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Verificação necessária</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Para sua segurança, você precisa concluir a verificação de identidade (KYC) antes de agendar consultas.
          </p>
          <Button onClick={() => navigate("/dashboard/profile?role=patient&kyc=open")} className="rounded-xl">
            <Shield className="w-4 h-4 mr-2" /> Completar verificação
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Paciente" nav={patientNav}>
      <div className="w-full max-w-lg mx-auto pb-24 md:pb-6">
        {/* Back */}
        <button onClick={() => {
          if (paymentStep) { setPaymentStep(false); return; }
          navigate(-1);
        }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Doctor card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 mb-5 hover:shadow-lg transition-shadow">
          <Avatar className="w-14 h-14 rounded-xl shrink-0">
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
              {doctor.first_name[0]}{doctor.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-[15px] truncate">Dr(a). {doctor.first_name} {doctor.last_name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>CRM {doctor.crm}/{doctor.crm_state}</span>
              {doctor.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-warning fill-warning" /> {doctor.rating.toFixed(1)}
                </span>
              )}
            </div>
            {doctor.specialties.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {doctor.specialties.slice(0, 2).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-foreground">R${totalPrice.toFixed(0)}</p>
            {cardDiscount > 0 && (
              <p className="text-[10px] text-secondary line-through">R${basePrice.toFixed(0)}</p>
            )}
            <p className="text-[10px] text-muted-foreground">por consulta</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-2 mb-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                      isDone ? "bg-primary text-primary-foreground" :
                      isActive ? "bg-primary/15 text-primary ring-2 ring-primary/30" :
                      "bg-muted text-muted-foreground"
                    )}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {isDone ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : <Icon className="w-4 h-4" />}
                  </motion.div>
                  <span className={cn(
                    "text-[10px] mt-1 font-medium",
                    isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-full h-0.5 -mt-4 bg-muted overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: i < currentStep ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Date */}
          {currentStep === 0 && (
            <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Escolha a data
              </h3>
              <Calendar
                mode="single" selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                disabled={(date) => !isDayAvailable(date)}
                fromDate={new Date()} toDate={addDays(new Date(), 60)}
                locale={ptBR} className="pointer-events-auto mx-auto"
              />
            </motion.div>
          )}

          {/* Step 2: Time */}
          {currentStep === 1 && selectedDate && (
            <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <button onClick={() => { setSelectedDate(undefined); setSelectedTime(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform">
                <CalendarDays className="w-4 h-4" />
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                <span className="text-primary/50 ml-1">✕</span>
              </button>

              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Horários disponíveis
                </h3>
                {availableTimes.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Sem horários nesta data</p>
                    <Button variant="outline" size="sm" className="mt-3 rounded-xl"
                      onClick={async () => {
                        const { error } = await db.from("appointment_waitlist").insert({
                          patient_id: user!.id, doctor_id: doctor.id,
                          desired_date: format(selectedDate, "yyyy-MM-dd"),
                        });
                        if (!error) toast.success("✅ Avisaremos você!", { description: "Se uma vaga abrir, você será notificado." });
                      }}>
                      🔔 Me avise se vagar
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map(time => (
                      <Button key={time} variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className={cn("h-12 text-sm rounded-xl font-medium active:scale-95 transition-all",
                          selectedTime === time && "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md scale-[1.02]"
                        )}>
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 2 && selectedDate && selectedTime && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setSelectedDate(undefined); setSelectedTime(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(selectedDate, "dd/MM", { locale: ptBR })}
                  <span className="opacity-50">✕</span>
                </button>
                <button onClick={() => setSelectedTime(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium active:scale-95 transition-transform">
                  <Clock className="w-3.5 h-3.5" /> {selectedTime}h <span className="opacity-50">✕</span>
                </button>
              </div>

              <div className="bg-card rounded-2xl border-2 border-primary/20 p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Confirmar Agendamento
                </h3>

                {dependents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1.5">Para quem é a consulta?</p>
                    <Select value={bookingFor} onValueChange={setBookingFor}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self"><span className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Para mim</span></SelectItem>
                        {dependents.map(dep => (
                          <SelectItem key={dep.id} value={dep.id}>
                            <span className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> {dep.name} ({dep.relationship})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Tipo de consulta</p>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_visit"><span className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> 1ª Consulta</span></SelectItem>
                      <SelectItem value="return"><span className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> Retorno</span></SelectItem>
                      <SelectItem value="urgency"><span className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Urgência</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 mb-5">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" /> Dr(a). {doctor.first_name} {doctor.last_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {selectedTime}h
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
                    <Check className="w-4 h-4 text-primary shrink-0" /> R$ {totalPrice.toFixed(2)}
                    {cardDiscount > 0 && <Badge variant="secondary" className="text-[10px] ml-1">-{cardDiscount}%</Badge>}
                  </div>
                </div>

                {/* Recurrence */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">Agendamento recorrente</p>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {recurrence !== "none" && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Quantas consultas?</p>
                      <Select value={String(recurrenceCount)} onValueChange={v => setRecurrenceCount(Number(v))}>
                        <SelectTrigger className="h-9 rounded-xl w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 6, 8, 12].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} consultas</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {appointmentType === "return" && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl mb-4 ${returnEligible ? "bg-success/10 border border-success/20" : "bg-warning/10 border border-warning/20"}`}>
                    {returnEligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <p className="text-[11px] text-foreground/80">
                          <strong>Retorno com 50% de desconto!</strong> Você tem uma consulta anterior com esse médico dentro do prazo de 60 dias. Valor: R$ {basePrice.toFixed(2)} (50% de R$ {fullPrice.toFixed(2)}).
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <p className="text-[11px] text-foreground/80">
                          Retornos têm 50% de desconto dentro de 60 dias da consulta original. Nenhuma consulta elegível encontrada — será cobrado o valor integral.
                        </p>
                      </>
                    )}
                  </div>
                )}

                <Button
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground text-base font-bold shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow active:scale-[0.98]"
                  onClick={handleBook} disabled={booking}>
                  {booking ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Reservando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Ir para Pagamento <ChevronRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground mt-3">
                  Ao confirmar, você concorda com os termos de uso e política de cancelamento.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 3 && paymentStep && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-5">
                <Lock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <h3 className="text-lg font-bold text-foreground">Pagamento Seguro</h3>
                <p className="text-xs text-muted-foreground">R$ {totalPrice.toFixed(2)} · via Asaas</p>
              </div>

              {/* Method selector */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {([
                  { id: "pix" as PaymentMethod, label: "PIX", icon: QrCode, badge: "Instantâneo" },
                  { id: "card" as PaymentMethod, label: "Cartão", icon: CreditCard, badge: null },
                  { id: "boleto" as PaymentMethod, label: "Boleto", icon: FileBarChart, badge: null },
                ] as const).map(method => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                      paymentMethod === method.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    )}>
                    <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-semibold", paymentMethod === method.id ? "text-primary" : "text-foreground")}>{method.label}</span>
                    {method.badge && (
                      <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground border-0">
                        {method.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* PIX */}
                {paymentMethod === "pix" && (
                  <motion.div key="pix" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className="border-border">
                      <CardContent className="p-6 text-center">
                        {pixExpired ? (
                          <>
                            <QrCode className="w-12 h-12 mx-auto text-destructive/40 mb-3" />
                            <p className="text-sm font-semibold text-destructive mb-1">QR Code expirado</p>
                            <p className="text-xs text-muted-foreground mb-4">O PIX expirou após 30 minutos.</p>
                            <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base"
                              onClick={() => { setPixQrCode(null); setPixCopyPaste(null); setPixExpired(false); handlePayment(); }}
                              disabled={processing}>
                              {processing ? "Gerando..." : "🔄 Gerar novo PIX"}
                            </Button>
                          </>
                        ) : pixQrCode ? (
                          <>
                            <div className="w-48 h-48 mx-auto rounded-2xl bg-card border-2 border-border p-2 mb-3">
                              <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-full h-full object-contain rounded-xl" loading="lazy" decoding="async" />
                            </div>
                            {/* Expiry countdown */}
                            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
                              pixSecondsLeft < 120 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                            }`}>
                              <Clock className="w-3 h-3" />
                              Expira em {Math.floor(pixSecondsLeft / 60).toString().padStart(2, "0")}:{(pixSecondsLeft % 60).toString().padStart(2, "0")}
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">Escaneie o QR Code ou copie o código</p>
                            <Button variant="outline" className="w-full mb-4 font-mono text-xs"
                              onClick={() => { navigator.clipboard.writeText(pixCopyPaste || ""); setPixCopied(true); toast.success("Copiado!"); setTimeout(() => setPixCopied(false), 3000); }}>
                              {pixCopied ? <><CheckCircle2 className="w-4 h-4 mr-2 text-secondary" /> Copiado!</> : <><Copy className="w-4 h-4 mr-2" /> Copiar código PIX</>}
                            </Button>
                            <p className="text-xs text-muted-foreground">Confirmação automática via webhook.</p>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">Clique para gerar o QR Code PIX</p>
                            <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base"
                              onClick={handlePayment} disabled={processing}>
                              {processing ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                  Gerando PIX...
                                </span>
                              ) : `Gerar PIX • R$ ${totalPrice.toFixed(2)}`}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Card */}
                {paymentMethod === "card" && (
                  <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className="border-border">
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nome no cartão</Label>
                          <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome como no cartão" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Número</Label>
                          <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="mt-1 font-mono" maxLength={19} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Validade</Label>
                            <Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" className="mt-1 font-mono" maxLength={5} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">CVV</Label>
                            <Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" className="mt-1 font-mono" maxLength={4} type="password" />
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base mt-2"
                          onClick={handlePayment} disabled={processing}>
                          {processing ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Processando...
                            </span>
                          ) : <><Lock className="w-4 h-4 mr-2" /> Pagar R$ {totalPrice.toFixed(2)}</>}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Boleto */}
                {paymentMethod === "boleto" && (
                  <motion.div key="boleto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Card className="border-border">
                      <CardContent className="p-6 text-center">
                        {boletoUrl ? (
                          <>
                            <CheckCircle2 className="w-12 h-12 mx-auto text-secondary mb-4" />
                            <h3 className="font-bold text-foreground mb-2">Boleto Gerado!</h3>
                            <p className="text-sm text-muted-foreground mb-4">Pague o boleto para confirmar sua consulta.</p>
                            <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                              <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base mb-3">
                                📄 Abrir Boleto
                              </Button>
                            </a>
                            <p className="text-xs text-muted-foreground">Confirmação automática via webhook.</p>
                          </>
                        ) : (
                          <>
                            <FileBarChart className="w-12 h-12 mx-auto text-primary/60 mb-4" />
                            <h3 className="font-bold text-foreground mb-2">Boleto Bancário</h3>
                            <p className="text-sm text-muted-foreground mb-4">Compensação em até 2 dias úteis.</p>
                            <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base"
                              onClick={handlePayment} disabled={processing}>
                              {processing ? (
                                <span className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                  Gerando boleto...
                                </span>
                              ) : `Gerar Boleto • R$ ${totalPrice.toFixed(2)}`}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 mt-4 text-muted-foreground">
                <div className="flex items-center gap-1 text-xs"><Lock className="w-3 h-3" /> SSL 256-bit</div>
                <div className="flex items-center gap-1 text-xs"><Shield className="w-3 h-3" /> PCI DSS</div>
                <div className="flex items-center gap-1 text-xs"><Check className="w-3 h-3" /> LGPD</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;

