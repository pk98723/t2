# T2 Expense Manager - Verification Checklist

## Pre-Deployment Verification

### ✅ Database Setup
- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Copy entire contents of `supabase/migrations/20260526100000_add_expense_tracking.sql`
- [ ] Execute the SQL query
- [ ] Verify tables created: `categories`, `transactions`, `monthly_budgets`
- [ ] Check RLS policies are enabled on all tables
- [ ] Confirm default categories exist in your profile

### ✅ Code Verification
- [ ] Verify all 8 new/modified files are in place:
  - [ ] `src/lib/expense.ts` exists (NEW)
  - [ ] `src/components/ExpenseTracker.tsx` exists (NEW)
  - [ ] `src/components/ExpenseInsights.tsx` exists (NEW)
  - [ ] `src/components/CategoryManager.tsx` exists (NEW)
  - [ ] `src/routes/_authenticated/expenses.tsx` exists (NEW)
  - [ ] `src/routes/_authenticated/categories.tsx` exists (NEW)
  - [ ] `src/routes/_authenticated/insights.tsx` exists (NEW)
  - [ ] `src/routes/_authenticated.tsx` modified with new nav links
  - [ ] `src/components/PurchaseAnalyzer.tsx` has input validation
  - [ ] `src/routes/_authenticated/history.tsx` has `.eq("user_id", user.id)` filter

### ✅ TypeScript Compilation
```bash
npm run build
# Should complete without errors
# If errors: Check import paths, verify file names match exactly
```

### ✅ Linting
```bash
npm run lint
# Should have no errors (warnings are okay)
```

---

## Feature Verification (Manual Testing)

### 1️⃣ **Authentication Flow**
```
Test Case: Login and Session Persistence
1. Visit http://localhost:5173
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify redirect to /app
5. Refresh page - should stay logged in
6. Verify profile loads with monthly_salary

Expected: ✅ User logged in with profile data
```

### 2️⃣ **Expense Tracking**
```
Test Case: Add Multiple Expenses
1. Sign in
2. Navigate to /expenses
3. Select category: "Food & Groceries"
4. Enter amount: 500
5. Description: "Market shopping"
6. Date: Today
7. Click "Add expense"
8. Add another: 200 for "Coffee"
9. Add another: 1000 for "Utilities" (different category)

Expected: ✅ All expenses appear in list
           ✅ Latest expenses appear first
           ✅ Expenses grouped by day
```

### 3️⃣ **Category Management**
```
Test Case: Create & Edit Categories
1. Navigate to /categories
2. Click "Add category"
3. Name: "Photography"
4. Budget: 5000
5. Color: Choose purple
6. Mark as essential: No
7. Create
8. Verify new category appears in list
9. Try adding duplicate name - should fail

Expected: ✅ New category created
           ✅ Shows in /expenses dropdown
           ✅ Duplicate prevention works
```

### 4️⃣ **Financial Insights**
```
Test Case: View Monthly Analysis
1. Ensure you have 3+ expenses in current month
2. Navigate to /insights
3. Verify displays:
   - Health Score (0-100)
   - Total Income (from profile)
   - Total Expenses
   - Savings amount
   - Savings Rate %
   - Category breakdown with progress bars
   - Financial advice bullets

Expected: ✅ All metrics calculate correctly
           ✅ Progress bars show budget usage
           ✅ Advice appears (at least 1 tip)
```

### 5️⃣ **Month Navigation**
```
Test Case: Navigate Between Months
1. Go to /expenses
2. Click "Prev" button
3. Verify month changed to previous
4. Add expense for previous month
5. Go to /insights
6. Click "Prev" to match month
7. Verify insight shows expense from previous month
8. Click "Next" to current month
9. Verify current month expenses show

Expected: ✅ Navigation works
           ✅ Data filters by selected month
           ✅ Month persists during navigation
```

### 6️⃣ **Budget Warnings**
```
Test Case: Over-Budget Alerts
1. Go to /categories
2. Find or create category with budget 1000
3. Go to /expenses
4. Add expense 600
5. Add another 600 (total 1200)
6. Go to /insights
7. Look at category breakdown for that category

Expected: ✅ Category shows 120% of budget
           ✅ Progress bar exceeds 100%
           ✅ Color changes to red/warning
           ✅ Advice mentions over-budget
```

### 7️⃣ **Financial Health Calculations**
```
Test Case: Health Score Calculation
Scenario: Monthly salary ₹80,000
- Add expenses totaling: ₹50,000
- Expected savings: ₹30,000
- Savings rate: 37.5%
- Go to /insights

Expected: ✅ Health score >= 80 (high savings rate)
           ✅ Advice includes: "Excellent savings"
           ✅ Savings rate shown as 37.5%
```

### 8️⃣ **Input Validation**
```
Test Case: Prevent Invalid Inputs
1. Go to /expenses
2. Try entering negative amount: -500
3. System should ignore/prevent

Go to /app (purchase analyzer):
4. Try entering negative salary
5. System should ignore

Expected: ✅ Negative values rejected
           ✅ Zero values allowed (but not used in calcs)
```

### 9️⃣ **Data Isolation (Security)**
```
Test Case: User Data Privacy
1. Sign in as User A
2. Go to /history
3. Note the decisions shown
4. Open new incognito window
5. Sign in as User B
6. Go to /history
7. Verify User B only sees their own decisions

Expected: ✅ No cross-user data visible
           ✅ Each user sees only their data
```

### 🔟 **Delete Operations**
```
Test Case: Delete Expense
1. Go to /expenses
2. Add expense: 300 for food
3. Click delete (trash icon)
4. Verify expense removed from list
5. Refresh page
6. Expense should still be gone

Expected: ✅ Delete works immediately
           ✅ Persists after refresh
           ✅ Toast notification shows
```

---

## Performance Checks

### Response Time
```
Test: Load /insights with 100+ expenses
Expected: < 2 seconds to load and render
If slower: Check database indexes, optimize queries
```

### Network Requests
```
Test: Monitor Network tab in DevTools
- /expenses: Should make 2 requests (categories + transactions)
- /insights: Should make 3 requests (profile + categories + transactions)
- No N+1 queries
Expected: Each route batches requests efficiently
```

---

## Edge Cases to Test

### Empty States
```
1. New user, no expenses
   - /expenses: "No expenses yet" message
   - /insights: "No data yet" message
   - /categories: Shows default categories

2. Delete all transactions for a month
   - /insights: Should show as empty month
```

### Boundary Conditions
```
1. Expense exactly on month boundary
   - Add on 1st of month
   - Add on 31st of month
   - Both should appear in that month

2. Large numbers
   - Add expense: ₹999,999
   - Add budget: ₹5,000,000
   - Verify no rounding errors

3. Zero values
   - Salary: 0 → EMI ratio should show 0%
   - Budget: 0 → Should allow unlimited spending
```

### Date Handling
```
1. Set current date to Feb 29 (leap year)
   - Month navigation should work
2. Jump from Dec to Jan (year boundary)
   - Should show correct year in insights
```

---

## Troubleshooting Guide

### Error: "Missing SUPABASE_URL"
```
Fix: Check .env.local file
- VITE_SUPABASE_URL = your-supabase-url.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY = your-anon-key
Restart dev server after changes
```

### Error: "Users can view their own categories" (403)
```
Fix: RLS policies not applied
- Go to Supabase > SQL Editor
- Re-run migration to create policies
- Or manually enable RLS and create policies
```

### Error: "Categories table not found"
```
Fix: Migration not executed
- Go to Supabase > SQL Editor
- Copy & run: supabase/migrations/20260526100000_add_expense_tracking.sql
- Verify tables created in Supabase > Tables view
```

### Error: "Cannot find module 'src/lib/expense'"
```
Fix: File path issue
- Verify file at: src/lib/expense.ts (not src/lib/expenses.ts)
- Check import paths use correct file name
- Restart IDE for import auto-completion
```

### Expenses not appearing
```
Debug steps:
1. Check DevTools > Network: See API call?
2. Check browser console: Any error messages?
3. Supabase > Database > transactions table: Any rows?
4. Verify user_id matches (check auth.users table)
5. Check if expense date matches selected month
```

### Health score always shows 100
```
Debug: Check calculateFinancialHealthScore() logic
- Verify savingsRate calculation
- Verify budget variance calculation
- Check if expenses loaded properly
- Log score calculation in console
```

---

## Sign-Off Checklist

Before considering complete:

- [ ] All 8 files created/modified
- [ ] Database migration executed successfully
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes
- [ ] Can add expenses and they persist
- [ ] Can view monthly insights with correct calculations
- [ ] Can manage categories
- [ ] User data isolation confirmed
- [ ] No console errors in DevTools
- [ ] All 10 manual tests above pass
- [ ] Performance acceptable (< 2s load times)
- [ ] Navigation works smoothly

---

## Deployment Checklist (Before Production)

- [ ] Environment variables set in production
- [ ] Database connection string is production (not dev)
- [ ] Auth credentials for Google OAuth configured
- [ ] Supabase RLS policies reviewed
- [ ] Database backups configured
- [ ] Error tracking (Sentry/LogRocket) configured
- [ ] Analytics configured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## Need Help?

Check these in order:
1. Browser DevTools Console - Check for JavaScript errors
2. Network tab - Verify API calls being made
3. Supabase Dashboard > Logs - Check database errors
4. Check file paths match exactly
5. Restart dev server: `npm run dev`
6. Clear browser cache: Ctrl+Shift+Delete
