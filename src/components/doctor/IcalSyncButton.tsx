/**
 * Botão "Sincronizar com calendário" — gera/copia URL do feed iCal do médico.
 * O usuário cola no Google Calendar (+) "From URL" ou no Apple Calendar
 * ("New Calendar Subscription"). Atualização automática a cada poucas horas.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarPlus, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { SUPABASE_FUNCTIONS_URL } from "@/lib/supabase-config";

const FEED_BASE = `${SUPABASE_FUNCTIONS_URL}/doctor-ical-feed`;

export default function IcalSyncButton() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    (async () => {
      const { data } = await db.from("doctor_profiles").select("ical_token").eq("user_id", user.id).maybeSingle();
      setToken((data as any)?.ical_token ?? null);
    })();
  }, [user?.id, open]);

  const ensureToken = async () => {
    if (!user) return null;
    if (token) return token;
    setBusy(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await db.from("doctor_profiles").update({ ical_token: newToken } as any).eq("user_id", user.id);
      if (error) throw error;
      setToken(newToken);
      return newToken;
    } catch (e: any) {
      logError("IcalSyncButton ensureToken", e);
      toast.error("Não foi possível gerar o link", { description: e?.message });
      return null;
    } finally { setBusy(false); }
  };

  const rotate = async () => {
    if (!user) return;
    if (!confirm("Gerar um novo link invalida o anterior. Você precisará atualizar no Google/Apple Calendar. Continuar?")) return;
    setBusy(true);
    try {
      const newToken = crypto.randomUUID();
      const { error } = await db.from("doctor_profiles").update({ ical_token: newToken } as any).eq("user_id", user.id);
      if (error) throw error;
      setToken(newToken);
      toast.success("Link regenerado");
    } catch (e: any) {
      toast.error("Erro", { description: e?.message });
    } finally { setBusy(false); }
  };

  const url = token ? `${FEED_BASE}?token=${token}` : "";

  const copy = async () => {
    let u = url;
    if (!u) { const t = await ensureToken(); if (!t) return; u = `${FEED_BASE}?token=${t}`; }
    try { await navigator.clipboard.writeText(u); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Link copiado"); } catch { /* */ }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" aria-label="Sincronizar com calendário externo">
          <CalendarPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sincronizar</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar com Google / Apple Calendar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use o link abaixo para assinar sua agenda em qualquer app de calendário.
            Atualização automática a cada poucas horas.
          </p>
          <div className="flex gap-2">
            <Input value={url || "(clique em Gerar para criar o link)"} readOnly className="text-xs" />
            <Button onClick={copy} disabled={busy} variant="default" size="icon" aria-label="Copiar link">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {token && (
            <Button variant="ghost" size="sm" onClick={rotate} disabled={busy} className="gap-1.5 h-8 text-xs">
              <RefreshCw className="w-3 h-3" /> Gerar novo link (invalida o anterior)
            </Button>
          )}
          <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t border-border/40">
            <p className="font-semibold text-foreground">Como assinar:</p>
            <p><strong>Google Calendar</strong>: clique em "+" ao lado de "Outras agendas" → "Por URL" → cole o link.</p>
            <p><strong>Apple Calendar</strong> (Mac/iPhone): Arquivo → Nova assinatura de calendário → cole o link.</p>
            <p><strong>Outlook</strong>: Calendário → Adicionar calendário → Assinar da web → cole o link.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
