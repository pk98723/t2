import { useState } from "react";
import { Transaction, Category, fmt } from "@/lib/expense";
import { Trash2, Edit2, Plus } from "lucide-react";

interface TransactionFormProps {
  categories: Category[];
  onSubmit: (transaction: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  loading?: boolean;
}

export function TransactionForm({ categories, onSubmit, loading }: TransactionFormProps) {
  const [form, setForm] = useState({
    category_id: categories[0]?.id || "",
    amount: 0,
    description: "",
    notes: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || form.amount <= 0) return;

    await onSubmit({
      category_id: form.category_id,
      amount: form.amount,
      description: form.description || null,
      notes: form.notes || null,
      transaction_date: form.transaction_date,
      is_recurring: false,
      recurring_interval: null,
      tags: null,
    });

    setForm({
      category_id: categories[0]?.id || "",
      amount: 0,
      description: "",
      notes: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
      <h3 className="mb-6 font-display text-xl font-bold">Add expense</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Amount (₹)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="0"
            className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-base font-semibold outline-none focus:ring-4 focus:ring-primary/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g., Groceries at Market"
            className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={form.transaction_date}
            onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
            className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !form.category_id || form.amount <= 0}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-6 py-3 font-display font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60"
      >
        <Plus className="h-5 w-5" />
        {loading ? "Saving..." : "Add expense"}
      </button>
    </form>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Map<string, Category>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
}

export function TransactionList({ transactions, categories, onDelete, loading }: TransactionListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await onDelete?.(id);
    } finally {
      setDeleting(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/30 p-10 text-center">
        <h3 className="font-display text-lg font-bold">No expenses yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Add your first expense to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const category = categories.get(tx.category_id);
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-xl border-2 border-foreground bg-card p-4 shadow-brutal-sm"
          >
            <div className="flex flex-1 items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-foreground"
                style={{ backgroundColor: category?.color || "#6366f1" }}
              >
                <span className="text-sm font-bold text-white">{category?.name[0]}</span>
              </div>
              <div className="flex-1">
                <div className="font-display font-bold">{tx.description || category?.name || "Unknown"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(tx.transaction_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-display text-lg font-bold">{fmt(tx.amount)}</div>
              </div>
              {onDelete && (
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={deleting === tx.id}
                  className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
