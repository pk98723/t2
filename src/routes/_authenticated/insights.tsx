import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile } from "@/lib/profile";
import { analyzeMonthlyExpenses, getCurrentMonthYear } from "@/lib/expense";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { type MonthlyExpenseAnalysis } from "@/lib/expense";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Insights · T2" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<MonthlyExpenseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());

  useEffect(() => {
    if (!user) return;
    loadInsights();
  }, [user, selectedMonth]);

  const loadInsights = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await fetchProfile(user.id);
      const monthlyIncome = profile?.monthly_salary || 0;

      const data = await analyzeMonthlyExpenses(user.id, selectedMonth.year, selectedMonth.month, monthlyIncome);
      setAnalysis(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const monthStr = new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Analysis
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Financial Insights</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your monthly spending analysis and personalized financial advice.
        </p>
      </div>

      {/* Month selector */}
      <div className="mb-8 flex gap-4 items-center">
        <button
          onClick={() => {
            const prev = new Date(selectedMonth.year, selectedMonth.month - 2);
            setSelectedMonth({ year: prev.getFullYear(), month: prev.getMonth() + 1 });
          }}
          className="px-4 py-2 rounded-lg border-2 border-foreground bg-muted hover:bg-muted/80 transition"
        >
          ← Prev
        </button>
        <span className="font-display text-lg font-bold min-w-[150px] text-center">{monthStr}</span>
        <button
          onClick={() => {
            const next = new Date(selectedMonth.year, selectedMonth.month);
            setSelectedMonth({ year: next.getFullYear(), month: next.getMonth() + 1 });
          }}
          className="px-4 py-2 rounded-lg border-2 border-foreground bg-muted hover:bg-muted/80 transition"
        >
          Next →
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading insights…</div>
      ) : analysis ? (
        <ExpenseInsights analysis={analysis} />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/30 p-10 text-center">
          <h3 className="font-display text-lg font-bold">No data yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add expenses to see your financial insights and personalized advice.
          </p>
        </div>
      )}
    </div>
  );
}
