-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Add email column to profiles table to store user email for easier access
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update existing profiles with email from auth.users
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE public.profiles.id = auth.users.id;

-- Fix RLS policies for multi-shop access
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
