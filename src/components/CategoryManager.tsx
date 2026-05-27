import { useState } from "react";
import { Category, fmt } from "@/lib/expense";
import { Edit2, Trash2, Plus } from "lucide-react";

interface CategoryFormProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  onUpdateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  loading?: boolean;
}

export function CategoryManager({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  loading,
}: CategoryFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "Wallet",
    monthly_budget: 0,
    is_essential: false,
  });

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    await onAddCategory(form);
    setForm({
      name: "",
      description: "",
      color: "#6366f1",
      icon: "Wallet",
      monthly_budget: 0,
      is_essential: false,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      {showForm && (
        <form onSubmit={handleAddCategory} className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal">
          <h3 className="mb-6 font-display text-xl font-bold">Add category</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Shopping"
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly budget (₹)
              </label>
              <input
                type="number"
                value={form.monthly_budget || ""}
                onChange={(e) => setForm({ ...form, monthly_budget: Number(e.target.value) })}
                placeholder="0"
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-sm outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Color
              </label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-10 w-full rounded-lg border-2 border-foreground cursor-pointer"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_essential}
                  onChange={(e) => setForm({ ...form, is_essential: e.target.checked })}
                  className="h-4 w-4 rounded border-2 border-foreground"
                />
                <span className="text-sm font-semibold">Essential expense (e.g., food, utilities)</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || !form.name}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-6 py-3 font-display font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60"
            >
              <Plus className="h-5 w-5" />
              {loading ? "Saving..." : "Create category"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border-2 border-foreground bg-muted px-6 py-3 font-display font-bold transition hover:bg-muted/80"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-6 py-3 font-display font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          <Plus className="h-5 w-5" />
          Add category
        </button>
      )}

      {/* Categories List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-xl border-2 border-foreground bg-card p-4 shadow-brutal-sm"
            style={{ borderColor: cat.color }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-display font-bold">{cat.name}</span>
                  {cat.is_essential && (
                    <span className="text-xs font-semibold bg-primary text-foreground px-2 py-1 rounded">
                      Essential
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Budget: <span className="font-mono font-bold">{fmt(cat.monthly_budget)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1.5 hover:bg-muted rounded transition"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
