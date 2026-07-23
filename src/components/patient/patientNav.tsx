import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  FlaskConical,
  Gift,
  HeartPulse,
  Home,
  LifeBuoy,
  MessageCircle,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Syringe,
  UploadCloud,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";
import type { TranslationKeys } from "@/i18n/locales/pt-BR";

type Translator = (key: TranslationKeys) => string;

/**
 * Default labels (PT-BR) usados quando o caller não passa um tradutor.
 * Mantém compatibilidade com chamadas antigas `getPatientNav("home")`.
 */
const DEFAULTS: Record<string, string> = {
  "patientNav.home": "Início",
  "patientNav.appointments": "Consultas",
  "patientNav.urgentCare": "Urgência",
  "patientNav.schedule": "Agendar",
  "patientNav.health": "Minha Saúde",
  "patientNav.prescriptions": "Receitas",
  "patientNav.examResults": "Exames",
  "patientNav.uploadExams": "Enviar Exames",
  "patientNav.renewal": "Renovar Receita",
  "patientNav.payments": "Pagamentos",
  "patientNav.notifications": "Avisos",
  "patientNav.support": "Suporte",
  "patientNav.chat": "Chat",
  "patientNav.profile": "Meu Perfil",
  "patientNav.settings": "Configurações",
  "patientNav.privacy": "Privacidade",
  "patientNav.groupMain": "Principal",
  "patientNav.groupHealth": "Saúde Digital",
  "patientNav.groupFinance": "Financeiro & Alertas",
  "patientNav.groupAccount": "Conta",
};

const fallback: Translator = (key) => DEFAULTS[key as string] ?? (key as string);

export const getPatientNav = (active: string, t: Translator = fallback) => {
  const main = t("patientNav.groupMain");
  const health = t("patientNav.groupHealth");
  const finance = t("patientNav.groupFinance");
  const account = t("patientNav.groupAccount");
  return [
    // ── Principal ──
    { label: t("patientNav.home"), href: "/dashboard?role=patient", icon: <NavIcon icon={<Home size={18} strokeWidth={2.4} />} color="blue" />, active: active === "home", group: main },
    { label: t("patientNav.appointments"), href: "/dashboard/appointments?role=patient", icon: <NavIcon icon={<CalendarCheck size={18} strokeWidth={2.4} />} color="blue" />, active: active === "appointments", group: main },
    { label: t("patientNav.urgentCare"), href: "/dashboard/urgent-care?role=patient", icon: <NavIcon icon={<Zap size={18} strokeWidth={2.5} />} color="amber" />, active: active === "urgent-care", group: main },
    { label: t("patientNav.schedule"), href: "/dashboard/schedule?role=patient", icon: <NavIcon icon={<Search size={18} strokeWidth={2.4} />} color="cyan" />, active: active === "schedule" || active === "doctors", group: main },
    { label: "Triagem por sintomas", href: "/dashboard/triage?role=patient", icon: <NavIcon icon={<Stethoscope size={18} strokeWidth={2.4} />} color="rose" />, active: active === "triage", group: main },

    // ── Saúde Digital ──
    { label: t("patientNav.health"), href: "/dashboard/patient/health?role=patient", icon: <NavIcon icon={<HeartPulse size={18} strokeWidth={2.4} />} color="rose" />, active: active === "health", group: health },
    { label: t("patientNav.prescriptions"), href: "/dashboard/history?role=patient", icon: <NavIcon icon={<FileText size={18} strokeWidth={2.4} />} color="emerald" />, active: active === "history", group: health },
    { label: t("patientNav.uploadExams"), href: "/dashboard/patient/documents?role=patient", icon: <NavIcon icon={<UploadCloud size={18} strokeWidth={2.4} />} color="cyan" />, active: active === "documents", group: health },
    { label: "Exames (laboratórios)", href: "/dashboard/patient/exams?role=patient", icon: <NavIcon icon={<FlaskConical size={18} strokeWidth={2.4} />} color="cyan" />, active: active === "exams", group: health },
    { label: t("patientNav.renewal"), href: "/dashboard/prescription-renewal?role=patient", icon: <NavIcon icon={<RefreshCw size={18} strokeWidth={2.4} />} color="emerald" />, active: active === "renewal", group: health },
    { label: "Minha Família", href: "/dashboard/patient/family?role=patient", icon: <NavIcon icon={<Users size={18} strokeWidth={2.4} />} color="blue" />, active: active === "family", group: health },
    { label: "Vacinação", href: "/dashboard/patient/vaccinations?role=patient", icon: <NavIcon icon={<Syringe size={18} strokeWidth={2.4} />} color="emerald" />, active: active === "vaccinations", group: health },
    { label: "Diário de Sintomas", href: "/dashboard/patient/diary?role=patient", icon: <NavIcon icon={<BookOpen size={18} strokeWidth={2.4} />} color="rose" />, active: active === "diary", group: health },
    { label: "Planos de Cuidado", href: "/dashboard/patient/care-plans?role=patient", icon: <NavIcon icon={<ClipboardList size={18} strokeWidth={2.4} />} color="cyan" />, active: active === "care-plans", group: health },
    { label: "Lembretes de Remédio", href: "/dashboard/patient/medication?role=patient", icon: <NavIcon icon={<Pill size={18} strokeWidth={2.4} />} color="rose" />, active: active === "medication", group: health },
    // ── Financeiro & Notificações ──
    { label: t("patientNav.payments"), href: "/dashboard/payment-history?role=patient", icon: <NavIcon icon={<CreditCard size={18} strokeWidth={2.4} />} color="green" />, active: active === "payments", group: finance },
    { label: t("patientNav.notifications"), href: "/dashboard/notifications?role=patient", icon: <NavIcon icon={<Bell size={18} strokeWidth={2.4} />} color="blue" />, active: active === "notifications", group: finance },
    { label: t("patientNav.support"), href: "/dashboard/patient/support?role=patient", icon: <NavIcon icon={<LifeBuoy size={18} strokeWidth={2.4} />} color="emerald" />, active: active === "support", group: finance },
    { label: t("patientNav.chat"), href: "/dashboard/chat?role=patient", icon: <NavIcon icon={<MessageCircle size={18} strokeWidth={2.4} />} color="blue" />, active: active === "chat", group: finance },
    { label: "Indique e Ganhe", href: "/dashboard/patient/referral?role=patient", icon: <NavIcon icon={<Gift size={18} strokeWidth={2.4} />} color="amber" />, active: active === "referral", group: finance },

    // ── Conta ──
    { label: t("patientNav.profile"), href: "/dashboard/profile?role=patient", icon: <NavIcon icon={<UserRound size={18} strokeWidth={2.4} />} color="blue" />, active: active === "profile", group: account },
    { label: t("patientNav.settings"), href: "/dashboard/settings?role=patient", icon: <NavIcon icon={<SlidersHorizontal size={18} strokeWidth={2.4} />} color="slate" />, active: active === "settings", group: account },
    { label: t("patientNav.privacy"), href: "/dashboard/patient/lgpd?role=patient", icon: <NavIcon icon={<ShieldCheck size={18} strokeWidth={2.4} />} color="amber" />, active: active === "lgpd", group: account },
    { label: "Quem acessou meus dados", href: "/dashboard/patient/access-log?role=patient", icon: <NavIcon icon={<Eye size={18} strokeWidth={2.4} />} color="amber" />, active: active === "access-log", group: account },
  ];
};
