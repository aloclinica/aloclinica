import {
  House, Lightning, CalendarDots, Timer, VideoCamera, Users,
  ChatCircleDots, ArrowsClockwise, Microscope, Pill,
  Certificate, Money, Wallet, CalendarBlank, Sliders, UserCircle
} from "@phosphor-icons/react";
import { FileText } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getDoctorNav = (active: string) => [
  { label: "Início", href: "/dashboard?role=doctor", icon: <NavIcon icon={<House size={16} weight="fill" />} color="blue" />, active: active === "home", group: "Principal" },
  { label: "Plantão 24h", href: "/dashboard/doctor/on-duty?role=doctor", icon: <NavIcon icon={<Lightning size={16} weight="fill" />} color="amber" />, active: active === "on-duty", group: "Principal" },
  { label: "Calendário", href: "/dashboard/doctor/calendar?role=doctor", icon: <NavIcon icon={<CalendarDots size={16} weight="fill" />} color="cyan" />, active: active === "calendar", group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/doctor/waiting-room?role=doctor", icon: <NavIcon icon={<Timer size={16} weight="fill" />} color="orange" />, active: active === "waiting-room", group: "Principal" },
  { label: "Consultas", href: "/dashboard/doctor/consultations?role=doctor", icon: <NavIcon icon={<VideoCamera size={16} weight="fill" />} color="emerald" />, active: active === "consultations", group: "Atendimento" },
  { label: "Pacientes", href: "/dashboard/patients?role=doctor", icon: <NavIcon icon={<Users size={16} weight="fill" />} color="blue" />, active: active === "patients", group: "Atendimento" },
  { label: "Chat", href: "/dashboard/chat?role=doctor", icon: <NavIcon icon={<ChatCircleDots size={16} weight="fill" />} color="cyan" />, active: active === "chat", group: "Atendimento" },
  { label: "Renovações", href: "/dashboard/doctor/renewal-queue?role=doctor", icon: <NavIcon icon={<ArrowsClockwise size={16} weight="fill" />} color="green" />, active: active === "renewal-queue", group: "Documentos" },
  { label: "Exames", href: "/dashboard/doctor/documents?role=doctor", icon: <NavIcon icon={<Microscope size={16} weight="fill" />} color="purple" />, active: active === "documents", group: "Documentos" },
  { label: "Receitas", href: "/dashboard/prescriptions?role=doctor", icon: <NavIcon icon={<FileText className="w-4 h-4" />} color="emerald" />, active: active === "prescriptions", group: "Documentos" },
  { label: "Receituário", href: "/dashboard/doctor/simple-prescription?role=doctor", icon: <NavIcon icon={<Pill size={16} weight="fill" />} color="rose" />, active: active === "simple-prescription", group: "Documentos" },
  { label: "Atestados", href: "/dashboard/certificates?role=doctor", icon: <NavIcon icon={<Certificate size={16} weight="fill" />} color="blue" />, active: active === "certificates", group: "Documentos" },
  { label: "Ganhos", href: "/dashboard/earnings?role=doctor", icon: <NavIcon icon={<Money size={16} weight="fill" />} color="green" />, active: active === "earnings", group: "Financeiro" },
  { label: "Carteira", href: "/dashboard/doctor/wallet?role=doctor", icon: <NavIcon icon={<Wallet size={16} weight="fill" />} color="emerald" />, active: active === "wallet", group: "Financeiro" },
  { label: "Disponibilidade", href: "/dashboard/availability?role=doctor", icon: <NavIcon icon={<CalendarBlank size={16} weight="fill" />} color="slate" />, active: active === "availability", group: "Conta" },
  { label: "Configurações", href: "/dashboard/settings?role=doctor", icon: <NavIcon icon={<Sliders size={16} weight="fill" />} color="slate" />, active: active === "settings", group: "Conta" },
  { label: "Meu Perfil", href: "/dashboard/profile?role=doctor", icon: <NavIcon icon={<UserCircle size={16} weight="fill" />} color="blue" />, active: active === "profile", group: "Conta" },
];
