import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchCategories, fetchTransactions, createTransaction, deleteTransaction, getCurrentMonthYear } from "@/lib/expense";
import { TransactionForm, TransactionList } from "@/components/ExpenseTracker";
import { type Transaction, type Category } from "@/lib/expense";
import { exportTransactionsToCSV } from "@/lib/export";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expenses · T2" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, selectedMonth]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cats, txs] = await Promise.all([
        fetchCategories(user.id),
        fetchTransactions(user.id, {
          startDate: `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`,
          endDate: `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-31`,
        }),
      ]);
      setCategories(cats);
      setTransactions(txs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (tx: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    try {
      const newTx = await createTransaction(user.id, tx);
      setTransactions([newTx, ...transactions]);
      toast.success("Expense added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add expense");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success("Expense deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete expense");
    }
  };

  const monthStr = new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Monthly tracking
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Expenses</h1>
        <p className="mt-2 text-lg text-muted-foreground">Track your monthly spending with category breakdown.</p>
      </div>

      {/* Month selector */}
      <div className="mb-8 flex gap-4 items-center flex-wrap">
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
        <button
          onClick={() => exportTransactionsToCSV(transactions, categories)}
          disabled={transactions.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg border-2 border-foreground bg-muted px-4 py-2 text-sm font-semibold transition hover:bg-muted/80 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading expenses…</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <TransactionForm
              categories={categories}
              onSubmit={handleAddTransaction}
              loading={false}
            />
          </div>
          <div>
            <TransactionList
              transactions={transactions}
              categories={new Map(categories.map((c) => [c.id, c]))}
              onDelete={handleDeleteTransaction}
            />
          </div>
        </div>
      )}
    </div>
  );
}
