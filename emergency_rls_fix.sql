-- Emergency RLS fix - Temporary solution
-- Run this in your Supabase SQL Editor

-- Step 1: Temporarily disable RLS on products table to allow immediate access
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Step 2: Create a simple policy that allows all authenticated users to access products
-- (This is less secure but will work immediately)
CREATE POLICY "Allow authenticated users to access products" ON public.products
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 3: Re-enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 4: Test if you can now create products
-- If this works, you can later replace the policy with more restrictive ones

-- Alternative: If you want to be more restrictive, use this instead:
-- DROP POLICY IF EXISTS "Allow authenticated users to access products" ON public.products;
-- CREATE POLICY "Users can access their shop products" ON public.products
--   FOR ALL TO authenticated
--   USING (
--     shop_id IN (
--       SELECT id FROM public.shops WHERE owner_id = auth.uid()
--     )
--   ); 