-- Add missing columns to shops table for extended settings
ALTER TABLE public.shops 
ADD COLUMN description TEXT,
ADD COLUMN website TEXT,
ADD COLUMN timezone TEXT DEFAULT 'Asia/Kolkata',
ADD COLUMN business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
  "thursday": {"open": "09:00", "close": "18:00", "closed": false},
  "friday": {"open": "09:00", "close": "18:00", "closed": false},
  "saturday": {"open": "09:00", "close": "16:00", "closed": false},
  "sunday": {"open": "09:00", "close": "16:00", "closed": true}
}',
ADD COLUMN auto_backup BOOLEAN DEFAULT true,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;