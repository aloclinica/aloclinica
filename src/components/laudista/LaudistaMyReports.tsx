import { useState, useMemo } from "react";
import mascotReading from "@/assets/mascot-reading.png";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Eye, Download, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const PAGE_SIZE = 20;

const LaudistaMyReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "signed" | "draft">("all");
  const [page, setPage] = useState(0);

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await db
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["laudista-my-reports", doctorProfile?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("exam_reports")
        .select("*, exam_requests!inner(exam_type, priority, patient_name)")
        .eq("reporter_id", doctorProfile!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        created_at: string;
        signed_at: string | null;
        verification_code: string | null;
        pdf_url: string | null;
        exam_request_id: string;
        exam_requests: { exam_type: string; priority?: string; patient_name?: string | null } | null;
      }>;
    },
    enabled: !!doctorProfile?.id,
  });

  const filtered = useMemo(() => {
    if (!reports) return [];
    let result = reports;

    if (statusFilter === "signed") result = result.filter(r => r.signed_at);
    if (statusFilter === "draft") result = result.filter(r => !r.signed_at);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(r =>
        (r.exam_requests?.exam_type?.toLowerCase().includes(q)) ||
        (r.exam_requests?.patient_name?.toLowerCase().includes(q)) ||
        (r.verification_code?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [reports, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0); };
  const handleStatusChange = (v: string) => { setStatusFilter(v as "all" | "signed" | "draft"); setPage(0); };

  const signedCount = reports?.filter(r => r.signed_at).length ?? 0;
  const draftCount = reports?.filter(r => !r.signed_at).length ?? 0;

  return (
    <DashboardLayout nav={getLaudistaNav("my-reports")} title="Meus Laudos" role="laudista">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl space-y-4 pb-24 md:pb-8"
      >
        {/* Summary badges */}
        {!isLoading && reports && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3">
              <FileText className="w-3 h-3" /> {reports.length} laudos
            </Badge>
            <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1.5 py-1 px-3">
              {signedCount} assinados
            </Badge>
            {draftCount > 0 && (
              <Badge className="bg-warning/10 text-warning border-warning/20 text-xs gap-1.5 py-1 px-3">
                {draftCount} rascunhos
              </Badge>
            )}
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                Meus Laudos Emitidos
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exame, paciente..."
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="pl-8 h-8 w-48 text-xs"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="signed">Assinados</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <img
                  src={mascotReading}
                  alt="Pingo"
                  className="w-20 h-20 object-contain mx-auto mb-4 select-none"
                  style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,.15))" }}
                  loading="lazy"
                  decoding="async"
                  width={80}
                  height={80}
                />
                <p className="text-sm font-semibold text-foreground mb-1">
                  {search || statusFilter !== "all" ? "Nenhum resultado" : "Nenhum laudo emitido ainda"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search ? "Tente alterar os filtros de busca" : "Seus laudos aparecerão aqui após emissão"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exame</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageItems.map((report) => (
                        <TableRow key={report.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">
                            {report.exam_requests?.exam_type ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {report.exam_requests?.patient_name || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                report.signed_at
                                  ? "bg-success/10 text-success border-success/20 text-[10px]"
                                  : "bg-warning/10 text-warning border-warning/20 text-[10px]"
                              }
                            >
                              {report.signed_at ? "Assinado" : "Rascunho"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {format(new Date(report.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-[10px] font-mono text-muted-foreground">
                            {report.verification_code || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 rounded-lg"
                                onClick={() => navigate(`/dashboard/laudista/report-editor/${report.exam_request_id}?role=laudista`)}
                              >
                                <Eye className="w-3 h-3" /> Ver
                              </Button>
                              {report.pdf_url && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1"
                                  onClick={async () => {
                                    const { data } = await db.storage.from("prescriptions").createSignedUrl(report.pdf_url!, 3600);
                                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} · Página {page + 1} de {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaMyReports;
