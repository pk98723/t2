# 🚀 Step-by-Step Deployment Guide

## Phase 1: Database Setup (5 minutes)

### Step 1.1: Get the Migration SQL
- File location: `supabase/migrations/20260526100000_add_expense_tracking.sql`
- This file creates 3 new tables with RLS policies

### Step 1.2: Execute in Supabase
```
1. Open https://supabase.com/
2. Log in with your account
3. Open your T2 project
4. Click "SQL Editor" (left sidebar)
5. Click "New Query"
6. Copy-paste the entire contents of the migration file
7. Click "Run" button
8. Wait for "Success" message
```

### Step 1.3: Verify Tables Created
```
1. Go to "Tables" (left sidebar)
2. Should see 3 new tables:
   ✅ categories
   ✅ transactions
   ✅ monthly_budgets
3. Each should have RLS enabled (lock icon visible)
```

### Step 1.4: Verify Default Categories
```
1. Click on "categories" table
2. Browse data tab
3. Should see 10 default categories:
   ✅ Food & Groceries
   ✅ Transportation
   ✅ Utilities
   ✅ Entertainment
   ✅ Healthcare
   ✅ Shopping
   ✅ Dining Out
   ✅ Subscriptions
   ✅ Education
   ✅ Other
```

✅ **Database setup complete!**

---

## Phase 2: Code Verification (5 minutes)

### Step 2.1: Check All Files Exist

**Open VS Code file explorer and verify:**

```
✅ src/lib/expense.ts                              (NEW)
✅ src/components/ExpenseTracker.tsx               (NEW)
✅ src/components/ExpenseInsights.tsx              (NEW)
✅ src/components/CategoryManager.tsx              (NEW)
✅ src/routes/_authenticated/expenses.tsx          (NEW)
✅ src/routes/_authenticated/categories.tsx        (NEW)
✅ src/routes/_authenticated/insights.tsx          (NEW)
✅ supabase/migrations/20260526100000_*.sql        (NEW)
```

**Modified files:**
```
✏️ src/routes/_authenticated.tsx
✏️ src/components/PurchaseAnalyzer.tsx
✏️ src/routes/_authenticated/history.tsx
```

### Step 2.2: Verify Imports

Open each new file and check imports are correct:

**src/lib/expense.ts:**
```typescript
import { supabase } from "@/integrations/supabase/client";
// ✅ Should not have error
```

**src/components/ExpenseTracker.tsx:**
```typescript
import { Transaction, Category, fmt } from "@/lib/expense";
// ✅ Should not have error
```

**src/routes/_authenticated/expenses.tsx:**
```typescript
import { fetchCategories, createTransaction } from "@/lib/expense";
// ✅ Should not have error
```

### Step 2.3: Check Navigation Update

Open `src/routes/_authenticated.tsx` and verify:
```tsx
<Link to="/expenses" ...>Expenses</Link>
<Link to="/categories" ...>Categories</Link>
<Link to="/insights" ...>Insights</Link>
// ✅ All three should be visible in nav
```

✅ **Code verification complete!**

---

## Phase 3: Build & Run (5 minutes)

### Step 3.1: Install Dependencies
```bash
npm install
# (Should be instant - no new packages added)
```

### Step 3.2: Verify TypeScript
```bash
npm run build
# Should complete without errors
# If errors: Check file paths and import statements
```

### Step 3.3: Verify Linting
```bash
npm run lint
# Should have 0 errors (warnings are okay)
```

### Step 3.4: Start Dev Server
```bash
npm run dev
# Should output:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Step 3.5: Open in Browser
```
1. Open http://localhost:5173
2. Should see T2 home page
3. Click "Continue with Google" to sign in
4. Complete OAuth flow
```

✅ **Dev server running!**

---

## Phase 4: Feature Testing (15 minutes)

### Test 1: Navigation Links (2 min)
```
After signing in:
1. Click "Expenses" → Should show /expenses page
2. Click "Categories" → Should show /categories page
3. Click "Insights" → Should show /insights page
4. Click "Analyze" → Should show /app page (original analyzer)
5. Click "History" → Should show /history page
6. Click "Profile" → Should show /profile page

✅ All navigation works
```

### Test 2: Add Expense (3 min)
```
On /expenses page:
1. Category dropdown → Should have Food & Groceries, etc
2. Amount field → Enter 500
3. Description → Enter "Groceries"
4. Date → Select today
5. Click "Add expense"
6. Should see:
   - Toast notification "Expense added"
   - Expense appears in list below form
   - Amount shows ₹500

✅ Add expense works
```

### Test 3: Monthly Navigation (2 min)
```
On /expenses page:
1. See month selector at top: "May 2026"
2. Click "← Prev" → Shows "April 2026"
3. Add expense for April
4. Click "Next →" → Back to "May 2026"
5. Expense should only show when viewing April

✅ Month navigation works
```

### Test 4: View Insights (3 min)
```
On /insights page:
1. Should see month selector (current month)
2. Should display:
   - Health Score (0-100 number)
   - Total Income (from profile)
   - Total Expenses
   - Savings amount
   - Savings Rate (%)
3. Should show category breakdown
4. Should show financial advice (at least 1 tip)

✅ Insights page works
```

### Test 5: Category Management (3 min)
```
On /categories page:
1. Should see 10 default categories
2. Click "Add category"
3. Category name → "Custom Test"
4. Monthly budget → 5000
5. Color → Pick any color
6. Click "Create category"
7. Should see success message
8. New category appears in list

✅ Category management works
```

### Test 6: Data Persistence (2 min)
```
1. Add an expense on /expenses
2. Refresh page (F5)
3. Expense should still be there
4. Go to /insights
5. Expense should be counted in totals
6. Go to /categories
7. Budget should be visible

✅ Data persists correctly
```

✅ **All features working!**

---

## Phase 5: Security Check (5 minutes)

### Test 7: User Data Isolation
```
IMPORTANT: Test with 2 different Google accounts

User A:
1. Sign in with google.com account 1
2. Add 3 expenses
3. Note the expenses shown
4. Go to /history → See decisions
5. Go to /insights → See metrics

User B (New incognito window):
1. Sign in with google.com account 2
2. Go to /expenses
3. Should NOT see User A's expenses ⚠️
4. Add your own expense
5. Go to /history
6. Should NOT see User A's decisions ⚠️
7. Go to /insights
8. Should NOT see User A's data ⚠️

✅ User data is properly isolated
```

---

## Phase 6: Final Checklist

Before considering complete, verify:

```
Database:
✅ Supabase tables created (categories, transactions, monthly_budgets)
✅ RLS policies enabled
✅ Default categories auto-created

Code:
✅ All 8 new files in place
✅ 3 files modified correctly
✅ No TypeScript errors (npm run build)
✅ No lint errors (npm run lint)

Navigation:
✅ Can access /expenses, /categories, /insights
✅ Navigation menu shows all new links

Features:
✅ Can add expenses
✅ Can manage categories
✅ Can view insights with calculations
✅ Can navigate months
✅ Data persists after refresh

Security:
✅ User A cannot see User B's data
✅ Each user sees only their own expenses

Performance:
✅ Pages load in < 2 seconds
✅ No console errors
✅ Smooth animations/transitions
```

---

## 🎉 Deployment Complete!

You now have a fully functional expense management app with:
- ✅ Monthly expense tracking
- ✅ Category-based organization
- ✅ Budget management
- ✅ Financial insights & health scoring
- ✅ Personalized financial advice
- ✅ User data isolation & security

---

## 📞 Troubleshooting

### "Tables not found" Error
```
Solution:
1. Check Supabase dashboard > Tables
2. Do you see categories, transactions, monthly_budgets?
   NO → Run migration again
   YES → Clear browser cache (Ctrl+Shift+Delete)
```

### "RLS policy violation" Error
```
Solution:
1. Check Supabase > Authentication > Users
2. Are you signed in?
   NO → Sign in with Google
   YES → Check RLS policies exist
      → Go to SQL Editor
      → Run: SELECT * FROM information_schema.tables WHERE table_name IN ('categories', 'transactions', 'monthly_budgets')
      → Should show 3 tables
```

### "Cannot find module" Error
```
Solution:
1. Check file exists at exact path
2. Verify file naming:
   ✅ expense.ts (not expenses.ts)
   ✅ ExpenseTracker.tsx (capital E)
3. Restart dev server: npm run dev
```

### Build Fails
```
Solution:
1. Check error message carefully
2. Usually: wrong import path
3. Run: npm run lint
4. Fix reported issues
5. Run: npm run build again
```

---

## 📚 Documentation Files

For more details, see:
- **QUICK_START.md** - Overview of all changes
- **IMPLEMENTATION_GUIDE.md** - Detailed feature documentation
- **VERIFICATION_CHECKLIST.md** - 10 manual tests + edge cases

---

## ✨ You're All Set!

Your T2 expense manager is ready to use.

**Next step**: Start tracking your expenses and let the app give you financial advice! 🎯
