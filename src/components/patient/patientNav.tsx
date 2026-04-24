import {
  House, MagnifyingGlass, Lightning, CalendarCheck, ChatCircleDots,
  Headset, CreditCard, Sliders, UserCircle, Heart, FileText,
  ClipboardText, Upload, BookOpen, Users, Bell, Shield,
  IdentificationCard, Syringe, FirstAid, Eye
} from "@phosphor-icons/react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getPatientNav = (active: string) => [
  // ── Bottom bar (first 5 = bottom nav) ──
  { label: "Início", href: "/dashboard?role=patient", icon: <NavIcon icon={<House size={16} weight="fill" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Consultas", href: "/dashboard/appointments?role=patient", icon: <NavIcon icon={<CalendarCheck size={16} weight="fill" />} color="blue" />, active: active === "appointments", group: "Principal" },
  { label: "Urgência", href: "/dashboard/urgent-care?role=patient", icon: <NavIcon icon={<Lightning size={16} weight="fill" />} color="amber" />, active: active === "urgent-care", group: "Principal" },
  { label: "Chat", href: "/dashboard/chat?role=patient", icon: <NavIcon icon={<ChatCircleDots size={16} weight="fill" />} color="blue" />, active: active === "chat", group: "Principal" },
  { label: "Perfil", href: "/dashboard/profile?role=patient", icon: <NavIcon icon={<UserCircle size={16} weight="fill" />} color="blue" />, active: active === "profile", group: "Principal" },

  // ── Consultas ──
  { label: "Agendar", href: "/dashboard/schedule?role=patient", icon: <NavIcon icon={<MagnifyingGlass size={16} weight="fill" />} color="cyan" />, active: active === "schedule" || active === "doctors", group: "Consultas" },
  { label: "Notificações", href: "/dashboard/notifications?role=patient", icon: <NavIcon icon={<Bell size={16} weight="fill" />} color="blue" />, active: active === "notifications", group: "Consultas" },
  { label: "Pagamentos", href: "/dashboard/payment-history?role=patient", icon: <NavIcon icon={<CreditCard size={16} weight="fill" />} color="green" />, active: active === "payments", group: "Consultas" },
  { label: "Pingo Card", href: "/dashboard/patient/pingo-card?role=patient", icon: <NavIcon icon={<Heart size={16} weight="fill" />} color="rose" />, active: active === "pingo-card", group: "Consultas" },

  // ── Saúde Digital ──
  { label: "Minha Saúde", href: "/dashboard/patient/health?role=patient", icon: <NavIcon icon={<Heart size={16} weight="fill" />} color="rose" />, active: active === "health", group: "Saúde Digital" },
  { label: "Receitas", href: "/dashboard/history?role=patient", icon: <NavIcon icon={<FileText size={16} weight="fill" />} color="emerald" />, active: active === "history", group: "Saúde Digital" },
  { label: "Exames", href: "/dashboard/patient/exam-results?role=patient", icon: <NavIcon icon={<ClipboardText size={16} weight="fill" />} color="purple" />, active: active === "exam-results", group: "Saúde Digital" },
  { label: "Enviar Exames", href: "/dashboard/patient/documents?role=patient", icon: <NavIcon icon={<Upload size={16} weight="fill" />} color="cyan" />, active: active === "documents", group: "Saúde Digital" },
  { label: "Renovar Receita", href: "/dashboard/prescription-renewal?role=patient", icon: <NavIcon icon={<BookOpen size={16} weight="fill" />} color="emerald" />, active: active === "renewal", group: "Saúde Digital" },

  // ── Saúde Digital (extras) ──
  // { label: "Planos de Cuidado", href: "/dashboard/patient/care-plans?role=patient", icon: <NavIcon icon={<FirstAid size={16} weight="fill" />} color="rose" />, active: active === "care-plans", group: "Saúde Digital" },
  // { label: "Vacinas", href: "/dashboard/patient/vaccinations?role=patient", icon: <NavIcon icon={<Syringe size={16} weight="fill" />} color="purple" />, active: active === "vaccinations", group: "Saúde Digital" },
  // { label: "Oftalmologia", href: "/dashboard/patient/ophthalmology?role=patient", icon: <NavIcon icon={<Eye size={16} weight="fill" />} color="cyan" />, active: active === "ophthalmology", group: "Saúde Digital" },

  // ── Perfil Clínico ──
  // { label: "Cartão Saúde", href: "/dashboard/patient/health-card?role=patient", icon: <NavIcon icon={<IdentificationCard size={16} weight="fill" />} color="blue" />, active: active === "health-card", group: "Perfil Clínico" },
  { label: "Dependentes", href: "/dashboard/patient/dependents?role=patient", icon: <NavIcon icon={<Users size={16} weight="fill" />} color="blue" />, active: active === "dependents", group: "Perfil Clínico" },

  // ── Suporte ──
  { label: "Suporte", href: "/dashboard/patient/support?role=patient", icon: <NavIcon icon={<Headset size={16} weight="fill" />} color="emerald" />, active: active === "support", group: "Suporte" },

  // ── Segurança ──
  { label: "Configurações", href: "/dashboard/settings?role=patient", icon: <NavIcon icon={<Sliders size={16} weight="fill" />} color="slate" />, active: active === "settings", group: "Segurança" },
  { label: "Privacidade (LGPD)", href: "/dashboard/patient/lgpd?role=patient", icon: <NavIcon icon={<Shield size={16} weight="fill" />} color="amber" />, active: active === "lgpd", group: "Segurança" },
];
