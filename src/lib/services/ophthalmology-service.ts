import { db } from "@/integrations/supabase/untyped";
import type { Database } from "@/integrations/supabase/types";

type OphthalmologyExam = Database["public"]["Tables"]["ophthalmology_exams"]["Row"];
type OphthalmologyExamInsert = Database["public"]["Tables"]["ophthalmology_exams"]["Insert"];
type OphthalmologyExamUpdate = Database["public"]["Tables"]["ophthalmology_exams"]["Update"];
type OphthalmologyPrescription = Database["public"]["Tables"]["ophthalmology_prescriptions"]["Row"];
type OphthalmologyPrescriptionInsert = Database["public"]["Tables"]["ophthalmology_prescriptions"]["Insert"];

export const ophthalmologyService = {
  // ── Exams ──
  async getExams(filters?: { status?: string; clinic_id?: string }): Promise<OphthalmologyExam[]> {
    let query = db.from("ophthalmology_exams").select("*").order("created_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.clinic_id) query = query.eq("clinic_id", filters.clinic_id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getExamById(id: string): Promise<OphthalmologyExam> {
    const { data, error } = await db.from("ophthalmology_exams").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async createExam(exam: OphthalmologyExamInsert): Promise<OphthalmologyExam> {
    const { data, error } = await db.from("ophthalmology_exams").insert(exam).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateExam(id: string, updates: OphthalmologyExamUpdate): Promise<OphthalmologyExam> {
    const { data, error } = await db.from("ophthalmology_exams").update(updates).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ── Prescriptions ──
  async getPrescriptionsByExam(examId: string): Promise<OphthalmologyPrescription[]> {
    const { data, error } = await db.from("ophthalmology_prescriptions").select("*").eq("exam_id", examId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getPrescriptionsByDoctor(doctorId: string): Promise<OphthalmologyPrescription[]> {
    const { data, error } = await db.from("ophthalmology_prescriptions").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createPrescription(prescription: OphthalmologyPrescriptionInsert): Promise<OphthalmologyPrescription> {
    const { data, error } = await db.from("ophthalmology_prescriptions").insert(prescription).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getMyExams(doctorId: string): Promise<OphthalmologyExam[]> {
    const { data, error } = await supabase
      .from("ophthalmology_exams")
      .select("*")
      .eq("assigned_doctor_id", doctorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
