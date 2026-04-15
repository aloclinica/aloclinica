/**
 * AdminMediaLibrary — grid of uploaded images. Upload + copy URL.
 */
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Copy, Trash2 } from "lucide-react";

type Media = { id: string; url: string; path: string; name: string; size_bytes?: number; created_at: string };

export default function AdminMediaLibrary() {
  const [items, setItems] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("site_media")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const onUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await db.storage.from("site-media").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data: pub } = db.storage.from("site-media").getPublicUrl(path);
      await (supabase as any).from("site_media").insert({
        url: pub.publicUrl, path, name: file.name, mime_type: file.type, size_bytes: file.size,
      });
    }
    setUploading(false);
    toast.success("Upload concluído");
    load();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  };

  const remove = async (m: Media) => {
    if (!confirm(`Remover ${m.name}?`)) return;
    await db.storage.from("site-media").remove([m.path]);
    await (supabase as any).from("site_media").delete().eq("id", m.id);
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Biblioteca de mídia</h1>
        <label className="inline-flex items-center gap-2 border rounded px-4 py-2 cursor-pointer hover:bg-muted">
          <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Upload"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((m) => (
          <Card key={m.id} className="p-2 space-y-2">
            <img src={m.url} alt={m.name} className="w-full h-32 object-cover rounded" />
            <div className="text-xs truncate" title={m.name}>{m.name}</div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => copyUrl(m.url)}>
                <Copy className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => remove(m)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">Nenhuma mídia enviada</div>}
      </div>
    </div>
  );
}
