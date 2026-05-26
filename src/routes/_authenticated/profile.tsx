import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile, upsertProfile, type Profile } from "@/lib/profile";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · T2" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Partial<Profile> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((data) => setP(data ?? {
      monthly_salary: 0, monthly_expenses: 0, existing_emis: 0, current_savings: 0, emergency_target_months: 6,
    }));
  }, [user]);

  const save = async () => {
    if (!user || !p) return;
    setSaving(true);
    try {
      await upsertProfile(user.id, p);
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  if (!p) return <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">· You</div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Your money snapshot</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Update once. T2 uses it every time you analyze a purchase.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal sm:p-8">
        <div className="mb-4 text-sm text-muted-foreground">
          Signed in as <span className="font-mono font-semibold text-foreground">{user?.email}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["monthly_salary", "Monthly salary (₹)"],
            ["monthly_expenses", "Monthly expenses (₹)"],
            ["existing_emis", "Existing EMIs (₹)"],
            ["current_savings", "Total savings (₹)"],
            ["emergency_target_months", "Emergency target (months)"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </label>
              <input
                type="number"
                value={(p as any)[key] ?? 0}
                onChange={(e) => setP((s) => ({ ...s, [key]: Number(e.target.value) }))}
                className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-base font-semibold outline-none focus:ring-4 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-6 py-3 font-display text-base font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
