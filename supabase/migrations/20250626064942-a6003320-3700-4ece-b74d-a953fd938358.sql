
-- Fix RLS policy for shop creation
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own shops" ON public.shops;

-- Create a new policy that allows authenticated users to create shops
CREATE POLICY "Authenticated users can create shops" ON public.shops
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Also ensure users can view shops they own
DROP POLICY IF EXISTS "Users can view their own shops" ON public.shops;
CREATE POLICY "Users can view their own shops" ON public.shops
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = owner_id);

-- Allow users to update their own shops
DROP POLICY IF EXISTS "Users can update their own shops" ON public.shops;
CREATE POLICY "Users can update their own shops" ON public.shops
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = owner_id);
