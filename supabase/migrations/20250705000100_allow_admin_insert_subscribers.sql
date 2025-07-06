-- Allow only super admins (by email) to insert into the subscribers table
DROP POLICY IF EXISTS "Admins can insert subscribers" ON public.subscribers;

-- Drop the policy if it exists to avoid errors
DROP POLICY IF EXISTS "Super admins can insert subscribers" ON public.subscribers;

CREATE POLICY "Super admins can insert subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (
  (SELECT email FROM public.profiles WHERE id = auth.uid()) IN ('admin@billblaze.com', 'harjot@iprofit.in')
); 