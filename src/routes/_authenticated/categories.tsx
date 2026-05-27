import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile } from "@/lib/profile";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/expense";
import { CategoryManager } from "@/components/CategoryManager";
import { type Category } from "@/lib/expense";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Categories · T2" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cats = await fetchCategories(user.id);
      setCategories(cats);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (
    category: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) return;
    try {
      const newCat = await createCategory(user.id, category);
      setCategories([...categories, newCat]);
      toast.success("Category created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create category");
    }
  };

  const handleUpdateCategory = async (id: string, patch: Partial<Category>) => {
    try {
      const updated = await updateCategory(id, patch);
      setCategories(categories.map((c) => (c.id === id ? updated : c)));
      toast.success("Category updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete category");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Organization
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Categories</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Organize expenses by category and set monthly budgets.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading categories…</div>
      ) : (
        <CategoryManager
          categories={categories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          loading={false}
        />
      )}
    </div>
  );
}
