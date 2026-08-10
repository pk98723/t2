import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, type Profile } from "@/lib/profile";
import { fetchTransactions, analyzeMonthlyExpenses, getCurrentMonthYear, type Transaction, type MonthlyExpenseAnalysis } from "@/lib/expense";

export interface DashboardData {
  profile: Profile | null;
  healthScore: number;
  healthScoreAnalysis: MonthlyExpenseAnalysis | null;
  recentDecisions: DecisionRow[];
  recentTransactions: Transaction[];
  upcomingBills: Transaction[];
  currentMonth: { year: number; month: number };
}

export interface DecisionRow {
  id: string;
  item_name: string;
  price: number;
  funding_mode: string;
  verdict: "go" | "caution" | "stop";
  emi_ratio_after: number;
  emergency_months_after: number;
  created_at: string;
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const { year, month } = getCurrentMonthYear();

  const fetchRecentDecisions = async () => {
    const { data, error } = await supabase
      .from("decisions")
      .select("id,item_name,price,funding_mode,verdict,emi_ratio_after,emergency_months_after,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    return (data ?? []) as DecisionRow[];
  };

  const fetchUpcomingBills = async () => {
    const allTxs = await fetchTransactions(userId, { limit: 50 });
    // Filter for recurring transactions and sort by date
    const recurring = allTxs.filter((t) => t.is_recurring);
    // Sort by transaction_date ascending so nearest upcoming bills are first
    recurring.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    return recurring.slice(0, 5);
  };

  const [profile, recentDecisions, recentTransactions, upcomingBills] = await Promise.all([
    fetchProfile(userId),
    fetchRecentDecisions(),
    fetchTransactions(userId, { limit: 5 }),
    fetchUpcomingBills(),
  ]);

  let healthScore = 0;
  let healthScoreAnalysis: MonthlyExpenseAnalysis | null = null;

  if (profile) {
    try {
      healthScoreAnalysis = await analyzeMonthlyExpenses(userId, year, month, profile.monthly_salary || 0);
      healthScore = healthScoreAnalysis.healthScore;
    } catch {
      // Monthly analysis may fail if no data yet — that's fine
    }
  }

  return {
    profile,
    healthScore,
    healthScoreAnalysis,
    recentDecisions,
    recentTransactions,
    upcomingBills,
    currentMonth: { year, month },
  };
}