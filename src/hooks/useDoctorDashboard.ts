import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";

export const useDoctorStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["doctor-dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: docProfile } = await supabase
        .from("doctor_profiles")
        .select("id, consultation_price, rating, total_reviews, crm, crm_state, crm_verified")
        .eq("user_id", user.id)
        .single();
      if (!docProfile) return null;

      const doctorId = docProfile.id;
      const price = Number(docProfile.consultation_price) || 89;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [todayRes, totalPatientsRes, prescriptionsRes, completedRes, upcomingRes] = await Promise.all([
        db.from("appointments")
          .select("id, scheduled_at, status, patient_id, duration_minutes")
          .eq("doctor_id", doctorId)
          .gte("scheduled_at", todayStart.toISOString())
          .lte("scheduled_at", todayEnd.toISOString())
          .order("scheduled_at", { ascending: true }),
        db.from("appointments").select("patient_id").eq("doctor_id", doctorId),
        db.from("prescriptions").select("id", { count: "exact", head: true }).eq("doctor_id", doctorId),
        db.from("appointments").select("id", { count: "exact", head: true })
          .eq("doctor_id", doctorId).eq("status", "completed"),
        db.from("appointments")
          .select("id, scheduled_at, status, patient_id, duration_minutes")
          .eq("doctor_id", doctorId).eq("status", "scheduled")
          .gt("scheduled_at", todayEnd.toISOString())
          .order("scheduled_at", { ascending: true }).limit(5),
      ]);

      const uniquePatients = new Set(totalPatientsRes.data?.map(a => a.patient_id) ?? []);
      const completedCount = completedRes.count ?? 0;

      // Resolve patient names
      const allAppts = [...(todayRes.data ?? []), ...(upcomingRes.data ?? [])];
      let todayAppts = todayRes.data ?? [];
      let upcoming = upcomingRes.data ?? [];

      if (allAppts.length > 0) {
        const patientIds = [...new Set(allAppts.map(a => a.patient_id).filter((id): id is string => !!id))];
        const { data: profiles } = patientIds.length > 0
          ? await supabase
            .from("profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", patientIds)
          : { data: [] as { user_id: string; first_name: string; last_name: string }[] };
        const pMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) ?? []);
        todayAppts = todayAppts.map(a => ({ ...a, patient_name: pMap.get(a.patient_id ?? "") ?? "Paciente" }));
        upcoming = upcoming.map(a => ({ ...a, patient_name: pMap.get(a.patient_id ?? "") ?? "Paciente" }));
      }

      return {
        doctorId,
        rating: Number(docProfile.rating) || 0,
        totalReviews: Number(docProfile.total_reviews) || 0,
        crm: docProfile.crm,
        crmState: docProfile.crm_state,
        crmVerified: docProfile.crm_verified,
        stats: {
          today: todayRes.data?.length ?? 0,
          total_patients: uniquePatients.size,
          prescriptions: prescriptionsRes.count ?? 0,
          totalEarnings: completedCount * price,
        },
        todayAppts,
        upcomingAppts: upcoming,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
