-- Add Stripe fields to subscribers table for Stripe integration
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT; 