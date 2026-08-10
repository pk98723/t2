import { supabase } from "@/integrations/supabase/client";
import type { SavingsGoal } from "@t2/shared";
import { calculateProgress, calculateProjectedCompletion, getCategoryColor, GOAL_CATEGORIES } from "@t2/shared";

// Re-export shared types and pure functions for backwards compatibility
export type { SavingsGoal } from "@t2/shared";
export { calculateProgress, calculateProjectedCompletion, getCategoryColor, GOAL_CATEGORIES } from "@t2/shared";

// ============= DATA-FETCHING FUNCTIONS (stays in web) =============

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