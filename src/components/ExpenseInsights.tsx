import { MonthlyExpenseAnalysis, fmt } from "@/lib/expense";
import { AlertTriangle, TrendingUp, PieChart, Target } from "lucide-react";

interface ExpenseInsightsProps {
  analysis: MonthlyExpenseAnalysis;
}

export function ExpenseInsights({ analysis }: ExpenseInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Health Score */}
      <div className="rounded-2xl border-2 border-foreground bg-foreground p-6 text-background shadow-brutal sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs font-bold tracking-widest opacity-70">FINANCIAL HEALTH</div>
            <div className="mt-2 font-display text-4xl font-black">{analysis.healthScore}%</div>
          </div>
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background"
            style={{
              background: `conic-gradient(#FFD700 0deg ${analysis.healthScore * 3.6}deg, #666 ${analysis.healthScore * 3.6}deg 360deg)`,
            }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background">
              <span className="font-display font-black">{analysis.healthScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Total Income"
          value={fmt(analysis.total_income)}
          icon={TrendingUp}
          color="bg-success"
        />
        <MetricCard
          label="Total Expenses"
          value={fmt(analysis.total_expenses)}
          icon={PieChart}
          color="bg-warning"
        />
        <MetricCard
          label="Savings"
          value={fmt(analysis.savings)}
          sublabel={`${analysis.savingsRate.toFixed(1)}% of income`}
          icon={Target}
          color={analysis.savingsRate >= 20 ? "bg-success" : "bg-warning"}
        />
        <MetricCard
          label="Budget Status"
          value={analysis.total_expenses > analysis.total_budget ? "Over" : "Under"}
          sublabel={`${Math.abs(analysis.total_budget - analysis.total_expenses).toFixed(0)}% variance`}
          icon={AlertTriangle}
          color={analysis.total_expenses > analysis.total_budget ? "bg-destructive" : "bg-success"}
        />
      </div>

      {/* Advice */}
      <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
        <h3 className="mb-4 font-display text-lg font-bold">Financial Advice</h3>
        <ul className="space-y-3">
          {analysis.advice.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
        <h3 className="mb-4 font-display text-lg font-bold">Category Breakdown</h3>
        <div className="space-y-4">
          {analysis.categoryBreakdown.map((breakdown) => (
            <div key={breakdown.category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-semibold">{breakdown.category.name}</div>
                <div className="text-right">
                  <div className="font-mono font-bold">{fmt(breakdown.spent)}</div>
                  {breakdown.budget > 0 && (
                    <div className="text-xs text-muted-foreground">Budget: {fmt(breakdown.budget)}</div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                  <div
                    className={`h-full ${
                      breakdown.isOverBudget ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.min(100, breakdown.percentOfBudget)}%`,
                    }}
                  />
                </div>
                <span className={`text-xs font-semibold w-12 text-right ${breakdown.isOverBudget ? "text-destructive" : ""}`}>
                  {breakdown.percentOfBudget.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: typeof AlertTriangle;
  color: string;
}) {
  return (
    <div className={`rounded-xl border-2 border-foreground ${color} p-4 text-foreground`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-75">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold">{value}</div>
          {sublabel && <div className="mt-1 text-xs opacity-75">{sublabel}</div>}
        </div>
        <Icon className="h-5 w-5 opacity-60" />
      </div>
    </div>
  );
}
