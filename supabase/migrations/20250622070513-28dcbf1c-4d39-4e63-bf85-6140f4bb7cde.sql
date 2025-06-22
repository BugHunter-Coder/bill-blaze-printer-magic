
-- Create enum types first
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'bank_transfer', 'other');
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'expense', 'refund');
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'manager');

-- Create shops table (multi-tenant)
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,4) DEFAULT 0.08,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table for inventory
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, sku),
  UNIQUE(shop_id, barcode)
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table (sales, purchases, expenses)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  invoice_number TEXT,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_reference TEXT,
  notes TEXT,
  is_direct_billing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction_items table
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_adjustments table
CREATE TABLE public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL, -- 'stock_in', 'stock_out', 'adjustment'
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  reference_number TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shops
CREATE POLICY "Users can view their own shops" ON public.shops
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own shops" ON public.shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shops" ON public.shops
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create helper function to get user's shop_id
CREATE OR REPLACE FUNCTION get_user_shop_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT shop_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view profiles in their shop" ON public.profiles
  FOR SELECT USING (shop_id = get_user_shop_id() OR id = auth.uid());

CREATE POLICY "Shop owners can manage profiles" ON public.profiles
  FOR ALL USING (
    shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())
    OR id = auth.uid()
  );

-- Create RLS policies for other tables (shop-scoped)
CREATE POLICY "Shop members can view categories" ON public.categories
  FOR SELECT USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can manage categories" ON public.categories
  FOR ALL USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can view products" ON public.products
  FOR SELECT USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can manage products" ON public.products
  FOR ALL USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can view customers" ON public.customers
  FOR SELECT USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can manage customers" ON public.customers
  FOR ALL USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can view transactions" ON public.transactions
  FOR SELECT USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can manage transactions" ON public.transactions
  FOR ALL USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can view transaction items" ON public.transaction_items
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.transactions WHERE shop_id = get_user_shop_id()
    )
  );

CREATE POLICY "Shop members can manage transaction items" ON public.transaction_items
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM public.transactions WHERE shop_id = get_user_shop_id()
    )
  );

CREATE POLICY "Shop members can view expenses" ON public.expenses
  FOR SELECT USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can manage expenses" ON public.expenses
  FOR ALL USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can view inventory adjustments" ON public.inventory_adjustments
  FOR SELECT USING (shop_id = get_user_shop_id());

CREATE POLICY "Shop members can manage inventory adjustments" ON public.inventory_adjustments
  FOR ALL USING (shop_id = get_user_shop_id());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX idx_profiles_shop_id ON public.profiles(shop_id);
CREATE INDEX idx_products_shop_id ON public.products(shop_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX idx_transactions_shop_id ON public.transactions(shop_id);
CREATE INDEX idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON public.transaction_items(product_id);
CREATE INDEX idx_expenses_shop_id ON public.expenses(shop_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_inventory_adjustments_shop_id ON public.inventory_adjustments(shop_id);
CREATE INDEX idx_inventory_adjustments_product_id ON public.inventory_adjustments(product_id);
