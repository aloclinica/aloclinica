import { useState, memo, forwardRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Stethoscope, VideoCamera, Buildings, FileText, SignIn, SignOut, SquaresFour, CaretRight, Eye, CreditCard, Users, Heart, Star, ChatsCircle, House, Info, FirstAidKit, Question } from "@phosphor-icons/react";
import { PINGO_LOGO_URL } from "@/lib/constants";
const mascot = PINGO_LOGO_URL;
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

const Header = memo(forwardRef<HTMLElement, { config?: any }>(({ config }, ref) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  const logoUrl = config?.logo_url || mascot;
  const baseMenuItems = config?.menu_items || [
    { label: "Especialidades", href: "/#especialidades" },
    { label: "Para Médicos", href: "/#para-medicos" },
    { label: "Saúde Corporativa", href: "/para-empresas" },
    { label: "Ajuda", href: "/ajuda" },
  ];
  // Sempre garantir que Pingo Card apareça em destaque, mesmo se vier config do banco sem ele
  const hasPingoCard = baseMenuItems.some((i: any) => 
    (i.href || i.url || "").includes("pingo-card") || (i.label || "").toLowerCase().includes("pingo")
  );
  const menuItems = hasPingoCard 
    ? baseMenuItems.map((i: any) => 
        ((i.href || i.url || "").includes("pingo-card") ? { ...i, label: "Pingo Card" } : i)
      )
    : [{ label: "Pingo Card", href: "/pingo-card" }, ...baseMenuItems];

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkBtnBase = "text-[13px] font-semibold px-3.5 h-9 rounded-full transition-all duration-200 inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer";

  // Cor única por item — estilo "Pingo Card" multicolorido
  const itemColorMap: Record<string, { cls: string; icon: React.ElementType }> = {
    "Início":              { cls: "bg-sky-100 text-sky-800 hover:bg-sky-200",                icon: House },
    "Sobre Nós":           { cls: "bg-violet-100 text-violet-800 hover:bg-violet-200",        icon: Info },
    "Pingo Card":          { cls: "bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400 shadow-sm shadow-amber-400/30 font-bold", icon: CreditCard },
    "Especialidades":      { cls: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",     icon: FirstAidKit },
    "Para Médicos":        { cls: "bg-rose-100 text-rose-800 hover:bg-rose-200",              icon: Stethoscope },
    "Saúde Corporativa":   { cls: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",        icon: Buildings },
    "Ajuda":               { cls: "bg-teal-100 text-teal-800 hover:bg-teal-200",              icon: Question },
  };
  const getItemStyle = (label: string) =>
    itemColorMap[label] || { cls: "bg-muted text-foreground hover:bg-muted/70", icon: CaretRight };

  const triggerCls = "group/trigger text-[13px] font-semibold bg-violet-100 text-violet-800 hover:bg-violet-200 data-[state=open]:bg-violet-200 px-3.5 h-9 rounded-full transition-all duration-200 gap-1.5 whitespace-nowrap";

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
      <div className="max-w-[1800px] mx-auto flex items-center gap-4 h-14 lg:h-[64px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105" width={36} height={36} />
          <span className="text-xl font-extrabold text-[#1a1c1e] tracking-tight">
            Alo<span className="text-[#1a4fcf]">Clinica</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center flex-1 justify-center min-w-0">
          <NavigationMenu>
            <NavigationMenuList className="gap-0.5">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className={cn(linkBtnBase, getItemStyle("Início").cls)}>
                    {(() => { const I = getItemStyle("Início").icon; return <I className="w-3.5 h-3.5" weight="fill" />; })()}
                    Início
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className={triggerCls}>
                  <Info className="w-3.5 h-3.5" weight="fill" />
                  Sobre Nós
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-popover/95 backdrop-blur-xl rounded-2xl border border-border/20 shadow-elevated">
                    <ListItem
                      title="Quem somos"
                      href="/sobre/quem-somos"
                      icon={Users}
                    >
                      Nossa história, missão e compromisso com sua saúde.
                    </ListItem>
                    <ListItem
                      title="Porque nós"
                      href="/sobre/porque-nos"
                      icon={Heart}
                    >
                      Diferenciais que fazem da AloClínica sua melhor escolha.
                    </ListItem>
                    <ListItem
                      title="Depoimentos"
                      href="/sobre/depoimentos"
                      icon={Star}
                    >
                      O que nossos pacientes dizem sobre nosso atendimento.
                    </ListItem>
                    <ListItem
                      title="Fale conosco"
                      href="/contato"
                      icon={ChatsCircle}
                    >
                      Dúvidas ou sugestões? Nossa equipe está pronta para ajudar.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

                {menuItems.filter((item: any) => item.label !== "Início").map((item: any, idx: number) => {
                  const style = getItemStyle(item.label);
                  const Icon = style.icon;
                  return (
                    <NavigationMenuItem key={idx}>
                      <NavigationMenuLink asChild>
                        <Link 
                          to={item.href || item.url} 
                          className={cn(linkBtnBase, style.cls)}
                        >
                          <Icon className="w-3.5 h-3.5" weight="fill" />
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <LanguageSwitcher />

          {user ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2 h-9 px-2.5 border-border/60 bg-card/80 transition-all duration-150 max-w-[180px]"
              onClick={() => navigate("/dashboard")}
            >
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                {profile?.first_name?.[0]?.toUpperCase() || "U"}
              </span>
              <span className="text-foreground text-[13px] truncate">
                {profile?.first_name ? profile.first_name : "Painel"}
              </span>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="rounded-full h-9 px-4 border-[#1a4fcf] text-[#1a4fcf] hover:bg-[#1a4fcf]/5 font-semibold text-[13px]" onClick={() => navigate("/agendar")}>
                Agendar
              </Button>
              <Button size="sm" className="rounded-full h-9 px-4 bg-[#1a4fcf] text-white hover:bg-[#1a4fcf]/90 font-semibold text-[13px]" onClick={() => navigate("/paciente")}>
                Entrar
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
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
              {menuItems.map((item: any, idx: number) => {
                if (item.label === "Início") {
                  return (
                    <div key="inicio-group">
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                        onClick={() => { setMobileOpen(false); navigate(item.href); }}
                        className="text-sm font-medium py-3 px-3 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/40 active:bg-muted active:scale-[0.98] w-full"
                      >
                        {item.label}
                      </motion.button>
                      
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 px-1">Sobre Nós</p>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            { label: "Quem somos", href: "/sobre/quem-somos", icon: Users },
                            { label: "Porque nós", href: "/sobre/porque-nos", icon: Heart },
                            { label: "Depoimentos", href: "/sobre/depoimentos", icon: Star },
                            { label: "Fale conosco", href: "/contato", icon: ChatsCircle }
                          ].map((subItem, sIdx) => (
                            <button
                              key={subItem.label}
                              onClick={() => { setMobileOpen(false); navigate(subItem.href); }}
                              className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all"
                            >
                              <subItem.icon className="w-4 h-4 text-primary/60" weight="fill" />
                              <span className="text-sm font-medium">{subItem.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <motion.button
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    onClick={() => { setMobileOpen(false); navigate(item.href); }}
                    className="text-sm font-medium py-3 px-3 rounded-xl transition-colors text-left text-muted-foreground hover:text-foreground hover:bg-muted/40 active:bg-muted active:scale-[0.98]"
                  >
                    {item.label}
                  </motion.button>
                );
              })}

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
                    <Button size="sm" variant="outline" className="rounded-full justify-start gap-2 font-semibold border-primary/20 bg-primary/[0.05] text-primary" onClick={() => { setMobileOpen(false); navigate("/agendar"); }}>
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
