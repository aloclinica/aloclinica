import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { getReceptionNav } from "@/components/reception/receptionNav";
import { getClinicNav } from "@/components/clinic/clinicNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileImage, X } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const EXAM_TYPES = [
  "Raio-X Tórax PA",
  "Raio-X Tórax Perfil",
  "Raio-X Coluna",
  "Raio-X Membros",
  "Tomografia Computadorizada",
  "Ressonância Magnética",
  "Ultrassonografia",
  "Eletrocardiograma",
  "Hemograma Completo",
  "Ecocardiograma",
  "Mamografia",
  "Densitometria Óssea",
  "Outro",
];

const ExamRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "";

  const isLaudista = location.pathname.includes("/laudista/");
  const isClinic = location.pathname.includes("/clinic/") || roleParam === "clinic";
  const isReception = location.pathname.includes("/reception/") || roleParam === "receptionist";

  const [examType, setExamType] = useState("");
  const [customExamType, setCustomExamType] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [patientName, setPatientName] = useState("");
  const [patientBirthDate, setPatientBirthDate] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [examDate, setExamDate] = useState("");
  const [patientId, setPatientId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Doctor profile (for doctor/laudista roles)
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-for-exam", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isClinic,
  });

  // Clinic profile (for clinic role)
  const { data: clinicProfile } = useQuery({
    queryKey: ["clinic-profile-for-exam", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_profiles")
        .select("id, name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && isClinic,
  });

  // For reception: find affiliated doctor
  const { data: receptionDoctorProfile } = useQuery({
    queryKey: ["reception-doctor-profile", user?.id],
    queryFn: async () => {
      const { data: dp } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (dp) return dp;
      const { data: clinic } = await supabase
        .from("clinic_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (clinic) {
        const { data: affiliation } = await supabase
          .from("clinic_affiliations")
          .select("doctor_id")
          .eq("clinic_id", clinic.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (affiliation) return { id: affiliation.doctor_id };
      }
      return null;
    },
    enabled: !!user && isReception,
  });

  const getNav = () => {
    if (isClinic) return getClinicNav("exam-request");
    if (isReception) return getReceptionNav("exam-request");
    if (isLaudista) return getLaudistaNav("queue");
    return getDoctorNav("exam-request");
  };

  const getBackRoute = () => {
    if (isClinic) return "/dashboard/clinic/my-exams?role=clinic";
    if (isReception) return "/dashboard?role=receptionist";
    if (isLaudista) return "/dashboard/laudista/queue?role=doctor";
    return "/dashboard/doctor/report-queue?role=doctor";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalExamType = examType === "Outro" ? customExamType : examType;

    if (isClinic) {
      if (!clinicProfile?.id) {
        toast.error("Erro", { description: "Perfil da clínica não encontrado." });
        return;
      }
      if (!patientName.trim()) {
        toast.error("Campo obrigatório", { description: "Informe o nome do paciente." });
        return;
      }
      if (!finalExamType || files.length === 0) {
        toast.error("Campos obrigatórios", { description: "Selecione o tipo de exame e envie pelo menos um arquivo." });
        return;
      }
    } else {
      const effectiveDoctorId = isReception ? receptionDoctorProfile?.id : doctorProfile?.id;
      if (!effectiveDoctorId) {
        toast.error("Erro", { description: "Perfil de médico não encontrado." });
        return;
      }
      if (!finalExamType || files.length === 0) {
        toast.error("Campos obrigatórios", { description: "Selecione o tipo de exame e envie pelo menos um arquivo." });
        return;
      }
    }

    setUploading(true);
    try {
      const fileUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("exam-files")
          .upload(path, file);
        if (uploadError) throw uploadError;
        fileUrls.push(path);
      }

      if (isClinic) {
        const { error } = await db.from("exam_requests" as any).insert({
          requesting_clinic_id: clinicProfile!.id,
          requesting_doctor_id: null,
          patient_id: null,
          patient_name: patientName.trim() || null,
          patient_birth_date: patientBirthDate || null,
          patient_sex: patientSex || null,
          exam_date: examDate || null,
          exam_type: finalExamType,
          clinical_info: clinicalInfo,
          file_urls: fileUrls,
          priority,
          status: "pending",
        } as any);
        if (error) throw error;
        toast.success("Solicitação enviada!", { description: "O exame foi enviado para a fila de laudos." });
        navigate("/dashboard/clinic/my-exams?role=clinic");
        return;
      } else {
        const effectiveDoctorId = isReception ? receptionDoctorProfile?.id : doctorProfile?.id;
        const { error } = await db.from("exam_requests" as any).insert({
          requesting_doctor_id: effectiveDoctorId,
          patient_id: patientId || null,
          exam_type: finalExamType,
          clinical_info: clinicalInfo,
          file_urls: fileUrls,
          priority,
          status: "pending",
        } as any);
        if (error) throw error;
      }

      toast.success("Solicitação enviada!", { description: "O exame foi enviado para a fila de laudos." });
      navigate(getBackRoute());
    } catch (err: unknown) {
      toast.error("Erro ao enviar", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setUploading(false);
    }
  };

  const roleLabel = isClinic ? "clinic" : isReception ? "receptionist" : undefined;

  return (
    <DashboardLayout nav={getNav()} title="Solicitar Laudo" role={roleLabel}>
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
              {/* Patient info - shown for clinic/reception */}
              {(isClinic || isReception) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Nome do Paciente *</Label>
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Nome completo do paciente"
                      required={isClinic}
                    />
                  </div>
                  {isClinic && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="patientBirthDate">Data de Nascimento</Label>
                        <Input
                          id="patientBirthDate"
                          type="date"
                          value={patientBirthDate}
                          onChange={(e) => setPatientBirthDate(e.target.value)}
                        />
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
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="examType">Tipo de Exame *</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de exame" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {examType === "Outro" && (
                  <Input
                    value={customExamType}
                    onChange={(e) => setCustomExamType(e.target.value)}
                    placeholder="Digite o tipo de exame"
                    className="mt-2"
                  />
                )}
              </div>

              {isClinic && (
                <div className="space-y-2">
                  <Label htmlFor="examDate">Data de Realização do Exame</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
              )}

              {!(isClinic || isReception) && (
                <div className="space-y-2">
                  <Label htmlFor="patientId">ID do Paciente (opcional)</Label>
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="UUID do paciente (se aplicável)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">🚨 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalInfo">Informações Clínicas / Anamnese</Label>
                <Textarea
                  id="clinicalInfo"
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                  placeholder="Descreva o contexto clínico, queixa principal, hipótese diagnóstica..."
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

export default ExamRequestForm;
