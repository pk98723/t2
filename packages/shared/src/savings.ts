// Savings goals — types + pure math shared by web + mobile.

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

export function calculateProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100));
}

export function calculateProjectedCompletion(
  currentAmount: number,
  targetAmount: number,
  monthlySaving: number
): string | null {
  if (monthlySaving <= 0) return null;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return "Already reached!";
  const months = Math.ceil(remaining / monthlySaving);
  if (months <= 1) return "1 month";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years} year, ${remMonths} months` : `${years} years`;
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