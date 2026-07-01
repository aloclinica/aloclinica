import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppBannerPlacement, AppPromoBanner, useAppPromoBanners } from "@/lib/app-banners";

const THEME: Record<string, string> = {
  blue: "from-[hsl(215,75%,32%)] via-[hsl(200,78%,38%)] to-[hsl(178,58%,38%)]",
  emerald: "from-[hsl(158,62%,28%)] via-[hsl(168,55%,35%)] to-[hsl(195,70%,34%)]",
  violet: "from-violet-700 via-indigo-700 to-cyan-700",
  amber: "from-amber-600 via-orange-600 to-rose-600",
  rose: "from-rose-700 via-pink-700 to-violet-700",
};

function BannerCard({ banner, onDismiss }: { banner: AppPromoBanner; onDismiss: () => void }) {
  const navigate = useNavigate();
  const gradient = THEME[banner.theme ?? "blue"] ?? THEME.blue;
  const hasCta = Boolean(banner.cta_label && banner.cta_href);

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.985 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative overflow-hidden rounded-[30px] bg-gradient-to-br p-4 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.85)]", gradient)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.20)_0%,transparent_36%,rgba(255,255,255,0.08)_100%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/12 to-transparent blur-sm"
        animate={{ x: ["0%", "280%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
      />
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[48%] object-cover opacity-70 mix-blend-screen md:block"
          loading="lazy"
          decoding="async"
        />
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Ocultar banner"
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white/75 backdrop-blur transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative z-10 max-w-2xl pr-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/22 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/86 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {banner.eyebrow || "Novidade"}
        </div>
        <h3 className="text-xl font-black leading-tight tracking-tight md:text-2xl">{banner.title}</h3>
        {banner.subtitle && <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-white/78">{banner.subtitle}</p>}
        {hasCta && (
          <Button
            type="button"
            onClick={() => navigate(banner.cta_href!)}
            className="mt-4 rounded-2xl bg-white text-slate-950 shadow-lg hover:bg-white/92"
          >
            {banner.cta_label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.section>
  );
}

export default function AppPromotionalBanners({ role, placement = "dashboard" }: { role: string; placement?: AppBannerPlacement }) {
  const { banners } = useAppPromoBanners(role, placement);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = useMemo(() => banners.filter((banner) => !dismissed.includes(banner.id)).slice(0, 2), [banners, dismissed]);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {visible.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            onDismiss={() => setDismissed((current) => [...current, banner.id])}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
