import { supabase } from "@/integrations/supabase/client";
import {
  computeMonthlyExpenseAnalysis,
  type Category,
  type Transaction,
  type MonthlyBudget,
  type MonthlyExpenseAnalysis,
} from "@t2/shared";

// Re-export shared types and pure helpers for backwards compatibility
export type {
  Category,
  Transaction,
  MonthlyBudget,
  MonthlyExpenseAnalysis,
} from "@t2/shared";
export {
  generateExpenseAdvice,
  calculateFinancialHealthScore,
  fmt,
  getMonthYear,
  getCurrentMonthYear,
} from "@t2/shared";

// ============= CATEGORIES =============

export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as Category[];
}

export async function createCategory(
  userId: string,
  category: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, ...category })
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(categoryId: string, patch: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw error;
}

// ============= TRANSACTIONS =============

export async function fetchTransactions(
  userId: string,
  filters?: {
    categoryId?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    limit?: number;
  }
): Promise<Transaction[]> {
  let query = supabase.from("transactions").select("*").eq("user_id", userId);

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.startDate) {
    query = query.gte("transaction_date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("transaction_date", filters.endDate);
  }

  query = query.order("transaction_date", { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Transaction[];
}

export async function createTransaction(
  userId: string,
  transaction: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Transaction> {
  // Validate amount
  if (transaction.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({ user_id: userId, ...transaction })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(transactionId: string, patch: Partial<Transaction>): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update(patch)
    .eq("id", transactionId)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) throw error;
}

// ============= MONTHLY BUDGETS =============

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

export async function upsertMonthlyBudget(
  userId: string,
  year: number,
  month: number,
  patch: Omit<MonthlyBudget, "id" | "user_id" | "year" | "month" | "created_at" | "updated_at">
): Promise<MonthlyBudget> {
  const { data, error } = await supabase
    .from("monthly_budgets")
    .upsert(
      { user_id: userId, year, month, ...patch },
      { onConflict: "user_id,year,month" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as MonthlyBudget;
}

// ============= ANALYSIS & INSIGHTS =============

export async function analyzeMonthlyExpenses(
  userId: string,
  year: number,
  month: number,
  monthlyIncome: number
): Promise<MonthlyExpenseAnalysis> {
  // Get all data needed for analysis
  const [transactions, categories, budget] = await Promise.all([
    fetchTransactions(userId, {
      startDate: `${year}-${String(month).padStart(2, "0")}-01`,
      endDate: `${year}-${String(month).padStart(2, "0")}-31`,
    }),
    fetchCategories(userId),
    fetchMonthlyBudget(userId, year, month),
  ]);

  // Delegate the pure computation to the shared package
  return computeMonthlyExpenseAnalysis({
    year,
    month,
    transactions,
    categories,
    budget,
    monthlyIncome,
  });
}
