import { createFileRoute, Link } from "@tanstack/react-router";
import { PurchaseAnalyzer } from "@/components/PurchaseAnalyzer";
import { useAuth } from "@/hooks/use-auth";
import { Brain, TrendingDown, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T2 — Think Twice. Spend Right." },
      {
        name: "description",
        content:
          "T2 is your AI financial decision coach. Before you swipe that card, run the numbers. EMI ratio, emergency cushion, recovery time — in seconds.",
      },
      { property: "og:title", content: "T2 — Think Twice. Spend Right." },
      {
        property: "og:description",
        content: "AI financial decision coach. Should you buy this? Find out before you regret it.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-foreground bg-primary font-display text-lg font-black">
              T2
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Think Twice</span>
          </a>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/app"
                className="rounded-lg border-2 border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary hover:text-foreground"
              >
                Open app →
              </Link>
            ) : (
              <>
                <a href="#analyzer" className="hidden rounded-lg border-2 border-foreground bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted sm:inline-flex">
                  Try free
                </a>
                <Link
                  to="/login"
                  className="rounded-lg border-2 border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary hover:text-foreground"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-foreground bg-grid">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-brutal-sm">
                <Zap className="h-3.5 w-3.5" /> AI Financial Decision Coach
              </div>
              <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-balance sm:text-7xl">
                Think twice.
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">Spend right.</span>
                  <span className="absolute inset-x-0 bottom-1 -z-0 h-4 bg-primary sm:bottom-2 sm:h-6" />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
                Before you swipe that card, run the numbers. T2 shows the real impact on your EMI load,
                emergency fund and recovery time — in seconds.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#analyzer"
                  className="rounded-xl border-2 border-foreground bg-primary px-6 py-3.5 font-display text-base font-bold shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                >
                  Should I buy this? →
                </a>
                <a
                  href="#how"
                  className="rounded-xl border-2 border-foreground bg-background px-6 py-3.5 font-display text-base font-bold transition hover:bg-muted"
                >
                  How it works
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Analyzer */}
      <section id="analyzer" className="border-b-2 border-foreground bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              · The killer feature
            </div>
            <h2 className="mt-2 font-display text-4xl font-black sm:text-5xl">
              Should I buy this?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Drop in your numbers. Get an honest verdict — not a sales pitch.
            </p>
          </div>
          <PurchaseAnalyzer />
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-b-2 border-foreground bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="font-display text-4xl font-black sm:text-5xl">
            The math your gut won't do.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: TrendingDown,
                title: "EMI ratio rule",
                body: "If your total EMIs cross 35% of monthly income, you're in risky territory. T2 catches it before the swipe.",
              },
              {
                icon: Shield,
                title: "Emergency cushion",
                body: "Less than 3 months of expenses in savings? Big purchases get put on pause. Future-you says thanks.",
              },
              {
                icon: Brain,
                title: "AI coaching, not lecturing",
                body: "T2 explains the math in plain words and suggests a smarter path. Calm, supportive, never preachy.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-brutal-sm transition hover:-translate-y-1 hover:shadow-brutal"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-foreground bg-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">
            One question between you and <span className="text-primary">financial freedom.</span>
          </h2>
          <p className="mt-5 text-lg text-background/70">
            T2 is the pause button for impulse spending. Build the habit. Skip the regret.
          </p>
          <a
            href="#analyzer"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-7 py-4 font-display text-lg font-bold text-foreground shadow-brutal-sm transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            Run my first decision →
          </a>
        </div>
      </section>

      <footer className="border-t-2 border-primary bg-foreground py-6 text-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs">
          <span>T2 · Think Twice. Spend Right.</span>
          <span className="font-mono">v0.1 · MVP</span>
        </div>
      </footer>
    </div>
  );
}
