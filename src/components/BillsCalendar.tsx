import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchRecurringTransactions, getUpcomingBills, getRelativeDueLabel, getIntervalLabel, getDueUrgencyColor, type BillProjection } from "@/lib/bills";
import { type Transaction } from "@/lib/expense";
import { fmt } from "@/lib/finance";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function BillsCalendar() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<BillProjection[]>([]);
  const [allRecurring, setAllRecurring] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [upcomingData, allData] = await Promise.all([
        getUpcomingBills(user.id, 30),
        fetchRecurringTransactions(user.id),
      ]);
      setUpcoming(upcomingData);
      setAllRecurring(allData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-muted-foreground">
        Loading bills…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Bills (next 30 days) */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Clock className="h-5 w-5 text-primary" />
          Due in the next 30 days
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/30 p-10 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <h3 className="font-display text-lg font-bold">No upcoming bills</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Mark expenses as recurring in the Expenses page to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((bill) => {
              const urgencyColor = getDueUrgencyColor(bill.nextDate);
              const diffDays = Math.ceil((bill.nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={bill.id}
                  className="flex items-center gap-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-brutal-sm"
                >
                  {/* Urgency dot */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-foreground ${urgencyColor}`}>
                    {diffDays <= 0 ? (
                      <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
                    ) : (
                      <span className="font-display text-lg font-bold">{diffDays}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg font-bold truncate">
                      {bill.description || "Unnamed bill"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {bill.category && (
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: bill.category.color }}
                        />
                      )}
                      <span>{bill.category?.name}</span>
                      <span>·</span>
                      <span>{getRelativeDueLabel(bill.nextDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold">{fmt(bill.amount)}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {getIntervalLabel(bill.transaction.recurring_interval)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Recurring Transactions */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Calendar className="h-5 w-5 text-primary" />
          All recurring bills
        </h2>
        {allRecurring.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/30 p-10 text-center">
            <h3 className="font-display text-lg font-bold">No recurring transactions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              When you add an expense and mark it as recurring, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allRecurring.map((tx) => (
              <div
                key={tx.id}
                className="rounded-xl border-2 border-foreground bg-card p-4 shadow-brutal-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display font-bold">{tx.description || "Unnamed"}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border-2 border-foreground bg-muted px-2 py-0.5 text-xs font-semibold uppercase">
                        {getIntervalLabel(tx.recurring_interval)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Next: {new Date(tx.transaction_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="font-display text-lg font-bold">{fmt(tx.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}