import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getClinicNav } from "@/components/clinic/clinicNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileImage, X } from "lucide-react";

const EXAM_TYPES = [
  { value: "ECG", label: "ECG — Eletrocardiograma" },
  { value: "RX_TORAX", label: "Raio-X Tórax" },
  { value: "RX_ABDOME", label: "Raio-X Abdome" },
  { value: "TC_CRANIO", label: "Tomografia de Crânio" },
  { value: "TC_TORAX", label: "Tomografia de Tórax" },
  { value: "RM_CRANIO", label: "Ressonância de Crânio" },
  { value: "US_ABDOME", label: "Ultrassonografia de Abdome" },
  { value: "OUTRO", label: "Outro" },
];

const ClinicExamUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [patientBirthDate, setPatientBirthDate] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [examType, setExamType] = useState("");
  const [customExamType, setCustomExamType] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [examDate, setExamDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const { data: clinicProfile } = useQuery({
    queryKey: ["clinic-profile-upload", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_profiles")
        .select("id, name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!clinicProfile?.id) throw new Error("Perfil da clínica não encontrado.");
      if (!patientName.trim()) throw new Error("Informe o nome do paciente.");
      const finalExamType = examType === "OUTRO" ? customExamType.trim() : examType;
      if (!finalExamType) throw new Error("Selecione o tipo de exame.");
      if (files.length === 0) throw new Error("Envie pelo menos um arquivo.");

      const requestId = crypto.randomUUID();
      const fileUrls: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${clinicProfile.id}/${requestId}/${safeName}`;
        const { error: upErr } = await db.storage.from("exam-files").upload(path, file);
        if (upErr) throw upErr;
        fileUrls.push(path);
      }

      const { error } = await db.from("exam_requests" as any).insert({
        id: requestId,
        requesting_clinic_id: clinicProfile.id,
        requesting_doctor_id: null,
        patient_id: null,
        patient_name: patientName.trim(),
        patient_birth_date: patientBirthDate || null,
        patient_sex: patientSex || null,
        exam_date: examDate || null,
        exam_type: finalExamType,
        clinical_info: clinicalInfo ? `${patientCpf ? `CPF: ${patientCpf}\n` : ""}${clinicalInfo}` : (patientCpf ? `CPF: ${patientCpf}` : null),
        file_urls: fileUrls,
        priority,
        status: "pending",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Exame enviado!", description: "Disponível para os laudistas na fila." });
      navigate("/dashboard/clinic/exam-list?role=clinic");
    },
    onError: (err: unknown) => {
      toast({
        title: "Erro ao enviar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const uploading = submitMutation.isPending;

  return (
    <DashboardLayout nav={getClinicNav("exam-upload")} title="Enviar Exame para Laudo" role="clinic">
      <div className="max-w-2xl mx-auto pb-24 md:pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Nova Solicitação de Laudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome do Paciente *</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="patientCpf">CPF (opcional)</Label>
                  <Input
                    id="patientCpf"
                    value={patientCpf}
                    onChange={(e) => setPatientCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientBirthDate">Data de Nascimento</Label>
                  <Input
                    id="patientBirthDate"
                    type="date"
                    value={patientBirthDate}
                    onChange={(e) => setPatientBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientSex">Sexo</Label>
                <Select value={patientSex} onValueChange={setPatientSex}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="O">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">Tipo de Exame *</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de exame" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {examType === "OUTRO" && (
                  <Input
                    value={customExamType}
                    onChange={(e) => setCustomExamType(e.target.value)}
                    placeholder="Descreva o tipo de exame"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="examDate">Data de Realização do Exame</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="stat">STAT (imediato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalInfo">Informações Clínicas</Label>
                <Textarea
                  id="clinicalInfo"
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                  placeholder="Queixa principal, hipótese diagnóstica, medicações..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivos do Exame *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para enviar PDF, imagens ou DICOM
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Formatos: .pdf, .jpg, .png, .dcm
                    </span>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
                        <span className="truncate">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {uploading ? "Enviando..." : "Enviar para Laudar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClinicExamUpload;
