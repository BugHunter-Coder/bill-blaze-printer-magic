-- Add a column for sensitive data PIN (hashed) to shops table
ALTER TABLE public.shops
ADD COLUMN sensitive_data_pin TEXT;

-- (Optional) You may want to add a comment for clarity
COMMENT ON COLUMN public.shops.sensitive_data_pin IS 'BCrypt hash of PIN for sensitive data protection (null if unset)'; 