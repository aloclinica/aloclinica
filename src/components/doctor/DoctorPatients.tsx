import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDoctorNav } from "./doctorNav";
import { Users, FileText, ArrowLeft, Search, MoreVertical } from "lucide-react";

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
  const [search, setSearch] = useState("");

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

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("patients")}>
      <div className="w-full mx-auto max-w-4xl space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full" aria-label="Voltar ao painel">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Meus Pacientes</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base de Dados Clínica</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar pacientes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-2xl bg-muted/40 border-transparent focus:bg-background transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" />
        ) : filteredPatients.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-10 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-primary/70" />
              </div>
              {search.trim() ? (
                <>
                  <p className="font-semibold text-foreground mb-1">Nenhum paciente para “{search.trim()}”</p>
                  <p className="text-sm text-muted-foreground mb-4">Verifique a grafia ou limpe a busca.</p>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSearch("")}>Limpar busca</Button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground mb-1">Nenhum paciente ainda</p>
                  <p className="text-sm text-muted-foreground mb-4">Seus pacientes aparecem aqui após a primeira consulta. Ative sua agenda para receber atendimentos.</p>
                  <Button size="sm" className="rounded-xl" onClick={() => navigate("/dashboard/availability")}>Configurar disponibilidade</Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPatients.map(p => (
              <div 
                key={p.user_id} 
                className="group p-4 rounded-3xl border border-border/10 bg-card hover:border-primary/30 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/dashboard/patients/${p.user_id}/emr?role=doctor`)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 rounded-2xl">
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-xs rounded-2xl border border-primary/20">
                        {p.first_name[0]}{p.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-background border border-border flex items-center justify-center">
                      <FileText className="w-2.5 h-2.5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{p.first_name} {p.last_name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {p.total_appointments} consultas
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Ações do paciente">
                    <MoreVertical className="w-4 h-4" />
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

export default DoctorPatients;
