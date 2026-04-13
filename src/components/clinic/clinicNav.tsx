import { NavIcon } from "@/components/ui/nav-icon";
import { Home, Upload, ClipboardList } from "lucide-react";

export const getClinicNav = (active: string) => [
  {
    label: "Início",
    href: "/dashboard?role=clinic",
    icon: <NavIcon icon={<Home className="w-3.5 h-3.5" />} color="blue" />,
    active: active === "home",
    group: "Principal",
  },
  // {
  //   label: "Enviar Exame para Laudo",
  //   href: "/dashboard/clinic/exam-upload?role=clinic",
  //   icon: <NavIcon icon={<Upload className="w-3.5 h-3.5" />} color="green" />,
  //   active: active === "exam-upload",
  //   group: "Telelaudo",
  // },
  // {
  //   label: "Meus Exames",
  //   href: "/dashboard/clinic/exam-list?role=clinic",
  //   icon: <NavIcon icon={<ClipboardList className="w-3.5 h-3.5" />} color="purple" />,
  //   active: active === "exam-list",
  //   group: "Telelaudo",
  // },
];
