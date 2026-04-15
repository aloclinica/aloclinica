import { useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FirstAid, Plus, Trash, Check, Pill, Heartbeat, CalendarCheck, ChartLineUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Objective {
  title: string;
  completed: boolean;
  due_date?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Lifestyle {
  category: string;
  instruction: string;
}

interface Props {
  patientId: string;
  appointmentId?: string;
  doctorProfileId: string;
  onSaved?: () => void;
}

export default function CarePlanCreator({ patientId, appointmentId, doctorProfileId, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [lifestyle, setLifestyle] = useState<Lifestyle[]>([]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Objective helpers
  const addObjective = () => setObjectives(o => [...o, { title: "", completed: false }]);
  const updateObj = (i: number, field: keyof Objective, value: any) =>
    setObjectives(o => o.map((obj, idx) => idx === i ? { ...obj, [field]: value } : obj));
  const removeObj = (i: number) => setObjectives(o => o.filter((_, idx) => idx !== i));

  // Medication helpers
  const addMed = () => setMedications(m => [...m, { name: "", dosage: "", frequency: "", duration: "" }]);
  const updateMed = (i: number, field: keyof Medication, value: string) =>
    setMedications(m => m.map((med, idx) => idx === i ? { ...med, [field]: value } : med));
  const removeMed = (i: number) => setMedications(m => m.filter((_, idx) => idx !== i));

  // Lifestyle helpers
  const addLife = () => setLifestyle(l => [...l, { category: "", instruction: "" }]);
  const updateLife = (i: number, field: keyof Lifestyle, value: string) =>
    setLifestyle(l => l.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  const removeLife = (i: number) => setLifestyle(l => l.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!title.trim()) { toast.error("Informe o título do plano"); return; }
    setSaving(true);
    const { error } = await db.from("care_plans" as any).insert({
      patient_id: patientId,
      doctor_id: doctorProfileId,
      appointment_id: appointmentId ?? null,
      title,
      description: description || null,
      objectives: objectives.filter(o => o.title.trim()),
      medications: medications.filter(m => m.name.trim()),
      lifestyle: lifestyle.filter(l => l.instruction.trim()),
      follow_up_date: followUpDate || null,
      follow_up_notes: followUpNotes || null,
      status: "active",
    });
    if (error) toast.error("Erro ao salvar plano de cuidado");
    else {
      toast.success("Plano de cuidado criado!");
      // Send notification to patient
      await db.from("notifications").insert({
        user_id: patientId,
        title: "📋 Novo plano de cuidado",
        message: `Seu médico criou o plano: ${title}`,
        type: "care_plan",
        link: "/dashboard/patient/care-plans?role=patient",
      });
      onSaved?.();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <FirstAid size={18} weight="fill" className="text-rose-500" />
        <h3 className="font-bold text-foreground">Criar Plano de Cuidado</h3>
      </div>

      {/* Basic info */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Título do plano *</Label>
          <Input placeholder="Ex: Controle de Diabetes Tipo 2" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">Descrição</Label>
          <Textarea placeholder="Objetivo geral do tratamento..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none" />
        </div>
      </div>

      {/* Objectives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <ChartLineUp size={14} className="text-blue-500" /> Objetivos
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={addObjective} className="h-7 text-xs gap-1">
            <Plus size={12} /> Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {objectives.map((obj, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Objetivo (ex: Reduzir HbA1c para < 7%)"
                value={obj.title}
                onChange={e => updateObj(i, "title", e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={obj.due_date ?? ""}
                onChange={e => updateObj(i, "due_date", e.target.value)}
                className="w-36"
              />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeObj(i)}>
                <Trash size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Pill size={14} className="text-blue-500" /> Medicações
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={addMed} className="h-7 text-xs gap-1">
            <Plus size={12} /> Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {medications.map((med, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center">
              <Input placeholder="Medicamento" value={med.name} onChange={e => updateMed(i, "name", e.target.value)} className="col-span-2" />
              <Input placeholder="Dosagem" value={med.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} />
              <div className="flex gap-1">
                <Input placeholder="Frequência" value={med.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} className="flex-1" />
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMed(i)}>
                  <Trash size={14} />
                </Button>
              </div>
              <Input placeholder="Duração (ex: 30 dias)" value={med.duration} onChange={e => updateMed(i, "duration", e.target.value)} className="col-span-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Lifestyle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Heartbeat size={14} className="text-rose-500" /> Estilo de Vida
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={addLife} className="h-7 text-xs gap-1">
            <Plus size={12} /> Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {lifestyle.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Categoria (ex: Exercício)"
                value={item.category}
                onChange={e => updateLife(i, "category", e.target.value)}
                className="w-36"
              />
              <Input
                placeholder="Instrução (ex: Caminhar 30min/dia)"
                value={item.instruction}
                onChange={e => updateLife(i, "instruction", e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeLife(i)}>
                <Trash size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      <div>
        <Label className="flex items-center gap-1.5 text-sm font-semibold mb-2">
          <CalendarCheck size={14} className="text-emerald-500" /> Retorno
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Data de retorno</Label>
            <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Input placeholder="Ex: Trazer exames" value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} />
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full gap-2">
        <Check size={16} /> {saving ? "Salvando..." : "Criar Plano de Cuidado"}
      </Button>
    </div>
  );
}
