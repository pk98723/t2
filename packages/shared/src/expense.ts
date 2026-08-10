// Expense tracking types + pure analysis logic — shared by web + mobile.

// ============= TYPES =============

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  monthly_budget: number;
  is_essential: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  notes: string | null;
  transaction_date: string; // DATE format: YYYY-MM-DD
  is_recurring: boolean;
  recurring_interval: "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annual" | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  year: number;
  month: number;
  total_budget: number;
  discretionary_limit: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryBreakdown {
  category: Category;
  spent: number;
  budget: number;
  percentOfBudget: number;
  isOverBudget: boolean;
  transactions: Transaction[];
}

export interface MonthlyExpenseAnalysis {
  month: string; // "Jan 2026"
  total_income: number;
  total_expenses: number;
  total_budget: number;
  discretionary_spent: number;
  discretionary_limit: number;
  essential_spent: number;
  savings: number;
  savingsRate: number; // percentage
  categoryBreakdown: CategoryBreakdown[];
  advice: string[];
  healthScore: number; // 0-100
}

// ============= PURE ANALYSIS =============

export function generateExpenseAdvice(data: {
  totalExpenses: number;
  monthlyIncome: number;
  savings: number;
  savingsRate: number;
  discretionarySpent: number;
  discretionaryLimit: number;
  essentialSpent: number;
  categoryBreakdown: CategoryBreakdown[];
}): string[] {
  const advice: string[] = [];

  // Savings rate advice
  if (data.savingsRate < 10) {
    advice.push(
      "⚠️ Savings rate is below 10%. Aim to save at least 20% of your income for financial security."
    );
  } else if (data.savingsRate >= 20 && data.savingsRate <= 35) {
    advice.push("✓ Good savings rate! You're building financial resilience.");
  } else if (data.savingsRate > 35) {
    advice.push("🎯 Excellent savings discipline. You're building wealth effectively.");
  }

  // Discretionary spending advice
  if (data.discretionarySpent > data.discretionaryLimit && data.discretionaryLimit > 0) {
    const overage = data.discretionarySpent - data.discretionaryLimit;
    advice.push(
      `⚠️ Discretionary spending exceeded budget by ₹${Math.round(overage)}. Consider cutting back on non-essentials.`
    );
  }

  // Essential vs discretionary ratio
  const essentialRatio = data.essentialSpent / (data.totalExpenses || 1);
  if (essentialRatio > 0.8) {
    advice.push(
      "💡 You're spending 80%+ on essentials. Look for ways to reduce discretionary spending."
    );
  }

  // Over-budget categories
  const overBudgetCats = data.categoryBreakdown.filter((b) => b.isOverBudget);
  if (overBudgetCats.length > 0) {
    const cats = overBudgetCats.map((c) => c.category.name).join(", ");
    advice.push(`📊 Over budget in: ${cats}. Review these categories this month.`);
  }

  // Total expense advice
  if (data.totalExpenses > data.monthlyIncome) {
    advice.push(
      `⛔ Total expenses (₹${Math.round(data.totalExpenses)}) exceed income (₹${Math.round(data.monthlyIncome)}). You're going into deficit.`
    );
  }

  // Positive feedback
  if (advice.length === 0) {
    advice.push("✅ Great job! Your spending is within limits and savings rate is healthy.");
  }

  return advice;
}

export function calculateFinancialHealthScore(data: {
  savingsRate: number;
  discretionarySpent: number;
  discretionaryLimit: number;
  totalExpenses: number;
  totalBudget: number;
  categoryBreakdown: CategoryBreakdown[];
}): number {
  let score = 100;

  // Savings rate impact (40 points max)
  if (data.savingsRate >= 20) {
    score += 0;
  } else if (data.savingsRate >= 10) {
    score -= 10;
  } else {
    score -= 30;
  }

  // Budget adherence (30 points max)
  const budgetVariance = Math.abs(data.totalExpenses - data.totalBudget) / (data.totalBudget || 1);
  if (budgetVariance < 0.1) {
    score += 0;
  } else if (budgetVariance < 0.2) {
    score -= 5;
  } else {
    score -= 15;
  }

  // Discretionary overage (20 points max)
  if (data.discretionaryLimit > 0) {
    const discretionaryRatio = data.discretionarySpent / data.discretionaryLimit;
    if (discretionaryRatio > 1.2) {
      score -= 20;
    } else if (discretionaryRatio > 1) {
      score -= 10;
    }
  }

  // Categories over budget (10 points)
  const overBudgetCount = data.categoryBreakdown.filter((b) => b.isOverBudget).length;
  score -= overBudgetCount * 2;

  return Math.max(0, Math.min(100, score));
}

/**
 * Pure computation of the monthly expense analysis from already-loaded data.
 * This is the core logic extracted from the Supabase-backed analyzeMonthlyExpenses
 * so it can be shared by web and mobile apps.
 */
export function computeMonthlyExpenseAnalysis(params: {
  year: number;
  month: number;
  transactions: Transaction[];
  categories: Category[];
  budget: MonthlyBudget | null;
  monthlyIncome: number;
}): MonthlyExpenseAnalysis {
  const { year, month, transactions, categories, budget, monthlyIncome } = params;

  // Calculate category breakdown
  const categoryBreakdown = categories
    .map((cat) => {
      const categoryTransactions = transactions.filter((t) => t.category_id === cat.id);
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const budgetAmount = cat.monthly_budget || 0;

      return {
        category: cat,
        spent,
        budget: budgetAmount,
        percentOfBudget: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
        isOverBudget: spent > budgetAmount,
        transactions: categoryTransactions,
      };
    })
    .filter((b) => b.spent > 0 || b.budget > 0); // Show only categories with activity or budget

  // Calculate totals
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBudget = budget?.total_budget || categories.reduce((sum, c) => sum + c.monthly_budget, 0);

  const essentialSpent = categoryBreakdown
    .filter((b) => b.category.is_essential)
    .reduce((sum, b) => sum + b.spent, 0);

  const discretionarySpent = categoryBreakdown
    .filter((b) => !b.category.is_essential)
    .reduce((sum, b) => sum + b.spent, 0);

  const discretionaryLimit = budget?.discretionary_limit || 0;
  const savings = monthlyIncome - totalExpenses;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

  // Generate financial advice
  const advice = generateExpenseAdvice({
    totalExpenses,
    monthlyIncome,
    savings,
    savingsRate,
    discretionarySpent,
    discretionaryLimit,
    essentialSpent,
    categoryBreakdown,
  });

  // Calculate health score (0-100)
  const healthScore = calculateFinancialHealthScore({
    savingsRate,
    discretionarySpent,
    discretionaryLimit,
    totalExpenses,
    totalBudget,
    categoryBreakdown,
  });

  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "short", year: "numeric" });

  return {
    month: monthName,
    total_income: monthlyIncome,
    total_expenses: totalExpenses,
    total_budget: totalBudget,
    discretionary_spent: discretionarySpent,
    discretionary_limit: discretionaryLimit,
    essential_spent: essentialSpent,
    savings,
    savingsRate,
    categoryBreakdown,
    advice,
    healthScore,
  };
}

// ============= HELPERS =============

export const fmt = (n: number, currency = "₹") => `${currency}${Math.round(n).toLocaleString("en-IN")}`;

export const getMonthYear = (year: number, month: number) =>
  new Date(year, month - 1).toLocaleString("default", { month: "short", year: "numeric" });

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};