import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDoctorNav } from "./doctorNav";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { Json } from "@/integrations/db/types";

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
      <div className="w-full mx-auto max-w-3xl pb-24 md:pb-6">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          Voltar ao painel
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Receitas Emitidas</h1>
        <p className="text-muted-foreground mb-6">Histórico de prescrições</p>

        {loading ? (
          <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" />
        ) : prescriptions.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma receita emitida.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {prescriptions.map(p => (
              <Card key={p.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{p.patient_name}</p>
                      {p.diagnosis && <p className="text-sm text-muted-foreground">{p.diagnosis}</p>}
                      <div className="flex gap-1 mt-1">
                        {p.medications.map((m, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {typeof m === "string" ? m : (m as Record<string, unknown>)?.name as string ?? "Medicamento"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
