import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavingsGoal,
  calculateProgress, calculateProjectedCompletion, getCategoryColor, GOAL_CATEGORIES,
  type SavingsGoal,
} from "@/lib/savings";
import { fmt } from "@/lib/finance";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, PiggyBank, Target, Calendar, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function SavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [addFunds, setAddFunds] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    name: "",
    target_amount: 0,
    current_amount: 0,
    target_date: "",
    category: "other",
    color: "#FFD700",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchSavingsGoals(user.id);
      setGoals(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const resetForm = () => {
    setForm({ name: "", target_amount: 0, current_amount: 0, target_date: "", category: "other", color: "#FFD700" });
    setShowForm(false);
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!user || !form.name || form.target_amount <= 0) return;
    try {
      const goal = await createSavingsGoal(user.id, {
        name: form.name,
        target_amount: form.target_amount,
        current_amount: form.current_amount,
        target_date: form.target_date || null,
        category: form.category,
        color: form.color,
      });
      setGoals([...goals, goal]);
      toast.success("Goal created!");
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create goal");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await updateSavingsGoal(id, {
        name: form.name,
        target_amount: form.target_amount,
        current_amount: form.current_amount,
        target_date: form.target_date || null,
        category: form.category,
        color: form.color,
      } as any);
      setGoals(goals.map((g) => (g.id === id ? updated : g)));
      toast.success("Goal updated!");
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update goal");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavingsGoal(id);
      setGoals(goals.filter((g) => g.id !== id));
      toast.success("Goal deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete goal");
    }
  };

  const handleAddFunds = async (id: string) => {
    if (fundAmount <= 0) return;
    try {
      const updated = await addToSavingsGoal(id, fundAmount);
      setGoals(goals.map((g) => (g.id === id ? updated : g)));
      toast.success(`Added ${fmt(fundAmount)} to goal`);
      setAddFunds(null);
      setFundAmount(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add funds");
    }
  };

  const startEdit = (goal: SavingsGoal) => {
    setForm({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date || "",
      category: goal.category || "other",
      color: goal.color,
    });
    setEditing(goal.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading goals…</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Goal Button */}
      {!showForm && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-5 py-3 font-display text-sm font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          <Plus className="h-4 w-4" /> New savings goal
        </button>
      )}

      {/* Goal Form */}
      {showForm && (
        <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
          <h3 className="mb-4 font-display text-lg font-bold">
            {editing ? "Edit goal" : "New savings goal"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Emergency Fund"
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Amount (₹)
              </label>
              <input
                type="number"
                value={form.target_amount || ""}
                onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })}
                placeholder="100000"
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Amount (₹)
              </label>
              <input
                type="number"
                value={form.current_amount || ""}
                onChange={(e) => setForm({ ...form, current_amount: Number(e.target.value) })}
                placeholder="0"
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={editing ? () => handleUpdate(editing) : handleCreate}
              disabled={!form.name || form.target_amount <= 0}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-5 py-2.5 font-display text-sm font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60"
            >
              {editing ? "Update" : "Create"} goal
            </button>
            <button
              onClick={resetForm}
              className="rounded-xl border-2 border-foreground bg-background px-5 py-2.5 font-display text-sm font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 && !showForm ? (
        <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/30 p-10 text-center">
          <PiggyBank className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <h3 className="font-display text-lg font-bold">No savings goals</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Set a goal — whether it's an emergency fund, a vacation, or a big purchase.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <div
                key={goal.id}
                className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-brutal-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-foreground"
                      style={{ backgroundColor: goal.color }}
                    >
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-display font-bold">{goal.name}</div>
                      {goal.category && (
                        <div className="text-xs text-muted-foreground capitalize">
                          {GOAL_CATEGORIES.find((c) => c.value === goal.category)?.label ?? goal.category}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(goal)}
                      className="rounded-lg border-2 border-foreground bg-background p-1.5 transition hover:bg-muted"
                      aria-label="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="rounded-lg border-2 border-foreground bg-background p-1.5 transition hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono font-semibold">{fmt(goal.current_amount)}</span>
                    <span className="font-mono font-semibold">{fmt(goal.target_amount)}</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary">{progress}%</span>
                  {goal.target_date && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.target_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Add Funds */}
                {addFunds === goal.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      value={fundAmount || ""}
                      onChange={(e) => setFundAmount(Number(e.target.value))}
                      placeholder="Amount"
                      className="flex-1 rounded-lg border-2 border-foreground bg-background px-3 py-1.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddFunds(goal.id)}
                      disabled={fundAmount <= 0}
                      className="rounded-lg border-2 border-foreground bg-primary px-3 py-1.5 font-display text-sm font-bold transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddFunds(null); setFundAmount(0); }}
                      className="rounded-lg border-2 border-foreground bg-background px-3 py-1.5 font-display text-sm font-bold transition hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddFunds(goal.id)}
                    className="mt-3 w-full rounded-lg border-2 border-foreground bg-background py-2 font-display text-sm font-bold transition hover:bg-muted"
                  >
                    + Add funds
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}