// Mobile data-fetching layer — thin wrappers over supabase using @t2/shared types

import { supabase } from "@/lib/supabase";
import type { Transaction, Category, MonthlyBudget } from "@t2/shared";

// ============ PROFILE ============

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  monthly_salary: number | null;
  created_at: string;
  updated_at: string;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// ============ CATEGORIES ============

export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Category[];
}

// ============ TRANSACTIONS ============

export async function fetchTransactions(
  userId: string,
  filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<Transaction[]> {
  let query = supabase.from("transactions").select("*").eq("user_id", userId);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.startDate) query = query.gte("transaction_date", filters.startDate);
  if (filters?.endDate) query = query.lte("transaction_date", filters.endDate);
  query = query.order("transaction_date", { ascending: false });
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Transaction[];
}

export async function createTransaction(
  userId: string,
  tx: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Transaction> {
  if (tx.amount <= 0) throw new Error("Amount must be greater than 0");
  const { data, error } = await supabase
    .from("transactions")
    .insert({ user_id: userId, ...tx })
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) throw error;
}

// ============ MONTHLY BUDGET ============

export async function fetchMonthlyBudget(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyBudget | null> {
  const { data, error } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data as MonthlyBudget | null;
}

// ============ DASHBOARD ============

import { computeMonthlyExpenseAnalysis, getCurrentMonthYear } from "@t2/shared";

export interface DashboardData {
  profile: Profile | null;
  healthScore: number;
  recentTransactions: Transaction[];
  upcomingBills: Transaction[];
  currentMonth: { year: number; month: number };
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const { year, month } = getCurrentMonthYear();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const [profile, monthTxs, allRecurring] = await Promise.all([
    fetchProfile(userId),
    fetchTransactions(userId, { startDate, endDate }),
    fetchTransactions(userId, { limit: 50 }).then((txs) =>
      txs.filter((t) => t.is_recurring).slice(0, 5)
    ),
  ]);

  let healthScore = 0;
  if (profile?.monthly_salary) {
    try {
      const categories = await fetchCategories(userId);
      const budget = await fetchMonthlyBudget(userId, year, month);
      const analysis = computeMonthlyExpenseAnalysis({
        year,
        month,
        transactions: monthTxs,
        categories,
        budget,
        monthlyIncome: profile.monthly_salary,
      });
      healthScore = analysis.healthScore;
    } catch { /* empty month is fine */ }
  }

  return {
    profile,
    healthScore,
    recentTransactions: monthTxs.slice(0, 5),
    upcomingBills: allRecurring,
    currentMonth: { year, month },
  };
}