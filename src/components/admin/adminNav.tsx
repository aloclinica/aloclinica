import {
  SquaresFour, VideoCamera, Wallet, ChartLineUp, Star,
  UserCircleCheck, ClipboardText, UserGear, Users, Stethoscope,
  Buildings, CalendarCheck, CreditCard, Receipt, ShieldStar,
  Key, Tag, ClockCounterClockwise, WhatsappLogo, HardDrives, Sliders,
  PaintBrush
} from "@phosphor-icons/react";
import { NavIcon } from "@/components/ui/nav-icon";

export const getAdminNav = (active: string) => [
  { label: "Centro de Painéis", href: "/dashboard/admin/panel-center?role=admin", icon: <NavIcon icon={<SquaresFour size={16} weight="fill" />} color="blue" />, active: active === "overview" || active === "panel-center", group: "Principal" },
  { label: "Ao Vivo", href: "/dashboard/admin/live?role=admin", icon: <NavIcon icon={<VideoCamera size={16} weight="fill" />} color="rose" />, active: active === "live", group: "Principal" },
  { label: "Financeiro", href: "/dashboard/admin/financial?role=admin", icon: <NavIcon icon={<Wallet size={16} weight="fill" />} color="green" />, active: active === "financial", group: "Principal" },
  { label: "Relatórios", href: "/dashboard/admin/reports?role=admin", icon: <NavIcon icon={<ChartLineUp size={16} weight="fill" />} color="cyan" />, active: active === "reports", group: "Principal" },
  { label: "NPS", href: "/dashboard/admin/nps?role=admin", icon: <NavIcon icon={<Star size={16} weight="fill" />} color="amber" />, active: active === "nps", group: "Monitoramento" },
  { label: "Aprovações", href: "/dashboard/admin/approvals?role=admin", icon: <NavIcon icon={<UserCircleCheck size={16} weight="fill" />} color="emerald" />, active: active === "approvals", group: "Monitoramento" },
  { label: "Solicitações Médicos", href: "/dashboard/admin/doctor-applications?role=admin", icon: <NavIcon icon={<ClipboardText size={16} weight="fill" />} color="purple" />, active: active === "doctor-applications", group: "Monitoramento" },
  { label: "Usuários", href: "/dashboard/admin/users?role=admin", icon: <NavIcon icon={<UserGear size={16} weight="fill" />} color="blue" />, active: active === "users", group: "Gestão" },
  { label: "Pacientes", href: "/dashboard/admin/patients?role=admin", icon: <NavIcon icon={<Users size={16} weight="fill" />} color="cyan" />, active: active === "patients", group: "Gestão" },
  { label: "Médicos", href: "/dashboard/admin/doctors?role=admin", icon: <NavIcon icon={<Stethoscope size={16} weight="fill" />} color="emerald" />, active: active === "doctors", group: "Gestão" },
  { label: "Clínicas", href: "/dashboard/admin/clinics?role=admin", icon: <NavIcon icon={<Buildings size={16} weight="fill" />} color="orange" />, active: active === "clinics", group: "Gestão" },
  { label: "Consultas", href: "/dashboard/admin/appointments?role=admin", icon: <NavIcon icon={<CalendarCheck size={16} weight="fill" />} color="blue" />, active: active === "appointments", group: "Operações" },
  { label: "Especialidades", href: "/dashboard/admin/specialties?role=admin", icon: <NavIcon icon={<ShieldStar size={16} weight="fill" />} color="cyan" />, active: active === "specialties", group: "Operações" },
  { label: "Códigos de Convite", href: "/dashboard/admin/invite-codes?role=admin", icon: <NavIcon icon={<Key size={16} weight="fill" />} color="amber" />, active: active === "invite-codes", group: "Sistema" },
  { label: "Cupons", href: "/dashboard/admin/coupons?role=admin", icon: <NavIcon icon={<Tag size={16} weight="fill" />} color="orange" />, active: active === "coupons", group: "Operações" },
  { label: "Histórico", href: "/dashboard/admin/logs?role=admin", icon: <NavIcon icon={<ClockCounterClockwise size={16} weight="fill" />} color="slate" />, active: active === "logs", group: "Sistema" },
  { label: "WhatsApp", href: "/dashboard/admin/whatsapp?role=admin", icon: <NavIcon icon={<WhatsappLogo size={16} weight="fill" />} color="green" />, active: active === "whatsapp", group: "Sistema" },
  { label: "PACS / DICOM", href: "/dashboard/admin/pacs?role=admin", icon: <NavIcon icon={<HardDrives size={16} weight="fill" />} color="cyan" />, active: active === "pacs", group: "Sistema" },
  { label: "Configurações", href: "/dashboard/settings?role=admin", icon: <NavIcon icon={<Sliders size={16} weight="fill" />} color="slate" />, active: active === "settings", group: "Sistema" },
  { label: "Config. do Site", href: "/dashboard/admin/site-config?role=admin", icon: <NavIcon icon={<PaintBrush size={16} weight="fill" />} color="purple" />, active: active === "site-config", group: "Sistema" },
];