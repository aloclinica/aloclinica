import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDoctorNav } from "./doctorNav";
import { FileText, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DoctorAppHeader from "./DoctorAppHeader";

import type { Json } from "@/integrations/supabase/types";

interface MedicationEntry {
  name?: string;
  dosage?: string;
  frequency?: string;
}

interface Prescription {
  id: string;
  created_at: string;
  medications: Json[];
  diagnosis: string | null;
  patient_name: string;
}

const DoctorPrescriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchPrescriptions(); }, [user]);

  const fetchPrescriptions = async () => {
    const { data: doc } = await db
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (!doc) { setLoading(false); return; }

    const { data } = await db
      .from("prescriptions")
      .select("id, created_at, medications, diagnosis, patient_id")
      .eq("doctor_id", doc.id)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) { setLoading(false); return; }

    const patientIds = [...new Set(data.map(p => p.patient_id))];
    const { data: profiles } = await db
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", patientIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);

    setPrescriptions(data.map(p => ({
      id: p.id,
      created_at: p.created_at,
      medications: Array.isArray(p.medications) ? p.medications : [],
      diagnosis: p.diagnosis,
      patient_name: profileMap.get(p.patient_id) ?? "Paciente",
    })));
    setLoading(false);
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("prescriptions")}>
      <div className="w-full mx-auto max-w-4xl space-y-6 pb-24 md:pb-6">
        <DoctorAppHeader
          eyebrow="Prescricoes"
          title="Receitas digitais"
          description="Emita, acompanhe e consulte prescricoes com uma experiencia mais rapida."
          icon={FileText}
          stats={[
            { label: "Receitas", value: prescriptions.length },
            { label: "Medicamentos", value: prescriptions.reduce((total, p) => total + p.medications.length, 0) },
          ]}
          actions={
            <Button onClick={() => navigate("/dashboard/prescribe")} className="h-11 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-5 w-5" />
              Nova receita
            </Button>
          }
        />

        {/* Modern Header */}
        <div className="hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full" aria-label="Voltar ao painel">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Receitas Emitidas</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Controle de Prescrições</p>
            </div>
          </div>
          <Button onClick={() => navigate("/dashboard/prescribe")} className="rounded-2xl h-11 px-6 gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> Nova Receita
          </Button>
        </div>

        {loading ? (
          <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" />
        ) : prescriptions.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-10 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-primary/70" />
              </div>
              <p className="font-semibold text-foreground mb-1">Nenhuma receita emitida</p>
              <p className="text-sm text-muted-foreground mb-4">Emita receitas digitais com assinatura válida diretamente pela plataforma.</p>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={() => navigate("/dashboard/prescribe")}>
                <Plus className="w-4 h-4" /> Nova Receita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map(p => (
              <div 
                key={p.id} 
                className="p-5 rounded-3xl border border-border/10 bg-card hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between h-full"
                onClick={() => navigate(`/dashboard/prescriptions/${p.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{p.patient_name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {format(new Date(p.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {p.medications.slice(0, 3).map((m, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-muted/50 text-[10px] py-0 px-2 rounded-lg border-transparent">
                      {typeof m === "string" ? m : (m as Record<string, unknown>)?.name as string ?? "Medicamento"}
                    </Badge>
                  ))}
                  {p.medications.length > 3 && (
                    <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-lg">
                      +{p.medications.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
