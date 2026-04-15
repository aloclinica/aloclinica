import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Plus, Search, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getOHIFUrl } from "@/lib/orthanc";

interface Exame {
  id: string;
  paciente_nome: string;
  tipo_exame: string;
  status: string;
  origem: string;
  arquivo_url: string | null;
  orthanc_study_uid: string | null;
  pdf_url: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pendente: { label: "Aguardando", variant: "secondary" },
  em_laudo: { label: "Em Laudo", variant: "default" },
  concluido: { label: "Concluído", variant: "outline" },
};

export default function ClinicaExamesPage() {
  const { user } = useAuth();
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadExames = useCallback(async () => {
    if (!user) return;
    try {
      let query = (db as any)
        .from("exames")
        .select("id, paciente_nome, tipo_exame, status, origem, arquivo_url, orthanc_study_uid, pdf_url, created_at")
        .eq("clinica_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setExames(data ?? []);
    } catch {
      toast.error("Erro ao carregar exames");
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => { loadExames(); }, [loadExames]);

  const filtered = exames.filter((e) =>
    e.paciente_nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Meus Exames</h1>
        </div>
        <Link to="/clinica/enviar-exame">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Enviar Exame
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Aguardando</SelectItem>
            <SelectItem value="em_laudo">Em Laudo</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum exame encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exame) => {
            const st = STATUS_MAP[exame.status] ?? STATUS_MAP.pendente;
            return (
              <Card key={exame.id}>
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{exame.paciente_nome}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{exame.tipo_exame}</span>
                      <span>•</span>
                      <span>{new Date(exame.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {exame.status === "concluido" && exame.pdf_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(exame.pdf_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Ver Laudo
                      </Button>
                    )}
                    {exame.orthanc_study_uid && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getOHIFUrl(exame.orthanc_study_uid!), "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> DICOM
                      </Button>
                    )}
                    {exame.arquivo_url && !exame.orthanc_study_uid && (
                      <Button size="sm" variant="outline" onClick={() => window.open(exame.arquivo_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> Arquivo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
