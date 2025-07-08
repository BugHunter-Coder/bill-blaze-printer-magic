-- Migration: Create loyalty_programs table
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  points_per_purchase integer NOT NULL DEFAULT 1,
  reward text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_shop_id ON loyalty_programs(shop_id);

-- Migration: Add details column to loyalty_programs table
ALTER TABLE loyalty_programs ADD COLUMN IF NOT EXISTS details text; 