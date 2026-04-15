import { useState, forwardRef } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Envelope, Phone, InstagramLogo, LinkedinLogo, YoutubeLogo, Heart, ShieldCheck, Lock, SealCheck, PaperPlaneTilt, FacebookLogo, TwitterLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/mascot.png";
import { useSiteConfig } from "@/lib/site-config";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { get } = useSiteConfig();

  const siteName    = get("site_name",      "AlôMédico");
  const footerText  = get("footer_text",    `© ${new Date().getFullYear()} AlôMédico. Todos os direitos reservados.`);
  const footerTag   = get("footer_tagline", "Telemedicina segura e acessível para todo o Brasil.");
  const contactEmail = get("contact_email", "contato@aloclinica.com.br");
  const contactPhone = get("contact_phone", "0800 123 4567");
  const igUrl  = get("social_instagram", "");
  const fbUrl  = get("social_facebook",  "");
  const twUrl  = get("social_twitter",   "");
  const liUrl  = get("social_linkedin",  "");
  const ytUrl  = get("social_youtube",   "");

  const socialLinks = [
    igUrl && { icon: InstagramLogo, href: igUrl, label: "Instagram" },
    fbUrl && { icon: FacebookLogo,  href: fbUrl, label: "Facebook" },
    twUrl && { icon: TwitterLogo,   href: twUrl, label: "Twitter/X" },
    liUrl && { icon: LinkedinLogo,  href: liUrl, label: "LinkedIn" },
    ytUrl && { icon: YoutubeLogo,   href: ytUrl, label: "YouTube" },
  ].filter(Boolean) as { icon: typeof InstagramLogo; href: string; label: string }[];

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await db.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") toast.info("Você já está inscrito! 📬");
        else toast.error("Erro ao inscrever. Tente novamente.");
      } else {
        toast.success("Inscrito com sucesso! 🎉");
      }
      setEmail("");
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer ref={ref} aria-label="Rodapé" className="bg-[hsl(215_45%_12%)] text-white">
      {/* Newsletter + Trust */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/[0.06]">
        <form onSubmit={handleNewsletter} className="flex gap-2 w-full max-w-sm">
          <Input
            type="email"
            placeholder="Receba novidades — seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-white/[0.06] border-white/8 text-white placeholder:text-white/30 rounded-xl h-10 text-sm focus:border-primary/40"
            required
          />
          <Button type="submit" disabled={submitting} size="sm" className="rounded-xl h-10 px-4 shrink-0 bg-primary hover:bg-primary/90">
            {submitting ? "..." : <PaperPlaneTilt className="w-4 h-4" weight="fill" />}
          </Button>
        </form>
        <div className="flex items-center gap-5 text-[11px] text-white/35 font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary/70" weight="fill" /> CFM</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary/70" weight="fill" /> LGPD</span>
          <span className="flex items-center gap-1.5"><SealCheck className="w-3.5 h-3.5 text-primary/70" weight="fill" /> SSL</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-50" /><span className="relative inline-flex rounded-full h-2 w-2 bg-success" /></span>
            Online
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt={siteName} className="w-7 h-7 rounded-lg object-contain" loading="lazy" decoding="async" width={28} height={28} />
              <span className="font-bold text-sm text-white">{siteName}</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-[200px]">
              {footerTag}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {socialLinks.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-primary/80 hover:border-primary/60 transition-all duration-150 text-white/50 hover:text-white">
                    <s.icon className="w-4 h-4" weight="fill" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          {[
            { title: "Plataforma", links: [
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Especialidades", href: "#especialidades" },
              { label: "Consultas", href: "#consulta-avulsa" },
              { label: "Para Empresas", to: "/para-empresas" },
            ]},
            { title: "Acesso", links: [
              { label: "Paciente", to: "/paciente" },
              { label: "Médico", to: "/medico" },
              { label: "Laudista", to: "/laudista" },
              { label: "Clínica", to: "/clinica" },
            ]},
            { title: "Contato", contact: true, links: [] },
          ].map((col, ci) => (
            <div key={ci}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35 mb-3">{col.title}</h4>
              {col.contact ? (
                <ul className="space-y-2.5 text-xs text-white/35">
                  {contactEmail && <li className="flex items-center gap-2 hover:text-white/55 transition-colors"><Envelope className="w-3.5 h-3.5 text-primary/60" weight="fill" /> {contactEmail}</li>}
                  {contactPhone && <li className="flex items-center gap-2 hover:text-white/55 transition-colors"><Phone className="w-3.5 h-3.5 text-primary/60" weight="fill" /> {contactPhone}</li>}
                </ul>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {col.links.map((link, li) => (
                    <li key={li}>
                      {"to" in link && link.to ? (
                        <Link to={link.to} className="text-white/35 hover:text-primary transition-colors duration-150">{link.label}</Link>
                      ) : (
                        <a href={"href" in link ? link.href : "#"} className="text-white/35 hover:text-primary transition-colors duration-150">{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/[0.05]">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-white/20 flex items-center gap-1">
            {footerText} — Feito com <Heart className="w-3 h-3 text-destructive/60" weight="fill" /> no Brasil
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px]">
            {[
              { label: "Termos", to: "/terms" },
              { label: "Privacidade", to: "/privacy" },
              { label: "LGPD", to: "/lgpd" },
              { label: "Cookies", to: "/cookies" },
              { label: "Reembolso", to: "/refund" },
              { label: "Acessibilidade", to: "/accessibility" },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-white/15 hover:text-primary transition-colors duration-150">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";
export default Footer;
