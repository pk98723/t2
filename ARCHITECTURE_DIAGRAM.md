# T2 Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Header Navigation                                                │
│  ├─ Analyze (purchase advisor)                                   │
│  ├─ Expenses (track spending) ← NEW                              │
│  ├─ Insights (financial analysis) ← NEW                          │
│  ├─ Categories (manage categories) ← NEW                         │
│  ├─ History (decisions)                                          │
│  └─ Profile (settings)                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         REACT COMPONENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ExpenseTracker.tsx                                              │
│  ├─ TransactionForm (add expense)                               │
│  └─ TransactionList (view/delete)                               │
│                                                                   │
│  ExpenseInsights.tsx                                             │
│  ├─ Health Score display                                         │
│  ├─ Metric Cards (income, expenses, savings)                    │
│  └─ Category Breakdown                                           │
│                                                                   │
│  CategoryManager.tsx                                             │
│  ├─ Category Form (create/edit)                                 │
│  └─ Category List (view/delete)                                 │
│                                                                   │
│  PurchaseAnalyzer.tsx (UPDATED)                                 │
│  ├─ Input Validation (no negatives)                             │
│  └─ Analysis Display                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  expense.ts (NEW)                                                │
│  ├─ Category Operations                                          │
│  │  ├─ fetchCategories()          [READ]                        │
│  │  ├─ createCategory()            [CREATE]                     │
│  │  ├─ updateCategory()            [UPDATE]                     │
│  │  └─ deleteCategory()            [DELETE]                     │
│  │                                                               │
│  ├─ Transaction Operations                                       │
│  │  ├─ fetchTransactions(userId, filters)   [READ]             │
│  │  ├─ createTransaction(userId, data)      [CREATE]            │
│  │  ├─ updateTransaction()                  [UPDATE]            │
│  │  └─ deleteTransaction()                  [DELETE]            │
│  │                                                               │
│  ├─ Analysis Functions                                           │
│  │  ├─ analyzeMonthlyExpenses() → MonthlyExpenseAnalysis       │
│  │  ├─ generateExpenseAdvice() → string[]                       │
│  │  └─ calculateFinancialHealthScore() → 0-100                 │
│  │                                                               │
│  └─ Utilities                                                    │
│     ├─ fmt() - Format currency                                 │
│     ├─ getMonthYear() - Date formatting                        │
│     └─ getCurrentMonthYear() - Current month                   │
│                                                                   │
│  finance.ts (EXISTING)                                           │
│  ├─ analyze(input) - Purchase analysis                         │
│  └─ fmt() - Currency formatting                                │
│                                                                   │
│  profile.ts (EXISTING)                                           │
│  ├─ fetchProfile()                                              │
│  └─ upsertProfile()                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLIENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication                                                  │
│  └─ OAuth (Google) via Lovable Cloud                           │
│                                                                   │
│  Database Queries                                                │
│  └─ .from("table").select().eq().order().limit()              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  auth.users (managed by Supabase)                               │
│  └─ User authentication & sessions                              │
│                                                                   │
│  profiles (EXISTING)                                             │
│  ├─ monthly_salary                                              │
│  ├─ monthly_expenses                                            │
│  ├─ existing_emis                                               │
│  ├─ current_savings                                             │
│  └─ emergency_target_months                                     │
│                                                                   │
│  decisions (EXISTING)                                            │
│  └─ Purchase decision history                                   │
│                                                                   │
│  categories (NEW)                                                │
│  ├─ id, user_id, name, monthly_budget                          │
│  ├─ color, icon, is_essential                                  │
│  └─ RLS: Users see only their own                              │
│                                                                   │
│  transactions (NEW)                                              │
│  ├─ id, user_id, category_id, amount                           │
│  ├─ description, transaction_date, tags                        │
│  ├─ is_recurring, recurring_interval                           │
│  └─ RLS: Users see only their own                              │
│                                                                   │
│  monthly_budgets (NEW)                                           │
│  ├─ id, user_id, year, month                                   │
│  ├─ total_budget, discretionary_limit                          │
│  └─ RLS: Users see only their own                              │
│                                                                   │
│  Indexes                                                         │
│  ├─ transactions(user_id, transaction_date DESC)              │
│  ├─ transactions(category_id)                                  │
│  └─ monthly_budgets(user_id, year, month)                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Add Expense Flow
```
User Input (Category, Amount, Date)
    ↓
TransactionForm Component
    ↓
createTransaction(user_id, data)
    ↓
Input Validation (amount > 0)
    ↓
Supabase.from("transactions").insert()
    ↓
Database Insert with RLS Check
    ↓
Return Transaction with ID
    ↓
UI Update: Expense appears in list
    ↓
Toast: "Expense added"
```

### 2. View Insights Flow
```
User Navigates to /insights
    ↓
fetchProfile(user_id) → Get monthly_salary
    ↓
analyzeMonthlyExpenses(user_id, year, month, income)
    ↓
├─ fetchTransactions() → Get all expenses for month
├─ fetchCategories() → Get all categories
└─ fetchMonthlyBudget() → Get budget for month
    ↓
Calculate Metrics
├─ total_expenses = sum(transaction amounts)
├─ savingsRate = (income - total_expenses) / income * 100
└─ categoryBreakdown = group by category + calculate %
    ↓
generateExpenseAdvice()
├─ Check savings rate
├─ Check budget adherence
├─ Check category overage
└─ Generate tips
    ↓
calculateFinancialHealthScore()
├─ Apply savings rate penalty
├─ Apply budget variance penalty
├─ Apply discretionary penalty
└─ Clamp to 0-100
    ↓
Return MonthlyExpenseAnalysis object
    ↓
ExpenseInsights Component renders:
├─ Health Score gauge
├─ Metric cards
├─ Category breakdown
└─ Financial advice
```

### 3. Security Flow
```
User Makes Request
    ↓
Supabase Auth Check
├─ Is user authenticated?
└─ Get user_id from session
    ↓
Database Query with RLS
└─ WHERE user_id = authenticated_user_id
    ↓
Database RLS Policy
└─ CREATE POLICY "Users can view their own X"
   FOR SELECT USING (auth.uid() = user_id)
    ↓
Result: Only user's data returned
    ↓
If other user tries: 403 Forbidden
```

---

## Component Architecture

```
PurchaseAnalyzerForm (existing)
│
├─ Input Fields (salary, expenses, emi, savings)
│  └─ Validation: No negative values (NEW)
│
├─ Purchase Input Fields (price, funding mode)
│  └─ Validation: No negative values
│
└─ Result Display
   └─ Uses: analyze(input) from finance.ts


ExpenseTracker Hierarchy
│
├─ TransactionForm
│  └─ Calls: createTransaction()
│
└─ TransactionList
   ├─ Maps over transactions
   └─ Shows: Delete button


ExpenseInsights Hierarchy
│
├─ MetricCard (multiple instances)
│  └─ Shows: Income, Expenses, Savings, Budget status
│
├─ Category Breakdown
│  ├─ ForEach category: Progress bar
│  └─ Shows: Spent vs Budget
│
└─ Financial Advice
   └─ Lists generated advice tips


CategoryManager Hierarchy
│
├─ Form (conditional)
│  ├─ Inputs: Name, Budget, Color, Essential toggle
│  └─ Calls: createCategory()
│
└─ Category Grid
   └─ Each category card
      └─ Shows: Name, Budget, Color, Delete button
```

---

## Route Structure

```
/
├─ / (landing page)
├─ /login (OAuth)
│
└─ /_authenticated (auth guard layout)
   ├─ /app (purchase analyzer) - existing
   │  └─ Uses: PurchaseAnalyzer component
   │
   ├─ /expenses (NEW - monthly tracking)
   │  ├─ Uses: TransactionForm, TransactionList
   │  └─ Calls: fetchTransactions, createTransaction, deleteTransaction
   │
   ├─ /categories (NEW - management)
   │  ├─ Uses: CategoryManager
   │  └─ Calls: fetchCategories, createCategory, updateCategory, deleteCategory
   │
   ├─ /insights (NEW - analysis)
   │  ├─ Uses: ExpenseInsights
   │  └─ Calls: analyzeMonthlyExpenses (main analytics)
   │
   ├─ /history (existing - decision history)
   │  └─ BUG FIX: Added user_id filter
   │
   └─ /profile (existing - settings)
       └─ Uses: fetchProfile, upsertProfile
```

---

## Type Flow

```
AnalysisInput (from finance.ts)
├─ salary: number
├─ expenses: number
├─ emi: number
├─ savings: number
├─ price: number
├─ fundingMode: "savings" | "emi"
└─ emiMonths?: number


Category (NEW)
├─ id: string
├─ user_id: string
├─ name: string
├─ monthly_budget: number
├─ color: string
├─ icon: string
└─ is_essential: boolean


Transaction (NEW)
├─ id: string
├─ user_id: string
├─ category_id: string
├─ amount: number
├─ transaction_date: string
├─ description?: string
└─ tags?: string[]


MonthlyExpenseAnalysis (NEW)
├─ month: string
├─ total_income: number
├─ total_expenses: number
├─ savings: number
├─ savingsRate: number
├─ healthScore: number
├─ categoryBreakdown: CategoryBreakdown[]
└─ advice: string[]


CategoryBreakdown (NEW)
├─ category: Category
├─ spent: number
├─ budget: number
├─ percentOfBudget: number
├─ isOverBudget: boolean
└─ transactions: Transaction[]
```

---

## State Management

```
React Component State
├─ Local State: form inputs, UI toggles
│
└─ Server State (via React Query)
   ├─ categories (refetch on delete)
   ├─ transactions (refetch on add/delete)
   └─ analysis (refetch on month change)


Data Flow
User Action
    ↓
Update Local State (UI feedback)
    ↓
Call API Function (expense.ts)
    ↓
Supabase Query/Mutation
    ↓
Refetch Related Data
    ↓
Update Component State
    ↓
Re-render UI
    ↓
Toast Notification
```

---

## Database Relationships

```
auth.users (1)
    │
    ├─→ (1 to ∞) profiles
    │
    ├─→ (1 to ∞) categories
    │   │
    │   └─→ (1 to ∞) transactions
    │
    ├─→ (1 to ∞) transactions
    │
    ├─→ (1 to ∞) decisions
    │
    └─→ (1 to ∞) monthly_budgets


RLS Enforcement
user_id ∈ categories   → Only user can read/write own categories
user_id ∈ transactions → Only user can read/write own transactions
user_id ∈ profiles     → Only user can read/write own profile
user_id ∈ decisions    → Only user can read/write own decisions
user_id ∈ monthly_budgets → Only user can read/write own budgets
```

---

## Request/Response Cycle

```
Browser → Components → expense.ts → supabase-js → Supabase
  ↓          ↓            ↓            ↓            ↓
  UI        React       TypeScript    Client      Database
  Action    Logic       Functions     Library      (SQL)
                                        ↓           ↓
← Components ← Data ← response ← RLS Check ← Query Result ←
  Update    Props       JSON       Passed?       Rows
```

---

## Performance Optimization

```
Batch Loading
├─ Promise.all([
│  ├─ fetchTransactions(),
│  ├─ fetchCategories(),
│  └─ fetchMonthlyBudget()
│  ])
└─ Reduces round-trips: 1 instead of 3


Database Indexes
├─ transactions(user_id, transaction_date DESC)
│  └─ Fast: Find user's expenses in date order
│
├─ transactions(category_id)
│  └─ Fast: Find expenses by category
│
└─ monthly_budgets(user_id, year, month)
   └─ Fast: Unique lookup for specific month


Component Memoization
└─ React.memo() on list items to prevent re-renders


Query Filtering
├─ Server-side: Only fetch month's data
├─ Not: Fetch all years then filter in JS
└─ Saves bandwidth & processing
```

---

This architecture ensures:
- ✅ Clear separation of concerns
- ✅ Type-safe data flow
- ✅ Secure user isolation
- ✅ Efficient database queries
- ✅ Responsive UI updates
