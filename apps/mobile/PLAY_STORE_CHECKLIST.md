# Play Store Publishing Checklist — T2

## Prerequisites

- [ ] **Google Play Console** account — one-time $25 fee at [play.google.com/console](https://play.google.com/console)
- [ ] **Expo account** — free at [expo.dev](https://expo.dev) (for EAS Build)
- [ ] **Privacy policy URL** — host `PRIVACY_POLICY.md` somewhere (GitHub Pages, Netlify, or a personal site)
- [ ] **App icon assets** — create in `apps/mobile/assets/images/`:
  - `icon.png` — 1024×1024 (Play Store listing icon)
  - `adaptive-foreground.png` — 1024×1024, transparent bg (Android adaptive icon foreground)
  - `splash-icon.png` — 1284×2778 (splash screen)

## Step 1: Install EAS CLI & Login

```bash
npm install -g eas-cli
eas login
```

## Step 2: Configure EAS project

```bash
# Link to Expo account — creates project on expo.dev
eas init --id <your-project-id>

# Update app.json's extra.eas.projectId with the ID from above
```

## Step 3: Build the Android App Bundle (AAB)

```bash
eas build --platform android --profile production
```

This generates a **signed `.aab`** file. EAS stores the keystore automatically on their servers.

## Step 4: Google Play Console Setup

1. Create a new app in Play Console
2. **App details:**
   - App name: **T2 - Think Twice**
   - Default language: English (India) / English (US)
   - App or game: **App**
   - Free or paid: **Free**
3. **Store listing:**
   - Short description (80 char): *"Your personal finance decision coach. Analyze purchases, track expenses, and save smarter."*
   - Full description:
     ```
     T2 (Think Twice) helps you make smarter financial decisions. 
     
     Features:
     • Purchase Analyzer — Get a 'Go', 'Caution', or 'Stop' verdict before buying
     • Expense Tracking — Log daily expenses with categories and budgets
     • Financial Insights — Health score, spending breakdown, and smart advice
     • Savings Goals — Set and track progress toward your targets
     • Bills Calendar — Never miss a recurring payment
     • Dark Mode — Easy on the eyes
     
     Your data is encrypted and private. No third-party sharing.
     ```
   - Screenshots: 2-8 phone screenshots (take from a real device/emulator)
   - Feature graphic: 1024×500 PNG
   - **Category:** Finance
   - **Tags:** Personal finance, budget, expense tracker

4. **Data safety form:**
   - Data collected: Email, Name (personal info) + Financial data (app functionality)
   - Data shared: None (not shared)
   - Security practices: Data encrypted in transit, data deleted on request

5. **Content rating:** Complete IARC questionnaire (will likely be "Everyone" or "3+")

6. **App content:**
   - Privacy policy URL: Host `PRIVACY_POLICY.md`
   - **No ads declaration**

## Step 5: Upload & Submit

```bash
# Option A: Upload via CLI
eas submit --platform android --profile production

# Option B: Download and upload manually
eas build --platform android --profile production
# Then upload the .aab file from the build output to Play Console → Production → Upload
```

## Step 6: After Launch

- [ ] Monitor crash reports (add Sentry or similar)
- [ ] Set up Firebase Crashlytics for RN
- [ ] Monitor Supabase usage (revisit the "1K user" migration trigger)
- [ ] Plan the next update cycle

---

## Assets quick reference

| Asset | Size | Format | Location |
|---|---|---|---|
| App icon (store) | 1024×1024 | PNG | `assets/images/icon.png` |
| Adaptive foreground | 1024×1024 | PNG (transparent bg) | `assets/images/adaptive-foreground.png` |
| Splash | 1284×2778 | PNG | `assets/images/splash-icon.png` |
| Feature graphic | 1024×500 | PNG | Upload manually to Play Console |
| Phone screenshots | Any | PNG/JPG | Upload manually to Play Console |
| Privacy policy | — | HTML/MD | Hosted at a URL |

---

## Common issues

**"Missing intent filter for deep link"** — Already in `app.json`. If OAuth doesn't return to the app, verify `t2app://` is in Supabase Auth → Redirect URLs.

**"Keystore not found"** — EAS manages this automatically. Don't create one manually.

**"App rejected: WebView wrapper"** — We're using React Native, not a WebView, so this won't apply.

**"App rejected: Insufficient data safety"** — Fill out the data safety form honestly. This app collects financial data for core functionality — that's acceptable when clearly disclosed.