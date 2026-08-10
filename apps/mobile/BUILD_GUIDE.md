# T2 Mobile App — Build & Deployment Guide

## Overview

T2 (Think Twice) is a personal finance app built with **React Native (Expo SDK 57)** for Android. The codebase is a monorepo:

```
t2/
├── apps/mobile/        ← React Native / Expo app (Android)
├── packages/shared/    ← Shared logic (finance, expense, savings, bills calc)
└── supabase/           ← Database migrations
```

## Prerequisites

| Tool | Purpose | Install |
|---|---|---|
| **Node.js** 22+ | Runtime | [nodejs.org](https://nodejs.org) |
| **Git** | Version control | [git-scm.com](https://git-scm.com) |
| **Expo CLI** | Expo commands | `npm install -g expo-cli` |
| **EAS CLI** | Cloud builds | `npm install -g eas-cli` |
| **Expo account** | Cloud build service | [expo.dev](https://expo.dev) — free |
| **Google Play Console** | Play Store publishing | $25 one-time at [play.google.com/console](https://play.google.com/console) |

## Quick start (local dev)

```bash
# Clone
git clone https://github.com/pk98723/t2.git
cd t2/apps/mobile

# Install deps
npm install

# Start dev server
npx expo start
```

For OAuth (Azure AD / Microsoft login), create `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://hbgkiqxrssbqryagdwly.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

## Build the APK (option 1: EAS Cloud Build)

```bash
cd apps/mobile

# 1. Login to Expo
eas login

# 2. Initialise EAS project (first time only)
eas init

# 3. Build development APK (for testing)
eas build --platform android --profile development

# 4. Build preview APK (standalone, no dev client needed)  
eas build --platform android --profile preview

# 5. Build production AAB (for Play Store)
eas build --platform android --profile production
```

The cloud build takes ~5–15 minutes. You get a download link when done.

## Build via GitHub Actions (option 2: CI/CD)

The project includes a GitHub Actions workflow at `.github/workflows/build-mobile.yml`.

### How it works

```yaml
name: Build Mobile APK
on:
  workflow_dispatch:      # Manual trigger from GitHub UI
  push:
    branches: [main]
    paths:               # Only runs on changes to mobile/shared
      - "apps/mobile/**"
      - "packages/shared/**"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci
        working-directory: apps/mobile

      - name: Build Android APK (preview)
        run: eas build --platform android --profile preview --non-interactive --no-wait
        working-directory: apps/mobile
```

### Setup for GitHub Actions

1. **Generate an Expo token:**
   ```bash
   npx expo login
   npx expo token
   ```
   Copy the token.

2. **Add the token to GitHub Secrets:**
   - Go to repo → Settings → Secrets and variables → Actions
   - Add `EXPO_TOKEN` with the token value

3. **Trigger the build:**
   - Push to `main` (only for mobile/shared changes)
   - Or go to Actions → Build Mobile APK → Run workflow

The APK will be available as a downloadable artifact in the workflow run.

## Environment & secrets

| Variable | Where to set | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `apps/mobile/.env` + EAS env vars | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `apps/mobile/.env` + EAS env vars | Supabase anon key |
| `EXPO_TOKEN` | GitHub Secrets | Expo auth for CI |

For EAS environment variables:
```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..." --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sb_publishable_..." --environment production
```

## EAS build profiles (`eas.json`)

| Profile | Type | Use |
|---|---|---|
| `development` | APK (debug) | Dev testing with hot-reload via dev client |
| `preview` | APK (release) | Standalone install for testing |
| `production` | AAB (release) | Play Store submission |

## App identity

| Field | Value |
|---|---|
| App name | T2 - Think Twice |
| Android package | `com.t2app` |
| Deep link scheme | `t2app://` |
| Expo project ID | `46176733-f239-4c16-8432-64d50b0bf6d2` |
| EAS project | `t2-finance` on `pavan98723s-team` account |

## OAuth (Azure AD)

The app uses Microsoft / Azure AD for login via Supabase's Azure provider.

**Configuration:**
- Azure App Registration redirect URI: `https://hbgkiqxrssbqryagdwly.supabase.co/auth/v1/callback`
- Supabase Auth redirect URL: `t2app://`
- Supabase Auth → Providers → Azure: Client ID + Secret + Tenant ID

## Database (Supabase)

The app uses Supabase with the following tables:
- `profiles` — user profile, monthly salary
- `categories` — expense categories with budgets
- `transactions` — expense transactions
- `monthly_budgets` — monthly budget caps
- `decisions` — purchase analyzer results
- `savings_goals` — savings targets

RLS (Row-Level Security) is enabled on all tables.

## Key npm scripts

```bash
# Mobile app
cd apps/mobile
npm start           # Start Expo dev server
npm run android     # Start for Android
npm run lint        # TypeScript check

# Web app
cd t2/
npm run dev         # Start web dev server
npm run build       # Build web for production
```

## File structure (mobile)

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (React Query + Auth)
│   ├── index.tsx           # Auth-aware entry
│   ├── login.tsx           # Azure AD sign-in
│   ├── (tabs)/
│   │   ├── dashboard.tsx   # Health score, metrics, recent data
│   │   ├── expenses.tsx    # Transaction list + add/delete
│   │   ├── insights.tsx    # Monthly analysis + advice
│   │   └── more.tsx        # Hub → sub-screens
│   ├── categories.tsx      # Category CRUD
│   ├── bills.tsx           # Upcoming bills projections
│   ├── goals.tsx           # Savings goals CRUD
│   ├── analyzer.tsx        # Purchase decision calculator
│   ├── history.tsx         # Past decisions log
│   └── profile.tsx         # Profile + sign out
├── src/
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client + SecureStore
│   │   ├── data.ts         # Data fetching (txns, categories, profile)
│   │   ├── data-savings.ts # Savings goals CRUD
│   │   └── data-decisions.ts # Decision history
│   └── hooks/
│       └── use-auth.tsx    # Auth context + Azure OAuth flow
├── app.json                # Expo config
├── eas.json                # EAS build profiles
├── metro.config.js         # Metro bundler config
└── package.json            # Dependencies
```

## Troubleshooting

**`git status` crash (exit code 3221225477)**  
→ Project is on OneDrive. Move to `C:\dev\t2\` and reinstall.

**`expo config --json` crash**  
→ Try running via `node node_modules/expo/bin/cli` directly.

**EAS build stuck in queue**  
→ Free tier queues can be slow. Use GitHub Actions as an alternative.

**Build fails: missing .env**  
→ Create `apps/mobile/.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

**OAuth doesn't return to app**  
→ Verify `t2app://` is in Supabase Auth → URL Configuration → Redirect URLs.
→ Also check Azure AD callback URL includes the Supabase auth callback.

For more details, see `PHASE2_MOBILE_PLAN.md` and `PLAY_STORE_CHECKLIST.md`.