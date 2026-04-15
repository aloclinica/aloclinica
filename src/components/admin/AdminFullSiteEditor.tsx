/**
 * AdminFullSiteEditor — Three-column CMS editor for all landing sections.
 *
 * Left: section list (toggle, edit).
 * Middle: dynamic form generated from each section's `schema`.
 * Right: live preview iframe of "/".
 */
import { useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { invalidateSiteSections } from "@/lib/site-sections";
import { ArrowUp, ArrowDown, Save, RefreshCw, Monitor, Tablet, Smartphone, History, Upload, Plus, Trash2 } from "lucide-react";

type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "color" | "url" | "select" | "array";
  options?: string[];
  item_schema?: { fields: Field[] };
};

type Section = {
  id: string;
  key: string;
  display_name: string;
  display_order: number;
  is_enabled: boolean;
  config: Record<string, any>;
  schema: { fields?: Field[] };
};

const VIEWPORTS = {
  desktop: { w: "100%", label: "Desktop", icon: Monitor },
  tablet:  { w: "768px", label: "Tablet",  icon: Tablet },
  mobile:  { w: "390px", label: "Mobile",  icon: Smartphone },
} as const;

export default function AdminFullSiteEditor() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [history, setHistory] = useState<Array<{ id: string; saved_at: string; config: any }>>([]);

  const selected = useMemo(() => sections.find((s) => s.key === selectedKey), [sections, selectedKey]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("site_sections")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar seções");
    } else {
      setSections(data as Section[]);
      if (!selectedKey && data && data[0]) setSelectedKey(data[0].key);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected) setEditing(selected.config ?? {});
  }, [selectedKey]); // eslint-disable-line

  const saveConfig = async () => {
    if (!selected) return;
    const { error } = await (supabase as any)
      .from("site_sections")
      .update({ config: editing, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Seção salva");
    invalidateSiteSections();
    setPreviewKey((k) => k + 1);
    await load();
  };

  const toggleEnabled = async (s: Section): Promise<void> => {
    const { error } = await (supabase as any)
      .from("site_sections")
      .update({ is_enabled: !s.is_enabled })
      .eq("id", s.id);
    if (error) { toast.error("Erro"); return; }
    invalidateSiteSections();
    setPreviewKey((k) => k + 1);
    await load();
  };

  const move = async (s: Section, dir: -1 | 1) => {
    const idx = sections.findIndex((x) => x.id === s.id);
    const target = sections[idx + dir];
    if (!target) return;
    await (supabase as any).from("site_sections").update({ display_order: target.display_order }).eq("id", s.id);
    await (supabase as any).from("site_sections").update({ display_order: s.display_order }).eq("id", target.id);
    invalidateSiteSections();
    setPreviewKey((k) => k + 1);
    await load();
  };

  const loadHistory = async () => {
    if (!selected) return;
    const { data } = await (supabase as any)
      .from("site_sections_history")
      .select("id, saved_at, config")
      .eq("section_key", selected.key)
      .order("saved_at", { ascending: false })
      .limit(20);
    setHistory(data ?? []);
  };

  const restoreHistory = (cfg: any) => {
    setEditing(cfg ?? {});
    toast.info("Versão carregada — clique Salvar para aplicar");
  };

  const fields = selected?.schema?.fields ?? [];
  const VpIcon = VIEWPORTS[viewport].icon;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 px-2">
        <h1 className="text-2xl font-bold">Editor do site</h1>
        <div className="flex items-center gap-2">
          {(Object.keys(VIEWPORTS) as Array<keyof typeof VIEWPORTS>).map((k) => {
            const Icon = VIEWPORTS[k].icon;
            return (
              <Button key={k} size="sm" variant={viewport === k ? "default" : "outline"} onClick={() => setViewport(k)}>
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
          <Button size="sm" variant="outline" onClick={() => setPreviewKey((k) => k + 1)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Recarregar
          </Button>
          <DropdownMenu onOpenChange={(o) => { if (o) loadHistory(); }}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline"><History className="w-4 h-4 mr-1" /> Histórico</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {history.length === 0 && <DropdownMenuItem disabled>Sem versões anteriores</DropdownMenuItem>}
              {history.map((h) => (
                <DropdownMenuItem key={h.id} onClick={() => restoreHistory(h.config)}>
                  {new Date(h.saved_at).toLocaleString("pt-BR")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={saveConfig} disabled={!selected}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* Left: sections list */}
        <Card className="col-span-3 p-2 overflow-y-auto">
          {loading && <div className="p-4 text-sm text-muted-foreground">Carregando...</div>}
          {sections.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${selectedKey === s.key ? "bg-muted" : ""}`}
              onClick={() => setSelectedKey(s.key)}
            >
              <div className="flex flex-col gap-0">
                <button className="p-0.5 hover:bg-background rounded" onClick={(e) => { e.stopPropagation(); move(s, -1); }}>
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button className="p-0.5 hover:bg-background rounded" onClick={(e) => { e.stopPropagation(); move(s, 1); }}>
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.display_name}</div>
                <div className="text-xs text-muted-foreground truncate">{s.key}</div>
              </div>
              <Switch checked={s.is_enabled} onClick={(e) => e.stopPropagation()} onCheckedChange={() => toggleEnabled(s)} />
            </div>
          ))}
        </Card>

        {/* Middle: form */}
        <Card className="col-span-4 p-4 overflow-y-auto">
          {!selected && <div className="text-sm text-muted-foreground">Selecione uma seção</div>}
          {selected && (
            <div className="space-y-4">
              <h2 className="font-bold">{selected.display_name}</h2>
              {fields.length === 0 && <div className="text-xs text-muted-foreground">Esta seção não tem campos configuráveis.</div>}
              {fields.map((f) => (
                <FieldEditor
                  key={f.key}
                  field={f}
                  value={editing[f.key]}
                  onChange={(v) => setEditing((e) => ({ ...e, [f.key]: v }))}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Right: preview */}
        <Card className="col-span-5 p-2 flex flex-col">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <VpIcon className="w-3 h-3" /> {VIEWPORTS[viewport].label}
          </div>
          <div className="flex-1 bg-muted rounded overflow-hidden flex justify-center">
            <iframe
              key={previewKey}
              src="/?preview=1"
              className="h-full border-0 bg-white"
              style={{ width: VIEWPORTS[viewport].w, maxWidth: "100%" }}
              title="preview"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------- Field editors -------- */

function FieldEditor({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  if (field.type === "text" || field.type === "url") {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "color") {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 rounded border" />
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="#RRGGBB ou hsl(...)" />
        </div>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === "image") {
    return <ImageField label={field.label} value={value ?? ""} onChange={onChange} />;
  }
  if (field.type === "array") {
    return <ArrayField field={field} value={value ?? []} onChange={onChange} />;
  }
  return null;
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const onFile = async (file: File) => {
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error: upErr } = await db.storage.from("site-media").upload(path, file, { upsert: false });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: pub } = db.storage.from("site-media").getPublicUrl(path);
    const url = pub.publicUrl;
    await (supabase as any).from("site_media").insert({ url, path, name: file.name, mime_type: file.type, size_bytes: file.size });
    onChange(url);
    setUploading(false);
    toast.success("Imagem enviada");
  };
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {value && <img src={value} alt="" className="h-24 w-auto rounded border object-cover" />}
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="URL" />
        <label className="inline-flex items-center gap-1 border rounded px-3 py-2 cursor-pointer hover:bg-muted text-sm">
          <Upload className="w-4 h-4" /> {uploading ? "..." : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        <MediaPickerButton onPick={onChange} />
      </div>
    </div>
  );
}

function MediaPickerButton({ onPick }: { onPick: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  useEffect(() => {
    if (!open) return;
    (supabase as any).from("site_media").select("*").order("created_at", { ascending: false }).limit(60)
      .then(({ data }: any) => setMedia(data ?? []));
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">Biblioteca</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Biblioteca de mídia</DialogTitle></DialogHeader>
        <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
          {media.map((m) => (
            <button key={m.id} onClick={() => { onPick(m.url); setOpen(false); }} className="border rounded p-1 hover:border-primary">
              <img src={m.url} alt={m.name} className="w-full h-24 object-cover rounded" />
              <div className="text-[10px] truncate mt-1">{m.name}</div>
            </button>
          ))}
          {media.length === 0 && <div className="col-span-4 text-sm text-muted-foreground p-4 text-center">Nenhuma imagem</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ArrayField({ field, value, onChange }: { field: Field; value: any[]; onChange: (v: any[]) => void }) {
  const items = Array.isArray(value) ? value : [];
  const itemFields = field.item_schema?.fields ?? [];
  const addItem = () => {
    const blank: Record<string, any> = {};
    for (const f of itemFields) blank[f.key] = "";
    onChange([...items, blank]);
  };
  return (
    <div className="space-y-2 border rounded p-3">
      <div className="flex items-center justify-between">
        <Label>{field.label}</Label>
        <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border rounded p-2 space-y-2 bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="text-xs font-semibold">Item {i + 1}</div>
            <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          {itemFields.map((f) => (
            <FieldEditor
              key={f.key}
              field={f}
              value={item?.[f.key]}
              onChange={(v) => {
                const next = [...items];
                next[i] = { ...next[i], [f.key]: v };
                onChange(next);
              }}
            />
          ))}
        </div>
      ))}
      {items.length === 0 && <div className="text-xs text-muted-foreground">Vazio</div>}
    </div>
  );
}
