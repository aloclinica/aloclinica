import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Upload, FileText, Heart, Video, ArrowRight, ArrowLeft, X, Sparkles, User, Droplets, AlertTriangle, Plus, Stethoscope, Ambulance, ClipboardList, ShieldCheck, Camera, CheckCircle2, Smartphone, Monitor } from "lucide-react";
import BiometricKYC from "@/components/kyc/BiometricKYC";
import CpfInput from "@/components/ui/cpf-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import mascotWelcome from "@/assets/mascot-welcome.png";
import { formatMask } from "@/hooks/use-mask";
import { validarCPF } from "@/lib/form-validators";

const ONBOARDING_KEY = "aloclinica_onboarding_completed";
const KYC_PENDING_KEY = "aloclinica_kyc_pending";

interface PatientOnboardingProps {
  onComplete: () => void;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];

const PatientOnboarding = ({ onComplete }: PatientOnboardingProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || "");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState("");
  const [kycCompleted, setKycCompleted] = useState(false);
  const [kycFailed, setKycFailed] = useState(false);

  useEffect(() => {
    if (user) {
      db.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setCpf(data.cpf || "");
          setPhone(data.phone || "");
          setDateOfBirth(data.date_of_birth || "");
          setBloodType(data.blood_type || "");
          setAllergies(data.allergies || []);
          setChronicConditions(data.chronic_conditions || []);
        }
      });
    }
  }, [user]);

  const cpfMasked = formatMask(cpf, "cpf");
  const phoneMasked = formatMask(phone, "phone");

  const STEPS = [
    { id: "welcome", title: "Bem-vindo(a)!" },
    { id: "personal", title: "Dados Pessoais" },
    { id: "health", title: "Informações de Saúde" },
    { id: "kyc", title: "Verificação de Identidade" },
    { id: "tour", title: "Como usar" },
    { id: "done", title: "Tudo pronto!" },
  ];

  const isLast = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];

  const addAllergy = () => {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) { setAllergies(prev => [...prev, v]); setAllergyInput(""); }
  };
  const addCondition = () => {
    const v = conditionInput.trim();
    if (v && !chronicConditions.includes(v)) { setChronicConditions(prev => [...prev, v]); setConditionInput(""); }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await db.from("profiles").update({
      first_name: firstName, last_name: lastName,
      cpf: cpf.replace(/\D/g, ""), phone: phone.replace(/\D/g, ""),
      date_of_birth: dateOfBirth || null, blood_type: bloodType || null,
      allergies, chronic_conditions: chronicConditions,
    }).eq("user_id", user.id);
    setSaving(false);
  };

  const handleNext = async () => {
    if (step.id === "personal") {
      if (!firstName.trim() || !lastName.trim()) { toast.error("Preencha nome e sobrenome"); return; }
      const rawCpf = cpf.replace(/\D/g, "");
      if (!rawCpf || !validarCPF(rawCpf)) { toast.error("CPF obrigatório", { description: "Informe um CPF válido para continuar." }); return; }
      const rawPhone = phone.replace(/\D/g, "");
      if (!rawPhone || rawPhone.length < 10) { toast.error("Telefone obrigatório", { description: "Informe um telefone válido." }); return; }
      if (!dateOfBirth) { toast.error("Data de nascimento obrigatória"); return; }
      // Age validation (16+)
      const today = new Date();
      const birth = new Date(dateOfBirth);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 16) { toast.error("Idade mínima: 16 anos"); return; }
      await saveProfile();
    }
    if (step.id === "health") {
      if (!bloodType) { toast.error("Tipo sanguíneo obrigatório", { description: "Selecione seu tipo sanguíneo." }); return; }
      if (!allergies.length) { toast.error("Informe suas alergias", { description: "Adicione alergias ou marque 'Não tenho alergias'." }); return; }
      if (!chronicConditions.length) { toast.error("Informe condições crônicas", { description: "Adicione condições ou marque 'Não tenho condições crônicas'." }); return; }
      await saveProfile();
    }
    if (step.id === "kyc" && !kycCompleted) {
      toast.error("Verificação obrigatória", { description: "Complete a verificação de identidade para continuar." });
      return;
    }
    if (isLast) { localStorage.setItem(ONBOARDING_KEY, "true"); localStorage.removeItem(KYC_PENDING_KEY); onComplete(); }
    else setCurrentStep(prev => prev + 1);
  };

  const FEATURES = [
    { icon: <Stethoscope className="w-6 h-6 text-primary" />, title: "Consultas Médicas", desc: "Agende especialistas em poucos cliques." },
    { icon: <ClipboardList className="w-6 h-6 text-secondary" />, title: "Histórico", desc: "Seu prontuário sempre à mão." },
    { icon: <Ambulance className="w-6 h-6 text-destructive" />, title: "Emergência", desc: "Atendimento 24h prioritário." },
  ];

  const renderStep = () => {
    switch (step.id) {
      case "welcome":
        return (
          <div className="text-center px-2 pt-2">
            {/* Mascot stage with halo */}
            <div className="relative mx-auto w-56 h-56 mb-2">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-2xl" />
              <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-primary/15 to-secondary/15 blur-xl animate-pulse" />
              <motion.img
                src={mascotWelcome}
                alt="Pingo, mascote da AloClínica"
                className="relative w-full h-full object-contain drop-shadow-2xl"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: [0, -6, 0], opacity: 1 }}
                transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.5 } }}
                loading="eager"
                decoding="async"
                width={224}
                height={224}
              />
              {/* Floating accents */}
              <motion.div
                className="absolute top-4 -left-1 w-7 h-7 rounded-full bg-secondary/30 backdrop-blur-sm border border-secondary/40 flex items-center justify-center shadow-lg"
                animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="w-3.5 h-3.5 text-secondary" />
              </motion.div>
              <motion.div
                className="absolute top-10 -right-2 w-7 h-7 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/30 flex items-center justify-center shadow-lg"
                animate={{ y: [0, -8, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <motion.div
                className="absolute bottom-6 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shadow-lg"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
              </motion.div>
            </div>

            {/* Speech bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative bg-card rounded-2xl border border-border/60 px-4 py-2.5 max-w-[220px] mx-auto mb-5 shadow-md"
            >
              <p className="text-[12px] text-foreground leading-snug font-medium">
                Olá! Eu sou o <span className="text-primary font-bold">Pingo</span> 🐧
              </p>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-border/60 rotate-45" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-[28px] sm:text-3xl font-black text-foreground leading-[1.1] tracking-tight mb-3"
            >
              Sua saúde em<br />
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent italic">
                boas mãos.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px] mx-auto mb-5"
            >
              Bem-vindo à <span className="font-semibold text-foreground">AloClínica</span>. O santuário digital para cuidar de você e de quem você ama.
            </motion.p>

            {/* Trust chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-1.5"
            >
              {[
                { icon: <ShieldCheck className="w-3 h-3" />, label: "100% seguro" },
                { icon: <Stethoscope className="w-3 h-3" />, label: "Médicos verificados" },
                { icon: <Heart className="w-3 h-3" />, label: "Cuidado humano" },
              ].map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 border border-border/40 px-2.5 py-1 rounded-full">
                  {c.icon} {c.label}
                </span>
              ))}
            </motion.div>
          </div>
        );

      case "personal":
        return (
          <div className="text-left space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Dados Pessoais</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Todos os campos são obrigatórios</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Nome *</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" className="mt-1 h-11 rounded-xl" /></div>
              <div><Label className="text-xs">Sobrenome *</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" className="mt-1 h-11 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs">CPF *</Label>
              <CpfInput value={cpf} onChange={setCpf} className="mt-1" inputClassName="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Telefone *</Label><Input value={phoneMasked} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="(00) 00000-0000" className="mt-1 h-11 rounded-xl font-mono" maxLength={15} /></div>
              <div><Label className="text-xs">Nascimento *</Label><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="mt-1 h-11 rounded-xl" max={new Date().toISOString().split("T")[0]} /></div>
            </div>
          </div>
        );

      case "health":
        return (
          <div className="text-left space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Saúde</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Todos os campos são obrigatórios</p>
            <div>
              <Label className="text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> Tipo Sanguíneo</Label>
              <Select value={bloodType} onValueChange={setBloodType}>
                <SelectTrigger className="mt-1 h-11 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alergias</Label>
              <div className="flex gap-2 mt-1">
                <Input value={allergyInput} onChange={e => setAllergyInput(e.target.value)} placeholder="Ex: Dipirona" className="h-11 rounded-xl flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAllergy())} />
                <Button size="sm" variant="outline" onClick={addAllergy} className="h-11 w-11 rounded-xl"><Plus className="w-4 h-4" /></Button>
              </div>
              <button type="button" onClick={() => { if (!allergies.includes("Nenhuma")) setAllergies(["Nenhuma"]); }} className="text-xs text-primary mt-1.5 hover:underline">Não tenho alergias</button>
              {allergies.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{allergies.map(a => (<Badge key={a} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setAllergies(prev => prev.filter(x => x !== a))}>{a} <X className="w-2.5 h-2.5" /></Badge>))}</div>}
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Heart className="w-3 h-3" /> Condições Crônicas</Label>
              <div className="flex gap-2 mt-1">
                <Input value={conditionInput} onChange={e => setConditionInput(e.target.value)} placeholder="Ex: Diabetes" className="h-11 rounded-xl flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCondition())} />
                <Button size="sm" variant="outline" onClick={addCondition} className="h-11 w-11 rounded-xl"><Plus className="w-4 h-4" /></Button>
              </div>
              <button type="button" onClick={() => { if (!chronicConditions.includes("Nenhuma")) setChronicConditions(["Nenhuma"]); }} className="text-xs text-primary mt-1.5 hover:underline">Não tenho condições crônicas</button>
              {chronicConditions.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{chronicConditions.map(c => (<Badge key={c} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setChronicConditions(prev => prev.filter(x => x !== c))}>{c} <X className="w-2.5 h-2.5" /></Badge>))}</div>}
            </div>
          </div>
        );

      case "kyc": {
        if (kycCompleted) {
          return (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Identidade Verificada! ✅</h2>
              <p className="text-xs text-muted-foreground">Sua verificação foi aprovada. Prossiga para o próximo passo.</p>
            </div>
          );
        }

        if (kycFailed) {
          return (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Verificação não aprovada</h2>
              <p className="text-xs text-muted-foreground">A similaridade facial ficou abaixo do mínimo. Tente novamente com fotos mais nítidas.</p>
              <Button onClick={() => setKycFailed(false)} variant="outline" className="rounded-xl gap-2 mt-2">
                <Camera className="w-4 h-4" /> Tentar Novamente
              </Button>
            </div>
          );
        }

        return (
          <BiometricKYC
            onComplete={(result) => {
              if (result.status === "aprovado") {
                setKycCompleted(true);
                localStorage.removeItem(KYC_PENDING_KEY);
              } else {
                setKycFailed(true);
              }
            }}
            variant="full"
            tipo="paciente"
          />
        );
      }

      case "tour":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground text-center">O que você pode fazer</h2>
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
            {/* Highlight banner */}
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">DESTAQUE DO MÊS</p>
              <p className="text-base font-bold mt-1">Check-up Preventivo</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Incluso no seu plano AloClínica.</p>
              <Button variant="secondary" size="sm" className="mt-3 rounded-xl">Saber Mais</Button>
            </div>
          </div>
        );

      case "done":
        return (
          <div className="text-center pt-4">
            <div className="relative mx-auto w-40 h-40 mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 blur-2xl" />
              <motion.img
                src={mascotWelcome}
                alt="Pingo comemorando"
                className="relative w-full h-full object-contain drop-shadow-2xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, -4, 4, 0] }}
                transition={{ scale: { duration: 0.4 }, rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
              />
              <motion.div
                className="absolute -top-1 right-2 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              >
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">
              Tudo pronto! <span className="text-secondary">💚</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
              Agende sua primeira consulta e comece a cuidar da saúde com a <span className="font-semibold text-foreground">AloClínica</span>.
            </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
      {/* Decorative gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-secondary/5" />
      <div className="pointer-events-none absolute -top-32 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-lg font-extrabold text-primary italic">AloClínica</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-semibold bg-muted/50 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" /> Cadastro seguro
        </span>
      </div>

      {/* Step indicators */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.id}
              className="h-1.5 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: i <= currentStep ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
              initial={false}
              animate={{
                backgroundColor: i <= currentStep ? "hsl(var(--primary))" : "hsl(var(--muted))",
                scale: i === currentStep ? 1 : 0.95,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground">{step.title}</p>
          <p className="text-[10px] text-muted-foreground/60">{currentStep + 1}/{STEPS.length}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border/50 safe-bottom">
        <div className="flex gap-2 max-w-md mx-auto">
          {currentStep > 0 && (
            <Button variant="outline" className="h-13 rounded-xl px-4" onClick={() => setCurrentStep(prev => prev - 1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Button
            className="flex-1 h-13 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 disabled:opacity-40"
            onClick={handleNext}
            disabled={saving || (step.id === "kyc" && !kycCompleted)}
          >
            {saving ? "Salvando..." : isLast ? "Começar Agora" : (
              <>Próximo <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
        {step.id === "kyc" && !kycCompleted && (
          <p className="w-full text-center text-xs text-destructive/70 mt-3 font-medium">
            ⚠️ Verificação obrigatória para usar a plataforma
          </p>
        )}
        {isLast && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Tudo pronto para começar! 💚
          </p>
        )}
      </div>
      </div>
    </div>
  );
};

export { ONBOARDING_KEY, KYC_PENDING_KEY };
export default PatientOnboarding;
