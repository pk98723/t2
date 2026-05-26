import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile, upsertProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { analyze, type AnalysisInput, type Analysis } from "@/lib/finance";
import { PurchaseAnalyzerForm } from "@/components/PurchaseAnalyzer";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Analyze · T2" }] }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const { user } = useAuth();
  const [input, setInput] = useState<AnalysisInput | null>(null);
  const [itemName, setItemName] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      setInput({
        salary: p?.monthly_salary ?? 80000,
        expenses: p?.monthly_expenses ?? 35000,
        emi: p?.existing_emis ?? 12000,
        savings: p?.current_savings ?? 150000,
        price: 0,
        fundingMode: "savings",
        emiMonths: 12,
      });
    });
  }, [user]);

  const onAnalyze = (i: AnalysisInput) => {
    setInput(i);
    setResult(analyze(i));
  };

  const save = async () => {
    if (!user || !result || !input) return;
    setSaving(true);
    try {
      // Persist profile snapshot
      await upsertProfile(user.id, {
        monthly_salary: input.salary,
        monthly_expenses: input.expenses,
        existing_emis: input.emi,
        current_savings: input.savings,
      });
      const { error } = await supabase.from("decisions").insert({
        user_id: user.id,
        item_name: itemName || "Untitled purchase",
        price: input.price,
        funding_mode: input.fundingMode,
        tenure_months: input.fundingMode === "emi" ? input.emiMonths ?? null : null,
        emi_amount: input.fundingMode === "emi" ? Math.round(input.price / (input.emiMonths ?? 12)) : null,
        verdict: result.verdict,
        emi_ratio_before: result.emiRatioBefore,
        emi_ratio_after: result.emiRatioAfter,
        emergency_months_before: result.emergencyMonthsBefore,
        emergency_months_after: result.emergencyMonthsAfter,
        recovery_months: isFinite(result.monthsToRecover) ? result.monthsToRecover : 0,
        coach_notes: result.coachNotes as unknown as never,
        snapshot: input as unknown as never,
      });
      if (error) throw error;
      toast.success("Decision saved to your history");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  if (!input) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">Loading your profile…</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Welcome back
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Should I buy this?</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your numbers are pre-filled. Just tell us what tempts you.
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What are you buying?
        </label>
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g. iPhone 16 Pro"
          className="w-full max-w-md rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-display text-base font-semibold outline-none focus:ring-4 focus:ring-primary/40"
        />
      </div>

      <PurchaseAnalyzerForm
        initial={input}
        onResult={onAnalyze}
        result={result}
        afterResult={
          result && (
            <button
              onClick={save}
              disabled={saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-6 py-3 font-display text-base font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save to history"}
            </button>
          )
        }
      />
    </div>
  );
}
