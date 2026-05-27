# T2
Think Twice is a personal finance decision app that helps users analyze purchase decisions, save decision history, and manage their financial profile.

## Overview

- React 19 + Vite frontend
- TanStack Router for page routing
- Supabase for auth and database
- Cloudflare Workers-compatible server entry
- Lovable Cloud OAuth for Google sign-in

## Architecture

The app is built as a frontend-first React application with Supabase as the backend service. It uses client-side Supabase access for authenticated queries and a server-side Supabase admin client for trusted operations.

```
Browser / Client
  ├─ React + TanStack Router
  │   ├─ /login
  │   ├─ /app
  │   ├─ /history
  │   └─ /profile
  ├─ Supabase client (anon/public key)
  │   ├─ profiles
  │   └─ decisions
  └─ Lovable Cloud OAuth

Server / Deployment
  ├─ src/server.ts
  ├─ Cloudflare Workers target
  └─ Supabase admin client (service_role key)
```

## Key files

- `package.json` - npm scripts and dependencies
- `vite.config.ts` - Vite configuration and env support
- `wrangler.jsonc` - Cloudflare Workers deployment config
- `src/server.ts` - SSR entry point for the app
- `src/routes/__root.tsx` - root layout and global providers
- `src/routes/login.tsx` - login page
- `src/routes/_authenticated.tsx` - auth guard layout
- `src/routes/_authenticated/app.tsx` - purchase analyzer page
- `src/routes/_authenticated/history.tsx` - decision history page
- `src/routes/_authenticated/profile.tsx` - user profile page
- `src/components/PurchaseAnalyzer.tsx` - main analyzer UI component
- `src/lib/finance.ts` - purchase decision logic and score calculations
- `src/lib/profile.ts` - profile read/write helpers for Supabase
- `src/integrations/supabase/client.ts` - browser Supabase client
- `src/integrations/supabase/client.server.ts` - server-side Supabase admin client
- `src/integrations/supabase/types.ts` - generated Supabase DB types
- `src/integrations/supabase/auth-middleware.ts` - server auth verification
- `src/integrations/lovable/index.ts` - Lovable Cloud auth wrapper
- `src/hooks/use-auth.tsx` - auth state hook
- `supabase/config.toml` - local Supabase project config
- `supabase/migrations/` - database migrations

## Supabase environment variables

Create a `.env.local` file at the repo root with the following values:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Notes:
- `VITE_` variables are used in client-side code.
- `SUPABASE_SERVICE_ROLE_KEY` is only for server-side use and must not be committed.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` support server-side auth/middleware.

## Local setup

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Create `.env.local` with Supabase keys.
3. Start the app:
   ```powershell
   npm run dev
   ```

## Supabase local development

If you use the Supabase CLI locally:

```powershell
npx supabase start
npx supabase status
```

If you need to apply migrations:

```powershell
npx supabase db reset
```

## What the app does

- `src/routes/_authenticated/app.tsx` saves purchase decisions into `decisions`
- `src/lib/profile.ts` reads/writes the `profiles` table
- `src/routes/_authenticated/history.tsx` shows saved decision history
- `src/hooks/use-auth.tsx` keeps auth state current

## Diagram

The app flow is:

1. User signs in via Lovable Cloud / Supabase OAuth
2. The app loads profile data from Supabase
3. The user enters purchase details in `PurchaseAnalyzer`
4. The app computes a recommendation using `src/lib/finance.ts`
5. On save, the decision is inserted into Supabase `decisions`
6. The `history` page fetches saved decisions for the current user

For a more detailed diagram, see `ARCHITECTURE_DIAGRAM.md`.

