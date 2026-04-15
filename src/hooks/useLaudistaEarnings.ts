import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

interface LaudistaEarningsData {
  currentEarnings: number;
  monthlyGoal: number;
  percentage: number;
  slaOnTime: number;
  slaLate: number;
  slaPercentage: number;
  totalReports: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

const DEFAULT_MONTHLY_GOAL = 3000; // R$ 3.000 default goal

export function useLaudistaEarnings(userId?: string): LaudistaEarningsData {
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [monthlyGoal, setMonthlyGoal] = useState(DEFAULT_MONTHLY_GOAL);
  const [percentage, setPercentage] = useState(0);
  const [slaOnTime, setSlaOnTime] = useState(0);
  const [slaLate, setSlaLate] = useState(0);
  const [slaPercentage, setSlaPercentage] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEarningsAndSLA = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch earnings from wallet_transactions
      const { data: transactions, error: txError } = await db
        .from("wallet_transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "credit")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      if (txError) {
        logError("Error fetching wallet transactions:", txError);
      }

      const earnings = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      const earnPercentage = monthlyGoal > 0 ? Math.round((earnings / monthlyGoal) * 100) : 0;

      // Fetch SLA data from exam_reports
      // SLA = 24 hours from creation to completion
      const SLA_HOURS = 24;

      const { data: reports, error: reportsError } = await db
        .from("exam_reports")
        .select("created_at, updated_at")
        .eq("reporter_id", userId)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      if (reportsError) {
        logError("Error fetching exam reports:", reportsError);
      }

      if (!reports) {
        setCurrentEarnings(earnings);
        setPercentage(earnPercentage);
        setSlaOnTime(0);
        setSlaLate(0);
        setSlaPercentage(0);
        setTotalReports(0);
        setLoading(false);
        return;
      }

      // Calculate SLA metrics
      let onTime = 0;
      let late = 0;

      reports.forEach((report: any) => {
        const createdDate = new Date(report.created_at);
        const completedDate = report.updated_at ? new Date(report.updated_at) : new Date();

        const diffMs = completedDate.getTime() - createdDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours <= SLA_HOURS) {
          onTime++;
        } else {
          late++;
        }
      });

      const total = onTime + late;
      const slaRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

      setCurrentEarnings(earnings);
      setPercentage(earnPercentage);
      setSlaOnTime(onTime);
      setSlaLate(late);
      setSlaPercentage(slaRate);
      setTotalReports(total);
    } catch (error) {
      logError("Error in useLaudistaEarnings:", error);
      setCurrentEarnings(0);
      setPercentage(0);
      setSlaOnTime(0);
      setSlaLate(0);
      setSlaPercentage(0);
      setTotalReports(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsAndSLA();
  }, [userId]);

  const refetch = async () => {
    await fetchEarningsAndSLA();
  };

  return {
    currentEarnings,
    monthlyGoal,
    percentage,
    slaOnTime,
    slaLate,
    slaPercentage,
    totalReports,
    loading,
    refetch,
  };
}
