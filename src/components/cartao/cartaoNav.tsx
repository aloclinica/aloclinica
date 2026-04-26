import {
  House, IdentificationCard, Storefront, Users, Receipt,
  Headset, Sliders, UserCircle, Crown, Bell, Shield,
} from "@phosphor-icons/react";
import { NavIcon } from "@/components/ui/nav-icon";

/**
 * Navegação dedicada do painel Cartão Benefícios.
 * Nada de consultas/exames de telemedicina aqui — só carteirinha + rede.
 */
export const getCartaoNav = (active: string) => [
  // ── Bottom bar (5 primeiros) ──
  { label: "Início", href: "/dashboard?role=cartao_beneficios", icon: <NavIcon icon={<House size={16} weight="fill" />} color="rose" />, active: active === "home", group: "Principal" },
  { label: "Carteirinha", href: "/dashboard/cartao/carteirinha?role=cartao_beneficios", icon: <NavIcon icon={<IdentificationCard size={16} weight="fill" />} color="rose" />, active: active === "carteirinha", group: "Principal" },
  { label: "Rede", href: "/dashboard/cartao/rede?role=cartao_beneficios", icon: <NavIcon icon={<Storefront size={16} weight="fill" />} color="emerald" />, active: active === "rede", group: "Principal" },
  { label: "Faturas", href: "/dashboard/cartao/faturas?role=cartao_beneficios", icon: <NavIcon icon={<Receipt size={16} weight="fill" />} color="amber" />, active: active === "faturas", group: "Principal" },
  { label: "Perfil", href: "/dashboard/profile?role=cartao_beneficios", icon: <NavIcon icon={<UserCircle size={16} weight="fill" />} color="rose" />, active: active === "profile", group: "Principal" },

  // ── Plano ──
  { label: "Meu Plano", href: "/dashboard/cartao/plano?role=cartao_beneficios", icon: <NavIcon icon={<Crown size={16} weight="fill" />} color="amber" />, active: active === "plano", group: "Plano" },
  { label: "Dependentes", href: "/dashboard/cartao/dependentes?role=cartao_beneficios", icon: <NavIcon icon={<Users size={16} weight="fill" />} color="blue" />, active: active === "dependentes", group: "Plano" },
  { label: "Notificações", href: "/dashboard/notifications?role=cartao_beneficios", icon: <NavIcon icon={<Bell size={16} weight="fill" />} color="blue" />, active: active === "notifications", group: "Plano" },

  // ── Suporte ──
  { label: "Suporte", href: "/dashboard/cartao/suporte?role=cartao_beneficios", icon: <NavIcon icon={<Headset size={16} weight="fill" />} color="emerald" />, active: active === "support", group: "Suporte" },

  // ── Conta ──
  { label: "Configurações", href: "/dashboard/settings?role=cartao_beneficios", icon: <NavIcon icon={<Sliders size={16} weight="fill" />} color="slate" />, active: active === "settings", group: "Conta" },
  { label: "Privacidade (LGPD)", href: "/dashboard/cartao/lgpd?role=cartao_beneficios", icon: <NavIcon icon={<Shield size={16} weight="fill" />} color="amber" />, active: active === "lgpd", group: "Conta" },
];