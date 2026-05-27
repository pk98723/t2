# T2 (Think Twice) - AI Coding Instructions

**Project**: Personal finance decision app for analyzing purchase decisions based on financial profiles.

## Quick Start

- **Build**: `bun run build` or `npm run build` (TypeScript + Vite)
- **Dev**: `bun run dev` (runs on port 5173 via Vite)
- **Lint**: `eslint .` · **Format**: `prettier --write .`
- **Framework Stack**: TanStack Start (React 19 + React Router v1) on Cloudflare Workers

## Architecture

### Route Structure (File-based with TanStack Router)
- `src/routes/__root.tsx` - Root layout with QueryClientProvider, AuthProvider, Toaster (sonner)
- `src/routes/login.tsx` - OAuth login via Lovable Cloud + Google
- `src/routes/_authenticated.tsx` - Auth guard layout; redirects unauthenticated users to `/login`
- `src/routes/_authenticated/app.tsx` - Main analyzer page (renders PurchaseAnalyzer)
- `src/routes/_authenticated/history.tsx` - Decision history
- `src/routes/_authenticated/profile.tsx` - User profile management
- `src/routes/index.tsx` - Landing page (public)

### Core Components & Logic
- **`src/components/PurchaseAnalyzer.tsx`**: Main UI component for purchase analysis. Reads form input (salary, expenses, EMI, savings, price, fundingMode) → calls `analyze(input)` → displays verdict + coaching notes
- **`src/lib/finance.ts`**: Pure financial logic. Exports `analyze(input: AnalysisInput): Analysis` that returns verdict ("go"/"caution"/"stop") + ratio calculations + personalized coach notes. Key metrics: EMI ratio (target <25%), emergency cushion (target ≥3 months)

### Authentication & Integration
- **Supabase** (`src/integrations/supabase/`): Handles user auth via Lovable Cloud's OAuth proxy
  - `client.ts` - Supabase JS client (auto-generated, uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
  - `client.server.ts` - SSR-compatible variant
  - `types.ts` - Generated TypeScript schema from Supabase DB
- **Lovable Cloud** (`src/integrations/lovable/`): OAuth provider wrapper; `lovable.auth.signInWithOAuth("google", ...)`
- **Auth Hook** (`src/hooks/use-auth.tsx`): React context wrapper around Supabase auth state. Exports `useAuth()` → `{ user, session, loading, signOut }`

### Data & State Management
- **React Query** (TanStack React Query v5): Already provided to router context in `src/router.tsx`; use `QueryClientProvider` pattern
- **React Hook Form** + **Zod**: Available for forms; paired with `@hookform/resolvers`
- **UI Library**: Radix-UI primitives in `src/components/ui/` + Tailwind v4.2

### Server & Deployment
- **SSR Entry**: `src/server.ts` wraps TanStack Start's server entry; includes error capture/page rendering via `error-capture.ts`
- **Build Target**: Cloudflare Workers (`wrangler.jsonc` main = `src/server.ts`; compatibility flags include `nodejs_compat`)
- **Environment**: `VITE_*` vars (client-side), `process.env.*` (server-side); Vite replaces at build time

## Key Conventions

1. **Route Convention**: Files in `src/routes/` auto-generate route tree; use underscore prefix for layout groups (`_authenticated` = auth guard)
2. **Component Styling**: Tailwind v4 + shadcn-style component structure (Radix UI + CVA)
3. **Type Safety**: Strict TS; path alias `@/*` points to `src/*`
4. **Error Handling**: SSR errors trapped in `error-capture.ts`, rendered via `error-page.ts` (HTML template)
5. **Mobile Responsive**: Grid layouts use `lg:grid-cols-[1.1fr_1fr]` pattern; check `use-mobile.tsx` hook

## File Organization

```
src/
  routes/          # File-based TanStack Router routes
  components/      # React components; ui/ subfolder = shadcn exports
  integrations/    # External service clients (Supabase, Lovable)
  hooks/           # Custom hooks (useAuth, useMobile)
  lib/             # Utilities (finance analysis, error handling, profiles)
  styles.css       # Global Tailwind imports
```

## Common Workflows

- **Adding a Form**: Use `react-hook-form` + Zod schema (see `PurchaseAnalyzer.tsx` for input patterns)
- **Auth-Protected Page**: Create file in `src/routes/_authenticated/`, export Route via `createFileRoute()`
- **Styling UI**: Import Radix component from `src/components/ui/`, compose with Tailwind + CVA
- **Querying Data**: Use React Query via hook; QueryClient already in router context
- **Supabase Queries**: Call `supabase.from("table").select()` from `src/integrations/supabase/client`

## Design System Patterns

- **Brand Colors**: `bg-primary`, `bg-foreground`, `bg-background`, `bg-card`, `text-muted-foreground`
- **Button Style**: Bold border-2, `shadow-brutal` effect, hover translate effect (`hover:translate-x-[1px]`)
- **Layout**: Centered max-w-7xl container, py/px padding vars, rounded-2xl borders

## Debugging Notes

- **SSR Errors**: Check `error-capture.ts` for unhandled errors; they render via `error-page.ts` HTML
- **Auth Redirect Loop**: Verify `loading` state in `use-auth.tsx` is properly set before checking `user`
- **Env Vars Missing**: Supabase client throws if `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` not set in `.env.local`
