/**
 * Hook para gerenciar cartões salvos (vault PagBank).
 *
 * Funcionalidades:
 *   - list(): lista cartões ativos do usuário
 *   - addCard(form): tokeniza no PagBank + salva localmente via pagbank-save-card
 *   - remove(cardId): soft-delete (status=removed)
 *   - setDefault(cardId): marca como default
 */
import { useEffect, useState, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { warn } from "@/lib/logger";

export type SavedCard = {
  id: string;
  pagbank_card_id: string;
  last4: string;
  brand: string;
  holder_name: string;
  expiry_month: string;
  expiry_year: string;
  is_default: boolean;
  status: "active" | "expired" | "removed";
  created_at: string;
};

export type AddCardInput = {
  holder: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault?: boolean;
};

export function useSavedCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const list = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (db as any)
      .from("saved_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) warn("[useSavedCards] list error", error);
    setCards((data ?? []) as SavedCard[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { list(); }, [list]);

  const addCard = useCallback(async (input: AddCardInput): Promise<SavedCard | null> => {
    if (!user) {
      toast.error("Faça login");
      return null;
    }
    setAdding(true);
    try {
      const { data, error } = await db.functions.invoke("pagbank-save-card", {
        body: input,
      });
      if (error || !data?.ok) {
        const msg = (data as any)?.error || error?.message || "Erro ao salvar cartão";
        toast.error("Não foi possível salvar o cartão", { description: msg });
        return null;
      }
      toast.success("Cartão salvo!", {
        description: `${data.card.brand} •••• ${data.card.last4}`,
      });
      await list();
      return data.card as SavedCard;
    } catch (e) {
      warn("[useSavedCards] addCard error", e);
      toast.error("Erro inesperado");
      return null;
    } finally {
      setAdding(false);
    }
  }, [user, list]);

  const remove = useCallback(async (cardId: string) => {
    const { error } = await (db as any)
      .from("saved_cards")
      .update({ status: "removed", removed_at: new Date().toISOString() })
      .eq("id", cardId);
    if (error) {
      toast.error("Erro ao remover", { description: error.message });
      return false;
    }
    toast.success("Cartão removido");
    await list();
    return true;
  }, [list]);

  const setDefault = useCallback(async (cardId: string) => {
    if (!user) return false;
    // Desmarcar todos
    await (db as any).from("saved_cards").update({ is_default: false }).eq("user_id", user.id);
    // Marcar o escolhido
    const { error } = await (db as any).from("saved_cards").update({ is_default: true }).eq("id", cardId);
    if (error) {
      toast.error("Erro", { description: error.message });
      return false;
    }
    await list();
    return true;
  }, [user, list]);

  return { cards, loading, adding, list, addCard, remove, setDefault };
}
