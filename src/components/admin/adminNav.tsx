import {
  SquaresFour, VideoCamera, Wallet, ChartLineUp, Star,
  UserCircleCheck, ClipboardText, UserGear, Users, Stethoscope,
  Buildings, CalendarCheck, ShieldStar,
   Key, Tag, ClockCounterClockwise, WhatsappLogo, Sliders, Pulse,
   PaintBrush, Image as ImageIcon, Heart, CreditCard
   , TestTube, Handshake
 } from "@phosphor-icons/react";
import { NavIcon } from "@/components/ui/nav-icon";

/**
 * Admin sidebar navigation
 * 5 grupos coesos · ordem por frequência de uso · sem itens órfãos
 */
export const getAdminNav = (active: string) => [
  // ── Visão Geral ──
   { label: "Painel Admin", href: "/dashboard/admin/panel-center?role=admin", icon: <NavIcon icon={<SquaresFour size={16} weight="fill" />}    color="blue"   />, active: active === "overview" || active === "panel-center", group: "Visão Geral" },
   { label: "Ao Vivo",      href: "/dashboard/admin/live?role=admin",         icon: <NavIcon icon={<VideoCamera size={16} weight="fill" />}    color="rose"   />, active: active === "live",     group: "Visão Geral" },
   { label: "Histórico",     href: "/dashboard/admin/logs?role=admin",     icon: <NavIcon icon={<ClockCounterClockwise size={16} weight="fill" />} color="slate" />, active: active === "logs",     group: "Visão Geral" },

  // ── Operação ──
  { label: "Aprovações",          href: "/dashboard/admin/approvals?role=admin",           icon: <NavIcon icon={<UserCircleCheck size={16} weight="fill" />} color="emerald" />, active: active === "approvals",           group: "Operação" },
  { label: "Consultas",           href: "/dashboard/admin/appointments?role=admin",        icon: <NavIcon icon={<CalendarCheck size={16} weight="fill" />}  color="blue"    />, active: active === "appointments",        group: "Operação" },
  { label: "Faturamento",         href: "/dashboard/admin/financial?role=admin",           icon: <NavIcon icon={<Wallet size={16} weight="fill" />}         color="green"   />, active: active === "financial",           group: "Operação" },
  { label: "Contratos",           href: "/dashboard/admin/contratos?role=admin",           icon: <NavIcon icon={<Handshake size={16} weight="fill" />}      color="emerald" />, active: active === "contratos",           group: "Operação" },

  // ── Pessoas ──
  { label: "Usuários",  href: "/dashboard/admin/users?role=admin",    icon: <NavIcon icon={<UserGear size={16} weight="fill" />}    color="blue"    />, active: active === "users",    group: "Pessoas" },
  { label: "Pacientes", href: "/dashboard/admin/patients?role=admin", icon: <NavIcon icon={<Users size={16} weight="fill" />}       color="cyan"    />, active: active === "patients", group: "Pessoas" },
  { label: "Médicos",   href: "/dashboard/admin/doctors?role=admin",  icon: <NavIcon icon={<Stethoscope size={16} weight="fill" />} color="emerald" />, active: active === "doctors",  group: "Pessoas" },

  // ── Conteúdo ──
  { label: "Especialidades", href: "/dashboard/admin/specialties?role=admin",  icon: <NavIcon icon={<ShieldStar size={16} weight="fill" />} color="cyan"   />, active: active === "specialties",  group: "Conteúdo" },
  { label: "Cupons",         href: "/dashboard/admin/coupons?role=admin",      icon: <NavIcon icon={<Tag size={16} weight="fill" />}         color="orange" />, active: active === "coupons",      group: "Conteúdo" },
  { label: "Site",           href: "/dashboard/admin/site-editor?role=admin",  icon: <NavIcon icon={<PaintBrush size={16} weight="fill" />}  color="purple" />, active: active === "site-editor" || active === "site-config", group: "Conteúdo" },

  // ── Sistema ──
   { label: "WhatsApp",      href: "/dashboard/admin/whatsapp?role=admin", icon: <NavIcon icon={<WhatsappLogo size={16} weight="fill" />}          color="green" />, active: active === "whatsapp", group: "Sistema" },
   { label: "Segurança",  href: "/dashboard/admin/security?role=admin",          icon: <NavIcon icon={<ShieldStar size={16} weight="fill" />}    color="rose"  />, active: active === "security",          group: "Sistema" },
   { label: "Configurações", href: "/dashboard/settings?role=admin",       icon: <NavIcon icon={<Sliders size={16} weight="fill" />}               color="slate" />, active: active === "settings", group: "Sistema" },
];
