-- Razorpay config table (for super admin)
CREATE TABLE IF NOT EXISTS public.razorpay_config (
  id SERIAL PRIMARY KEY,
  key_id TEXT NOT NULL,
  key_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment info to subscribers table
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT; 