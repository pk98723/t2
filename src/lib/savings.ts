import { supabase } from "@/integrations/supabase/client";

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export function calculateProgress(goal: SavingsGoal): number {
  if (goal.target_amount <= 0) return 0;
  return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
}

export function calculateProjectedCompletion(goal: SavingsGoal, monthlySaving: number): string | null {
  if (monthlySaving <= 0) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return "Already reached!";
  const months = Math.ceil(remaining / monthlySaving);
  if (months <= 1) return "1 month";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years} year, ${remMonths} months` : `${years} years`;
}

export async function fetchSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as SavingsGoal[];
}

export async function createSavingsGoal(
  userId: string,
  goal: Omit<SavingsGoal, "id" | "user_id" | "created_at" | "updated_at">
): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({ user_id: userId, ...goal })
    .select()
    .single();

  if (error) throw error;
  return data as SavingsGoal;
}

export async function updateSavingsGoal(
  id: string,
  patch: Partial<SavingsGoal>
): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from("savings_goals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as SavingsGoal;
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}

export async function addToSavingsGoal(id: string, amount: number): Promise<SavingsGoal> {
  const { data: current, error: fetchError } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  const newAmount = (current?.current_amount ?? 0) + amount;

  return updateSavingsGoal(id, { current_amount: newAmount } as any);
}

const CATEGORY_COLORS: Record<string, string> = {
  emergency: "#EF4444",
  purchase: "#F59E0B",
  vacation: "#3B82F6",
  debt: "#8B5CF6",
  investment: "#10B981",
  other: "#FFD700",
};

export function getCategoryColor(category: string | null): string {
  return category ? CATEGORY_COLORS[category] ?? "#FFD700" : "#FFD700";
}

export const GOAL_CATEGORIES = [
  { value: "emergency", label: "Emergency Fund" },
  { value: "purchase", label: "Big Purchase" },
  { value: "vacation", label: "Vacation" },
  { value: "debt", label: "Debt Repayment" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];