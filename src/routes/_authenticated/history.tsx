import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmt } from "@/lib/finance";
import { CheckCircle2, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History · T2" }] }),
  component: HistoryPage,
});

type Row = {
  id: string;
  item_name: string;
  price: number;
  funding_mode: string;
  verdict: "go" | "caution" | "stop";
  emi_ratio_after: number;
  emergency_months_after: number;
  created_at: string;
};

function HistoryPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("decisions")
      .select("id,item_name,price,funding_mode,verdict,emi_ratio_after,emergency_months_after,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("decisions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          · Decision log
        </div>
        <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">Your history</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Every purchase you ran through T2. The pause button, archived.
        </p>
      </div>

      {!rows ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/30 p-10 text-center">
          <h3 className="font-display text-xl font-bold">No decisions yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Run your first one — it'll show up here.</p>
          <Link
            to="/app"
            className="mt-5 inline-flex rounded-xl border-2 border-foreground bg-primary px-5 py-2.5 font-display text-sm font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            Analyze a purchase →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => {
            const tone =
              r.verdict === "go"
                ? { bg: "bg-success", Icon: CheckCircle2, label: "GO" }
                : r.verdict === "caution"
                ? { bg: "bg-warning", Icon: AlertTriangle, label: "PAUSE" }
                : { bg: "bg-destructive text-destructive-foreground", Icon: XCircle, label: "STOP" };
            const Icon = tone.Icon;
            return (
              <div
                key={r.id}
                className="grid items-center gap-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-brutal-sm sm:grid-cols-[auto_1fr_auto_auto]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-foreground ${tone.bg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold">{r.item_name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {fmt(r.price)} · {r.funding_mode === "emi" ? "EMI" : "Savings"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div>
                    <div className="font-mono uppercase tracking-widest text-muted-foreground">EMI</div>
                    <div className="font-display text-lg font-bold">{Number(r.emi_ratio_after).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="font-mono uppercase tracking-widest text-muted-foreground">Cushion</div>
                    <div className="font-display text-lg font-bold">{Number(r.emergency_months_after).toFixed(1)}mo</div>
                  </div>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-foreground bg-background transition hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
