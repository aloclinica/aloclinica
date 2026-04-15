import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import {
  fetchExamesParaLaudar,
  fetchExamesConcluidos,
  fetchNomesPacientes,
  assumirExame,
  buildOhifUrl,
  type AlocExame,
} from "@/lib/services/laudos-service";
import { getOHIFUrl } from "@/lib/orthanc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, ExternalLink, Play, CheckCircle, Clock, Loader2, Image } from "lucide-react";

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  badge: string;
  items: AlocExame[];
  userId: string;
  onIniciar?: (exame: AlocExame) => void;
  loading?: boolean;
}

function KanbanColumn({ title, icon, badge, items, userId, onIniciar, loading }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
        <Badge variant="secondary" className="ml-auto text-xs">
          {items.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1 min-h-[200px]">
        {loading && [1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}

        {!loading && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
            Nenhum exame
          </div>
        )}

        {!loading && items.map((exame) => (
          <ExameCard
            key={exame.id}
            exame={exame}
            userId={userId}
            onIniciar={onIniciar}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Exame Card ───────────────────────────────────────────────────────────────

interface ExameCardProps {
  exame: AlocExame;
  userId: string;
  onIniciar?: (exame: AlocExame) => void;
}

function ExameCard({ exame, userId, onIniciar }: ExameCardProps) {
  const navigate = useNavigate();
  const [iniciando, setIniciando] = useState(false);
  const isMinhaFila = exame.laudista_id === userId;

  const handleIniciar = async () => {
    if (!onIniciar) return;
    setIniciando(true);
    try {
      await onIniciar(exame);
    } finally {
      setIniciando(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Patient + exam type */}
        <div>
          <p className="font-medium text-foreground text-sm truncate">
            {exame.paciente_nome || "Paciente"}
          </p>
          <p className="text-xs text-muted-foreground">{exame.tipo_exame}</p>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          Solicitado: {new Date(exame.created_at).toLocaleDateString("pt-BR")}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {exame.status === "aguardando" && onIniciar && (
            <Button size="sm" className="text-xs" onClick={handleIniciar} disabled={iniciando}>
              {iniciando ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
              Iniciar Laudo
            </Button>
          )}

          {exame.status === "em_laudo" && isMinhaFila && (
            <Button size="sm" className="text-xs" onClick={() => navigate(`/laudos/editor/${exame.id}`)}>
              <FileText className="h-3 w-3 mr-1" /> Continuar
            </Button>
          )}

          {exame.orthanc_study_uid && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => window.open(buildOhifUrl(exame.orthanc_study_uid!), "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Abrir Imagem
            </Button>
          )}

          {/* For exames from clinic upload (arquivo_url without orthanc) */}
          {(exame as any).arquivo_url && !exame.orthanc_study_uid && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => window.open((exame as any).arquivo_url, "_blank")}
            >
              <Image className="h-3 w-3 mr-1" /> Ver Arquivo
            </Button>
          )}

          {/* Origin badge */}
          {(exame as any).origem && (
            <Badge variant="outline" className="text-xs">
              {(exame as any).origem === "dicom" ? "DICOM" : "PDF/Imagem"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FilaLaudos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aguardando, setAguardando] = useState<AlocExame[]>([]);
  const [emLaudo, setEmLaudo] = useState<AlocExame[]>([]);
  const [concluidos, setConcluidos] = useState<AlocExame[]>([]);
  const [loading, setLoading] = useState(true);

  const enrichWithNames = useCallback(async (exames: AlocExame[]) => {
    const ids = exames.map((e) => e.paciente_id).filter(Boolean) as string[];
    const names = await fetchNomesPacientes([...new Set(ids)]);
    return exames.map((e) => ({
      ...e,
      paciente_nome: e.paciente_id ? names[e.paciente_id] : undefined,
    }));
  }, []);

  const loadData = useCallback(async () => {
    try {
      // Fetch from aloc_exames (legacy)
      const [ativos, feitos] = await Promise.all([
        fetchExamesParaLaudar(),
        fetchExamesConcluidos(),
      ]);

      // Also fetch from exames table (clinic uploads)
      const { data: clinicExames } = await (db as any)
        .from("exames")
        .select("id, paciente_nome, tipo_exame, status, orthanc_study_uid, arquivo_url, origem, laudista_id, created_at")
        .in("status", ["pendente", "em_laudo", "concluido"])
        .order("created_at", { ascending: true });

      // Map clinic exames to AlocExame-compatible shape
      const mappedClinic = (clinicExames ?? []).map((e: any) => ({
        id: e.id,
        paciente_id: null,
        medico_solicitante_id: null,
        laudista_id: e.laudista_id,
        tipo_exame: e.tipo_exame,
        status: e.status === "pendente" ? "aguardando" : e.status,
        orthanc_study_uid: e.orthanc_study_uid,
        orthanc_study_url: null,
        created_at: e.created_at,
        paciente_nome: e.paciente_nome,
        arquivo_url: e.arquivo_url,
        origem: e.origem,
      }));

      const all = [...ativos, ...feitos, ...mappedClinic];
      const enriched = await enrichWithNames(all);

      setAguardando(enriched.filter((e) => e.status === "aguardando"));
      setEmLaudo(enriched.filter((e) => e.status === "em_laudo"));
      setConcluidos(enriched.filter((e) => e.status === "concluido"));
    } catch {
      toast.error("Erro ao carregar fila de laudos");
    } finally {
      setLoading(false);
    }
  }, [enrichWithNames]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = db
      .channel("aloc_exames_realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "aloc_exames" },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [loadData]);

  const handleIniciar = async (exame: AlocExame) => {
    if (!user) return;
    try {
      await assumirExame(exame.id, user.id);
      toast.success("Exame atribuído! Redirecionando...");
      navigate(`/laudos/editor/${exame.id}`);
    } catch {
      toast.error("Erro ao iniciar laudo");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Fila de Laudos</h1>
      </div>

      {/* Kanban board */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 overflow-x-auto pb-4">
        <KanbanColumn
          title="Aguardando"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          badge="aguardando"
          items={aguardando}
          userId={user?.id ?? ""}
          onIniciar={handleIniciar}
          loading={loading}
        />
        <KanbanColumn
          title="Em Laudo"
          icon={<Loader2 className="h-4 w-4 text-primary" />}
          badge="em_laudo"
          items={emLaudo}
          userId={user?.id ?? ""}
          loading={loading}
        />
        <KanbanColumn
          title="Concluídos (7 dias)"
          icon={<CheckCircle className="h-4 w-4 text-primary" />}
          badge="concluido"
          items={concluidos}
          userId={user?.id ?? ""}
          loading={loading}
        />
      </div>
    </div>
  );
}
