import { useState, type ReactNode } from "react";
import { analyze, fmt, type AnalysisInput, type Analysis } from "@/lib/finance";
import { ArrowRight, Wallet, AlertTriangle, CheckCircle2, XCircle, Sparkles } from "lucide-react";

const defaultInput: AnalysisInput = {
  salary: 80000,
  expenses: 35000,
  emi: 12000,
  savings: 150000,
  price: 60000,
  fundingMode: "savings",
  emiMonths: 12,
};

export function PurchaseAnalyzer() {
  const [result, setResult] = useState<Analysis | null>(null);
  const [lastPrice, setLastPrice] = useState(0);
  return (
    <PurchaseAnalyzerForm
      initial={defaultInput}
      result={result}
      onResult={(i) => {
        setResult(analyze(i));
        setLastPrice(i.price);
      }}
      lastPrice={lastPrice}
    />
  );
}

export function PurchaseAnalyzerForm({
  initial,
  onResult,
  result,
  afterResult,
  lastPrice,
}: {
  initial: AnalysisInput;
  onResult: (input: AnalysisInput) => void;
  result: Analysis | null;
  afterResult?: ReactNode;
  lastPrice?: number;
}) {
  const [input, setInput] = useState<AnalysisInput>(initial);

  const update = (k: keyof AnalysisInput, v: number | string) => {
    const numValue = typeof v === "string" && k === "fundingMode" ? v : Number(v);
    
    // Validation: ensure numbers are non-negative
    if (typeof numValue === "number" && numValue < 0) {
      return; // Ignore negative values
    }
    
    setInput((s) => ({ ...s, [k]: numValue }) as AnalysisInput);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-foreground bg-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Your money snapshot</h3>
            <p className="text-sm text-muted-foreground">All values monthly, in ₹</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly salary" value={input.salary} onChange={(v) => update("salary", v)} />
          <Field label="Monthly expenses" value={input.expenses} onChange={(v) => update("expenses", v)} />
          <Field label="Existing EMIs" value={input.emi} onChange={(v) => update("emi", v)} />
          <Field label="Total savings" value={input.savings} onChange={(v) => update("savings", v)} />
        </div>

        <div className="my-6 h-px bg-foreground/15" />

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-foreground bg-foreground text-background">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">The thing you want</h3>
            <p className="text-sm text-muted-foreground">Price + how you'd pay</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price" value={input.price} onChange={(v) => update("price", v)} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Funding
            </label>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border-2 border-foreground">
              {(["savings", "emi"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setInput((s) => ({ ...s, fundingMode: m }))}
                  className={`px-3 py-2.5 text-sm font-semibold transition ${
                    input.fundingMode === m ? "bg-foreground text-background" : "bg-card hover:bg-muted"
                  }`}
                >
                  {m === "savings" ? "Savings" : "New EMI"}
                </button>
              ))}
            </div>
          </div>
          {input.fundingMode === "emi" && (
            <Field
              label="EMI tenure (months)"
              value={input.emiMonths ?? 12}
              onChange={(v) => update("emiMonths", v)}
            />
          )}
        </div>

        <button
          onClick={() => onResult(input)}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary px-6 py-4 font-display text-lg font-bold text-foreground shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
        >
          Should I buy this? <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <ResultPanel result={result} price={lastPrice ?? input.price} />
        {afterResult}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border-2 border-foreground bg-background px-3 py-2.5 font-mono text-base font-semibold outline-none focus:ring-4 focus:ring-primary/40"
      />
    </div>
  );
}

function ResultPanel({ result, price }: { result: Analysis | null; price: number }) {
  if (!result) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/40 p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground bg-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="font-display text-xl font-bold">Your verdict appears here</h3>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Fill in the numbers and hit the button. T2 runs the math your gut won't.
        </p>
      </div>
    );
  }

  const tone =
    result.verdict === "go"
      ? { bg: "bg-success", icon: CheckCircle2, label: "GO" }
      : result.verdict === "caution"
      ? { bg: "bg-warning", icon: AlertTriangle, label: "PAUSE" }
      : { bg: "bg-destructive text-destructive-foreground", icon: XCircle, label: "STOP" };
  const Icon = tone.icon;

  return (
    <div className="rounded-2xl border-2 border-foreground bg-foreground p-6 text-background shadow-brutal sm:p-8">
      <div className={`mb-6 flex items-center gap-3 rounded-xl border-2 border-foreground ${tone.bg} p-4 text-foreground`}>
        <Icon className="h-8 w-8" />
        <div>
          <div className="font-mono text-xs font-bold tracking-widest opacity-70">VERDICT · {tone.label}</div>
          <div className="font-display text-xl font-bold leading-tight">{result.headline}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="EMI ratio"
          before={`${result.emiRatioBefore.toFixed(0)}%`}
          after={`${result.emiRatioAfter.toFixed(0)}%`}
          warn={result.emiRatioAfter > 35}
        />
        <Metric
          label="Emergency months"
          before={result.emergencyMonthsBefore.toFixed(1)}
          after={result.emergencyMonthsAfter.toFixed(1)}
          warn={result.emergencyMonthsAfter < 3}
        />
      </div>

      <div className="mt-4 rounded-xl border border-background/20 bg-background/5 p-4">
        <div className="font-mono text-xs font-bold tracking-widest text-primary">RECOVERY</div>
        <div className="mt-1 font-display text-lg font-bold">
          {isFinite(result.monthsToRecover)
            ? `~${Math.ceil(result.monthsToRecover)} months to rebuild ${fmt(price)}`
            : "You're not saving anything monthly"}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 font-mono text-xs font-bold tracking-widest text-primary">COACH NOTES</div>
        <ul className="space-y-2">
          {result.coachNotes.map((n, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-background/90">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({
  label,
  before,
  after,
  warn,
}: {
  label: string;
  before: string;
  after: string;
  warn: boolean;
}) {
  return (
    <div className="rounded-xl border border-background/20 bg-background/5 p-4">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-background/60">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-sm text-background/50 line-through">{before}</span>
        <ArrowRight className="h-3 w-3 text-background/40" />
        <span className={`font-display text-2xl font-bold ${warn ? "text-destructive" : "text-primary"}`}>
          {after}
        </span>
      </div>
    </div>
  );
}
