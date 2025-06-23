
-- First, let's drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their shop" ON public.profiles;
DROP POLICY IF EXISTS "Shop owners can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Shop members can view categories" ON public.categories;
DROP POLICY IF EXISTS "Shop members can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Shop members can view products" ON public.products;
DROP POLICY IF EXISTS "Shop members can manage products" ON public.products;
DROP POLICY IF EXISTS "Shop members can view customers" ON public.customers;
DROP POLICY IF EXISTS "Shop members can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Shop members can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Shop members can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Shop members can view transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Shop members can manage transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Shop members can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Shop members can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Shop members can view inventory adjustments" ON public.inventory_adjustments;
DROP POLICY IF EXISTS "Shop members can manage inventory adjustments" ON public.inventory_adjustments;

-- Drop the existing function that causes recursion
DROP FUNCTION IF EXISTS get_user_shop_id();

-- Create a new security definer function to get user's shop_id without causing recursion
CREATE OR REPLACE FUNCTION public.get_current_user_shop_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT shop_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Create a function to check if user is shop owner
CREATE OR REPLACE FUNCTION public.is_shop_owner(shop_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(SELECT 1 FROM public.shops WHERE id = shop_uuid AND owner_id = auth.uid());
$$;

-- Create new RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Shop owners can view profiles in their shops" ON public.profiles
  FOR SELECT USING (public.is_shop_owner(shop_id));

CREATE POLICY "Shop owners can manage profiles in their shops" ON public.profiles
  FOR ALL USING (public.is_shop_owner(shop_id));

-- Create new RLS policies for other tables using the security definer function
CREATE POLICY "Shop members can view categories" ON public.categories
  FOR SELECT USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can manage categories" ON public.categories
  FOR ALL USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can view products" ON public.products
  FOR SELECT USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can manage products" ON public.products
  FOR ALL USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can view customers" ON public.customers
  FOR SELECT USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can manage customers" ON public.customers
  FOR ALL USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can view transactions" ON public.transactions
  FOR SELECT USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can manage transactions" ON public.transactions
  FOR ALL USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can view transaction items" ON public.transaction_items
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.transactions WHERE shop_id = public.get_current_user_shop_id()
    )
  );

CREATE POLICY "Shop members can manage transaction items" ON public.transaction_items
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM public.transactions WHERE shop_id = public.get_current_user_shop_id()
    )
  );

CREATE POLICY "Shop members can view expenses" ON public.expenses
  FOR SELECT USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can manage expenses" ON public.expenses
  FOR ALL USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can view inventory adjustments" ON public.inventory_adjustments
  FOR SELECT USING (shop_id = public.get_current_user_shop_id());

CREATE POLICY "Shop members can manage inventory adjustments" ON public.inventory_adjustments
  FOR ALL USING (shop_id = public.get_current_user_shop_id());
