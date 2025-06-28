-- Fix RLS policies for multi-shop access
-- Run these commands in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Shop members can view products" ON public.products;
DROP POLICY IF EXISTS "Shop members can manage products" ON public.products;
DROP POLICY IF EXISTS "Shop members can view categories" ON public.categories;
DROP POLICY IF EXISTS "Shop members can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Shop members can view customers" ON public.customers;
DROP POLICY IF EXISTS "Shop members can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Shop members can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Shop members can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Shop members can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Shop members can manage expenses" ON public.expenses;

-- Create new policies that allow access to shops the user owns or is assigned to
CREATE POLICY "Users can view products from their shops" ON public.products
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage products in their shops" ON public.products
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can view categories from their shops" ON public.categories
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage categories in their shops" ON public.categories
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can view customers from their shops" ON public.customers
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage customers in their shops" ON public.customers
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can view transactions from their shops" ON public.transactions
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage transactions in their shops" ON public.transactions
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can view expenses from their shops" ON public.expenses
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage expenses in their shops" ON public.expenses
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Also fix the profiles policy to allow access to multiple shops
DROP POLICY IF EXISTS "Users can view profiles in their shop" ON public.profiles;
DROP POLICY IF EXISTS "Shop owners can manage profiles" ON public.profiles;

CREATE POLICY "Users can view profiles from their shops" ON public.profiles
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
    OR id = auth.uid()
  );

CREATE POLICY "Users can manage profiles in their shops" ON public.profiles
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid())
    )
    OR id = auth.uid()
  ); 