-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g., "Size", "Color", "Material"
  value VARCHAR(255) NOT NULL, -- e.g., "Large", "Red", "Cotton"
  price_modifier DECIMAL(10,2) DEFAULT 0, -- Additional cost for this variant
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);

-- Add RLS policies for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy for shop owners to manage their product variants
CREATE POLICY "Shop owners can manage their product variants" ON product_variants
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products 
      WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM shops WHERE owner_id = auth.uid()
      )
    )
  );

-- Policy for shop users to view product variants
CREATE POLICY "Shop users can view product variants" ON product_variants
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM products 
      WHERE shop_id IN (
        SELECT shop_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT id FROM shops WHERE owner_id = auth.uid()
      )
    )
  );

-- Add variant_options table for managing variant types
CREATE TABLE IF NOT EXISTS variant_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g., "Size", "Color", "Material"
  values TEXT[] NOT NULL, -- Array of possible values
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for variant_options
CREATE INDEX IF NOT EXISTS idx_variant_options_shop_id ON variant_options(shop_id);

-- Add RLS policies for variant_options
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;

-- Policy for shop owners to manage their variant options
CREATE POLICY "Shop owners can manage their variant options" ON variant_options
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );

-- Policy for shop users to view variant options
CREATE POLICY "Shop users can view variant options" ON variant_options
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );

-- Add has_variants column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON product_variants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variant_options_updated_at 
  BEFORE UPDATE ON variant_options 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 