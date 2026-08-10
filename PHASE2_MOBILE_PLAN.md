# T2 — Phase 2 Plan: Native Android App (Play Store)

**Decisions locked (2026-08-10):**
- Approach: **Expo (React Native) rewrite** of the UI
- Platform: **Android only** (iOS later)
- Monetization: **Free app**, no in-app payments yet (defer IAP/subscription)
- Backend: **Keep Supabase** until ~1K users (see project decision)

---

## 1. Strategy summary

Instead of wrapping the existing web app (which Play Store flags as a low-quality "web wrapper"), we **rebuild the UI natively in React Native/Expo** while **reusing every piece of non-UI logic and the Supabase backend**. This gives the best Play Store quality signal, native UX, and room to add push notifications/offline later — without re-architecting the data layer.

Result: one Supabase schema serves both products; the web app stays as-is; a new native app shares the same SDK, calculation logic, and tables.

---

## 2. Target architecture (monorepo)

We convert the repo to a single monorepo so web and mobile never drift on business logic.

```
t2/
├─ apps/
│  ├─ web/            (existing React + Vite + TanStack app — unchanged)
│  └─ mobile/         (NEW Expo React Native app)
├─ packages/
│  ├─ shared/         (NEW: extracted pure logic + shared TS types)
│  │   ├─ finance.ts  (purchase decision scoring)
│  │   ├─ expense.ts  (analytics, health score, advice)
│  │   ├─ bills.ts    (recurring → projection logic)
│  │   ├─ savings.ts  (goal math)
│  │   └─ types.ts    (shared DB row types)
└─ supabase/          (migrations — shared, already correct)
```

**How we reuse logic:** we *extract* the pure, dependency-free functions (finance score, expense analysis, bill projections, savings progress) out of the current `src/lib/*.ts` into `packages/shared`. Both apps import from there. Two apps, one source of truth for calculations.

```ts
// packages/shared/src/expense.ts  →  used by BOTH web and mobile
export function analyzeMonthlyExpenses(...): MonthlyExpenseAnalysis
```

> Note: today `src/lib/*.ts` mixes pure functions with direct `supabase` calls. We split those: pure math goes to `shared`, and data-fetching stays in each app (web uses web's client, mobile uses RN client + AsyncStorage/SecureStore).

---

## 3. Recommended tooling

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo SDK** (latest stable) | Managed workflow, EAS Build, best RN DX |
| Navigation | **expo-router** (file-based) | Mirrors your TanStack Router habits; bottom tabs free |
| UI | **NativeWind** (Tailwind for RN) | You already know Tailwind — reuse classNames, dark mode `useColorScheme()` |
| Charting | **react-native-gifted-charts** | Lightweight native charts (health gauge, category bars) |
| Data fetching | **@tanstack/react-query** | You already use it in web; shared patterns |
| Backend | **@supabase/supabase-js cluster** | Same tables; RN session storage via `expo-secure-store` |
| Auth | **expo-auth-session** + Supabase OAuth | PKCE Google OAuth with deep link back into the app |
| Dates | **date-fns** (already a dep) | Reuse |
| Package manager | **npm workspaces** | Keep low-tooling; bun works too if you prefer |
| Builds | **EAS Build** + `eas submit` | Cloud Android App Bundle (`.aab`) generation & Play upload |

---

## 4. Workstreams (build order)

### WS-0 — Scaffold monorepo + extract shared logic
- Convert to npm/pnpm workspaces; add `packages/shared`.
- Move pure functions from `src/lib/{finance,expense,bills,savings,export}.ts` into `packages/shared`; update web imports.
- Run web build to confirm the extraction changed nothing.

**Exit:** web app unaffected; shared package typed and unit-testable.

### WS-1 — Expo app shell + auth + theme
- `npx create-expo-app apps/mobile` (blank TypeScript template).
- Set up `expo-router` tabs: Overview, Quick Add, Insights, Budget, More.
- Google OAuth:
  1. Create a deep-link scheme (e.g. `t2app://`) in `app.json`.
  2. Add that scheme + a dev redirect URL to **Supabase → Auth → URL Configuration → Redirect URLs**.
  3. Implement `signInWithOAuth` via `expo-auth-session` (PKCE); persist session in `expo-secure-store`.
- Dark/light theme from `useColorScheme()` + shared constants.
- React Query provider + an `isAuthenticated` route guard (mirrors `_authenticated.tsx`).

### WS-2 — Core financial screens (the 80%)
Port these, reusing `packages/shared` math:
- **Dashboard/Overview** — health score ring, income/expense/savings metric tiles, recent decisions, upcoming bills.
- **Expenses** — add/edit/delete transactions, category picker, month navigation, recurrence flag.
- **Categories** — CRUD with budget + color + essential toggle.
- **Insights** — health score, category breakdown with progress bars, advice bullets, month nav.
- **Export** (WS-2.5) — CSV/HTML → **React Native `Share` API** (native share sheet) instead of `downloadFile`.

### WS-3 — Remaining screens
- **Bills** — projected upcoming bills from recurring txs.
- **Savings Goals** — CRUD, progress bars, add-funds.
- **Purchase Analyzer** — the decision calculator (port `finance.ts`).
- **History** — past decisions log.
- **Profile/Settings** — salary, currency (₹), profile edit, logout.

### WS-4 — Play Store packaging & publishing
See §6 checklist. Build `.aab` with EAS, then submit to an internal test track → closed/promotional → production.

---

## 5. Key technical gotchas (plan for these now)

1. **OAuth redirect back to app** — must add the `t2app://` scheme to Supabase's redirect allowlist or Google sign-in silently fails. Test on a physical device early (redirect behavior differs from a browser).
2. **Session persistence** — use `expo-secure-store`, **not** AsyncStorage, for the Supabase auth token (secure by default; Play review prefers it for financial data).
3. **Currency (₹)** — `Intl.NumberFormat("en-IN")` is limited in Hermes (RN JS engine). Either use a small formatter in `shared` (no `Intl`) or enable Hermes intl properly. Decide early; the whole app formats money.
4. **No `window` / `document`** — `export.ts` uses `URL.createObjectURL` + `window.open`. Rewrite export for RN using the native `Share` API. This is why `shared` can't hold that file as-is.
5. **Responsive vs fixed** — RN has no viewport-based CSS. Reset layouts to flexbox + `useWindowDimensions`.
6. **Recharts → native charts** — Recharts (used on web) doesn't work in RN; swap to `react-native-gifted-charts`.

---

## 6. Play Store publishing checklist (WS-4)

**Account & setup**
- [ ] Create Google Play Console developer account (**one-time $25**).
- [ ] Verify ownership of the app's package name (e.g. `com.t2.finance`) by registering it in Play Console.

**App identity**
- [ ] App icons (legacy 512px + adaptive, foreground/background), splash screen, feature graphic.
- [ ] App name, short & full description (mention it's a finance decision coach).
- [ ] **Privacy policy URL (required)** — host a page stating what financial data is collected/stored and how it's used. Non-negotiable for Play review, and mandatory for any app handling money records.
- [ ] **Data safety form** — declare data collection (profile, transactions, goals), storage (Supabase), deletion (account-deletion flow → user may request data deletion).

**Content & compliance**
- [ ] Content-rating questionnaire (IARC).
- [ ] Target current Google Play API target level (32+, verify the level required at launch).
- [ ] In-app billing: not required (free app).

**Build & release**
- [ ] `eas build --platform android --profile production` → produces a signed **Android App Bundle (`.aab`)** (Play requires `.aab`, not `.apk`).
- [ ] Upload to **Internal testing** track first; install on real devices.
- [ ] Promote to **Closed testing** (get a few reviews) → **Open/production**.

**Post-launch**
- [ ] Restart `eas submit` for version updates.
- [ ] Add crash reporting (Sentry) and basic analytics **before** production launch — don't ship blind.
- [ ] Monitor Supabase usage/cost; revisit the "1K users" migration trigger.

---

## 7. Rough timeline

| Workstream | Effort | Can parallel with |
|---|---|---|
| WS-0 monorepo + shared logic | 2–3 days | — |
| WS-1 shell + auth + theme | 4–6 days | Play Console account + Supabase redirect config |
| WS-2 core screens | 2–3 weeks | — |
| WS-3 remaining screens | 1–2 weeks | — |
| WS-4 packaging + store listing + review | 1 week (+ 1–2 wk review buffer) | — |
| **Total to live on Play Store** | **~5–8 weeks** | |

---

## 8. What I need from you to start WS-0

1. Confirm the package name (e.g. `com.t2.finance`) — must be globally unique on Play.
2. Have the `$25` Play Console account ready for WS-4 (can be created in parallel now).
3. Confirm Google OAuth is via **Supabase's own Google provider** (we'll wire `expo-auth-session` to it) — the current web app uses *Lovable Cloud* OAuth, which we will NOT reuse on mobile.

---

## 9. Optional later (not Phase 2)

- iOS release (Mac + $99/yr Apple Developer).
- Push notifications for bill due-dates (needs `expo-notifications` + a push service in Supabase/Edge function).
- Google Play Billing for a premium tier/subscription.
- Offline-first data via local SQLite on the device.