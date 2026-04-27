import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Ticket, ArrowLeft, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Sweepstake {
  id: string;
  title: string;
  description: string | null;
  prize_value: number;
  draw_date: string;
  status: "open" | "closed" | "drawn" | "cancelled";
  drawn_ticket_number: string | null;
}

interface Ticket {
  id: string;
  ticket_number: string;
  source: string;
  is_winner: boolean;
  sweepstake_id: string;
  sweepstakes: { title: string; draw_date: string; status: string };
}

export default function Sweepstakes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sweepstakes, setSweepstakes] = useState<Sweepstake[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: sw }, { data: tk }] = await Promise.all([
          db.from("sweepstakes")
            .select("*")
            .order("draw_date", { ascending: false })
            .limit(6),
          db.from("sweepstake_tickets")
            .select("id, ticket_number, source, is_winner, sweepstake_id, sweepstakes(title, draw_date, status)")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        setSweepstakes((sw as any) ?? []);
        setTickets((tk as any) ?? []);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar sorteios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSweepstake = sweepstakes.find((s) => s.status === "open");
  const myTicketsForActive = activeSweepstake
    ? tickets.filter((t) => t.sweepstake_id === activeSweepstake.id)
    : [];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Sorteios Pingo Card</h1>
            <p className="text-sm text-muted-foreground">
              Cupons gerados automaticamente conforme seu plano. Confira os sorteios ativos e seus números.
            </p>
          </div>
        </div>

        {activeSweepstake ? (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {activeSweepstake.title}
                <Badge>Em aberto</Badge>
              </CardTitle>
              <CardDescription>
                {activeSweepstake.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Prêmio</p>
                  <p className="text-2xl font-bold text-amber-600">
                    R$ {Number(activeSweepstake.prize_value).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data do sorteio
                  </p>
                  <p className="text-base font-semibold">
                    {format(parseISO(activeSweepstake.draw_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">
                  Seus cupons ({myTicketsForActive.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {myTicketsForActive.length === 0 ? (
                    <p className="col-span-full text-xs text-muted-foreground italic">
                      Você ainda não tem cupons gerados para este sorteio.
                    </p>
                  ) : (
                    myTicketsForActive.map((t) => (
                      <div key={t.id} className="bg-background border rounded-md p-2 text-xs font-mono text-center">
                        <Ticket className="w-3 h-3 mx-auto mb-1 text-primary" />
                        {t.ticket_number}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhum sorteio ativo no momento</p>
            </CardContent>
          </Card>
        )}

        <h2 className="text-lg font-semibold mb-3">Sorteios anteriores</h2>
        <div className="space-y-3">
          {sweepstakes.filter((s) => s.id !== activeSweepstake?.id).map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(s.draw_date), "dd/MM/yyyy", { locale: ptBR })} —
                    Prêmio: R$ {Number(s.prize_value).toLocaleString("pt-BR")}
                  </p>
                  {s.drawn_ticket_number && (
                    <p className="text-xs mt-1">Número sorteado: <span className="font-mono">{s.drawn_ticket_number}</span></p>
                  )}
                </div>
                <Badge variant={s.status === "drawn" ? "default" : "secondary"}>
                  {s.status === "drawn" ? "Sorteado" : s.status === "closed" ? "Fechado" : s.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {sweepstakes.length <= 1 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sem sorteios anteriores ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
