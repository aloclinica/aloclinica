import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Sparkles, Plus, Copy, Trash2, Save, RotateCcw, ExternalLink, CalendarClock, Eye, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { AdminPageHeader } from "./AdminPageHeader";
import { getAdminNav } from "./adminNav";
import { db } from "@/integrations/supabase/untyped";
import { invalidateSiteConfig } from "@/lib/site-config";
import { AppBannerAudience, AppBannerPlacement, AppPromoBanner, DEFAULT_APP_BANNERS, parseAppBanners } from "@/lib/app-banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CONFIG_KEY = "app_promotional_banners";

const AUDIENCES: { value: AppBannerAudience; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "patient", label: "Paciente" },
  { value: "doctor", label: "Medico" },
  { value: "clinic", label: "Clinica" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Suporte" },
  { value: "partner", label: "Parceiro" },
];

const PLACEMENTS: { value: AppBannerPlacement; label: string }[] = [
  { value: "dashboard", label: "Inicio do app" },
  { value: "schedule", label: "Agenda" },
  { value: "waiting-room", label: "Sala de espera" },
  { value: "global", label: "Global" },
];

const THEMES = [
  { value: "blue", label: "Azul premium", className: "from-[hsl(215,75%,32%)] via-[hsl(200,78%,38%)] to-[hsl(178,58%,38%)]" },
  { value: "emerald", label: "Verde clinico", className: "from-[hsl(158,62%,28%)] via-[hsl(168,55%,35%)] to-[hsl(195,70%,34%)]" },
  { value: "violet", label: "Violeta app", className: "from-violet-700 via-indigo-700 to-cyan-700" },
  { value: "amber", label: "Campanha quente", className: "from-amber-600 via-orange-600 to-rose-600" },
  { value: "rose", label: "Destaque rose", className: "from-rose-700 via-pink-700 to-violet-700" },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

const emptyBanner = (): AppPromoBanner => ({
  id: `banner-${Date.now()}`,
  title: "Nova campanha do app",
  subtitle: "Texto curto para explicar a oferta, novidade ou beneficio.",
  eyebrow: "Novidade",
  cta_label: "Abrir",
  cta_href: "/dashboard?role=patient",
  image_url: "/images/app-promo-telemedicine.png",
  audience: "patient",
  placement: "dashboard",
  enabled: true,
  priority: 1,
  theme: "blue",
});

const APP_CARDS = [
  { label: "Paciente", description: "Home, agenda, busca medica e banners globais", audience: "patient" },
  { label: "Medico", description: "Home, agenda, sala de espera e campanhas operacionais", audience: "doctor" },
  { label: "Interno", description: "Admin, suporte, clinica e parceiros", audience: "admin" },
];

function BannerPreview({ banner }: { banner: AppPromoBanner }) {
  const theme = THEMES.find((item) => item.value === banner.theme)?.className ?? THEMES[0].className;

  return (
    <div className={cn("relative overflow-hidden rounded-[30px] bg-gradient-to-br p-5 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.95)]", theme)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.22)_0%,transparent_38%,rgba(255,255,255,0.08)_100%)]" />
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-65 mix-blend-screen"
        />
      )}
      <div className="relative z-10 max-w-[78%]">
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/22 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/86 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {banner.eyebrow || "Campanha"}
        </div>
        <h3 className="text-2xl font-black leading-tight tracking-tight">{banner.title || "Titulo do banner"}</h3>
        <p className="mt-2 max-w-md text-sm font-medium leading-6 text-white/80">{banner.subtitle || "Descricao curta da campanha."}</p>
        {banner.cta_label && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-950 shadow-lg">
            {banner.cta_label}
            <ExternalLink className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAppEditor() {
  const [banners, setBanners] = useState<AppPromoBanner[]>(DEFAULT_APP_BANNERS);
  const [selectedId, setSelectedId] = useState(DEFAULT_APP_BANNERS[0]?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const nav = getAdminNav("app-editor");

  const selected = useMemo(
    () => banners.find((banner) => banner.id === selectedId) ?? banners[0],
    [banners, selectedId],
  );
  const dirty = JSON.stringify(banners) !== savedSnapshot;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await db.from("site_config").select("value").eq("key", CONFIG_KEY).maybeSingle();
      if (!mounted) return;
      if (error) {
        toast.error("Nao foi possivel carregar os banners dos apps");
      }
      const next = parseAppBanners(data?.value);
      setBanners(next);
      setSelectedId(next[0]?.id ?? "");
      setSavedSnapshot(JSON.stringify(next));
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateSelected = (patch: Partial<AppPromoBanner>) => {
    if (!selected) return;
    setBanners((current) => current.map((banner) => (banner.id === selected.id ? { ...banner, ...patch } : banner)));
  };

  const addBanner = () => {
    const banner = emptyBanner();
    setBanners((current) => [banner, ...current]);
    setSelectedId(banner.id);
  };

  const duplicateBanner = () => {
    if (!selected) return;
    const copyBanner = { ...selected, id: `${selected.id}-copy-${Date.now()}`, title: `${selected.title} copia`, priority: selected.priority + 1 };
    setBanners((current) => [copyBanner, ...current]);
    setSelectedId(copyBanner.id);
  };

  const removeBanner = () => {
    if (!selected) return;
    const next = banners.filter((banner) => banner.id !== selected.id);
    setBanners(next);
    setSelectedId(next[0]?.id ?? "");
  };

  const resetDefaults = () => {
    setBanners(DEFAULT_APP_BANNERS);
    setSelectedId(DEFAULT_APP_BANNERS[0]?.id ?? "");
  };

  const save = async () => {
    setSaving(true);
    const payload = JSON.stringify(banners, null, 2);
    const { error } = await db.from("site_config").upsert({
      key: CONFIG_KEY,
      value: payload,
      category: "apps",
      label: "Banners promocionais dos apps",
      input_type: "json",
    }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar banners dos apps");
      return;
    }
    invalidateSiteConfig();
    setSavedSnapshot(JSON.stringify(banners));
    toast.success("Banners dos apps salvos");
  };

  return (
    <DashboardLayout title="Editor Apps" nav={nav} role="admin">
      <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-10">
        <AdminPageHeader
          icon={Smartphone}
          title="Configuracoes dos apps"
          eyebrow="Apps paciente, medico e interno"
          description="Controle campanhas, publico, posicao, imagem, periodo de exibicao e chamadas sem alterar codigo."
          accent="from-cyan-600 to-blue-700"
          badge={{ label: `${banners.length} banners`, tone: dirty ? "warning" : "success" }}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetDefaults} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Padrao
              </Button>
              <Button onClick={save} disabled={!dirty || saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          }
        />

        <section className="grid gap-3 md:grid-cols-3">
          {APP_CARDS.map((app) => {
            const total = banners.filter((banner) => banner.audience === app.audience || banner.audience === "all").length;
            const active = banners.filter((banner) => (banner.audience === app.audience || banner.audience === "all") && banner.enabled).length;
            return (
              <button
                key={app.label}
                type="button"
                onClick={() => {
                  const first = banners.find((banner) => banner.audience === app.audience || banner.audience === "all");
                  if (first) setSelectedId(first.id);
                }}
                className="rounded-3xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:border-cyan-300/70 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">{app.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{app.description}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-muted/45 p-3">
                    <p className="text-xl font-black text-foreground">{active}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Ativos</p>
                  </div>
                  <div className="rounded-2xl bg-muted/45 p-3">
                    <p className="text-xl font-black text-foreground">{total}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Total</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr_390px]">
            <Skeleton className="h-[520px] rounded-3xl" />
            <Skeleton className="h-[520px] rounded-3xl" />
            <Skeleton className="h-[520px] rounded-3xl" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr_390px]">
            <section className="rounded-3xl border border-border/60 bg-card p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Campanhas</p>
                  <p className="text-sm text-muted-foreground">Ordem por prioridade</p>
                </div>
                <Button size="icon" onClick={addBanner} aria-label="Novo banner" className="rounded-2xl">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {banners
                  .slice()
                  .sort((a, b) => b.priority - a.priority)
                  .map((banner) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => setSelectedId(banner.id)}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition hover:border-primary/35 hover:bg-muted/50",
                        selected?.id === banner.id ? "border-primary/45 bg-primary/5" : "border-border/55 bg-background",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-foreground">{banner.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{AUDIENCES.find((a) => a.value === banner.audience)?.label} · {PLACEMENTS.find((p) => p.value === banner.placement)?.label}</p>
                          {(banner.starts_at || banner.ends_at) && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700">
                              <CalendarClock className="h-3 w-3" />
                              Agendado
                            </p>
                          )}
                        </div>
                        <Badge variant={banner.enabled ? "default" : "outline"}>{banner.enabled ? "on" : "off"}</Badge>
                      </div>
                    </button>
                  ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
              {selected ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Conteudo do banner</p>
                      <h2 className="text-xl font-black text-foreground">{selected.title}</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={duplicateBanner} className="gap-2">
                        <Copy className="h-4 w-4" />
                        Duplicar
                      </Button>
                      <Button variant="outline" size="sm" onClick={removeBanner} className="gap-2 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-muted/25 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-cyan-700" />
                      <p className="text-sm font-black text-foreground">Exibicao no app</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Publico</Label>
                        <Select value={selected.audience} onValueChange={(value: AppBannerAudience) => updateSelected({ audience: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{AUDIENCES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Onde exibir</Label>
                        <Select value={selected.placement} onValueChange={(value: AppBannerPlacement) => updateSelected({ placement: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PLACEMENTS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Inicio da campanha</Label>
                        <Input type="datetime-local" value={selected.starts_at ?? ""} onChange={(event) => updateSelected({ starts_at: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim da campanha</Label>
                        <Input type="datetime-local" value={selected.ends_at ?? ""} onChange={(event) => updateSelected({ ends_at: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <Input type="number" value={selected.priority} onChange={(event) => updateSelected({ priority: Number(event.target.value) })} />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3">
                        <div>
                          <Label>Banner ativo</Label>
                          <p className="text-xs text-muted-foreground">Desligue para esconder sem apagar.</p>
                        </div>
                        <Switch checked={selected.enabled} onCheckedChange={(value) => updateSelected({ enabled: value })} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Titulo</Label>
                      <Input value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Subtitulo</Label>
                      <Textarea rows={3} value={selected.subtitle ?? ""} onChange={(event) => updateSelected({ subtitle: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Selo</Label>
                      <Input value={selected.eyebrow ?? ""} onChange={(event) => updateSelected({ eyebrow: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do botao</Label>
                      <Input value={selected.cta_label ?? ""} onChange={(event) => updateSelected({ cta_label: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Link do botao</Label>
                      <Input value={selected.cta_href ?? ""} onChange={(event) => updateSelected({ cta_href: event.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Imagem do banner</Label>
                      <Input value={selected.image_url ?? ""} placeholder="/images/app-promo-telemedicine.png" onChange={(event) => updateSelected({ image_url: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tema visual</Label>
                      <Select value={selected.theme ?? "blue"} onValueChange={(value: ThemeValue) => updateSelected({ theme: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{THEMES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
                  <p className="text-sm font-bold text-muted-foreground">Crie um banner para comecar.</p>
                  <Button className="mt-4 gap-2" onClick={addBanner}><Plus className="h-4 w-4" />Novo banner</Button>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Previa no app</p>
                  <p className="text-sm text-muted-foreground">Aparencia aproximada do banner nas telas.</p>
                </div>
                {selected ? <BannerPreview banner={selected} /> : null}
              </motion.section>

              <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-sm font-extrabold text-foreground">Imagem gerada para campanha</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Use <span className="font-mono text-xs">/images/app-promo-telemedicine.png</span> para aplicar o visual criado nos banners.
                </p>
              </section>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
