import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getDoctorNav } from "./doctorNav";
import { Users, FileText } from "lucide-react";

interface Patient {
  user_id: string;
  first_name: string;
  last_name: string;
  total_appointments: number;
  last_appointment: string;
}

const DoctorPatients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchPatients(); }, [user]);

  const fetchPatients = async () => {
    // Get doctor profile
    const { data: doc } = await db
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (!doc) { setLoading(false); return; }

    // Get all appointments
    const { data: appts } = await db
      .from("appointments")
      .select("patient_id, scheduled_at")
      .eq("doctor_id", doc.id)
      .order("scheduled_at", { ascending: false });

    if (!appts || appts.length === 0) { setLoading(false); return; }

    // Aggregate by patient
    const patientMap = new Map<string, { count: number; lastDate: string }>();
    appts.forEach(a => {
      const pid = a.patient_id ?? '';
      const existing = patientMap.get(pid);
      if (!existing) {
        patientMap.set(pid, { count: 1, lastDate: a.scheduled_at });
      } else {
        existing.count++;
      }
    });

    // Fetch profiles
    const patientIds = [...patientMap.keys()];
    const { data: profiles } = await db
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", patientIds);

    const results: Patient[] = patientIds.map(pid => {
      const profile = profiles?.find(p => p.user_id === pid);
      const info = patientMap.get(pid)!;
      return {
        user_id: pid,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        total_appointments: info.count,
        last_appointment: info.lastDate,
      };
    });

    setPatients(results);
    setLoading(false);
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("patients")}>
      <div className="w-full mx-auto max-w-3xl pb-24 md:pb-6">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          Voltar ao painel
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-1">Meus Pacientes</h1>
        <p className="text-muted-foreground mb-6">Pacientes que você já atendeu</p>

        {loading ? (
          <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" />
        ) : patients.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum paciente atendido ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {patients.map(p => (
              <Card key={p.user_id} className="border-border cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/dashboard/patients/${p.user_id}/emr?role=doctor`)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {p.first_name[0]}{p.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.total_appointments} consulta(s)
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Prontuário
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatients;
