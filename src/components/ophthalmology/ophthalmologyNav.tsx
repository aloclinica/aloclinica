import {
  House, Eye, CalendarDots, Users, Wallet, UserCircle, Sliders
} from "@phosphor-icons/react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getOphthalmologyNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=doctor", icon: <NavIcon icon={<House size={16} weight="fill" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Fila de Exames", href: "/dashboard/ophthalmology/queue?role=doctor", icon: <NavIcon icon={<Eye size={16} weight="fill" />} color="emerald" />, active: active === "queue", group: "Principal" },
  { label: "Meus Exames", href: "/dashboard/ophthalmology/my-exams?role=doctor", icon: <NavIcon icon={<Eye size={16} weight="fill" />} color="cyan" />, active: active === "my-exams", group: "Principal" },
  { label: "Agenda", href: "/dashboard/doctor/calendar?role=doctor", icon: <NavIcon icon={<CalendarDots size={16} weight="fill" />} color="cyan" />, active: active === "calendar", group: "Principal" },
  { label: "Pacientes", href: "/dashboard/patients?role=doctor", icon: <NavIcon icon={<Users size={16} weight="fill" />} color="blue" />, active: active === "patients", group: "Atendimento" },
  { label: "Carteira", href: "/dashboard/doctor/wallet?role=doctor", icon: <NavIcon icon={<Wallet size={16} weight="fill" />} color="emerald" />, active: active === "wallet", group: "Financeiro" },
  { label: "Configurações", href: "/dashboard/settings?role=doctor", icon: <NavIcon icon={<Sliders size={16} weight="fill" />} color="slate" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=doctor", icon: <NavIcon icon={<UserCircle size={16} weight="fill" />} color="blue" />, active: active === "profile", group: "Conta" },
];
