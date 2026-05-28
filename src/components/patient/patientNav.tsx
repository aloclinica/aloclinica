import {
  House, MagnifyingGlass, Lightning, CalendarCheck, ChatCircleDots,
  Headset, CreditCard, Sliders, UserCircle, Heart, FileText,
  ClipboardText, Upload, BookOpen, Users, Bell, Shield,
  IdentificationCard, Syringe, FirstAid, Eye
} from "@phosphor-icons/react";
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
    { label: t("patientNav.home"), href: "/dashboard?role=patient", icon: <NavIcon icon={<House size={16} weight="fill" />} color="blue" />, active: active === "home", group: main },
    { label: t("patientNav.appointments"), href: "/dashboard/appointments?role=patient", icon: <NavIcon icon={<CalendarCheck size={16} weight="fill" />} color="blue" />, active: active === "appointments", group: main },
    { label: t("patientNav.urgentCare"), href: "/dashboard/urgent-care?role=patient", icon: <NavIcon icon={<Lightning size={16} weight="fill" />} color="amber" />, active: active === "urgent-care", group: main },
    { label: t("patientNav.schedule"), href: "/dashboard/schedule?role=patient", icon: <NavIcon icon={<MagnifyingGlass size={16} weight="fill" />} color="cyan" />, active: active === "schedule" || active === "doctors", group: main },

    // ── Saúde Digital ──
    { label: t("patientNav.health"), href: "/dashboard/patient/health?role=patient", icon: <NavIcon icon={<Heart size={16} weight="fill" />} color="rose" />, active: active === "health", group: health },
    { label: t("patientNav.prescriptions"), href: "/dashboard/history?role=patient", icon: <NavIcon icon={<FileText size={16} weight="fill" />} color="emerald" />, active: active === "history", group: health },
    { label: t("patientNav.uploadExams"), href: "/dashboard/patient/documents?role=patient", icon: <NavIcon icon={<Upload size={16} weight="fill" />} color="cyan" />, active: active === "documents", group: health },
    { label: "Exames (laboratórios)", href: "/dashboard/patient/exams?role=patient", icon: <NavIcon icon={<FirstAid size={16} weight="fill" />} color="cyan" />, active: active === "exams", group: health },
    { label: t("patientNav.renewal"), href: "/dashboard/prescription-renewal?role=patient", icon: <NavIcon icon={<BookOpen size={16} weight="fill" />} color="emerald" />, active: active === "renewal", group: health },
    { label: "Família", href: "/dashboard/patient/family?role=patient", icon: <NavIcon icon={<Users size={16} weight="fill" />} color="rose" />, active: active === "family", group: health },
    { label: "Indique e ganhe", href: "/dashboard/patient/referral?role=patient", icon: <NavIcon icon={<Heart size={16} weight="fill" />} color="amber" />, active: active === "referral", group: finance },

    // ── Financeiro & Notificações ──
    { label: t("patientNav.payments"), href: "/dashboard/payment-history?role=patient", icon: <NavIcon icon={<CreditCard size={16} weight="fill" />} color="green" />, active: active === "payments", group: finance },
    { label: t("patientNav.notifications"), href: "/dashboard/notifications?role=patient", icon: <NavIcon icon={<Bell size={16} weight="fill" />} color="blue" />, active: active === "notifications", group: finance },
    { label: t("patientNav.support"), href: "/dashboard/patient/support?role=patient", icon: <NavIcon icon={<Headset size={16} weight="fill" />} color="emerald" />, active: active === "support", group: finance },
    { label: t("patientNav.chat"), href: "/dashboard/chat?role=patient", icon: <NavIcon icon={<ChatCircleDots size={16} weight="fill" />} color="blue" />, active: active === "chat", group: finance },

    // ── Conta ──
    { label: t("patientNav.profile"), href: "/dashboard/profile?role=patient", icon: <NavIcon icon={<UserCircle size={16} weight="fill" />} color="blue" />, active: active === "profile", group: account },
    { label: t("patientNav.settings"), href: "/dashboard/settings?role=patient", icon: <NavIcon icon={<Sliders size={16} weight="fill" />} color="slate" />, active: active === "settings", group: account },
    { label: t("patientNav.privacy"), href: "/dashboard/patient/lgpd?role=patient", icon: <NavIcon icon={<Shield size={16} weight="fill" />} color="amber" />, active: active === "lgpd", group: account },
    { label: "Quem acessou meus dados", href: "/dashboard/patient/access-log?role=patient", icon: <NavIcon icon={<Eye size={16} weight="fill" />} color="amber" />, active: active === "access-log", group: account },
  ];
};
