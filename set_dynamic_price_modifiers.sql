-- Set dynamic price_modifier values for each product's variants
-- Each product can have different price additions for its variants

-- Example: Set different price modifiers for different products
-- You can adjust these values based on your actual product pricing

-- For Veg Steam Momos: Full adds ₹30
UPDATE product_variants 
SET price_modifier = 30 
WHERE value = 'Full' AND product_id IN (
    SELECT id FROM products WHERE name LIKE '%Veg Steam Momos%'
);

-- For Paneer Steam Momos: Full adds ₹40
UPDATE product_variants 
SET price_modifier = 40 
WHERE value = 'Full' AND product_id IN (
    SELECT id FROM products WHERE name LIKE '%Paneer Steam Momos%'
);

-- For Veg Kurkure Momos: Full adds ₹50
UPDATE product_variants 
SET price_modifier = 50 
WHERE value = 'Full' AND product_id IN (
    SELECT id FROM products WHERE name LIKE '%Veg Kurkure Momos%'
);

-- Set Half variants to have no price addition (base price only)
UPDATE product_variants 
SET price_modifier = 0 
WHERE value = 'Half';

-- Ensure 'price' column exists
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Set price for all variants where price is null
UPDATE product_variants
SET price = (
  SELECT p.price + COALESCE(product_variants.price_modifier, 0)
  FROM products p
  WHERE p.id = product_variants.product_id
)
WHERE price IS NULL;

-- Optionally, you can also update all variants to always sync price this way:
-- UPDATE product_variants
-- SET price = (
--   SELECT p.price + COALESCE(product_variants.price_modifier, 0)
--   FROM products p
--   WHERE p.id = product_variants.product_id
-- );

-- Now all variants will have a price for correct UI display

-- Verify the dynamic pricing
SELECT 
    p.name as product_name,
    p.price as base_price,
    pv.value as variant_value,
    pv.price_modifier,
    (p.price + pv.price_modifier) as final_price
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.has_variants = true
ORDER BY p.name, pv.value; 