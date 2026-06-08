import { db } from "@/integrations/supabase/untyped";

export const ophthalmologyService = {
  // ── Exams ──
  async getExams(filters?: { status?: string; clinic_id?: string }): Promise<any[]> {
    let query = db.from("ophthalmology_exams").select("*").order("created_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.clinic_id) query = query.eq("clinic_id", filters.clinic_id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getExamById(id: string): Promise<any> {
    const { data, error } = await db.from("ophthalmology_exams").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async createExam(exam: any): Promise<any> {
    const { data, error } = await db.from("ophthalmology_exams").insert(exam).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateExam(id: string, updates: any): Promise<any> {
    const { data, error } = await db.from("ophthalmology_exams").update(updates).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ── Prescriptions ──
  async getPrescriptionsByExam(examId: string): Promise<any[]> {
    const { data, error } = await db.from("ophthalmology_prescriptions").select("*").eq("exam_id", examId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getPrescriptionsByDoctor(doctorId: string): Promise<any[]> {
    const { data, error } = await db.from("ophthalmology_prescriptions").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createPrescription(prescription: any): Promise<any> {
    const { data, error } = await db.from("ophthalmology_prescriptions").insert(prescription).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getMyExams(doctorId: string): Promise<any[]> {
    const { data, error } = await db
      .from("ophthalmology_exams")
      .select("*")
      .eq("assigned_doctor_id", doctorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
