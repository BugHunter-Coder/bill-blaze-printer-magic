-- Simple RLS fix for multi-shop access
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'products';

-- Drop all existing product policies
DROP POLICY IF EXISTS "Shop members can view products" ON public.products;
DROP POLICY IF EXISTS "Shop members can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view products from their shops" ON public.products;
DROP POLICY IF EXISTS "Users can manage products in their shops" ON public.products;

-- Create a simple policy that allows users to access products from shops they own
CREATE POLICY "Users can access products from owned shops" ON public.products
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

-- Create a policy for users assigned to shops
CREATE POLICY "Users can access products from assigned shops" ON public.products
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Also fix other tables with the same approach
DROP POLICY IF EXISTS "Shop members can view categories" ON public.categories;
DROP POLICY IF EXISTS "Shop members can manage categories" ON public.categories;

CREATE POLICY "Users can access categories from owned shops" ON public.categories
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can access categories from assigned shops" ON public.categories
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Fix customers table
DROP POLICY IF EXISTS "Shop members can view customers" ON public.customers;
DROP POLICY IF EXISTS "Shop members can manage customers" ON public.customers;

CREATE POLICY "Users can access customers from owned shops" ON public.customers
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can access customers from assigned shops" ON public.customers
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Fix transactions table
DROP POLICY IF EXISTS "Shop members can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Shop members can manage transactions" ON public.transactions;

CREATE POLICY "Users can access transactions from owned shops" ON public.transactions
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can access transactions from assigned shops" ON public.transactions
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Fix expenses table
DROP POLICY IF EXISTS "Shop members can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Shop members can manage expenses" ON public.expenses;

CREATE POLICY "Users can access expenses from owned shops" ON public.expenses
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can access expenses from assigned shops" ON public.expenses
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
  ); 