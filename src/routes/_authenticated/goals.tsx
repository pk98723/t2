import { createFileRoute } from "@tanstack/react-router";
import { SavingsGoals } from "@/components/SavingsGoals";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals · T2" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Targets
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Savings Goals</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Set financial targets and track your progress.
        </p>
      </div>
      <SavingsGoals />
    </div>
  );
}