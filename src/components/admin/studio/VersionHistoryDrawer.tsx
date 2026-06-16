import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchBlockVersions, rollbackBlock, type BlockVersion } from "@/lib/site-blocks";
import { Undo2, History } from "lucide-react";
import { toast } from "sonner";

export function VersionHistoryDrawer({ blockId, open, onOpenChange, onRolledBack }: {
  blockId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRolledBack: () => void;
}) {
  const [versions, setVersions] = useState<BlockVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !blockId) return;
    setLoading(true);
    fetchBlockVersions(blockId).then((v) => { setVersions(v); setLoading(false); });
  }, [open, blockId]);

  const doRollback = async (id: string, version: number) => {
    try {
      await rollbackBlock(id);
      toast.success(`Restaurado para v${version}`);
      onRolledBack();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Falha no rollback");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><History className="w-4 h-4" />Histórico de Versões</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!loading && versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</p>}
          {versions.map((v) => (
            <div key={v.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{v.version}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(v.published_at).toLocaleString("pt-BR")}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => doRollback(v.id, v.version)}>
                  <Undo2 className="w-3.5 h-3.5 mr-1" />Restaurar
                </Button>
              </div>
              {v.change_note && <p className="text-xs italic text-muted-foreground">"{v.change_note}"</p>}
              <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-x-auto max-h-24">
                {JSON.stringify(v.snapshot, null, 2).slice(0, 600)}
                {JSON.stringify(v.snapshot, null, 2).length > 600 ? "…" : ""}
              </pre>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}