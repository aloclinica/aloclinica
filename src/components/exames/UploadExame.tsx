import { useState, useCallback, useRef } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDICOM } from "@/lib/orthanc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, FileImage, FileText, Loader2 } from "lucide-react";
import { logError } from "@/lib/logger";

const TIPOS_EXAME = ["Raio-X", "Tomografia", "Ressonância", "Ultrassom", "Eletrocardiograma", "Outro"];
const ACCEPTED_EXTENSIONS = ".dcm,.dicom,.pdf,.jpg,.jpeg,.png";
const DICOM_EXTS = [".dcm", ".dicom"];

interface PatientResult {
  user_id: string;
  first_name: string;
  last_name: string;
  cpf: string | null;
}

interface UploadExameProps {
  onSuccess?: () => void;
}

export default function UploadExame({ onSuccess }: UploadExameProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [tipoExame, setTipoExame] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pacienteSearch, setPacienteSearch] = useState("");
  const [pacientes, setPacientes] = useState<PatientResult[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<PatientResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Search patients
  const searchPacientes = useCallback(async (query: string) => {
    if (query.length < 2) { setPacientes([]); return; }
    setSearching(true);
    try {
      const cleanQ = query.replace(/[.\-/]/g, "");
      const { data } = await db
        .from("profiles")
        .select("user_id, first_name, last_name, cpf")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,cpf.ilike.%${cleanQ}%`)
        .limit(10);
      setPacientes((data as PatientResult[]) ?? []);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setPacienteSearch(val);
    searchPacientes(val);
  };

  const isDicom = (file: File) => DICOM_EXTS.some((ext) => file.name.toLowerCase().endsWith(ext));

  const addFiles = (newFiles: FileList | File[]) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!user || !tipoExame || files.length === 0) {
      toast.error("Preencha tipo de exame e selecione pelo menos um arquivo.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const totalFiles = files.length;
      let completed = 0;

      for (const file of files) {
        let arquivoUrl: string | null = null;
        let orthancStudyUid: string | null = null;
        let origem = "upload";

        if (isDicom(file)) {
          // Upload DICOM via proxy
          origem = "dicom";
          orthancStudyUid = await uploadDICOM(file);
        } else {
          // Upload to Supabase Storage
          origem = "storage";
          const filePath = `${user.id}/${Date.now()}_${file.name}`;
          const { error: upErr } = await db.storage.from("exames").upload(filePath, file);
          if (upErr) throw upErr;
          const { data: urlData } = db.storage.from("exames").getPublicUrl(filePath);
          arquivoUrl = urlData.publicUrl;
        }

        // Insert into exames table
        const { error: insertErr } = await (db as any).from("exames").insert({
          clinica_id: user.id,
          paciente_id: selectedPaciente?.user_id ?? null,
          paciente_nome: selectedPaciente
            ? `${selectedPaciente.first_name} ${selectedPaciente.last_name}`.trim()
            : "Paciente não identificado",
          tipo_exame: tipoExame,
          origem,
          orthanc_study_uid: orthancStudyUid,
          arquivo_url: arquivoUrl,
          observacoes: observacoes || null,
          status: "pendente",
        });
        if (insertErr) throw insertErr;

        completed++;
        setProgress(Math.round((completed / totalFiles) * 100));
      }

      // Notify available laudistas
      try {
        await db.functions.invoke("whatsapp-notify", {
          body: {
            tipo: "nova_consulta",
            user_id: user.id,
            dados: {
              nome_paciente: selectedPaciente
                ? `${selectedPaciente.first_name} ${selectedPaciente.last_name}`.trim()
                : "Paciente",
              data: new Date().toLocaleDateString("pt-BR"),
              hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            },
          },
        });
      } catch {
        // Non-blocking notification
      }

      toast.success("Exame(s) enviado(s) com sucesso! O laudista será notificado.");
      setFiles([]);
      setTipoExame("");
      setObservacoes("");
      setSelectedPaciente(null);
      setPacienteSearch("");
      setProgress(0);
      onSuccess?.();
    } catch (err: any) {
      logError("Exam upload error", err);
      toast.error(err.message || "Erro ao enviar exame.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Enviar Exame para Laudar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Patient search */}
        <div className="space-y-2">
          <Label>Paciente</Label>
          {selectedPaciente ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedPaciente.first_name} {selectedPaciente.last_name}
                {selectedPaciente.cpf && ` — ${selectedPaciente.cpf}`}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => { setSelectedPaciente(null); setPacienteSearch(""); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={pacienteSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
              {pacientes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {pacientes.map((p) => (
                    <button
                      key={p.user_id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { setSelectedPaciente(p); setPacientes([]); setPacienteSearch(""); }}
                    >
                      {p.first_name} {p.last_name}
                      {p.cpf && <span className="text-muted-foreground ml-2">({p.cpf})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exam type */}
        <div className="space-y-2">
          <Label>Tipo de Exame</Label>
          <Select value={tipoExame} onValueChange={setTipoExame}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_EXAME.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drag & drop area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arraste arquivos aqui ou <span className="text-primary font-medium">clique para selecionar</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">.dcm, .dicom, .pdf, .jpg, .jpeg, .png</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File previews */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                {isDicom(file) ? (
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <FileImage className="h-5 w-5 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB — {isDicom(file) ? "DICOM → Orthanc" : "Storage"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeFile(idx)} disabled={uploading}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Observations */}
        <div className="space-y-2">
          <Label>Observações (opcional)</Label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações clínicas adicionais..."
            rows={3}
          />
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">{progress}% concluído</p>
          </div>
        )}

        {/* Submit */}
        <Button onClick={handleSubmit} disabled={uploading || files.length === 0 || !tipoExame} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Enviar para Laudar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
