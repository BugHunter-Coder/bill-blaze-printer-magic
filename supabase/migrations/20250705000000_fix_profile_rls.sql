-- Fix RLS policies for profiles to allow proper profile creation and management

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Shop owners can view profiles in their shops" ON public.profiles;
DROP POLICY IF EXISTS "Shop owners can manage profiles in their shops" ON public.profiles;

-- Create comprehensive profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Shop owners can view profiles in their shops" ON public.profiles
  FOR SELECT USING (public.is_shop_owner(shop_id));

CREATE POLICY "Shop owners can manage profiles in their shops" ON public.profiles
  FOR ALL USING (public.is_shop_owner(shop_id));

-- Also ensure shops policies allow creation
DROP POLICY IF EXISTS "Users can create their own shops" ON public.shops;
CREATE POLICY "Users can create their own shops" ON public.shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Add a policy to allow users to view shops they own or are assigned to
DROP POLICY IF EXISTS "Users can view their own shops" ON public.shops;
CREATE POLICY "Users can view their own shops" ON public.shops
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR id IN (
      SELECT shop_id FROM public.profiles 
      WHERE id = auth.uid() AND shop_id IS NOT NULL
    )
  ); 