-- Create subscription_applications table
CREATE TABLE IF NOT EXISTS subscription_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requested_tier TEXT NOT NULL CHECK (requested_tier IN ('basic', 'premium', 'enterprise')),
    application_reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE subscription_applications ENABLE ROW LEVEL SECURITY;

-- Allow shop owners to view their own applications
CREATE POLICY "Shop owners can view their own applications" ON subscription_applications
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Allow shop owners to create applications
CREATE POLICY "Shop owners can create applications" ON subscription_applications
    FOR INSERT WITH CHECK (
        owner_id = auth.uid() OR 
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Allow super admins to view all applications
CREATE POLICY "Super admins can view all applications" ON subscription_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow super admins to update applications
CREATE POLICY "Super admins can update applications" ON subscription_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_applications_shop_id ON subscription_applications(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscription_applications_status ON subscription_applications(status);
CREATE INDEX IF NOT EXISTS idx_subscription_applications_owner_id ON subscription_applications(owner_id); 