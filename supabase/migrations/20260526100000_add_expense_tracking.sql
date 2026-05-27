-- Categories table for expense classification
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1', -- Default indigo color
  icon TEXT NOT NULL DEFAULT 'Wallet', -- Icon name from lucide-react
  monthly_budget NUMERIC NOT NULL DEFAULT 0,
  is_essential BOOLEAN NOT NULL DEFAULT false, -- Essential vs discretionary
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_categories_user ON public.categories(user_id);

-- Transactions table for actual expenses
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT CHECK (recurring_interval IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annual', NULL)),
  tags TEXT[], -- Array of tags for filtering
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);

-- Monthly budget tracking
CREATE TABLE public.monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  total_budget NUMERIC NOT NULL DEFAULT 0,
  discretionary_limit NUMERIC NOT NULL DEFAULT 0, -- Limit for non-essential spending
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly budgets" ON public.monthly_budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own monthly budgets" ON public.monthly_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monthly budgets" ON public.monthly_budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_monthly_budgets_user ON public.monthly_budgets(user_id, year, month);

-- Update triggers for updated_at columns
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_budgets_updated_at
BEFORE UPDATE ON public.monthly_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-populate default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, is_essential, monthly_budget)
  VALUES
    (NEW.user_id, 'Food & Groceries', 'ShoppingCart', true, 8000),
    (NEW.user_id, 'Transportation', 'Car', true, 3000),
    (NEW.user_id, 'Utilities', 'Zap', true, 2000),
    (NEW.user_id, 'Entertainment', 'Film', false, 2000),
    (NEW.user_id, 'Healthcare', 'Heart', true, 1500),
    (NEW.user_id, 'Shopping', 'Bag', false, 3000),
    (NEW.user_id, 'Dining Out', 'Coffee', false, 2000),
    (NEW.user_id, 'Subscriptions', 'Radio', false, 1000),
    (NEW.user_id, 'Education', 'BookOpen', true, 2000),
    (NEW.user_id, 'Other', 'MoreHorizontal', false, 1000)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_add_categories
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();
