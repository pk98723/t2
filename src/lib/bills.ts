import { supabase } from "@/integrations/supabase/client";
import type { Transaction, Category } from "@/lib/expense";
import { fetchCategories } from "@/lib/expense";
import { addDays } from "date-fns";
import { computeNextOccurrences, getRelativeDueLabel, getIntervalLabel, getDueUrgencyColor } from "@t2/shared";

// Re-export shared pure functions
export { computeNextOccurrences, getRelativeDueLabel, getIntervalLabel, getDueUrgencyColor } from "@t2/shared";

// Keep the richer BillProjection type locally (web also needs transaction + category refs)
export interface BillProjection {
  id: string;
  transaction: Transaction;
  category: Category | null;
  nextDate: Date;
  amount: number;
  description: string | null;
}

// ============= DATA-FETCHING FUNCTIONS (stays in web) =============

export async function fetchRecurringTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_recurring", true)
    .order("transaction_date", { ascending: true });

  if (error) throw error;
  return (data || []) as Transaction[];
}

export async function getUpcomingBills(userId: string, daysAhead = 30): Promise<BillProjection[]> {
  const [transactions, categories] = await Promise.all([
    fetchRecurringTransactions(userId),
    fetchCategories(userId),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const now = new Date();
  const cutoff = addDays(now, daysAhead);
  const projections: BillProjection[] = [];

  for (const tx of transactions) {
    const occurrences = computeNextOccurrences(tx.transaction_date, tx.recurring_interval, 12);
    for (const date of occurrences) {
      if (date >= now && date <= cutoff) {
        projections.push({
          id: `${tx.id}_${date.toISOString()}`,
          transaction: tx,
          category: categoryMap.get(tx.category_id) ?? null,
          nextDate: date,
          amount: tx.amount,
          description: tx.description,
        });
      }
      if (date > cutoff) break;
    }
  }

  // Sort by nearest date first
  projections.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return projections;
}