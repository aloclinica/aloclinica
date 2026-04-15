import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

interface Exam {
  id: string;
  patient_name: string;
  exam_type: string;
  created_at: string;
  status: "pending" | "in_review" | "signed";
  priority: "urgente" | "normal" | "baixa";
}

interface OphthalmologistStats {
  examsToSign: Exam[];
  signedToday: number;
  signedTotal: number;
  successRate: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useOphthalmologistStats(userId?: string): OphthalmologistStats {
  const [examsToSign, setExamsToSign] = useState<Exam[]>([]);
  const [signedToday, setSignedToday] = useState(0);
  const [signedTotal, setSignedTotal] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all exams assigned to this user
      const { data: exams, error } = await db
        .from("ophthalmology_exams")
        .select("id, patient_name, exam_type, created_at, status, priority, signed_at")
        .eq("assigned_to", userId)
        .order("created_at", { ascending: false });

      if (error) {
        logError("Error fetching ophthalmology exams:", error);
        setLoading(false);
        return;
      }

      if (!exams) {
        setExamsToSign([]);
        setSignedToday(0);
        setSignedTotal(0);
        setSuccessRate(0);
        setLoading(false);
        return;
      }

      // Filter exams pending signature
      const pending = exams
        .filter((e: any) => e.status === "pending" || e.status === "in_review")
        .map((e: any) => ({
          id: e.id,
          patient_name: e.patient_name || "Paciente",
          exam_type: e.exam_type || "Exame Oftalmológico",
          created_at: e.created_at,
          status: e.status,
          priority: e.priority || "normal",
        }));

      // Count signed exams today
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const signedThisMonth = exams.filter((e: any) => {
        if (!e.signed_at) return false;
        const signedDate = new Date(e.signed_at);
        return signedDate >= todayStart;
      });
      const signedThisDayCount = signedThisMonth.filter((e: any) => {
        const signedDate = new Date(e.signed_at);
        return signedDate.toDateString() === now.toDateString();
      }).length;

      // Count total signed this month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalSignedMonth = exams.filter((e: any) => {
        if (!e.signed_at) return false;
        const signedDate = new Date(e.signed_at);
        return signedDate >= monthStart && signedDate <= now;
      }).length;

      // Calculate success rate
      const totalExams = exams.length;
      const signed = exams.filter((e: any) => e.status === "signed").length;
      const rate = totalExams > 0 ? Math.round((signed / totalExams) * 100) : 0;

      setExamsToSign(pending);
      setSignedToday(signedThisDayCount);
      setSignedTotal(totalSignedMonth);
      setSuccessRate(rate);
    } catch (error) {
      logError("Error in useOphthalmologistStats:", error);
      setExamsToSign([]);
      setSignedToday(0);
      setSignedTotal(0);
      setSuccessRate(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const refetch = async () => {
    await fetchStats();
  };

  return {
    examsToSign,
    signedToday,
    signedTotal,
    successRate,
    loading,
    refetch,
  };
}
