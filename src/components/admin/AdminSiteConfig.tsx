import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, RefreshCw, Plus, Trash2, Pencil, X, Star,
  Globe, Palette, Search, Plug, LayoutTemplate, SlidersHorizontal,
  MessageSquareQuote, CircleDollarSign, HelpCircle, Image, GripVertical, Check,
  AlertTriangle, Eye, EyeOff, Undo2, CheckCircle2, Copy, ExternalLink,
} from "lucide-react";
import { warn } from "@/lib/logger";
import { invalidateSiteConfig } from "@/lib/site-config";

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfigMap = Record<string, string>;

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  max_appointments: number | null;
  is_active: boolean;
  features: string[];
  stripe_price_id: string | null;
};

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  text: string;
  rating: number;
  is_active: boolean;
  order_index: number;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
};

type ConfigRow = {
  id: string;
  key: string;
  value: string | null;
  category: string;
  label: string;
  input_type: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MotionCard = motion.create(Card);

const cardAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const SaveBtn = ({ onSave, saving, hasChanges }: { onSave: () => void; saving: boolean; hasChanges?: boolean }) => (
  <Button onClick={onSave} disabled={saving} className="gap-2" size="sm">
    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    {saving ? "Salvando…" : "Salvar alterações"}
    {hasChanges && !saving && (
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
    )}
  </Button>
);

const EmptyState = ({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground mb-1">{title}</p>
    <p className="text-xs text-muted-foreground max-w-[280px] mb-4">{description}</p>
    {action}
  </div>
);

const SectionSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

const StatPill = ({ label, count, color = "muted" }: { label: string; count: number; color?: string }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-${color}/10 text-${color}-foreground border border-${color}/20`}>
    <span className="text-foreground font-bold">{count}</span>
    {label}
  </div>
);

const ConfigField = ({
  row,
  value,
  onChange,
}: {
  row: ConfigRow;
  value: string;
  onChange: (key: string, val: string) => void;
}) => {
  const v = value ?? "";

  if (row.input_type === "boolean") {
    return (
      <div className="flex items-center justify-between py-3 px-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/30 transition-colors">
        <div className="flex-1 min-w-0">
          <Label className="font-normal text-sm cursor-pointer">{row.label}</Label>
        </div>
        <Switch checked={v === "true"} onCheckedChange={(c) => onChange(row.key, String(c))} />
      </div>
    );
  }
  if (row.input_type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{row.label}</Label>
        <Textarea value={v} onChange={(e) => onChange(row.key, e.target.value)} className="resize-none min-h-[80px] bg-card/50" placeholder={row.label} />
      </div>
    );
  }
  if (row.input_type === "color") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{row.label}</Label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input type="color" value={v || "#000000"} onChange={(e) => onChange(row.key, e.target.value)} className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer p-1 bg-transparent" />
          </div>
          <Input value={v} onChange={(e) => onChange(row.key, e.target.value)} className="font-mono uppercase w-32 bg-card/50" placeholder="#000000" maxLength={7} />
          {v && <span className="w-10 h-10 rounded-xl border-2 border-border shadow-sm ring-2 ring-offset-2 ring-offset-background ring-transparent" style={{ backgroundColor: v }} />}
        </div>
      </div>
    );
  }
  if (row.input_type === "url") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{row.label}</Label>
        <div className="flex gap-2">
          <Input value={v} onChange={(e) => onChange(row.key, e.target.value)} placeholder="https://" className="flex-1 bg-card/50" />
          {v && (
            <Button variant="outline" size="icon" type="button" tabIndex={-1} asChild>
              <a href={v} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
            </Button>
          )}
        </div>
        {v && /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(v) && (
          <div className="mt-2 p-2 rounded-lg border border-border bg-muted/30">
            <img src={v} alt="preview" className="h-16 w-auto rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>
    );
  }
  if (row.input_type === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{row.label}</Label>
        <Input type="number" value={v} onChange={(e) => onChange(row.key, e.target.value)} className="w-32 bg-card/50" />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{row.label}</Label>
      <Input value={v} onChange={(e) => onChange(row.key, e.target.value)} placeholder={row.label} className="bg-card/50" />
    </div>
  );
};

// ── Stars ─────────────────────────────────────────────────────────────────────

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} className="transition-transform hover:scale-110">
        <Star className={`w-5 h-5 transition-colors ${s <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

// ── JSON Validator ────────────────────────────────────────────────────────────

const JsonField = ({ value, onChange, placeholder, minH = "180px", hint }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minH?: string;
  hint?: string;
}) => {
  const isValid = useMemo(() => {
    if (!value?.trim()) return null;
    try { JSON.parse(value); return true; } catch { return false; }
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          className={`font-mono text-xs bg-card/50 ${isValid === false ? "border-destructive/50 focus-visible:ring-destructive/30" : isValid === true ? "border-emerald-500/50" : ""}`}
          style={{ minHeight: minH }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {isValid !== null && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isValid ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
            {isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {isValid ? "JSON válido" : "JSON inválido"}
          </div>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const AdminSiteConfig = () => {
  const nav = getAdminNav("site-config");

  // Config key-value
  const [configRows, setConfigRows] = useState<ConfigRow[]>([]);
  const [values, setValues] = useState<ConfigMap>({});
  const [savedValues, setSavedValues] = useState<ConfigMap>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planDialog, setPlanDialog] = useState(false);
  const [planFeatureInput, setPlanFeatureInput] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialDialog, setTestimonialDialog] = useState(false);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // FAQ
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqDialog, setFaqDialog] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("geral");
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "plan" | "testimonial" | "faq"; id: string; label: string } | null>(null);

  // Unsaved changes detection
  const hasUnsavedChanges = useCallback((cat: string) => {
    const catRows = configRows.filter((r) => r.category === cat);
    return catRows.some((r) => (values[r.key] ?? "") !== (savedValues[r.key] ?? ""));
  }, [configRows, values, savedValues]);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    const { data, error } = await supabase.from("site_config").select("*").order("category").order("key");
    if (error) { warn("[SiteConfig] config error", error); return; }
    setConfigRows(data ?? []);
    const map: ConfigMap = {};
    for (const r of data ?? []) map[r.key] = r.value ?? "";
    setValues(map);
    setSavedValues(map);
  }, []);

  const loadPlans = useCallback(async () => {
    const { data, error } = await supabase.from("plans").select("*").order("price");
    if (error) { warn("[SiteConfig] plans error", error); return; }
    setPlans((data ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
    })) as Plan[]);
  }, []);

  const loadTestimonials = useCallback(async () => {
    const { data, error } = await supabase.from("testimonials").select("*").order("order_index");
    if (error) { warn("[SiteConfig] testimonials error", error); return; }
    setTestimonials(data ?? []);
  }, []);

  const loadFaq = useCallback(async () => {
    const { data, error } = await supabase.from("faq_items").select("*").order("order_index");
    if (error) { warn("[SiteConfig] faq error", error); return; }
    setFaqItems(data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadConfig(), loadPlans(), loadTestimonials(), loadFaq()]);
    setLoading(false);
  }, [loadConfig, loadPlans, loadTestimonials, loadFaq]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Config save ────────────────────────────────────────────────────────────

  const saveCategory = async (cat: string) => {
    setSavingCat(cat);
    const catRows = configRows.filter((r) => r.category === cat);
    const changedRows = catRows.filter((r) => (values[r.key] ?? "") !== (savedValues[r.key] ?? ""));
    if (changedRows.length === 0) {
      toast.info("Nenhuma alteração para salvar");
      setSavingCat(null);
      return;
    }
    await Promise.all(changedRows.map((r) =>
      supabase.from("site_config").update({ value: values[r.key] ?? "" }).eq("key", r.key)
    ));
    toast.success(`${changedRows.length} configuração${changedRows.length > 1 ? "ões" : ""} salva${changedRows.length > 1 ? "s" : ""}!`);
    invalidateSiteConfig();
    setSavedValues((prev) => {
      const next = { ...prev };
      for (const r of changedRows) next[r.key] = values[r.key] ?? "";
      return next;
    });
    setSavingCat(null);
  };

  const resetCategory = (cat: string) => {
    const catRows = configRows.filter((r) => r.category === cat);
    setValues((prev) => {
      const next = { ...prev };
      for (const r of catRows) next[r.key] = savedValues[r.key] ?? "";
      return next;
    });
    toast.info("Alterações descartadas");
  };

  const handleChange = (key: string, val: string) => setValues((p) => ({ ...p, [key]: val }));

  const rows = (cat: string) => configRows.filter((r) => r.category === cat);

  // ── Plans CRUD ─────────────────────────────────────────────────────────────

  const blankPlan = (): Plan => ({
    id: "", name: "", description: "", price: 0, interval: "monthly",
    max_appointments: null, is_active: true, features: [], stripe_price_id: null,
  });

  const openNewPlan = () => { setEditingPlan(blankPlan()); setPlanFeatureInput(""); setPlanDialog(true); };
  const openEditPlan = (p: Plan) => { setEditingPlan({ ...p, features: [...p.features] }); setPlanFeatureInput(""); setPlanDialog(true); };

  const addFeature = () => {
    if (!planFeatureInput.trim() || !editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, planFeatureInput.trim()] });
    setPlanFeatureInput("");
  };

  const removeFeature = (i: number) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((_, idx) => idx !== i) });
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    if (!editingPlan.name.trim()) { toast.error("Nome do plano é obrigatório"); return; }
    setSavingPlan(true);
    const payload = {
      name: editingPlan.name,
      description: editingPlan.description || null,
      price: Number(editingPlan.price),
      interval: editingPlan.interval,
      max_appointments: editingPlan.max_appointments ? Number(editingPlan.max_appointments) : null,
      is_active: editingPlan.is_active,
      features: editingPlan.features,
      stripe_price_id: editingPlan.stripe_price_id || null,
    };
    let error;
    if (editingPlan.id) {
      ({ error } = await supabase.from("plans").update(payload).eq("id", editingPlan.id));
    } else {
      ({ error } = await supabase.from("plans").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar plano", { description: error.message }); }
    else { toast.success(editingPlan.id ? "Plano atualizado!" : "Plano criado!"); setPlanDialog(false); loadPlans(); }
    setSavingPlan(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === "plan") {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) toast.error("Erro ao excluir plano");
      else { toast.success("Plano excluído"); loadPlans(); }
    } else if (type === "testimonial") {
      await supabase.from("testimonials").delete().eq("id", id);
      toast.success("Depoimento excluído"); loadTestimonials();
    } else if (type === "faq") {
      await supabase.from("faq_items").delete().eq("id", id);
      toast.success("Item excluído"); loadFaq();
    }
    setDeleteTarget(null);
  };

  const deletePlan = (id: string, name: string) => setDeleteTarget({ type: "plan", id, label: name });

  const togglePlanActive = async (p: Plan) => {
    await supabase.from("plans").update({ is_active: !p.is_active }).eq("id", p.id);
    loadPlans();
  };

  // ── Testimonials CRUD ──────────────────────────────────────────────────────

  const blankTestimonial = (): Testimonial => ({
    id: "", name: "", role: "", company: "", avatar_url: "", text: "", rating: 5, is_active: true, order_index: testimonials.length + 1,
  });

  const openNewTestimonial = () => { setEditingTestimonial(blankTestimonial()); setTestimonialDialog(true); };
  const openEditTestimonial = (t: Testimonial) => { setEditingTestimonial({ ...t }); setTestimonialDialog(true); };

  const saveTestimonial = async () => {
    if (!editingTestimonial) return;
    if (!editingTestimonial.name.trim() || !editingTestimonial.text.trim()) { toast.error("Nome e texto são obrigatórios"); return; }
    setSavingTestimonial(true);
    const payload = {
      name: editingTestimonial.name,
      role: editingTestimonial.role || null,
      company: editingTestimonial.company || null,
      avatar_url: editingTestimonial.avatar_url || null,
      text: editingTestimonial.text,
      rating: editingTestimonial.rating,
      is_active: editingTestimonial.is_active,
      order_index: editingTestimonial.order_index,
    };
    let error;
    if (editingTestimonial.id) {
      ({ error } = await supabase.from("testimonials").update(payload).eq("id", editingTestimonial.id));
    } else {
      ({ error } = await supabase.from("testimonials").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar depoimento", { description: error.message }); }
    else { toast.success(editingTestimonial.id ? "Depoimento atualizado!" : "Depoimento criado!"); setTestimonialDialog(false); loadTestimonials(); }
    setSavingTestimonial(false);
  };

  const deleteTestimonial = (id: string, name: string) => setDeleteTarget({ type: "testimonial", id, label: name });

  const toggleTestimonialActive = async (t: Testimonial) => {
    await supabase.from("testimonials").update({ is_active: !t.is_active }).eq("id", t.id);
    loadTestimonials();
  };

  // ── FAQ CRUD ───────────────────────────────────────────────────────────────

  const blankFaq = (): FaqItem => ({
    id: "", question: "", answer: "", category: "geral", is_active: true, order_index: faqItems.length + 1,
  });

  const openNewFaq = () => { setEditingFaq(blankFaq()); setFaqDialog(true); };
  const openEditFaq = (f: FaqItem) => { setEditingFaq({ ...f }); setFaqDialog(true); };

  const saveFaq = async () => {
    if (!editingFaq) return;
    if (!editingFaq.question.trim() || !editingFaq.answer.trim()) { toast.error("Pergunta e resposta são obrigatórias"); return; }
    setSavingFaq(true);
    const payload = {
      question: editingFaq.question,
      answer: editingFaq.answer,
      category: editingFaq.category || "geral",
      is_active: editingFaq.is_active,
      order_index: editingFaq.order_index,
    };
    let error;
    if (editingFaq.id) {
      ({ error } = await supabase.from("faq_items").update(payload).eq("id", editingFaq.id));
    } else {
      ({ error } = await supabase.from("faq_items").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar FAQ", { description: error.message }); }
    else { toast.success(editingFaq.id ? "FAQ atualizado!" : "FAQ criado!"); setFaqDialog(false); loadFaq(); }
    setSavingFaq(false);
  };

  const deleteFaq = (id: string, question: string) => setDeleteTarget({ type: "faq", id, label: question });

  const toggleFaqActive = async (f: FaqItem) => {
    await supabase.from("faq_items").update({ is_active: !f.is_active }).eq("id", f.id);
    loadFaq();
  };

  // ── Filtered FAQ items ─────────────────────────────────────────────────────

  const filteredFaq = useMemo(() => {
    if (!searchTerm.trim()) return faqItems;
    const term = searchTerm.toLowerCase();
    return faqItems.filter((f) =>
      f.question.toLowerCase().includes(term) ||
      f.answer.toLowerCase().includes(term) ||
      (f.category ?? "").toLowerCase().includes(term)
    );
  }, [faqItems, searchTerm]);

  // ── Tab config ─────────────────────────────────────────────────────────────

  const tabItems = useMemo(() => [
    { id: "geral", label: "Geral", icon: Globe, count: rows("geral").length },
    { id: "landing", label: "Landing", icon: LayoutTemplate },
    { id: "cards", label: "Cards / JSON", icon: LayoutTemplate },
    { id: "secoes", label: "Seções", icon: SlidersHorizontal, count: rows("secoes").length },
    { id: "planos", label: "Planos", icon: CircleDollarSign, count: plans.length },
    { id: "depoimentos", label: "Depoimentos", icon: MessageSquareQuote, count: testimonials.length },
    { id: "faq", label: "FAQ", icon: HelpCircle, count: faqItems.length },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "seo", label: "SEO", icon: Search },
    { id: "integracoes", label: "Integrações", icon: Plug },
  ], [configRows, plans.length, testimonials.length, faqItems.length]);

  // ── Category save bar ──────────────────────────────────────────────────────

  const CategorySaveBar = ({ cat }: { cat: string }) => {
    const changed = hasUnsavedChanges(cat);
    return (
      <AnimatePresence>
        {changed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5"
          >
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Alterações não salvas</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => resetCategory(cat)} className="gap-1.5 text-xs h-8">
                <Undo2 className="w-3.5 h-3.5" />Descartar
              </Button>
              <SaveBtn onSave={() => saveCategory(cat)} saving={savingCat === cat} hasChanges />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Configuração do Site" nav={nav} role="admin">
      <div className="space-y-6 pb-24 md:pb-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Configuração da Plataforma
              {values["maintenance_mode"] === "true" && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">MANUTENÇÃO</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie textos, imagens, planos, depoimentos, FAQ, cores e integrações.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <div className="hidden md:flex items-center gap-2 mr-2">
                <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                  <span className="font-bold text-foreground">{configRows.length}</span> configs
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                  <span className="font-bold text-foreground">{plans.length}</span> planos
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                  <span className="font-bold text-foreground">{testimonials.length}</span> depoimentos
                </Badge>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading} className="shrink-0 gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Recarregar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />)}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
                  <CardContent><SectionSkeleton /></CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(""); }}>
            <TabsList className="flex flex-wrap gap-1 h-auto p-1.5 mb-6 bg-muted/50">
              {tabItems.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:shadow-sm">
                  <t.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span className="ml-0.5 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{t.count}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── GERAL ─────────────────────────────────────────────────── */}
            <TabsContent value="geral">
              <div className="grid gap-6 md:grid-cols-2">
                <MotionCard {...cardAnim}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />Identidade
                    </CardTitle>
                    <CardDescription>Nome, logo, favicon e descrição.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rows("geral").filter(r => ["site_name", "site_description", "logo_url", "favicon_url"].includes(r.key)).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </MotionCard>

                <MotionCard {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.05 }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-primary" />Contato & Rodapé
                    </CardTitle>
                    <CardDescription>E-mail, telefone, WhatsApp e textos do rodapé.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rows("geral").filter(r => ["contact_email", "contact_phone", "whatsapp_number", "footer_text", "footer_tagline"].includes(r.key)).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </MotionCard>

                <MotionCard {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.1 }} className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />Redes Sociais
                    </CardTitle>
                    <CardDescription>Links das redes sociais exibidos no rodapé.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rows("geral").filter(r => r.key.startsWith("social_")).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </MotionCard>
              </div>
              <CategorySaveBar cat="geral" />
            </TabsContent>

            {/* ── LANDING ───────────────────────────────────────────────── */}
            <TabsContent value="landing">
              <div className="grid gap-6 md:grid-cols-2">
                <MotionCard {...cardAnim}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-primary" />Hero
                    </CardTitle>
                    <CardDescription>Bloco principal da página inicial.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rows("landing").filter(r => ["landing_badge_text", "hero_title", "hero_subtitle", "hero_cta_text", "hero_cta_primary_text", "hero_cta_primary_url", "hero_cta_secondary_text", "hero_cta_secondary_url", "landing_second_cta", "hero_image_url", "hero_video_url"].includes(r.key)).map(r => (
                      <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                    ))}
                  </CardContent>
                </MotionCard>

                <MotionCard {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.05 }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />Estatísticas em destaque
                    </CardTitle>
                    <CardDescription>4 números exibidos abaixo do hero.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="grid grid-cols-2 gap-2 pb-3 border-b border-border/30 last:border-0">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Stat {n} — Valor</Label>
                          <Input
                            value={values[`stat_${n}_value`] ?? ""}
                            onChange={(e) => handleChange(`stat_${n}_value`, e.target.value)}
                            placeholder="10k+"
                            className="bg-card/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Stat {n} — Rótulo</Label>
                          <Input
                            value={values[`stat_${n}_label`] ?? ""}
                            onChange={(e) => handleChange(`stat_${n}_label`, e.target.value)}
                            placeholder="Pacientes"
                            className="bg-card/50"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </MotionCard>
              </div>
              <CategorySaveBar cat="landing" />
            </TabsContent>

            {/* ── CARDS DE ENTRADA / LISTAS JSON ────────────────────────── */}
            <TabsContent value="cards">
              <div className="grid gap-6">
                <MotionCard {...cardAnim}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-primary" />Cards de entrada da landing
                    </CardTitle>
                    <CardDescription>
                      JSON com os 3 cards abaixo do Hero. Cada item: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{`{title, description, icon, cta, href}`}</code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JsonField
                      value={values["entry_cards"] ?? ""}
                      onChange={(v) => handleChange("entry_cards", v)}
                      placeholder='[{"title":"...","description":"...","icon":"Stethoscope","cta":"Agendar","href":"/..."}]'
                      minH="220px"
                      hint="Ícones suportados: Stethoscope, Eye, Building2. Se inválido, a landing usa valores padrão."
                    />
                  </CardContent>
                </MotionCard>

                <MotionCard {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.05 }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Como funciona — Passos</CardTitle>
                    <CardDescription>
                      JSON array de passos: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{`{step, title, desc, time?}`}</code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JsonField
                      value={values["how_it_works_steps"] ?? ""}
                      onChange={(v) => handleChange("how_it_works_steps", v)}
                      minH="180px"
                    />
                  </CardContent>
                </MotionCard>

                <MotionCard {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.1 }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Especialidades em destaque</CardTitle>
                    <CardDescription>JSON array de nomes de especialidades.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JsonField
                      value={values["featured_specialties"] ?? ""}
                      onChange={(v) => handleChange("featured_specialties", v)}
                      placeholder='["Cardiologia","Dermatologia",...]'
                      minH="120px"
                    />
                  </CardContent>
                </MotionCard>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <SaveBtn onSave={() => saveCategory("cards")} saving={savingCat === "cards"} hasChanges={hasUnsavedChanges("cards")} />
              </div>
            </TabsContent>

            {/* ── SEÇÕES ────────────────────────────────────────────────── */}
            <TabsContent value="secoes">
              <MotionCard {...cardAnim}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />Visibilidade das Seções
                  </CardTitle>
                  <CardDescription>Ative ou desative blocos de conteúdo na página inicial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {rows("secoes").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}
                </CardContent>
              </MotionCard>
              <CategorySaveBar cat="secoes" />
            </TabsContent>

            {/* ── PLANOS ────────────────────────────────────────────────── */}
            <TabsContent value="planos">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {plans.length} plano{plans.length !== 1 ? "s" : ""} cadastrado{plans.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plans.filter(p => p.is_active).length} ativo{plans.filter(p => p.is_active).length !== 1 ? "s" : ""}
                      {plans.filter(p => !p.is_active).length > 0 && ` · ${plans.filter(p => !p.is_active).length} inativo${plans.filter(p => !p.is_active).length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <Button onClick={openNewPlan} size="sm" className="gap-2"><Plus className="w-4 h-4" />Novo Plano</Button>
                </div>

                {plans.length === 0 ? (
                  <EmptyState
                    icon={CircleDollarSign}
                    title="Nenhum plano cadastrado"
                    description="Crie planos de assinatura para seus pacientes."
                    action={<Button size="sm" onClick={openNewPlan} className="gap-2"><Plus className="w-4 h-4" />Criar primeiro plano</Button>}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {plans.map((p, i) => (
                        <MotionCard
                          key={p.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`relative group overflow-hidden ${!p.is_active ? "opacity-50 grayscale-[30%]" : ""}`}
                        >
                          {!p.is_active && (
                            <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center pointer-events-none">
                              <Badge variant="outline" className="text-xs"><EyeOff className="w-3 h-3 mr-1" />Inativo</Badge>
                            </div>
                          )}
                          <CardContent className="pt-5 pb-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-semibold text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{p.description ?? "Sem descrição"}</p>
                              </div>
                              <Switch checked={p.is_active} onCheckedChange={() => togglePlanActive(p)} className="shrink-0" />
                            </div>
                            <div className="flex items-baseline gap-1 mb-3">
                              <span className="text-2xl font-bold tracking-tight">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                              <span className="text-xs text-muted-foreground">/{p.interval === "monthly" ? "mês" : p.interval === "annual" ? "ano" : "único"}</span>
                            </div>
                            {p.features.length > 0 && (
                              <ul className="mb-3 space-y-1">
                                {p.features.slice(0, 4).map((f, i) => (
                                  <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{f}
                                  </li>
                                ))}
                                {p.features.length > 4 && (
                                  <li className="text-xs text-muted-foreground/60 pl-5">+{p.features.length - 4} mais…</li>
                                )}
                              </ul>
                            )}
                            <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditPlan(p)}>
                                <Pencil className="w-3.5 h-3.5" />Editar
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => deletePlan(p.id, p.name)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </MotionCard>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Plan dialog */}
              <Dialog open={planDialog} onOpenChange={setPlanDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan?.id ? "Editar Plano" : "Novo Plano"}</DialogTitle>
                  </DialogHeader>
                  {editingPlan && (
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do plano *</Label>
                        <Input className="mt-1" value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Plano Básico" />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea className="mt-1 resize-none min-h-[60px]" value={editingPlan.description ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input className="mt-1" type="number" min={0} step={0.01} value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} />
                        </div>
                        <div>
                          <Label>Intervalo</Label>
                          <Select value={editingPlan.interval} onValueChange={(v) => setEditingPlan({ ...editingPlan, interval: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="annual">Anual</SelectItem>
                              <SelectItem value="single">Avulso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Máx. consultas (vazio = ilimitado)</Label>
                          <Input className="mt-1" type="number" min={1} value={editingPlan.max_appointments ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, max_appointments: e.target.value ? Number(e.target.value) : null })} placeholder="∞" />
                        </div>
                        <div>
                          <Label>Stripe Price ID</Label>
                          <Input className="mt-1 font-mono text-xs" value={editingPlan.stripe_price_id ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, stripe_price_id: e.target.value || null })} placeholder="price_xxx" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 bg-muted/30">
                        <Label className="font-normal">Plano ativo</Label>
                        <Switch checked={editingPlan.is_active} onCheckedChange={(c) => setEditingPlan({ ...editingPlan, is_active: c })} />
                      </div>
                      <div>
                        <Label>Funcionalidades incluídas</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px] p-2 rounded-lg border border-dashed border-border/50 bg-muted/20">
                          {editingPlan.features.length === 0 && (
                            <span className="text-xs text-muted-foreground/50 italic">Nenhuma funcionalidade adicionada</span>
                          )}
                          {editingPlan.features.map((f, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 pr-1">
                              {f}
                              <button type="button" onClick={() => removeFeature(i)} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={planFeatureInput}
                            onChange={(e) => setPlanFeatureInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                            placeholder="Ex: Consultas ilimitadas"
                            className="flex-1 text-sm"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-1"><Plus className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPlanDialog(false)}>Cancelar</Button>
                    <Button onClick={savePlan} disabled={savingPlan} className="gap-2">
                      {savingPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Plano
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── DEPOIMENTOS ───────────────────────────────────────────── */}
            <TabsContent value="depoimentos">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {testimonials.length} depoimento{testimonials.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonials.filter(t => t.is_active).length} ativo{testimonials.filter(t => t.is_active).length !== 1 ? "s" : ""} na landing page
                    </p>
                  </div>
                  <Button size="sm" onClick={openNewTestimonial} className="gap-2"><Plus className="w-4 h-4" />Novo Depoimento</Button>
                </div>

                {testimonials.length === 0 ? (
                  <EmptyState
                    icon={MessageSquareQuote}
                    title="Nenhum depoimento"
                    description="Adicione depoimentos de pacientes para exibir na landing page."
                    action={<Button size="sm" onClick={openNewTestimonial} className="gap-2"><Plus className="w-4 h-4" />Adicionar primeiro</Button>}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {testimonials.map((t, i) => (
                        <MotionCard
                          key={t.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`group ${!t.is_active ? "opacity-50" : ""}`}
                        >
                          <CardContent className="pt-4 pb-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                {t.avatar_url ? (
                                  <img src={t.avatar_url} alt={t.name} className="w-9 h-9 rounded-full object-cover border-2 border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">{t.name[0]}</div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold leading-tight">{t.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{t.role ?? ""}{t.company ? ` · ${t.company}` : ""}</p>
                                </div>
                              </div>
                              <Switch checked={t.is_active} onCheckedChange={() => toggleTestimonialActive(t)} />
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 italic">"{t.text}"</p>
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditTestimonial(t)}>
                                <Pencil className="w-3.5 h-3.5" />Editar
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => deleteTestimonial(t.id, t.name)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </MotionCard>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <Dialog open={testimonialDialog} onOpenChange={setTestimonialDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingTestimonial?.id ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle>
                  </DialogHeader>
                  {editingTestimonial && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nome *</Label>
                          <Input className="mt-1" value={editingTestimonial.name} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })} />
                        </div>
                        <div>
                          <Label>Cargo / Papel</Label>
                          <Input className="mt-1" value={editingTestimonial.role ?? ""} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })} placeholder="Paciente" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Empresa (opcional)</Label>
                          <Input className="mt-1" value={editingTestimonial.company ?? ""} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })} />
                        </div>
                        <div>
                          <Label>Foto (URL)</Label>
                          <Input className="mt-1" value={editingTestimonial.avatar_url ?? ""} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar_url: e.target.value })} placeholder="https://..." />
                        </div>
                      </div>
                      <div>
                        <Label>Depoimento *</Label>
                        <Textarea className="mt-1 resize-none min-h-[80px]" value={editingTestimonial.text} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, text: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <Label className="text-sm mb-1.5 block">Avaliação</Label>
                          <StarRating value={editingTestimonial.rating} onChange={(v) => setEditingTestimonial({ ...editingTestimonial, rating: v })} />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <Label className="font-normal text-sm">Ativo</Label>
                          <Switch checked={editingTestimonial.is_active} onCheckedChange={(c) => setEditingTestimonial({ ...editingTestimonial, is_active: c })} />
                        </div>
                      </div>
                      <div>
                        <Label>Ordem de exibição</Label>
                        <Input className="mt-1 w-24" type="number" min={1} value={editingTestimonial.order_index} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, order_index: Number(e.target.value) })} />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTestimonialDialog(false)}>Cancelar</Button>
                    <Button onClick={saveTestimonial} disabled={savingTestimonial} className="gap-2">
                      {savingTestimonial ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── FAQ ───────────────────────────────────────────────────── */}
            <TabsContent value="faq">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{faqItems.length} pergunta{faqItems.length !== 1 ? "s" : ""} no FAQ</p>
                    <p className="text-xs text-muted-foreground">
                      {faqItems.filter(f => f.is_active).length} ativa{faqItems.filter(f => f.is_active).length !== 1 ? "s" : ""} na landing page
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {faqItems.length > 3 && (
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar FAQ…"
                          className="pl-8 h-8 text-xs w-48"
                        />
                      </div>
                    )}
                    <Button size="sm" onClick={openNewFaq} className="gap-2"><Plus className="w-4 h-4" />Nova Pergunta</Button>
                  </div>
                </div>

                {faqItems.length === 0 ? (
                  <EmptyState
                    icon={HelpCircle}
                    title="Nenhuma pergunta no FAQ"
                    description="Adicione perguntas frequentes para exibir na landing page."
                    action={<Button size="sm" onClick={openNewFaq} className="gap-2"><Plus className="w-4 h-4" />Criar primeira pergunta</Button>}
                  />
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredFaq.map((f, i) => (
                        <MotionCard
                          key={f.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`${!f.is_active ? "opacity-50" : ""}`}
                        >
                          <CardContent className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0 cursor-grab" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <p className="text-sm font-medium">{f.question}</p>
                                  {f.category && (
                                    <Badge variant="outline" className="text-[10px] font-normal">{f.category}</Badge>
                                  )}
                                  {!f.is_active && (
                                    <Badge variant="secondary" className="text-[10px] gap-0.5"><EyeOff className="w-2.5 h-2.5" />Oculto</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{f.answer}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Switch checked={f.is_active} onCheckedChange={() => toggleFaqActive(f)} />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditFaq(f)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteFaq(f.id, f.question)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </MotionCard>
                      ))}
                    </AnimatePresence>
                    {searchTerm && filteredFaq.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Nenhum resultado para "<span className="font-medium text-foreground">{searchTerm}</span>"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingFaq?.id ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
                  </DialogHeader>
                  {editingFaq && (
                    <div className="space-y-4">
                      <div>
                        <Label>Pergunta *</Label>
                        <Input className="mt-1" value={editingFaq.question} onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })} />
                      </div>
                      <div>
                        <Label>Resposta *</Label>
                        <Textarea className="mt-1 resize-none min-h-[100px]" value={editingFaq.answer} onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Categoria</Label>
                          <Input className="mt-1" value={editingFaq.category ?? ""} onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })} placeholder="geral" />
                        </div>
                        <div>
                          <Label>Ordem</Label>
                          <Input className="mt-1" type="number" min={1} value={editingFaq.order_index} onChange={(e) => setEditingFaq({ ...editingFaq, order_index: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-border/50 bg-muted/30">
                        <Label className="font-normal text-sm flex-1">Ativo na landing</Label>
                        <Switch checked={editingFaq.is_active} onCheckedChange={(c) => setEditingFaq({ ...editingFaq, is_active: c })} />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFaqDialog(false)}>Cancelar</Button>
                    <Button onClick={saveFaq} disabled={savingFaq} className="gap-2">
                      {savingFaq ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ── APARÊNCIA ─────────────────────────────────────────────── */}
            <TabsContent value="aparencia">
              <MotionCard {...cardAnim}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />Cores e Estilo
                  </CardTitle>
                  <CardDescription>Paleta principal da plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows("aparencia").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}

                  {/* Color Preview */}
                  <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-muted/50 to-muted/20">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Pré-visualização da Paleta</p>
                    <div className="flex gap-4 flex-wrap">
                      {([
                        { key: "color_primary", label: "Primária" },
                        { key: "color_secondary", label: "Secundária" },
                        { key: "color_accent", label: "Destaque" },
                      ]).map(({ key, label }) => (
                        <div key={key} className="flex flex-col items-center gap-1.5">
                          <div
                            className="w-16 h-16 rounded-2xl border-2 border-border shadow-lg transition-all hover:scale-105"
                            style={{ backgroundColor: values[key] || "#cccccc" }}
                          />
                          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">{values[key] || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
              <CategorySaveBar cat="aparencia" />
            </TabsContent>

            {/* ── SEO ───────────────────────────────────────────────────── */}
            <TabsContent value="seo">
              <MotionCard {...cardAnim}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />SEO e Metadados
                  </CardTitle>
                  <CardDescription>Título, descrição e imagem para buscadores e redes sociais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows("seo").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}

                  {/* Google Preview */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Prévia no Google</p>
                    <div className="space-y-0.5">
                      <p className="text-blue-600 dark:text-blue-400 text-base font-medium leading-tight hover:underline cursor-default">
                        {values["seo_title"] || "AlôMédico — Telemedicina e Tele-laudos"}
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-500 text-xs flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        alomedico.com.br
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {values["seo_description"] || "Consultas online com especialistas, laudos médicos e muito mais."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
              <CategorySaveBar cat="seo" />
            </TabsContent>

            {/* ── INTEGRAÇÕES ───────────────────────────────────────────── */}
            <TabsContent value="integracoes">
              <MotionCard {...cardAnim}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plug className="w-4 h-4 text-primary" />
                    Integrações e Flags
                    {values["maintenance_mode"] === "true" && (
                      <Badge variant="destructive" className="text-[10px] animate-pulse ml-2">🔧 MANUTENÇÃO ATIVA</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Ative/desative funcionalidades e modo manutenção.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {rows("integracoes").filter(r => r.input_type === "boolean").map(r => (
                    <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                  ))}
                  {rows("integracoes").filter(r => r.input_type !== "boolean").length > 0 && (
                    <div className="space-y-4 pt-4 mt-2 border-t border-border/30">
                      {rows("integracoes").filter(r => r.input_type !== "boolean").map(r => (
                        <ConfigField key={r.key} row={r} value={values[r.key] ?? ""} onChange={handleChange} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </MotionCard>
              <CategorySaveBar cat="integracoes" />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.label}"</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminSiteConfig;
