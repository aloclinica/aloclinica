import { useState, memo, forwardRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Stethoscope, VideoCamera, Buildings, FileText, SignIn, SignOut, SquaresFour, CaretRight, Eye, CreditCard } from "@phosphor-icons/react";
import mascot from "@/assets/mascot.png";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const ListItem = forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"a"> & { icon?: React.ElementType; badge?: string }>(({ 
  className, title, children, href, icon: Icon, badge, ...props
}, ref) => (
  <li ref={ref}>
    <NavigationMenuLink asChild>
      <Link
        to={href || "#"}
        className={cn(
          "flex items-center gap-3 select-none rounded-xl p-3 no-underline outline-none transition-all duration-150",
          "hover:bg-primary/[0.04] focus-visible:ring-2 focus-visible:ring-primary/30 group relative",
          "active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {Icon ? (
          <div className="w-9 h-9 rounded-xl bg-primary/[0.07] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.12] transition-colors duration-150">
            <Icon className="w-[18px] h-[18px] text-primary/70 group-hover:text-primary transition-colors duration-150" weight="fill" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold leading-none text-foreground">{title}</span>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-primary/8 text-primary/70">{badge}</span>
            )}
          </div>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground mt-1">{children}</p>
        </div>
        <CaretRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 text-foreground" weight="bold" />
      </Link>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

const Header = memo(forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mobileLinks = [
    { label: "Teleconsulta", href: "/teleconsulta" },
    // { label: "Oftalmologia", href: "/oftalmologia" },
    // { label: "Telelaudo", href: "/para-empresas/telelaudo" },
    // { label: "Cartão Benefícios", href: "/cartao-beneficios" },
    // { label: "Cartão B2B", href: "/cartao-b2b" },
    { label: "Sou Médico", href: "/para-medicos" },
    // { label: "Sou Laudista", href: "/laudista" },
    // { label: "Sou Clínica", href: "/para-clinicas" },
  ];

  const triggerCls = "group/trigger text-[13px] font-medium text-muted-foreground hover:text-foreground bg-transparent data-[state=open]:text-foreground data-[state=open]:bg-muted/40 px-3.5 h-9 rounded-full transition-colors duration-150 gap-1.5";
  const triggerIconCls = "w-[15px] h-[15px] text-muted-foreground/60 group-hover/trigger:text-primary group-data-[state=open]/trigger:text-primary transition-colors duration-150";

  return (
    <header
      ref={ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)] border-border/40"
          : "bg-background/80 backdrop-blur-sm border-transparent"
      )}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between h-14 lg:h-[56px] px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img src={mascot} alt="Pingo" className="w-8 h-8 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105" width={32} height={32} />
          <span className="text-lg font-extrabold text-foreground tracking-tight">
            Alo<span className="text-primary">Clinica</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-0.5">
              <NavigationMenuItem>
                <NavigationMenuTrigger className={triggerCls}>
                  <VideoCamera className={triggerIconCls} weight="fill" />
                  Serviços
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2 w-[340px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/teleconsulta" title="Teleconsulta" icon={VideoCamera} badge="24h">
                        Consultas por vídeo com especialistas, receita digital e acesso rápido.
                      </ListItem>
                      {/* <ListItem href="/oftalmologia" title="Oftalmologia" icon={Eye}>
                        Exames, laudos e receitas para óculos e lentes de contato.
                      </ListItem>
                      <ListItem href="/para-empresas/telelaudo" title="Telelaudo" icon={FileText}>
                        Laudos a distância com IA, SLA e assinatura digital.
                      </ListItem> */}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* <NavigationMenuItem>
                <NavigationMenuTrigger className={triggerCls}>
                  <CreditCard className={triggerIconCls} weight="fill" />
                  Cartões
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2 w-[300px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/cartao-beneficios" title="Cartão Benefícios" icon={CreditCard}>
                        Planos individuais e familiares de telemedicina.
                      </ListItem>
                      <ListItem href="/cartao-b2b" title="Cartão B2B" icon={Buildings}>
                        Benefício corporativo de saúde para sua empresa.
                      </ListItem>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem> */}

              <NavigationMenuItem>
                <NavigationMenuTrigger className={triggerCls}>
                  <Stethoscope className={triggerIconCls} weight="fill" />
                  Para Profissionais
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-2 w-[300px]">
                    <ul className="grid gap-0.5">
                      <ListItem href="/para-medicos" title="Sou Médico" icon={Stethoscope}>
                        Atenda pacientes online e aumente sua renda.
                      </ListItem>
                      {/* <ListItem href="/laudista" title="Sou Laudista" icon={FileText} badge="IA">
                        Emita laudos à distância com IA e assinatura digital.
                      </ListItem> */}
                      {/* <ListItem href="/para-clinicas" title="Sou Clínica" icon={Buildings}>
                        Gerencie agendamento, prontuário e equipe.
                      </ListItem> */}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2 text-[13px] font-medium h-9 pl-2.5 pr-4 border-border/60 bg-card/80 shadow-sm hover:shadow hover:border-primary/20 transition-all duration-150 group"
                onClick={() => navigate("/dashboard")}
              >
                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {profile?.first_name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="text-foreground">
                  {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors duration-150"
                onClick={async () => { await signOut(); navigate("/"); }}
                title="Sair"
              >
                <SignOut className="w-4 h-4" weight="bold" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5 text-[13px] font-semibold h-9 px-4 border-primary/20 bg-primary/[0.05] text-primary hover:bg-primary/[0.10] hover:border-primary/30 transition-all duration-150"
                onClick={() => navigate("/paciente")}
              >
                <Stethoscope className="w-3.5 h-3.5" weight="fill" />
                Agendar Consulta
              </Button>
              <Button
                size="sm"
                className="rounded-full gap-1.5 text-[13px] font-semibold h-9 px-5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-150"
                onClick={() => navigate("/paciente")}
              >
                <SignIn className="w-3.5 h-3.5" weight="bold" />
                Entrar
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            role="dialog"
            aria-label="Menu de navegação"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-background/98 backdrop-blur-sm border-t border-border/40 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-3 gap-0.5">
              {mobileLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => { setMobileOpen(false); navigate(link.href); }}
                  className="text-sm font-medium py-3 px-3 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/40 active:bg-muted active:scale-[0.98]"
                >
                  {link.label}
                </motion.button>
              ))}

              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border/40">
                <div className="flex justify-center pb-1"><LanguageSwitcher /></div>
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="rounded-full justify-start gap-2" onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}>
                      <SquaresFour className="w-4 h-4" weight="fill" />
                      {profile?.first_name ? `Olá, ${profile.first_name}` : "Meu Painel"}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full justify-start gap-2" onClick={async () => { setMobileOpen(false); await signOut(); navigate("/"); }}>
                      <SignOut className="w-4 h-4" weight="bold" /> Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="rounded-full justify-start gap-2 font-semibold border-primary/20 bg-primary/[0.05] text-primary" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>
                      <Stethoscope className="w-4 h-4" weight="fill" /> Agendar Consulta
                    </Button>
                    <Button size="sm" className="rounded-full justify-start gap-2 bg-primary text-primary-foreground font-semibold" onClick={() => { setMobileOpen(false); navigate("/paciente"); }}>
                      <SignIn className="w-4 h-4" weight="bold" /> Entrar
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}));

Header.displayName = "Header";
export default Header;
