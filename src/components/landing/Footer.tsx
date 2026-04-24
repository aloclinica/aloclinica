import { useState, forwardRef, memo } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Envelope, Phone, InstagramLogo, LinkedinLogo, YoutubeLogo, Heart, ShieldCheck, Lock, SealCheck, PaperPlaneTilt, FacebookLogo, TwitterLogo } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PINGO_LOGO_URL } from "@/lib/constants";
const logo = PINGO_LOGO_URL;

const Footer = memo(forwardRef<HTMLElement, { config?: any }>(({ config }, ref) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const siteName    = config?.site_name || "AloClínica";
  const copyright   = config?.copyright || `© ${new Date().getFullYear()} AloClínica. Todos os direitos reservados.`;
  const footerTag   = config?.footer_tagline || "Telemedicina segura e acessível para todo o Brasil.";
  const contactEmail = config?.contact_email || "contato@aloclinica.com.br";
  const contactPhone = config?.contact_phone || "0800 123 4567";
  
  const socialLinksConfig = config?.social_links || [];
  
  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("instagram")) return InstagramLogo;
    if (p.includes("facebook")) return FacebookLogo;
    if (p.includes("twitter")) return TwitterLogo;
    if (p.includes("linkedin")) return LinkedinLogo;
    if (p.includes("youtube")) return YoutubeLogo;
    return InstagramLogo;
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await db.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") toast.info("Você já está inscrito! 📬");
        else toast.error("Erro ao inscrever.");
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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/[0.06]">
        <form onSubmit={handleNewsletter} className="flex gap-2 w-full max-w-sm">
          <Input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-white/[0.06] border-white/8 text-white rounded-xl h-10 text-sm"
            required
          />
          <Button type="submit" disabled={submitting} size="sm" className="rounded-xl h-10 px-4 bg-primary">
            <PaperPlaneTilt className="w-4 h-4" weight="fill" />
          </Button>
        </form>
        <div className="flex items-center gap-5 text-[11px] text-white/35 font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary/70" weight="fill" /> CFM</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary/70" weight="fill" /> LGPD</span>
          <span className="flex items-center gap-1.5"><SealCheck className="w-3.5 h-3.5 text-primary/70" weight="fill" /> SSL</span>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt={siteName} className="w-7 h-7 rounded-lg" width={28} height={28} />
              <span className="font-bold text-sm text-white">{siteName}</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-[200px]">{footerTag}</p>
            <div className="flex gap-2 flex-wrap">
              {socialLinksConfig.map((s: any, idx: number) => {
                const Icon = getSocialIcon(s.platform || "");
                return (
                  <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center hover:bg-primary/80 transition-all text-white/50 hover:text-white">
                    <Icon className="w-4 h-4" weight="fill" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Empresa</h4>
            <ul className="space-y-2.5 text-xs text-white/35">
              <li><Link to="/sobre/quem-somos" className="hover:text-primary transition-colors">Quem somos</Link></li>
              <li><Link to="/sobre/porque-nos" className="hover:text-primary transition-colors">Porque nós</Link></li>
              <li><Link to="/sobre/depoimentos" className="hover:text-primary transition-colors">Depoimentos</Link></li>
              <li><Link to="/contato" className="hover:text-primary transition-colors">Fale conosco</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Contato</h4>
            <ul className="space-y-2.5 text-xs text-white/35">
              <li className="flex items-center gap-2"><Envelope className="w-3.5 h-3.5" weight="fill" /> {contactEmail}</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" weight="fill" /> {contactPhone}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.05] py-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-white/20 flex items-center gap-1">
            {copyright} — Feito com <Heart className="w-3 h-3 text-destructive/60" weight="fill" />
          </p>
        </div>
      </div>
    </footer>
  );
}));

Footer.displayName = "Footer";
export default Footer;
