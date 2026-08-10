import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, type Transaction, type Category } from "@/lib/expense";
import { addDays, addMonths, addWeeks, formatDistanceToNow, parseISO } from "date-fns";

export interface BillProjection {
  id: string;
  transaction: Transaction;
  category: Category | null;
  nextDate: Date;
  amount: number;
  description: string | null;
}

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

export function computeNextOccurrences(transaction: Transaction, count = 6): Date[] {
  const baseDate = parseISO(transaction.transaction_date);
  const dates: Date[] = [];
  const interval = transaction.recurring_interval || "monthly";

  for (let i = 0; i < count; i++) {
    let next: Date;
    switch (interval) {
      case "daily":
        next = addDays(baseDate, i + 1);
        break;
      case "weekly":
        next = addWeeks(baseDate, i + 1);
        break;
      case "bi-weekly":
        next = addWeeks(baseDate, (i + 1) * 2);
        break;
      case "monthly":
        next = addMonths(baseDate, i + 1);
        break;
      case "quarterly":
        next = addMonths(baseDate, (i + 1) * 3);
        break;
      case "annual":
        next = addMonths(baseDate, (i + 1) * 12);
        break;
      default:
        next = addMonths(baseDate, i + 1);
    }
    dates.push(next);
  }
  return dates;
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
    const occurrences = computeNextOccurrences(tx, 12);
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
      // If we've gone past the cutoff, stop checking this transaction
      if (date > cutoff) break;
    }
  }

  // Sort by nearest date first
  projections.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return projections;
}

export function getRelativeDueLabel(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getIntervalLabel(interval: string | null): string {
  switch (interval) {
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "bi-weekly": return "Bi-weekly";
    case "monthly": return "Monthly";
    case "quarterly": return "Quarterly";
    case "annual": return "Annual";
    default: return "Recurring";
  }
}

export function getDueUrgencyColor(date: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "bg-destructive";
  if (diffDays <= 3) return "bg-warning";
  return "bg-success";
}