import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Eye,
  FileImage,
  FileText,
  FolderLock,
  Paperclip,
  Pill,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const PatientExamUpload = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("exam");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    const { data } = await db.from("patient_documents")
      .select("*")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "O tamanho maximo e 10MB." });
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await db.storage
      .from("patient-documents")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro no upload", { description: uploadError.message });
      setUploading(false);
      return;
    }

    const { error: dbError } = await db.from("patient_documents").insert({
      patient_id: user.id,
      uploaded_by: user.id,
      file_name: file.name,
      file_url: filePath,
      file_type: file.type,
      file_size: file.size,
      description: description || file.name,
      category,
    });

    if (dbError) {
      toast.error("Erro ao salvar", { description: dbError.message });
    } else {
      toast.success("Documento enviado");
      setDescription("");
      setCategory("exam");
      fetchDocuments();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const viewDocument = async (doc: { file_url: string }) => {
    const { data } = await db.storage.from("patient-documents").createSignedUrl(doc.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Erro ao abrir documento");
  };

  const deleteDocument = async (doc: { id: string; file_url: string }) => {
    await db.storage.from("patient-documents").remove([doc.file_url]);
    await db.from("patient_documents").delete().eq("id", doc.id);
    toast.success("Documento removido");
    fetchDocuments();
  };

  const CategoryIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "exam":
        return <FileImage className="h-5 w-5" />;
      case "prescription":
        return <Pill className="h-5 w-5" />;
      case "certificate":
        return <ClipboardList className="h-5 w-5" />;
      case "history":
        return <FolderLock className="h-5 w-5" />;
      default:
        return <Paperclip className="h-5 w-5" />;
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case "exam": return "Exame";
      case "prescription": return "Receita";
      case "certificate": return "Atestado";
      case "history": return "Historico";
      default: return "Outro";
    }
  };

  const filteredDocs = documents.filter(d => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (searchQuery && !(d.description || d.file_name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("documents")}>
      <div className="w-full mx-auto max-w-5xl pb-24 md:pb-6">
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#eef7ff_0%,#ffffff_52%,#f8fff6_100%)] p-5 shadow-[0_24px_70px_-46px_rgba(15,42,90,.68)] md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-400/16 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-16 h-40 w-40 rounded-full bg-emerald-300/14 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
                <FolderLock className="h-6 w-6 text-[hsl(var(--p-primary))]" />
              </div>
              <div>
                <div className="mb-1 inline-flex items-center rounded-full border border-primary/15 bg-white/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                  Documentos seguros
                </div>
                <h1 className="font-[Manrope] text-2xl font-black text-foreground">Cofre de Documentos</h1>
                <p className="text-sm text-muted-foreground">Guarde exames, receitas e documentos medicos em um so lugar.</p>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/65 bg-white/75 p-3 text-center shadow-sm sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Arquivos</p>
              <p className="mt-1 text-lg font-black text-foreground">{documents.length}</p>
            </div>
          </div>
        </section>

        <Card className="mb-6 overflow-hidden rounded-[30px] border border-dashed border-[hsl(var(--p-primary))]/25 bg-card/95 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="mb-1 text-sm font-black text-foreground">Enviar novo documento</p>
              <p className="mb-4 text-xs text-muted-foreground">PDF, imagens JPG e PNG, ate 10MB.</p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Input
                  placeholder="Descricao (ex: Hemograma completo)"
                  aria-label="Descricao do documento"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="h-11 max-w-xs rounded-2xl border-border/40 bg-muted/35"
                />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 w-[160px] rounded-2xl" aria-label="Categoria do documento"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Exame</SelectItem>
                    <SelectItem value="prescription">Receita</SelectItem>
                    <SelectItem value="certificate">Atestado</SelectItem>
                    <SelectItem value="history">Historico</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
                <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-11 rounded-full bg-[hsl(var(--p-primary))] px-5 font-bold text-white shadow-[var(--p-shadow-btn)]">
                  <Plus className="mr-1 h-4 w-4" /> {uploading ? "Enviando..." : "Escolher Arquivo"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-border/45 bg-card/90 p-2 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar documentos..." aria-label="Buscar documentos" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-11 rounded-2xl border-transparent bg-muted/35 pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-11 w-full rounded-2xl sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({documents.length})</SelectItem>
              <SelectItem value="exam">Exames</SelectItem>
              <SelectItem value="prescription">Receitas</SelectItem>
              <SelectItem value="certificate">Atestados</SelectItem>
              <SelectItem value="history">Historico</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <div className="shimmer-v2 inline-block h-5 w-32 rounded" aria-label="Carregando" /> : (
          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="relative overflow-hidden rounded-[28px] border border-dashed border-border/45 bg-card px-5 py-12 text-center shadow-sm">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-20 rounded-full bg-primary/10 blur-3xl" />
                <FileText className="relative mx-auto mb-3 h-12 w-12 text-primary/45" />
                <p className="relative mb-1 text-sm font-black text-foreground">Nenhum exame enviado ainda</p>
                <p className="relative text-xs text-muted-foreground">Envie seus exames usando o botao acima.</p>
              </div>
            ) : filteredDocs.map(d => (
              <div key={d.id} className="card-interactive flex items-center gap-4 rounded-[26px] border border-border/35 bg-card/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--p-shadow-card)]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CategoryIcon type={d.category || "exam"} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{d.description || d.file_name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{categoryLabel(d.category || "exam")}</Badge>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    <span className="text-[10px] text-muted-foreground">{formatSize(d.file_size || 0)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="outline" className="h-9 rounded-full text-xs" onClick={() => viewDocument(d)}>
                    <Eye className="mr-1 h-3 w-3" /> Ver
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Excluir documento" className="h-9 w-9 rounded-full p-0 text-destructive" onClick={() => deleteDocument(d)}>
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientExamUpload;
