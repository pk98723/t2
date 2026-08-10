import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { fetchDashboardData, type DashboardData } from "@/lib/dashboard";
import { MetricCard } from "@/components/MetricCard";
import { fmt } from "@/lib/finance";
import { Wallet, TrendingUp, PiggyBank, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchDashboardData(user.id)
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">
        Loading your financial overview…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">
        Couldn't load dashboard data.
      </div>
    );
  }

  const profile = data.profile;
  const monthlyIncome = profile?.monthly_salary ?? 0;
  const monthlyExpenses = profile?.monthly_expenses ?? 0;
  const monthlySavings = monthlyIncome - monthlyExpenses - (profile?.existing_emis ?? 0);
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      {/* Header */}
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Overview
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your financial health at a glance.
        </p>
      </div>

      {/* Health Score + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Health Score Ring */}
        <div className="rounded-2xl border-2 border-foreground bg-foreground p-6 text-background shadow-brutal sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs font-bold tracking-widest opacity-70">FINANCIAL HEALTH</div>
              <div className="mt-2 font-display text-4xl font-black">{data.healthScore}%</div>
              <div className="mt-1 text-sm opacity-70">
                {data.healthScore >= 80 ? "Excellent shape" : data.healthScore >= 50 ? "Doing okay" : "Needs attention"}
              </div>
            </div>
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background"
              style={{
                background: `conic-gradient(#FFD700 0deg ${data.healthScore * 3.6}deg, #666 ${data.healthScore * 3.6}deg 360deg)`,
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background">
                <span className="font-display font-black">{data.healthScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-5 py-3 font-display text-sm font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            <Wallet className="h-4 w-4" /> Analyze purchase <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/expenses"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-background px-5 py-3 font-display text-sm font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            <TrendingUp className="h-4 w-4" /> Add expense <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-background px-5 py-3 font-display text-sm font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            <AlertTriangle className="h-4 w-4" /> View insights <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Monthly Income"
          value={fmt(monthlyIncome)}
          icon={TrendingUp}
          color="bg-success"
        />
        <MetricCard
          label="Monthly Expenses"
          value={fmt(monthlyExpenses)}
          sublabel={`${monthlyIncome > 0 ? ((monthlyExpenses / monthlyIncome) * 100).toFixed(0) : 0}% of income`}
          icon={Wallet}
          color="bg-warning"
        />
        <MetricCard
          label="Monthly Savings"
          value={fmt(Math.max(monthlySavings, 0))}
          sublabel={`${savingsRate.toFixed(0)}% of income`}
          icon={PiggyBank}
          color={savingsRate >= 20 ? "bg-success" : monthlySavings > 0 ? "bg-warning" : "bg-destructive"}
        />
        <MetricCard
          label="Emergency Cushion"
          value={profile?.current_savings && monthlyExpenses > 0
            ? `${(profile.current_savings / monthlyExpenses).toFixed(1)}mo`
            : "—"}
          sublabel={`Target: ${profile?.emergency_target_months ?? 6}mo`}
          icon={AlertTriangle}
          color={profile && (profile.current_savings / (monthlyExpenses || 1)) >= (profile.emergency_target_months || 6) ? "bg-success" : "bg-warning"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Decisions */}
        <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Recent Decisions</h3>
            <Link to="/history" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          {data.recentDecisions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p>No decisions yet.</p>
              <Link to="/app" className="mt-2 inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                Analyze your first purchase <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentDecisions.map((d) => {
                const tone =
                  d.verdict === "go"
                    ? { bg: "bg-success", icon: CheckCircle2 }
                    : d.verdict === "caution"
                    ? { bg: "bg-warning", icon: AlertTriangle }
                    : { bg: "bg-destructive text-destructive-foreground", icon: XCircle };
                const Icon = tone.icon;
                return (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border-2 border-foreground bg-background p-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-foreground ${tone.bg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold truncate">{d.item_name}</div>
                      <div className="text-xs text-muted-foreground">{fmt(d.price)} · {new Date(d.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-mono font-semibold">{d.emi_ratio_after.toFixed(0)}% EMI</div>
                      <div className="text-muted-foreground">{d.emergency_months_after.toFixed(1)}mo</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Upcoming Bills</h3>
            <span className="text-xs text-muted-foreground">Recurring</span>
          </div>
          {data.upcomingBills.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p>No recurring bills set up.</p>
              <p className="mt-1 text-xs">Mark expenses as recurring in the Expenses page.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingBills.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl border-2 border-foreground bg-background p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-foreground bg-primary font-mono text-sm font-bold">
                    {tx.recurring_interval?.[0]?.toUpperCase() ?? "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold truncate">{tx.description || "Recurring"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{tx.recurring_interval ?? "recurring"} · due {new Date(tx.transaction_date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-display text-lg font-bold">{fmt(tx.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Recent Transactions</h3>
          <Link to="/expenses" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>No transactions yet.</p>
            <Link to="/expenses" className="mt-2 inline-flex items-center gap-1 text-primary font-semibold hover:underline">
              Add your first expense <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border-2 border-foreground bg-background px-4 py-3">
                <div>
                  <div className="font-display font-semibold">{tx.description || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString()}</div>
                </div>
                <div className="font-display text-lg font-bold">{fmt(tx.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}