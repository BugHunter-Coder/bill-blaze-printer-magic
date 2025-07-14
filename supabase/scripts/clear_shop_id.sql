-- Usage: Replace 'USER_UUID_HERE' with the actual user id (UUID)
UPDATE public.profiles
SET shop_id = NULL
WHERE id = 'USER_UUID_HERE'; 