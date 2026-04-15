import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClinicStats {
  totalAppointments: number;
  completedAppointments: number;
  noShowCount: number;
  attendanceRate: number;
  totalRevenue: number;
  activeDoctors: number;
}

export interface ClinicDoctor {
  doctorId: string;
  doctorName: string;
  specialty: string;
  commissionPercent: number;
  appointmentCount: number;
  rating: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Get clinic dashboard stats for the current period.
 */
export const getClinicStats = async (clinicId: string, period: "week" | "month" | "year" = "month"): Promise<ClinicStats> => {
  try {
    const periodStart = new Date();
    if (period === "week") periodStart.setDate(periodStart.getDate() - 7);
    else if (period === "month") periodStart.setMonth(periodStart.getMonth() - 1);
    else periodStart.setFullYear(periodStart.getFullYear() - 1);

    // Get affiliated doctors
    const { data: affiliations } = await supabase
      .from("clinic_affiliations")
      .select("doctor_id")
      .eq("clinic_id", clinicId)
      .eq("status", "active");

    const doctorIds = affiliations?.map(a => a.doctor_id) ?? [];
    if (doctorIds.length === 0) {
      return { totalAppointments: 0, completedAppointments: 0, noShowCount: 0, attendanceRate: 0, totalRevenue: 0, activeDoctors: 0 };
    }

    // Count appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, status, price_at_booking")
      .in("doctor_id", doctorIds)
      .gte("scheduled_at", periodStart.toISOString());

    const total = appointments?.length ?? 0;
    const completed = appointments?.filter(a => a.status === "completed").length ?? 0;
    const noShows = appointments?.filter(a => a.status === "no_show").length ?? 0;
    const revenue = appointments
      ?.filter(a => a.status === "completed")
      .reduce((sum, a) => sum + (Number(a.price_at_booking) || 0), 0) ?? 0;

    return {
      totalAppointments: total,
      completedAppointments: completed,
      noShowCount: noShows,
      attendanceRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalRevenue: revenue,
      activeDoctors: doctorIds.length,
    };
  } catch (err) {
    logError("getClinicStats failed", err);
    return { totalAppointments: 0, completedAppointments: 0, noShowCount: 0, attendanceRate: 0, totalRevenue: 0, activeDoctors: 0 };
  }
};

/**
 * Get ranked list of doctors affiliated with a clinic.
 */
export const getClinicDoctorsRanking = async (clinicId: string): Promise<ClinicDoctor[]> => {
  try {
    const { data: affiliations } = await supabase
      .from("clinic_affiliations")
      .select("doctor_id, commission_percent")
      .eq("clinic_id", clinicId)
      .eq("status", "active");

    if (!affiliations?.length) return [];

    const doctorIds = affiliations.map(a => a.doctor_id);

    const [doctorsRes, profilesRes, specsRes] = await Promise.all([
      db.from("doctor_profiles").select("id, user_id, rating, total_reviews").in("id", doctorIds),
      db.from("profiles").select("user_id, first_name, last_name").in(
        "user_id",
        (await db.from("doctor_profiles").select("user_id").in("id", doctorIds)).data?.map(d => d.user_id) ?? []
      ),
      db.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", doctorIds),
    ]);

    // Count appointments per doctor (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: appts } = await supabase
      .from("appointments")
      .select("doctor_id")
      .in("doctor_id", doctorIds)
      .eq("status", "completed")
      .gte("scheduled_at", thirtyDaysAgo.toISOString());

    const apptCountMap = new Map<string, number>();
    appts?.forEach(a => apptCountMap.set(a.doctor_id, (apptCountMap.get(a.doctor_id) ?? 0) + 1));

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) ?? []);
    const commissionMap = new Map(affiliations.map(a => [a.doctor_id, a.commission_percent]));
    const specMap = new Map<string, string>();
    specsRes.data?.forEach((s: any) => {
      if (s.specialties?.name) specMap.set(s.doctor_id, s.specialties.name);
    });

    return (doctorsRes.data ?? []).map(d => {
      const p = profileMap.get(d.user_id);
      return {
        doctorId: d.id,
        doctorName: p ? `Dr(a). ${(p as any).first_name} ${(p as any).last_name}` : "Médico",
        specialty: specMap.get(d.id) ?? "Clínica Geral",
        commissionPercent: commissionMap.get(d.id) ?? 50,
        appointmentCount: apptCountMap.get(d.id) ?? 0,
        rating: Number(d.rating) || 0,
      };
    }).sort((a, b) => b.appointmentCount - a.appointmentCount);
  } catch (err) {
    logError("getClinicDoctorsRanking failed", err);
    return [];
  }
};

/**
 * Send exam request from clinic to telelaudo system.
 */
export const submitExamRequest = async (params: {
  clinicId: string;
  examType: string;
  patientName: string;
  patientId?: string;
  patientBirthDate?: string;
  patientSex?: string;
  clinicalInfo?: string;
  fileUrls: string[];
  priority?: "normal" | "urgent";
  specialtyRequired?: string;
}): Promise<string | null> => {
  try {
    const { data, error } = await db.from("exam_requests").insert({
      requesting_clinic_id: params.clinicId,
      exam_type: params.examType,
      patient_name: params.patientName,
      patient_id: params.patientId ?? null,
      patient_birth_date: params.patientBirthDate ?? null,
      patient_sex: params.patientSex ?? null,
      clinical_info: params.clinicalInfo ?? null,
      file_urls: params.fileUrls,
      priority: params.priority ?? "normal",
      specialty_required: params.specialtyRequired ?? null,
      status: "pending",
      source: "clinic",
    }).select("id").single();

    if (error || !data) {
      logError("submitExamRequest failed", error);
      return null;
    }
    return data.id;
  } catch (err) {
    logError("submitExamRequest exception", err);
    return null;
  }
};
