import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle, User, Heart, Activity, FileText, Stethoscope,
  Thermometer, Weight, HeartPulse, Wind, Droplets, Save, Clock,
  Shield, Search, Upload, Download, History, Eye, Plus, Loader2,
  ClipboardList, Brain, Check, AlertCircle, RefreshCw, Pill,
  CalendarDays, ChevronRight, Sparkles, TrendingUp, Ruler,
  FileCheck2, UserCircle, Syringe, Clipboard, ShieldCheck, X,
  Filter, SortAsc, SortDesc, Printer, Copy, Hash
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logError } from "@/lib/logger";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PatientEMRProps {
  patientId: string;
  appointmentId?: string;
  isDoctor?: boolean;
  readOnly?: boolean;
}

interface AnamnesisData {
  id?: string;
  social_name: string;
  gender: string;
  chief_complaint: string;
  history_present_illness: string;
  past_medical_history: string;
  family_history: string;
  lifestyle_habits: string;
  review_of_systems: string;
  blood_pressure_sys: number | null;
  blood_pressure_dia: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  physical_exam_notes: string;
  diagnostic_hypothesis: string;
  cid_codes: string[];
  treatment_plan: string;
  created_at?: string;
  updated_at?: string;
}

interface AuditEntry {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string;
}

interface MedicalRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  cid_code: string | null;
  severity: string | null;
  is_active: boolean;
  created_at: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error" | "dirty";

const EMPTY_ANAMNESIS: AnamnesisData = {
  social_name: "", gender: "", chief_complaint: "", history_present_illness: "",
  past_medical_history: "", family_history: "", lifestyle_habits: "", review_of_systems: "",
  blood_pressure_sys: null, blood_pressure_dia: null, heart_rate: null, respiratory_rate: null,
  spo2: null, temperature: null, weight: null, height: null, physical_exam_notes: "",
  diagnostic_hypothesis: "", cid_codes: [], treatment_plan: "",
};

const FIELD_LABELS: Record<string, string> = {
  chief_complaint: "Queixa Principal", history_present_illness: "HDA",
  past_medical_history: "Hist. Patológico", family_history: "Hist. Familiar",
  lifestyle_habits: "Hábitos de Vida", review_of_systems: "Rev. de Sistemas",
  blood_pressure_sys: "PA Sistólica", blood_pressure_dia: "PA Diastólica",
  heart_rate: "Freq. Cardíaca", respiratory_rate: "Freq. Respiratória",
  spo2: "SpO2", temperature: "Temperatura", weight: "Peso", height: "Altura",
  physical_exam_notes: "Exame Físico", diagnostic_hypothesis: "Hipótese Diagnóstica",
  treatment_plan: "Plano Terapêutico", social_name: "Nome Social", gender: "Gênero",
};

const RECORD_TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  allergy: { label: "Alergia", icon: AlertTriangle, color: "text-orange-500" },
  medication: { label: "Medicamento", icon: Pill, color: "text-primary" },
  condition: { label: "Condição", icon: Activity, color: "text-destructive" },
  evolution: { label: "Evolução", icon: FileText, color: "text-secondary" },
};

const AUTOSAVE_DEBOUNCE_MS = 5000;
const AUTOSAVE_INTERVAL_MS = 30000;

/* ─── Completeness calculator ─────────────────────────────────── */
const calcCompleteness = (a: AnamnesisData) => {
  const fields = [
    a.chief_complaint, a.history_present_illness, a.past_medical_history,
    a.family_history, a.lifestyle_habits, a.physical_exam_notes,
    a.diagnostic_hypothesis, a.treatment_plan,
  ];
  const vitals = [a.blood_pressure_sys, a.heart_rate, a.spo2, a.temperature, a.weight, a.height];
  const filledFields = fields.filter(f => f && f.trim().length > 0).length;
  const filledVitals = vitals.filter(v => v !== null && v !== undefined).length;
  return Math.round(((filledFields + filledVitals) / (fields.length + vitals.length)) * 100);
};

const PatientEMR = ({ patientId, appointmentId, isDoctor = false, readOnly = false }: PatientEMRProps) => {
  const { user, roles } = useAuth();
  const isDoctorRole = isDoctor || roles.includes("doctor");
  const canEdit = isDoctorRole && !readOnly && !!appointmentId;

  const [anamnesis, setAnamnesis] = useState<AnamnesisData>(EMPTY_ANAMNESIS);
  const [pastAnamneses, setPastAnamneses] = useState<(AnamnesisData & { id: string; created_at: string })[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("anamnesis");
  const [showAudit, setShowAudit] = useState(false);
  const [cidSearch, setCidSearch] = useState("");
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [existingAnamnesisId, setExistingAnamnesisId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // New: inline record creation
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({ record_type: "allergy", title: "", description: "", cid_code: "", severity: "" });
  const [addingRecord, setAddingRecord] = useState(false);

  // New: document filters
  const [docSearch, setDocSearch] = useState("");
  const [docCategory, setDocCategory] = useState("all");
  const [docSortDesc, setDocSortDesc] = useState(true);

  // New: records filter
  const [recordSearch, setRecordSearch] = useState("");
  const [recordTypeFilter, setRecordTypeFilter] = useState("all");

  const anamnesisRef = useRef(anamnesis);
  const existingIdRef = useRef(existingAnamnesisId);
  const doctorIdRef = useRef(doctorProfileId);
  const savingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => { anamnesisRef.current = anamnesis; }, [anamnesis]);
  useEffect(() => { existingIdRef.current = existingAnamnesisId; }, [existingAnamnesisId]);
  useEffect(() => { doctorIdRef.current = doctorProfileId; }, [doctorProfileId]);

  useEffect(() => {
    if (!patientId) return;
    fetchAllData();
    if (user && isDoctorRole && patientId !== user.id) {
      db.from("medical_record_access_logs" as any).insert({
        patient_id: patientId, accessed_by: user.id, access_type: "emr_view", user_agent: navigator.userAgent,
      }).then(() => {});
    }
  }, [patientId, appointmentId]);

  const fetchAllData = async () => {
    setLoading(true);
    const [profileRes, recordsRes, docsRes, pastRes] = await Promise.all([
      db.from("profiles").select("*").eq("user_id", patientId).maybeSingle(),
      db.from("medical_records").select("id, record_type, title, description, cid_code, severity, is_active, created_at")
        .eq("patient_id", patientId).order("created_at", { ascending: false }),
      db.from("patient_documents").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
      db.from("clinical_anamnesis" as any).select("*").eq("patient_id", patientId)
        .order("created_at", { ascending: false }) as any,
    ]);

    let currentAnamnesisRes: any = null;
    if (appointmentId) {
      currentAnamnesisRes = await (db.from("clinical_anamnesis" as any).select("*")
        .eq("appointment_id", appointmentId).maybeSingle() as any);
    }

    let docProfileRes: any = null;
    if (user && isDoctorRole) {
      docProfileRes = await db.from("doctor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    }

    if (profileRes.data) setPatient(profileRes.data);
    if (recordsRes.data) setRecords(recordsRes.data as MedicalRecord[]);
    if (docsRes.data) setDocuments(docsRes.data);
    if (pastRes.data) setPastAnamneses(pastRes.data as any[]);

    if (docProfileRes?.data) {
      setDoctorProfileId(docProfileRes.data.id);
      doctorIdRef.current = docProfileRes.data.id;
    }

    if (currentAnamnesisRes?.data) {
      const existing = currentAnamnesisRes.data;
      setExistingAnamnesisId(existing.id);
      existingIdRef.current = existing.id;
      const loaded: AnamnesisData = {
        social_name: existing.social_name || "", gender: existing.gender || "",
        chief_complaint: existing.chief_complaint || "", history_present_illness: existing.history_present_illness || "",
        past_medical_history: existing.past_medical_history || "", family_history: existing.family_history || "",
        lifestyle_habits: existing.lifestyle_habits || "", review_of_systems: existing.review_of_systems || "",
        blood_pressure_sys: existing.blood_pressure_sys, blood_pressure_dia: existing.blood_pressure_dia,
        heart_rate: existing.heart_rate, respiratory_rate: existing.respiratory_rate,
        spo2: existing.spo2, temperature: existing.temperature,
        weight: existing.weight, height: existing.height,
        physical_exam_notes: existing.physical_exam_notes || "",
        diagnostic_hypothesis: existing.diagnostic_hypothesis || "",
        cid_codes: existing.cid_codes || [], treatment_plan: existing.treatment_plan || "",
      };
      setAnamnesis(loaded);
      anamnesisRef.current = loaded;
      setSaveStatus("saved");
      setLastSavedAt(new Date(existing.updated_at || existing.created_at));

      const auditRes = await (db.from("clinical_evolution_audit" as any)
        .select("*").eq("record_id", existing.id).order("changed_at", { ascending: false }) as any);
      if (auditRes.data) setAuditLog(auditRes.data as unknown as AuditEntry[]);
    }
    setLoading(false);
  };

  const updateField = useCallback((field: keyof AnamnesisData, value: any) => {
    setAnamnesis(prev => ({ ...prev, [field]: value }));
    dirtyRef.current = true;
    setSaveStatus("dirty");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => { persistAnamnesis(); }, AUTOSAVE_DEBOUNCE_MS);
  }, []);

  const persistAnamnesis = useCallback(async () => {
    if (savingRef.current || !appointmentId || !doctorIdRef.current) return;
    if (!dirtyRef.current && existingIdRef.current) return;
    savingRef.current = true;
    setSaveStatus("saving");
    const d = anamnesisRef.current;
    const fields = {
      social_name: d.social_name, gender: d.gender, chief_complaint: d.chief_complaint,
      history_present_illness: d.history_present_illness, past_medical_history: d.past_medical_history,
      family_history: d.family_history, lifestyle_habits: d.lifestyle_habits,
      review_of_systems: d.review_of_systems, blood_pressure_sys: d.blood_pressure_sys,
      blood_pressure_dia: d.blood_pressure_dia, heart_rate: d.heart_rate,
      respiratory_rate: d.respiratory_rate, spo2: d.spo2, temperature: d.temperature,
      weight: d.weight, height: d.height, physical_exam_notes: d.physical_exam_notes,
      diagnostic_hypothesis: d.diagnostic_hypothesis, cid_codes: d.cid_codes,
      treatment_plan: d.treatment_plan,
    };

    let error: any;
    if (existingIdRef.current) {
      ({ error } = await db.from("clinical_anamnesis" as any).update(fields).eq("id", existingIdRef.current));
    } else {
      const res = await (db.from("clinical_anamnesis" as any).insert({
        appointment_id: appointmentId, patient_id: patientId, doctor_id: doctorIdRef.current, ...fields,
      }).select("id").single() as any);
      error = res.error;
      if (res.data) { const nid = (res.data as any).id; setExistingAnamnesisId(nid); existingIdRef.current = nid; }
    }
    savingRef.current = false;
    if (error) { setSaveStatus("error"); logError("EMR save error", error); }
    else { dirtyRef.current = false; setSaveStatus("saved"); setLastSavedAt(new Date()); }
  }, [appointmentId, patientId]);

  const handleManualSave = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    dirtyRef.current = true;
    await persistAnamnesis();
    if (!savingRef.current) toast.success("Prontuário salvo com sucesso! ✅");
  }, [persistAnamnesis]);

  // Add medical record inline
  const handleAddRecord = useCallback(async () => {
    if (!newRecord.title.trim() || !patientId) return;
    setAddingRecord(true);
    const { error } = await db.from("medical_records").insert({
      patient_id: patientId,
      record_type: newRecord.record_type,
      title: newRecord.title.trim(),
      description: newRecord.description.trim() || null,
      cid_code: newRecord.cid_code.trim() || null,
      severity: newRecord.severity || null,
      doctor_id: doctorProfileId,
      appointment_id: appointmentId || null,
    });
    setAddingRecord(false);
    if (error) {
      toast.error("Erro ao salvar registro médico");
      logError("Failed to add medical record", error);
    } else {
      toast.success("Registro médico adicionado! ✅");
      setNewRecord({ record_type: "allergy", title: "", description: "", cid_code: "", severity: "" });
      setShowAddRecord(false);
      // Refresh records
      const { data } = await db.from("medical_records")
        .select("id, record_type, title, description, cid_code, severity, is_active, created_at")
        .eq("patient_id", patientId).order("created_at", { ascending: false });
      if (data) setRecords(data as MedicalRecord[]);
    }
  }, [newRecord, patientId, doctorProfileId, appointmentId]);

  useEffect(() => {
    if (!canEdit) return;
    const interval = setInterval(() => { if (dirtyRef.current) persistAnamnesis(); }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [canEdit, persistAnamnesis]);

  useEffect(() => {
    if (!canEdit) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = "Existem alterações não salvas."; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [canEdit]);

  useEffect(() => {
    return () => {
      if (dirtyRef.current && canEdit) persistAnamnesis();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [canEdit, persistAnamnesis]);

  const activeAllergies = records.filter(r => r.record_type === "allergy" && r.is_active);
  const activeConditions = records.filter(r => r.record_type === "condition" && r.is_active);
  const activeMeds = records.filter(r => r.record_type === "medication" && r.is_active);
  const completeness = calcCompleteness(anamnesis);

  const age = patient?.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bmi = anamnesis.weight && anamnesis.height
    ? (anamnesis.weight / Math.pow(anamnesis.height / 100, 2)).toFixed(1)
    : null;

  // Filtered records
  const filteredRecords = useMemo(() => {
    let r = records;
    if (recordTypeFilter !== "all") r = r.filter(rec => rec.record_type === recordTypeFilter);
    if (recordSearch) {
      const q = recordSearch.toLowerCase();
      r = r.filter(rec => rec.title.toLowerCase().includes(q) || rec.description?.toLowerCase().includes(q) || rec.cid_code?.toLowerCase().includes(q));
    }
    return r;
  }, [records, recordTypeFilter, recordSearch]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let d = [...documents];
    if (docCategory !== "all") d = d.filter(doc => (doc.category || "Geral") === docCategory);
    if (docSearch) {
      const q = docSearch.toLowerCase();
      d = d.filter(doc => doc.file_name?.toLowerCase().includes(q) || doc.description?.toLowerCase().includes(q));
    }
    d.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return docSortDesc ? db - da : da - db;
    });
    return d;
  }, [documents, docCategory, docSearch, docSortDesc]);

  const docCategories = useMemo(() => {
    const cats = new Set(documents.map((d: any) => d.category || "Geral"));
    return ["all", ...Array.from(cats)];
  }, [documents]);

  const exportHL7 = () => {
    const lines = [
      `MSH|^~\\&|ALLO_MEDICO|EMR|||${new Date().toISOString()}||ADT^A01|${Date.now()}|P|2.5`,
      `PID|||${patientId}||${patient?.last_name}^${patient?.first_name}||${patient?.date_of_birth || ""}|${anamnesis.gender || "U"}`,
      `DG1|1||${anamnesis.cid_codes?.join("~") || ""}||${new Date().toISOString()}|A`,
      `OBX|1|NM|BP_SYS||${anamnesis.blood_pressure_sys || ""}|mmHg`,
      `OBX|2|NM|BP_DIA||${anamnesis.blood_pressure_dia || ""}|mmHg`,
      `OBX|3|NM|HR||${anamnesis.heart_rate || ""}|bpm`,
      `OBX|4|NM|TEMP||${anamnesis.temperature || ""}|°C`,
      `OBX|5|NM|SPO2||${anamnesis.spo2 || ""}|%`,
      `OBX|6|NM|WEIGHT||${anamnesis.weight || ""}|kg`,
      `OBX|7|NM|HEIGHT||${anamnesis.height || ""}|cm`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `prontuario-${patientId.slice(0, 8)}-${format(new Date(), "yyyyMMdd")}.hl7`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Exportado em formato HL7!");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Impressão iniciada");
  };

  const copyToClipboard = () => {
    const d = anamnesis;
    const text = [
      `PRONTUÁRIO ELETRÔNICO — ${patient?.first_name || ""} ${patient?.last_name || ""}`,
      `Data: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      "",
      `QUEIXA PRINCIPAL: ${d.chief_complaint || "—"}`,
      `HDA: ${d.history_present_illness || "—"}`,
      `ANTECEDENTES: ${d.past_medical_history || "—"}`,
      `HIST. FAMILIAR: ${d.family_history || "—"}`,
      `HÁBITOS: ${d.lifestyle_habits || "—"}`,
      "",
      `SINAIS VITAIS:`,
      `  PA: ${d.blood_pressure_sys || "—"}/${d.blood_pressure_dia || "—"} mmHg`,
      `  FC: ${d.heart_rate || "—"} bpm | FR: ${d.respiratory_rate || "—"} irpm`,
      `  SpO₂: ${d.spo2 || "—"}% | Temp: ${d.temperature || "—"}°C`,
      `  Peso: ${d.weight || "—"} kg | Altura: ${d.height || "—"} cm ${bmi ? `| IMC: ${bmi}` : ""}`,
      "",
      `EXAME FÍSICO: ${d.physical_exam_notes || "—"}`,
      `HIPÓTESE: ${d.diagnostic_hypothesis || "—"}`,
      `CID: ${d.cid_codes?.join(", ") || "—"}`,
      `CONDUTA: ${d.treatment_plan || "—"}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Prontuário copiado para a área de transferência!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Carregando prontuário...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* ══════════════════════════════════════════════════════════
            Patient Header — Premium glass card
           ══════════════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="glass border-border/50 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-t-xl" />
            <CardContent className="p-5 pt-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                    {patient?.avatar_url ? (
                      <img src={patient.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <UserCircle className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  {activeAllergies.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-semibold">Alergias: {activeAllergies.map(a => a.title).join(", ")}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {anamnesis.social_name || `${patient?.first_name || ""} ${patient?.last_name || ""}`}
                    </h2>
                    {anamnesis.social_name && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Nome social</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {patient?.cpf && <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />CPF: {patient.cpf}</span>}
                    {patient?.date_of_birth && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(patient.date_of_birth), "dd/MM/yyyy")} ({age} anos)
                      </span>
                    )}
                    {anamnesis.gender && <Badge variant="secondary" className="text-[10px]">{anamnesis.gender}</Badge>}
                    {patient?.blood_type && (
                      <Badge variant="destructive" className="text-[10px] gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />{patient.blood_type}
                      </Badge>
                    )}
                  </div>

                  {/* Quick stats strip */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <QuickStat icon={ClipboardList} label="Consultas" value={pastAnamneses.length.toString()} />
                    <QuickStat icon={FileText} label="Documentos" value={documents.length.toString()} />
                    <QuickStat icon={Activity} label="Registros" value={records.length.toString()} />
                    {activeAllergies.length > 0 && (
                      <QuickStat icon={AlertTriangle} label="Alergias" value={activeAllergies.length.toString()} variant="destructive" />
                    )}
                  </div>
                </div>

                {/* Actions + Completeness */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex gap-2 flex-wrap justify-end">
                    {canEdit && (
                      <Button onClick={handleManualSave} disabled={saveStatus === "saving"} size="sm"
                        className="gap-1.5 rounded-xl shadow-sm">
                        {saveStatus === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Salvar
                      </Button>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1.5 rounded-xl">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copiar prontuário</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={exportHL7} variant="outline" size="sm" className="gap-1.5 rounded-xl">
                          <Download className="w-3.5 h-3.5" /> HL7
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar HL7</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5 rounded-xl">
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Imprimir</TooltipContent>
                    </Tooltip>
                    <Button onClick={() => setShowAudit(true)} variant="ghost" size="sm" className="gap-1.5 rounded-xl">
                      <History className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <SaveStatusIndicator saveStatus={saveStatus} lastSavedAt={lastSavedAt} canEdit={canEdit} onRetry={handleManualSave} />

                  {canEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10">
                            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={completeness >= 80 ? "hsl(var(--primary))" : completeness >= 50 ? "hsl(var(--warning, 45 93% 47%))" : "hsl(var(--destructive))"}
                                strokeWidth="3" strokeDasharray={`${completeness}, 100`}
                                strokeLinecap="round" className="transition-all duration-700" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                              {completeness}%
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Completude do prontuário</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* ─── Allergy Alert Banner ─── */}
              <AnimatePresence>
                {activeAllergies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-destructive">Alergias Ativas</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {activeAllergies.map(a => (
                          <Badge key={a.id} variant="destructive" className="text-xs rounded-lg gap-1">
                            {a.title}
                            {a.severity === "severe" ? " 🔴" : a.severity === "moderate" ? " 🟠" : " 🟡"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Active Medications & Conditions Summary ─── */}
              {(activeMeds.length > 0 || activeConditions.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeMeds.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-[11px] text-primary font-medium">
                      <Pill className="w-3 h-3" />
                      {activeMeds.length} medicamento{activeMeds.length > 1 ? "s" : ""} ativo{activeMeds.length > 1 ? "s" : ""}
                    </div>
                  )}
                  {activeConditions.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-[11px] text-orange-600 font-medium">
                      <Activity className="w-3 h-3" />
                      {activeConditions.length} condição(ões) crônica(s)
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════
            Main Tabs — Premium segmented control
           ══════════════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="glass rounded-2xl p-1.5 border border-border/50">
              <TabsList className="grid w-full grid-cols-6 bg-transparent h-auto gap-1">
                {[
                  { value: "anamnesis", icon: ClipboardList, label: "Anamnese" },
                  { value: "vitals", icon: HeartPulse, label: "Sinais Vitais" },
                  { value: "diagnosis", icon: Brain, label: "Diagnóstico" },
                  { value: "records", icon: Clipboard, label: "Prontuário" },
                  { value: "documents", icon: FileText, label: "Arquivos" },
                  { value: "evolution", icon: TrendingUp, label: "Evolução" },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="flex flex-col gap-1 py-2.5 px-2 rounded-xl text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200">
                    <tab.icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ─── Anamnesis Tab ─── */}
            <TabsContent value="anamnesis">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-5">
                {canEdit && (
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Identificação
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nome Social</Label>
                          <Input value={anamnesis.social_name} onChange={e => updateField("social_name", e.target.value)}
                            placeholder="Nome social do paciente" className="mt-1 rounded-xl" disabled={!canEdit} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Gênero</Label>
                          <Select value={anamnesis.gender} onValueChange={v => updateField("gender", v)} disabled={!canEdit}>
                            <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Não-binário">Não-binário</SelectItem>
                              <SelectItem value="Prefere não informar">Prefere não informar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <SectionCard icon={Stethoscope} title="Queixa Principal" required>
                  <Textarea value={anamnesis.chief_complaint}
                    onChange={e => updateField("chief_complaint", e.target.value)}
                    placeholder="Descreva a queixa principal do paciente..." rows={2} className="rounded-xl border-border/50" disabled={!canEdit} />
                </SectionCard>

                <SectionCard icon={Search} title="História da Doença Atual (HDA)">
                  <Textarea value={anamnesis.history_present_illness}
                    onChange={e => updateField("history_present_illness", e.target.value)}
                    placeholder="Início, evolução, características dos sintomas..." rows={3} className="rounded-xl border-border/50" disabled={!canEdit} />
                </SectionCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SectionCard icon={History} title="Antecedentes Pessoais">
                    <Textarea value={anamnesis.past_medical_history}
                      onChange={e => updateField("past_medical_history", e.target.value)}
                      placeholder="Cirurgias, internações, doenças prévias..." rows={3} className="rounded-xl border-border/50" disabled={!canEdit} />
                  </SectionCard>
                  <SectionCard icon={Heart} title="Histórico Familiar">
                    <Textarea value={anamnesis.family_history}
                      onChange={e => updateField("family_history", e.target.value)}
                      placeholder="HAS, DM, câncer, doenças hereditárias..." rows={3} className="rounded-xl border-border/50" disabled={!canEdit} />
                  </SectionCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SectionCard icon={Activity} title="Hábitos de Vida">
                    <Textarea value={anamnesis.lifestyle_habits}
                      onChange={e => updateField("lifestyle_habits", e.target.value)}
                      placeholder="Tabagismo, etilismo, atividade física..." rows={3} className="rounded-xl border-border/50" disabled={!canEdit} />
                  </SectionCard>
                  <SectionCard icon={ClipboardList} title="Revisão de Sistemas">
                    <Textarea value={anamnesis.review_of_systems}
                      onChange={e => updateField("review_of_systems", e.target.value)}
                      placeholder="Cardiovascular, respiratório, neurológico..." rows={3} className="rounded-xl border-border/50" disabled={!canEdit} />
                  </SectionCard>
                </div>
              </motion.div>
            </TabsContent>

            {/* ─── Vitals Tab ─── */}
            <TabsContent value="vitals">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <VitalCard icon={HeartPulse} label="PA (mmHg)" color="from-destructive/20 to-destructive/5" iconColor="text-destructive"
                    status={anamnesis.blood_pressure_sys ? (anamnesis.blood_pressure_sys > 140 ? "high" : anamnesis.blood_pressure_sys < 90 ? "low" : "normal") : undefined}>
                    <div className="flex items-center gap-1">
                      <Input type="number" value={anamnesis.blood_pressure_sys ?? ""} placeholder="Sys"
                        onChange={e => updateField("blood_pressure_sys", e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                      <span className="text-muted-foreground font-bold">/</span>
                      <Input type="number" value={anamnesis.blood_pressure_dia ?? ""} placeholder="Dia"
                        onChange={e => updateField("blood_pressure_dia", e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                    </div>
                  </VitalCard>

                  <VitalCard icon={Activity} label="FC (bpm)" color="from-primary/20 to-primary/5" iconColor="text-primary"
                    status={anamnesis.heart_rate ? (anamnesis.heart_rate > 100 ? "high" : anamnesis.heart_rate < 60 ? "low" : "normal") : undefined}>
                    <Input type="number" value={anamnesis.heart_rate ?? ""} placeholder="—"
                      onChange={e => updateField("heart_rate", e.target.value ? parseInt(e.target.value) : null)}
                      className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                  </VitalCard>

                  <VitalCard icon={Wind} label="FR (irpm)" color="from-blue-500/20 to-blue-500/5" iconColor="text-blue-500"
                    status={anamnesis.respiratory_rate ? (anamnesis.respiratory_rate > 20 ? "high" : anamnesis.respiratory_rate < 12 ? "low" : "normal") : undefined}>
                    <Input type="number" value={anamnesis.respiratory_rate ?? ""} placeholder="—"
                      onChange={e => updateField("respiratory_rate", e.target.value ? parseInt(e.target.value) : null)}
                      className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                  </VitalCard>

                  <VitalCard icon={Droplets} label="SpO₂ (%)" color="from-cyan-500/20 to-cyan-500/5" iconColor="text-cyan-500"
                    status={anamnesis.spo2 ? (anamnesis.spo2 < 95 ? "low" : "normal") : undefined}>
                    <Input type="number" value={anamnesis.spo2 ?? ""} placeholder="—" step="0.1"
                      onChange={e => updateField("spo2", e.target.value ? parseFloat(e.target.value) : null)}
                      className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                  </VitalCard>

                  <VitalCard icon={Thermometer} label="Temp (°C)" color="from-orange-500/20 to-orange-500/5" iconColor="text-orange-500"
                    status={anamnesis.temperature ? (anamnesis.temperature > 37.5 ? "high" : anamnesis.temperature < 35 ? "low" : "normal") : undefined}>
                    <Input type="number" value={anamnesis.temperature ?? ""} placeholder="—" step="0.1"
                      onChange={e => updateField("temperature", e.target.value ? parseFloat(e.target.value) : null)}
                      className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                  </VitalCard>

                  <VitalCard icon={Weight} label="Peso (kg)" color="from-emerald-500/20 to-emerald-500/5" iconColor="text-emerald-500">
                    <Input type="number" value={anamnesis.weight ?? ""} placeholder="—" step="0.1"
                      onChange={e => updateField("weight", e.target.value ? parseFloat(e.target.value) : null)}
                      className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                  </VitalCard>

                  <VitalCard icon={Ruler} label="Altura (cm)" color="from-violet-500/20 to-violet-500/5" iconColor="text-violet-500">
                    <Input type="number" value={anamnesis.height ?? ""} placeholder="—" step="0.1"
                      onChange={e => updateField("height", e.target.value ? parseFloat(e.target.value) : null)}
                      className="h-9 text-center text-sm rounded-lg font-semibold" disabled={!canEdit} />
                  </VitalCard>

                  {/* IMC */}
                  {bmi && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/30 text-center relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">IMC</p>
                      <p className={`text-2xl font-black ${
                        parseFloat(bmi) < 18.5 ? "text-blue-500" :
                        parseFloat(bmi) < 25 ? "text-emerald-500" :
                        parseFloat(bmi) < 30 ? "text-orange-500" : "text-destructive"
                      }`}>{bmi}</p>
                      <Badge variant="outline" className="text-[9px] mt-1 border-border/50">
                        {parseFloat(bmi) < 18.5 ? "Abaixo" : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Sobrepeso" : "Obesidade"}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                <SectionCard icon={Stethoscope} title="Exame Físico / Objetivo">
                  <Textarea value={anamnesis.physical_exam_notes}
                    onChange={e => updateField("physical_exam_notes", e.target.value)}
                    placeholder="Achados do exame físico detalhado..." rows={4} className="rounded-xl border-border/50" disabled={!canEdit} />
                </SectionCard>
              </motion.div>
            </TabsContent>

            {/* ─── Diagnosis Tab ─── */}
            <TabsContent value="diagnosis">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-5">
                <SectionCard icon={Brain} title="Hipótese Diagnóstica">
                  <Textarea value={anamnesis.diagnostic_hypothesis}
                    onChange={e => updateField("diagnostic_hypothesis", e.target.value)}
                    placeholder="Principais hipóteses diagnósticas..." rows={3} className="rounded-xl border-border/50" disabled={!canEdit} />
                </SectionCard>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Hash className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-foreground">Códigos CID-10</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 mb-3">
                        <Input value={cidSearch} onChange={e => setCidSearch(e.target.value.toUpperCase())}
                          placeholder="Ex: J06, I10, E11..." className="rounded-xl flex-1" maxLength={10} />
                        <Button size="sm" className="rounded-xl gap-1 shrink-0"
                          onClick={() => {
                            if (cidSearch && !anamnesis.cid_codes.includes(cidSearch)) {
                              updateField("cid_codes", [...anamnesis.cid_codes, cidSearch]);
                              setCidSearch("");
                            }
                          }} disabled={!cidSearch}>
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {anamnesis.cid_codes.map((code, i) => (
                          <motion.div key={code} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}>
                            <Badge variant="secondary" className="text-xs gap-1.5 rounded-lg py-1 px-2.5">
                              <FileCheck2 className="w-3 h-3" />{code}
                              {canEdit && (
                                <button className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => updateField("cid_codes", anamnesis.cid_codes.filter((_, j) => j !== i))}>
                                  ×
                                </button>
                              )}
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>

                <SectionCard icon={Sparkles} title="Plano Terapêutico">
                  <Textarea value={anamnesis.treatment_plan}
                    onChange={e => updateField("treatment_plan", e.target.value)}
                    placeholder="Conduta, orientações, encaminhamentos, retorno..." rows={4} className="rounded-xl border-border/50" disabled={!canEdit} />
                </SectionCard>
              </motion.div>
            </TabsContent>

            {/* ─── Records Tab (IMPROVED with inline add + filters) ─── */}
            <TabsContent value="records">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SummaryCard title="Alergias" items={activeAllergies} icon={AlertTriangle}
                    gradient="from-destructive/15 to-destructive/5" iconColor="text-destructive" />
                  <SummaryCard title="Condições Crônicas" items={activeConditions} icon={Activity}
                    gradient="from-orange-500/15 to-orange-500/5" iconColor="text-orange-500" />
                  <SummaryCard title="Medicamentos" items={activeMeds} icon={Pill}
                    gradient="from-primary/15 to-primary/5" iconColor="text-primary" />
                </div>

                {/* Inline add record */}
                {canEdit && (
                  <AnimatePresence>
                    {!showAddRecord ? (
                      <Button onClick={() => setShowAddRecord(true)} variant="outline" className="w-full gap-2 rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5">
                        <Plus className="w-4 h-4" /> Adicionar Registro Médico
                      </Button>
                    ) : (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <Card className="border-primary/30 bg-primary/5 rounded-2xl">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary" /> Novo Registro
                              </p>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => setShowAddRecord(false)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Tipo</Label>
                                <Select value={newRecord.record_type} onValueChange={v => setNewRecord(p => ({ ...p, record_type: v }))}>
                                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="allergy">🟠 Alergia</SelectItem>
                                    <SelectItem value="medication">💊 Medicamento</SelectItem>
                                    <SelectItem value="condition">🔴 Condição / Diagnóstico</SelectItem>
                                    <SelectItem value="evolution">📄 Evolução / Nota</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Gravidade</Label>
                                <Select value={newRecord.severity} onValueChange={v => setNewRecord(p => ({ ...p, severity: v }))}>
                                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Opcional" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mild">Leve</SelectItem>
                                    <SelectItem value="moderate">Moderada</SelectItem>
                                    <SelectItem value="severe">Grave</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Título *</Label>
                                <Input value={newRecord.title} onChange={e => setNewRecord(p => ({ ...p, title: e.target.value }))}
                                  placeholder="Ex: Penicilina, HAS, Losartana..." className="mt-1 rounded-xl" />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">CID-10</Label>
                                <Input value={newRecord.cid_code} onChange={e => setNewRecord(p => ({ ...p, cid_code: e.target.value.toUpperCase() }))}
                                  placeholder="Ex: I10" className="mt-1 rounded-xl" maxLength={10} />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Descrição</Label>
                              <Textarea value={newRecord.description} onChange={e => setNewRecord(p => ({ ...p, description: e.target.value }))}
                                placeholder="Detalhes adicionais..." rows={2} className="mt-1 rounded-xl" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowAddRecord(false)}>Cancelar</Button>
                              <Button size="sm" className="rounded-xl gap-1.5" onClick={handleAddRecord}
                                disabled={!newRecord.title.trim() || addingRecord}>
                                {addingRecord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Salvar Registro
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                <Card className="border-border/50 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2 px-5 pt-5">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" /> Registros Cronológicos
                      <Badge variant="outline" className="text-[10px] ml-auto">{filteredRecords.length}/{records.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {/* Filters bar */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="relative flex-1 min-w-[150px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input value={recordSearch} onChange={e => setRecordSearch(e.target.value)}
                          placeholder="Buscar registros..." className="pl-8 h-8 text-xs rounded-lg" />
                      </div>
                      <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                          <Filter className="w-3 h-3 mr-1" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="allergy">Alergias</SelectItem>
                          <SelectItem value="medication">Medicamentos</SelectItem>
                          <SelectItem value="condition">Condições</SelectItem>
                          <SelectItem value="evolution">Evoluções</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <ScrollArea className="max-h-96">
                      {filteredRecords.length === 0 ? (
                        <EmptyState icon={Clipboard} text={recordSearch || recordTypeFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhum registro encontrado"} />
                      ) : (
                        <div className="space-y-2">
                          {filteredRecords.map((r, idx) => {
                            const typeInfo = RECORD_TYPE_MAP[r.record_type] || { label: r.record_type, icon: FileText, color: "text-muted-foreground" };
                            const TypeIcon = typeInfo.icon;
                            return (
                              <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`p-3.5 rounded-xl border border-border/50 hover:border-primary/30 transition-all ${!r.is_active ? "opacity-40" : ""}`}>
                                <div className="flex items-center gap-2">
                                  <TypeIcon className={`w-4 h-4 ${typeInfo.color} shrink-0`} />
                                  <Badge variant="outline" className="text-[10px] rounded-md">{typeInfo.label}</Badge>
                                  <span className="text-sm font-semibold text-foreground">{r.title}</span>
                                  {r.cid_code && <Badge variant="secondary" className="text-[10px]">CID: {r.cid_code}</Badge>}
                                  {r.severity && (
                                    <span className={`w-2 h-2 rounded-full ${
                                      r.severity === "severe" ? "bg-destructive" : r.severity === "moderate" ? "bg-orange-500" : "bg-yellow-500"
                                    }`} />
                                  )}
                                  {!r.is_active && <Badge variant="outline" className="text-[9px] text-muted-foreground">Inativo</Badge>}
                                </div>
                                {r.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{r.description}</p>}
                                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ─── Documents Tab (IMPROVED with search, filter, sort) ─── */}
            <TabsContent value="documents">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
                <Card className="border-border/50 rounded-2xl overflow-hidden">
                  <CardHeader className="px-5 pt-5 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" /> Arquivos do Paciente
                      <Badge variant="outline" className="text-[10px] ml-auto">{filteredDocs.length}/{documents.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    {/* Search + filter bar */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="relative flex-1 min-w-[150px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input value={docSearch} onChange={e => setDocSearch(e.target.value)}
                          placeholder="Buscar arquivos..." className="pl-8 h-8 text-xs rounded-lg" />
                      </div>
                      <Select value={docCategory} onValueChange={setDocCategory}>
                        <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg">
                          <Filter className="w-3 h-3 mr-1" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {docCategories.map(c => (
                            <SelectItem key={c} value={c}>{c === "all" ? "Todas categorias" : c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg" onClick={() => setDocSortDesc(v => !v)}>
                        {docSortDesc ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
                      </Button>
                    </div>

                    {filteredDocs.length === 0 ? (
                      <EmptyState icon={FileText} text={docSearch || docCategory !== "all" ? "Nenhum resultado encontrado" : "Nenhum arquivo enviado pelo paciente"} />
                    ) : (
                      <div className="space-y-2">
                        {filteredDocs.map((d: any, idx: number) => (
                          <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                d.file_type?.includes("image") ? "bg-violet-500/10" : "bg-primary/10"
                              }`}>
                                {d.file_type?.includes("image") ? (
                                  <Eye className="w-4 h-4 text-violet-500" />
                                ) : (
                                  <FileText className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{d.description || d.file_name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  <Badge variant="outline" className="text-[9px] rounded-md">{d.category || "Geral"}</Badge>
                                  <span>{format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                  {d.file_size && <span>{(d.file_size / 1024).toFixed(0)} KB</span>}
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                              onClick={async () => {
                                const { data } = await db.storage.from("patient-documents").createSignedUrl(d.file_url, 3600);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              }}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ─── Evolution Tab ─── */}
            <TabsContent value="evolution">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
                <Card className="border-border/50 rounded-2xl overflow-hidden">
                  <CardHeader className="px-5 pt-5 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Evolução Clínica
                      <Badge variant="outline" className="text-[10px] ml-auto">{pastAnamneses.length} consultas</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <ScrollArea className="max-h-[500px]">
                      {pastAnamneses.length === 0 ? (
                        <EmptyState icon={TrendingUp} text="Nenhuma evolução registrada" />
                      ) : (
                        <div className="relative">
                          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
                          <div className="space-y-4">
                            {pastAnamneses.map((a, idx) => (
                              <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="relative pl-10">
                                <div className={`absolute left-2.5 top-4 w-[11px] h-[11px] rounded-full border-2 border-background ${
                                  idx === 0 ? "bg-primary" : "bg-muted-foreground/40"
                                }`} />

                                <div className={`p-4 rounded-2xl border transition-all ${
                                  idx === 0 ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card/80"
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                                      <p className="text-xs font-medium text-muted-foreground">
                                        {format(new Date(a.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </p>
                                      {idx === 0 && <Badge className="text-[9px] bg-primary/10 text-primary border-primary/30">Mais recente</Badge>}
                                    </div>
                                    {a.cid_codes && a.cid_codes.length > 0 && (
                                      <div className="flex gap-1">
                                        {a.cid_codes.map((c: string, i: number) => (
                                          <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {a.chief_complaint && (
                                    <div className="mb-2.5">
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Queixa Principal</p>
                                      <p className="text-sm text-foreground mt-0.5">{a.chief_complaint}</p>
                                    </div>
                                  )}
                                  {a.diagnostic_hypothesis && (
                                    <div className="mb-2.5">
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Hipótese Diagnóstica</p>
                                      <p className="text-sm text-foreground mt-0.5">{a.diagnostic_hypothesis}</p>
                                    </div>
                                  )}
                                  {a.treatment_plan && (
                                    <div className="mb-2">
                                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Conduta</p>
                                      <p className="text-sm text-foreground mt-0.5">{a.treatment_plan}</p>
                                    </div>
                                  )}

                                  {(a.blood_pressure_sys || a.heart_rate || a.temperature) && (
                                    <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-border/50">
                                      {a.blood_pressure_sys && a.blood_pressure_dia && (
                                        <MiniVital icon={HeartPulse} label="PA" value={`${a.blood_pressure_sys}/${a.blood_pressure_dia}`} />
                                      )}
                                      {a.heart_rate && <MiniVital icon={Activity} label="FC" value={`${a.heart_rate} bpm`} />}
                                      {a.temperature && <MiniVital icon={Thermometer} label="T" value={`${a.temperature}°C`} />}
                                      {a.spo2 && <MiniVital icon={Droplets} label="SpO₂" value={`${a.spo2}%`} />}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ─── LGPD Footer ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary">Prontuário protegido pela LGPD</p>
            <p className="text-[10px] text-muted-foreground">CFM 2.314/22 · Guarda mínima 20 anos · Trilha de auditoria ativa · Auto-save habilitado</p>
          </div>
        </motion.div>

        {/* ─── Audit Dialog ─── */}
        <Dialog open={showAudit} onOpenChange={setShowAudit}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Trilha de Auditoria
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {auditLog.length === 0 ? (
                <EmptyState icon={History} text="Nenhuma alteração registrada" />
              ) : (
                <div className="space-y-3">
                  {auditLog.map(entry => (
                    <div key={entry.id} className="p-3.5 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px] rounded-md">{FIELD_LABELS[entry.field_name] || entry.field_name}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(entry.changed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                          <p className="text-[10px] text-destructive font-bold mb-0.5">Anterior</p>
                          <p className="text-xs text-foreground">{entry.old_value || "—"}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-primary font-bold mb-0.5">Novo</p>
                          <p className="text-xs text-foreground">{entry.new_value || "—"}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> {entry.changed_by?.slice(0, 8)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

/* ══════════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════════ */

const SaveStatusIndicator = ({ saveStatus, lastSavedAt, canEdit, onRetry }: {
  saveStatus: SaveStatus; lastSavedAt: Date | null; canEdit: boolean; onRetry: () => void;
}) => {
  const config: Record<SaveStatus, { icon: any; text: string; color: string }> = {
    idle: { icon: null, text: "", color: "" },
    dirty: { icon: AlertCircle, text: "Não salvo", color: "text-amber-500" },
    saving: { icon: Loader2, text: "Salvando...", color: "text-primary" },
    saved: { icon: Check, text: lastSavedAt ? `Salvo ${format(lastSavedAt, "HH:mm")}` : "Salvo", color: "text-emerald-500" },
    error: { icon: AlertTriangle, text: "Erro", color: "text-destructive" },
  };
  const s = config[saveStatus];
  if (!s.icon || !canEdit) return null;
  const Icon = s.icon;
  return (
    <motion.div key={saveStatus} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-1.5 text-[11px] font-semibold ${s.color}`}>
      <Icon className={`w-3.5 h-3.5 ${saveStatus === "saving" ? "animate-spin" : ""}`} />
      <span>{s.text}</span>
      {saveStatus === "error" && (
        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] rounded-md" onClick={onRetry}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </motion.div>
  );
};

const QuickStat = ({ icon: Icon, label, value, variant }: {
  icon: any; label: string; value: string; variant?: "destructive";
}) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
    variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted/60 text-muted-foreground"
  }`}>
    <Icon className="w-3 h-3" />
    <span>{value}</span>
    <span className="hidden sm:inline">{label}</span>
  </div>
);

const SectionCard = ({ icon: Icon, title, required, children }: {
  icon: any; title: string; required?: boolean; children: React.ReactNode;
}) => (
  <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-xs font-bold text-foreground">{title}</p>
        {required && <span className="text-destructive text-xs">*</span>}
      </div>
      {children}
    </CardContent>
  </Card>
);

const VitalCard = ({ icon: Icon, label, color, iconColor, children, status }: {
  icon: any; label: string; color: string; iconColor: string; children: React.ReactNode;
  status?: "normal" | "high" | "low";
}) => (
  <div className={`p-4 rounded-2xl border border-border/50 bg-gradient-to-br ${color} relative overflow-hidden`}>
    {status && (
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
        status === "normal" ? "bg-emerald-500" : status === "high" ? "bg-destructive animate-pulse" : "bg-amber-500 animate-pulse"
      }`} />
    )}
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
    {children}
  </div>
);

const SummaryCard = ({ title, items, icon: Icon, gradient, iconColor }: {
  title: string; items: MedicalRecord[]; icon: any; gradient: string; iconColor: string;
}) => (
  <Card className={`border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br ${gradient}`}>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-background/60`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-xs font-bold text-foreground flex-1">{title}</p>
        <Badge variant="outline" className="text-[10px] border-border/50">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Nenhum registro</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(i => (
            <Badge key={i.id} variant="secondary" className="text-[10px] rounded-lg">{i.title}</Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const MiniVital = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
    <Icon className="w-3 h-3" />
    <span className="font-semibold">{label}:</span>
    <span>{value}</span>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-sm font-medium">{text}</p>
  </div>
);

export default PatientEMR;
