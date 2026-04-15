import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  fetchExamePorId,
  fetchLaudoPorExame,
  criarLaudo,
  salvarLaudo,
  assinarLaudo,
  fetchNomesPacientes,
  buildOhifUrl,
  type AlocExame,
  type AlocLaudo,
} from "@/lib/services/laudos-service";
import { db } from "@/integrations/supabase/untyped";
import { criarDocumentoParaAssinar, enviarParaAssinatura } from "@/lib/docuseal";
import DocuSealSigningModal from "@/components/laudos/DocuSealSigningModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Save,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Maximize,
  Minimize,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

// TipTap imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table as TipTapTable } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

// ─── TipTap Toolbar ───────────────────────────────────────────────────────────

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-accent"
    }`;

  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-muted/30 rounded-t-lg">
      <button className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </button>
      <button className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </button>
      <button className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </button>
      <span className="w-px bg-border mx-1" />
      <button className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </button>
      <button className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </button>
      <button className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </button>
      <span className="w-px bg-border mx-1" />
      <button className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • Lista
      </button>
      <button className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. Lista
      </button>
      <span className="w-px bg-border mx-1" />
      <button
        className={btn(false)}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        Tabela
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditorLaudoCompleto() {
  const { exameId } = useParams<{ exameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [exame, setExame] = useState<AlocExame | null>(null);
  const [laudo, setLaudo] = useState<AlocLaudo | null>(null);
  const [pacienteNome, setPacienteNome] = useState("Paciente");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [docuSealOpen, setDocuSealOpen] = useState(false);
  const [docuSealUrl, setDocuSealUrl] = useState("");
  const [docuSealSubId, setDocuSealSubId] = useState(0);
  const [medicoEmail, setMedicoEmail] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TipTapTable.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  // Load data + fetch medico email
  useEffect(() => {
    if (!exameId || !user) return;
    (async () => {
      try {
        const e = await fetchExamePorId(exameId);
        if (!e) { toast.error("Exame não encontrado"); navigate("/laudos/fila"); return; }
        setExame(e);

        // Fetch patient name
        if (e.paciente_id) {
          const names = await fetchNomesPacientes([e.paciente_id]);
          setPacienteNome(names[e.paciente_id] || "Paciente");
        }

        // Fetch medico email
        const { data: { user: authUser } } = await db.auth.getUser();
        if (authUser?.email) setMedicoEmail(authUser.email);

        // Fetch or create laudo
        let l = await fetchLaudoPorExame(exameId);
        if (!l) l = await criarLaudo(exameId, user.id);
        setLaudo(l);
        if (l.conteudo_html && editor) {
          editor.commands.setContent(l.conteudo_html);
        }
      } catch {
        toast.error("Erro ao carregar exame");
      } finally {
        setLoading(false);
      }
    })();
  }, [exameId, user, navigate, editor]);

  // Set editor content when laudo loads after editor is ready
  useEffect(() => {
    if (laudo?.conteudo_html && editor && !editor.isDestroyed) {
      editor.commands.setContent(laudo.conteudo_html);
    }
  }, [laudo, editor]);

  // Generate PDF from laudo HTML
  const generateLaudoPdf = useCallback((html: string): string => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("LAUDO MÉDICO", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Paciente: ${pacienteNome}`, 20, 35);
    doc.text(`Exame: ${exame?.tipo_exame || ""}`, 20, 42);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 49);
    doc.line(20, 54, 190, 54);

    // Strip HTML tags for plain text rendering
    const plainText = html.replace(/<[^>]+>/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    const lines = doc.splitTextToSize(plainText, 170);
    doc.setFontSize(11);
    doc.text(lines, 20, 62);

    // Return as base64 (without data:... prefix)
    return doc.output("datauristring").split(",")[1];
  }, [pacienteNome, exame]);

  const handleSave = useCallback(async () => {
    if (!laudo || !editor) return;
    setSaving(true);
    try {
      await salvarLaudo(laudo.id, editor.getHTML());
      toast.success("Rascunho salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [laudo, editor]);

  const handleSign = useCallback(async () => {
    if (!laudo || !exame || !editor) return;
    const html = editor.getHTML();
    if (!html.trim() || html === "<p></p>") {
      toast.error("O laudo não pode estar vazio");
      return;
    }
    setSigning(true);
    setShowSignDialog(false);
    try {
      // 1. Save draft
      await salvarLaudo(laudo.id, html);

      // 2. Generate PDF
      const pdfBase64 = generateLaudoPdf(html);
      const nomeDoc = `Laudo_${exame.tipo_exame}_${new Date().toISOString().slice(0, 10)}`;

      // 3. Create template in DocuSeal
      toast.info("Preparando documento para assinatura…");
      const templateId = await criarDocumentoParaAssinar(pdfBase64, nomeDoc);

      // 4. Create submission
      const { submission_id, signing_url } = await enviarParaAssinatura(
        templateId,
        medicoEmail || "medico@allomedico.com",
        pacienteNome,
      );

      // 5. Open signing modal
      setDocuSealSubId(submission_id);
      setDocuSealUrl(signing_url);
      setDocuSealOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao preparar assinatura");
    } finally {
      setSigning(false);
    }
  }, [laudo, exame, editor, generateLaudoPdf, medicoEmail, pacienteNome]);

  // DocuSeal signing completed callback
  const handleDocuSealSigned = useCallback(async (documents: Array<{ url: string; filename: string }>) => {
    setDocuSealOpen(false);
    if (!laudo || !exame) return;

    try {
      toast.info("Salvando documento assinado…");

      // Download signed PDF and upload to Supabase Storage
      if (documents.length > 0) {
        const signedPdfUrl = documents[0].url;
        const response = await fetch(signedPdfUrl);
        const blob = await response.blob();
        const filePath = `${exame.id}/${laudo.id}_assinado.pdf`;

        await db.storage.from("laudos-assinados").upload(filePath, blob, {
          contentType: "application/pdf",
          upsert: true,
        });

        const { data: publicUrl } = db.storage.from("laudos-assinados").getPublicUrl(filePath);

        // Update laudo record
        await db.from("aloc_laudos").update({
          status: "assinado",
          pdf_url: publicUrl.publicUrl,
          assinado_em: new Date().toISOString(),
        }).eq("id", laudo.id);

        // Update exame status
        await db.from("aloc_exames").update({
          status: "concluido",
        }).eq("id", exame.id);

        // WhatsApp: notify patient that laudo is available
        if (exame.paciente_id) {
          db.functions.invoke("whatsapp-notify", {
            body: {
              tipo: "laudo_disponivel",
              user_id: exame.paciente_id,
              dados: {
                nome_medico: medicoEmail,
                laudo_url: publicUrl.publicUrl,
              },
            },
          }).catch(() => {});
        }
      } else {
        // Fallback: use the original sign flow
        await assinarLaudo(laudo.id, exame.id);
      }

      toast.success("Laudo assinado com sucesso!");
      navigate("/laudos/fila");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao finalizar assinatura");
    }
  }, [laudo, exame, navigate]);

  const handleSuggestAI = useCallback(async () => {
    if (!exame || !editor) return;
    setSuggesting(true);
    try {
      const { data, error } = await db.functions.invoke("sugerir-laudo", {
        body: { tipo_exame: exame.tipo_exame },
      });
      if (error) throw error;
      if (data?.sugestao) {
        editor.commands.setContent(data.sugestao);
        toast.success("Sugestão de IA aplicada!");
      } else {
        toast.error("IA não retornou sugestão");
      }
    } catch (err: any) {
      const msg = err?.message || "Erro ao gerar sugestão";
      toast.error(msg);
    } finally {
      setSuggesting(false);
    }
  }, [exame, editor]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!exame || !laudo) return null;

  const isReadOnly = laudo.status === "assinado" || laudo.status === "entregue";
  const ohifUrl = exame.orthanc_study_uid ? buildOhifUrl(exame.orthanc_study_uid) : null;

  // ─── OHIF Viewer Panel ──────────────────────────────────────────────────────
  const ViewerPanel = (
    <div className={`relative ${fullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"}`}>
      {ohifUrl ? (
        <>
          <iframe
            src={ohifUrl}
            className="w-full h-full min-h-[500px] border-0 rounded-lg"
            title="OHIF Viewer"
            allow="fullscreen"
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 z-10"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground gap-3">
          <ImageIcon className="h-12 w-12" />
          <p className="text-sm">Nenhuma imagem DICOM vinculada</p>
          {exame.orthanc_study_uid && (
            <a href={ohifUrl!} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
              <ExternalLink className="h-3 w-3 inline mr-1" /> Abrir externamente
            </a>
          )}
        </div>
      )}
    </div>
  );

  // ─── Editor Panel ───────────────────────────────────────────────────────────
  const EditorPanel = (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <Card className="mb-3">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Paciente: </span>
              <span className="font-medium text-foreground">{pacienteNome}</span>
            </div>
            <span className="text-border">|</span>
            <div>
              <span className="text-muted-foreground">Exame: </span>
              <span className="font-medium text-foreground">{exame.tipo_exame}</span>
            </div>
            <span className="text-border">|</span>
            <div>
              <span className="text-muted-foreground">Data: </span>
              <span className="font-medium text-foreground">
                {new Date(exame.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <Badge variant={isReadOnly ? "default" : "secondary"} className="ml-auto">
              {laudo.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggest */}
      {!isReadOnly && (
        <Button
          variant="outline"
          className="mb-3 self-start"
          onClick={handleSuggestAI}
          disabled={suggesting}
        >
          {suggesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {suggesting ? "Gerando sugestão…" : "Sugerir com IA"}
        </Button>
      )}

      {/* TipTap Editor */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-2 px-4 border-b border-border">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Conteúdo do Laudo
          </CardTitle>
        </CardHeader>
        {!isReadOnly && <EditorToolbar editor={editor} />}
        <CardContent className="flex-1 overflow-auto p-0">
          <EditorContent editor={editor} className="h-full" />
        </CardContent>
      </Card>

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex gap-2 justify-end mt-3">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Salvando…" : "Salvar Rascunho"}
          </Button>
          <Button onClick={() => setShowSignDialog(true)} disabled={signing}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Assinar e Finalizar
          </Button>
        </div>
      )}

      {isReadOnly && laudo.qr_token && (
        <p className="text-xs text-muted-foreground mt-2">
          QR Token: <code className="bg-muted px-1 rounded">{laudo.qr_token}</code>
        </p>
      )}
    </div>
  );

  // ─── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/laudos/fila")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground truncate">
          Laudo — {exame.tipo_exame}
        </h1>
        {ohifUrl && (
          <a
            href={ohifUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> OHIF
          </a>
        )}
      </div>

      {/* Content — tabs on mobile, split on desktop */}
      {isMobile ? (
        <Tabs defaultValue="editor" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="viewer">Imagens</TabsTrigger>
            <TabsTrigger value="editor">Laudo</TabsTrigger>
          </TabsList>
          <TabsContent value="viewer" className="flex-1">
            {ViewerPanel}
          </TabsContent>
          <TabsContent value="editor" className="flex-1">
            {EditorPanel}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <div className="overflow-hidden rounded-lg border border-border">
            {ViewerPanel}
          </div>
          <div className="overflow-auto">
            {EditorPanel}
          </div>
        </div>
      )}

      {/* Sign confirmation dialog */}
      <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assinar e Finalizar Laudo</AlertDialogTitle>
            <AlertDialogDescription>
              Após a assinatura, o laudo não poderá mais ser editado e ficará disponível para o paciente e médico solicitante. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSign} disabled={signing}>
              {signing ? "Assinando…" : "Confirmar Assinatura"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DocuSeal Signing Modal */}
      <DocuSealSigningModal
        open={docuSealOpen}
        signingUrl={docuSealUrl}
        submissionId={docuSealSubId}
        onSigned={handleDocuSealSigned}
        onCancel={() => setDocuSealOpen(false)}
      />
    </div>
  );
}
