import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Minimize2, FileText, Image, ArrowLeft, Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const OHIF_BASE = "http://72.62.138.208:3001";

const TelelaudoWorkspace = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const examId = searchParams.get("examId");
  const studyUid = searchParams.get("studyUid");

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ohifFullscreen, setOhifFullscreen] = useState(false);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      return;
    }
    const fetchExam = async () => {
      const { data } = await db
        .from("exam_requests")
        .select("*")
        .eq("id", examId)
        .single();
      setExam(data);
      setLoading(false);
    };
    fetchExam();
  }, [examId]);

  const effectiveStudyUid = studyUid || exam?.orthanc_study_uid;
  const ohifUrl = effectiveStudyUid
    ? `${OHIF_BASE}/viewer?StudyInstanceUIDs=${effectiveStudyUid}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Workspace Telelaudo | AloClínica" description="Visualize imagens DICOM e elabore laudos médicos." />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Workspace Telelaudo</h1>
              {exam && (
                <p className="text-xs text-muted-foreground">
                  {exam.exam_type} — {exam.patient_name || "Paciente"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {exam && (
              <Badge variant={exam.priority === "urgent" ? "destructive" : "secondary"}>
                {exam.priority === "urgent" ? "URGENTE" : exam.status}
              </Badge>
            )}
            {effectiveStudyUid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOhifFullscreen(!ohifFullscreen)}
                className="gap-1"
              >
                {ohifFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {ohifFullscreen ? "Dividir" : "Tela cheia"}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* OHIF Viewer Panel */}
          <div className={`${ohifFullscreen ? "w-full" : "w-1/2"} border-r border-border flex flex-col transition-all duration-300`}>
            {ohifUrl ? (
              <iframe
                src={ohifUrl}
                className="flex-1 w-full h-full border-0"
                title="OHIF DICOM Viewer"
                allow="fullscreen"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/30">
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhuma imagem DICOM disponível</p>
                  <p className="text-xs text-muted-foreground/70 max-w-xs">
                    Este exame não possui StudyInstanceUID vinculado ao PACS.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Editor Panel */}
          {!ohifFullscreen && (
            <div className="w-1/2 flex flex-col overflow-auto">
              <Card className="m-4 flex-1 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Laudo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exam ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Paciente:</span>
                          <p className="font-medium text-foreground">{exam.patient_name || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium text-foreground">{exam.exam_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Info Clínica:</span>
                          <p className="font-medium text-foreground">{exam.clinical_info || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prioridade:</span>
                          <p className="font-medium text-foreground">{exam.priority}</p>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/dashboard/laudista/report-editor/${examId}?role=doctor`)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Abrir Editor de Laudo
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Nenhum exame selecionado.</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/laudista/queue?role=doctor")}>
                        Ir para Fila de Laudos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TelelaudoWorkspace;
