import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { STALE } from "@/lib/constants";
import type { AdminAppointmentRow, ApprovalItem } from "@/types/domain";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminKpiData {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  total_revenue: number;
  
  pending_approvals: number;
  today_appointments: number;
  waiting_queue: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch admin KPI counts */
export function useAdminKpis() {
  return useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async (): Promise<AdminKpiData> => {
      const [patients, doctors, appts, pendingDocs, todayAppts, queue] =
        await Promise.all([
          db.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "patient"),
          db.from("doctor_profiles").select("id", { count: "exact", head: true }).eq("is_approved", true),
          db.from("appointments").select("id", { count: "exact", head: true }),
          db.from("doctor_profiles").select("id", { count: "exact", head: true }).is("is_approved", null),
          db.from("appointments").select("id", { count: "exact", head: true })
            .gte("scheduled_at", new Date().toISOString().split("T")[0])
            .lt("scheduled_at", new Date(Date.now() + 86400000).toISOString().split("T")[0]),
          db.from("on_demand_queue").select("id", { count: "exact", head: true }).eq("status", "waiting"),
        ]);

      // Revenue from completed appointments
      const { data: revenueData } = await supabase
        .from("appointments")
        .select("price_at_booking")
        .eq("status", "completed")
        .not("price_at_booking", "is", null);

      const total_revenue = (revenueData ?? []).reduce(
        (sum, a) => sum + (Number(a.price_at_booking) || 0), 0
      );

      return {
        total_patients: patients.count ?? 0,
        total_doctors: doctors.count ?? 0,
        total_appointments: appts.count ?? 0,
        total_revenue,
        
        pending_approvals: pendingDocs.count ?? 0,
        today_appointments: todayAppts.count ?? 0,
        waiting_queue: queue.count ?? 0,
      };
    },
    staleTime: STALE.SHORT,
    refetchInterval: STALE.SHORT,
  });
}

/** Fetch pending approvals */
export function useAdminPendingApprovals() {
  return useQuery({
    queryKey: ["admin-pending-approvals"],
    queryFn: async (): Promise<ApprovalItem[]> => {
      const { data } = await supabase
        .from("doctor_profiles")
        .select("id, user_id, crm, crm_state, created_at, is_approved")
        .is("is_approved", null)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as ApprovalItem[];
    },
    staleTime: STALE.SHORT,
  });
}

/** Fetch live (in-progress) appointments */
export function useAdminLiveAppointments() {
  return useQuery({
    queryKey: ["admin-live-appointments"],
    queryFn: async (): Promise<AdminAppointmentRow[]> => {
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, patient_id, doctor_id, duration_minutes, notes, appointment_type")
        .in("status", ["waiting", "in_progress"])
        .order("scheduled_at", { ascending: true })
        .limit(20);
      return (data ?? []) as AdminAppointmentRow[];
    },
    staleTime: STALE.REALTIME,
    refetchInterval: STALE.REALTIME,
  });
}

