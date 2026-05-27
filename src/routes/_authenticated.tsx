import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-foreground bg-primary font-display text-lg font-black">
              T2
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Think Twice</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Link
              to="/app"
              activeProps={{ className: "bg-foreground text-background" }}
              className="rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
            >
              Analyze
            </Link>
            <Link
              to="/expenses"
              activeProps={{ className: "bg-foreground text-background" }}
              className="rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
            >
              Expenses
            </Link>
            <Link
              to="/insights"
              activeProps={{ className: "bg-foreground text-background" }}
              className="rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
            >
              Insights
            </Link>
            <Link
              to="/categories"
              activeProps={{ className: "bg-foreground text-background" }}
              className="rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
            >
              Categories
            </Link>
            <Link
              to="/history"
              activeProps={{ className: "bg-foreground text-background" }}
              className="rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
            >
              History
            </Link>
            <Link
              to="/profile"
              activeProps={{ className: "bg-foreground text-background" }}
              className="rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-semibold transition hover:bg-muted"
            >
              Profile
            </Link>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/", replace: true });
              }}
              className="ml-1 rounded-lg border-2 border-foreground bg-background px-3 py-1.5 text-sm font-semibold transition hover:bg-destructive hover:text-destructive-foreground"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
