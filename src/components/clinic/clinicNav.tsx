import { NavIcon } from "@/components/ui/nav-icon";
import { Home, Calendar, Stethoscope, Users, Clock, Wallet, ChartBar } from "lucide-react";

/**
 * Navegação lateral da clínica. Antes retornava só "Início" — as demais telas
 * (agenda, médicos, pacientes, sala de espera, financeiro, relatórios) existem
 * como rota mas ficavam inacessíveis pelo menu.
 */
export const getClinicNav = (active: string) => [
  { label: "Início",        href: "/dashboard?role=clinic",                     icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />,        active: active === "home",         group: "Principal" },
  { label: "Agenda",        href: "/dashboard/clinic/schedules?role=clinic",     icon: <NavIcon icon={<Calendar className="w-3.5 h-3.5" />} color="cyan" />,    active: active === "schedules",    group: "Principal" },
  { label: "Médicos",       href: "/dashboard/clinic/doctors?role=clinic",       icon: <NavIcon icon={<Stethoscope className="w-3.5 h-3.5" />} color="emerald" />, active: active === "doctors",    group: "Principal" },
  { label: "Pacientes",     href: "/dashboard/clinic/patients?role=clinic",      icon: <NavIcon icon={<Users className="w-3.5 h-3.5" />} color="purple" />,     active: active === "patients",     group: "Principal" },
  { label: "Sala de Espera", href: "/dashboard/clinic/waiting-room?role=clinic", icon: <NavIcon icon={<Clock className="w-3.5 h-3.5" />} color="rose" />,        active: active === "waiting-room", group: "Principal" },
  { label: "Financeiro",    href: "/dashboard/clinic/finance?role=clinic",       icon: <NavIcon icon={<Wallet className="w-3.5 h-3.5" />} color="green" />,     active: active === "finance",      group: "Gestão" },
  { label: "Relatórios",    href: "/dashboard/clinic/reports?role=clinic",       icon: <NavIcon icon={<ChartBar className="w-3.5 h-3.5" />} color="amber" />,   active: active === "reports",      group: "Gestão" },
];
