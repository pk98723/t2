import { createFileRoute } from "@tanstack/react-router";
import { BillsCalendar } from "@/components/BillsCalendar";

export const Route = createFileRoute("/_authenticated/bills")({
  head: () => ({ meta: [{ title: "Bills · T2" }] }),
  component: BillsPage,
});

function BillsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Upcoming
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Bills & Recurring</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Track your recurring payments and see what's due next.
        </p>
      </div>
      <BillsCalendar />
    </div>
  );
}