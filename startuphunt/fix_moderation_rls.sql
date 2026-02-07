-- Fix Moderation Table RLS Policies
-- Run this in Supabase SQL Editor

-- Enable RLS on moderation table (if not already enabled)
ALTER TABLE moderation ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own moderation requests" ON moderation;
DROP POLICY IF EXISTS "Users can view their own moderation requests" ON moderation;
DROP POLICY IF EXISTS "Admins can view all moderation requests" ON moderation;
DROP POLICY IF EXISTS "Admins can update all moderation requests" ON moderation;
DROP POLICY IF EXISTS "Admins can delete all moderation requests" ON moderation;

-- Policy 1: Allow users to insert their own moderation requests
CREATE POLICY "Users can insert their own moderation requests"
ON moderation
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Allow users to view their own moderation requests
CREATE POLICY "Users can view their own moderation requests"
ON moderation
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 3: Allow admins to view all moderation requests
CREATE POLICY "Admins can view all moderation requests"
ON moderation
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy 4: Allow admins to update all moderation requests
CREATE POLICY "Admins can update all moderation requests"
ON moderation
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy 5: Allow admins to delete all moderation requests
CREATE POLICY "Admins can delete all moderation requests"
ON moderation
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
