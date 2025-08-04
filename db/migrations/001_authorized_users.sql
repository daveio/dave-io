-- Migration: Create authorized_users table for Supabase auth whitelist
-- This table stores authorized users who are allowed to access protected routes

-- Create the authorized_users table
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one identifier is provided
    CONSTRAINT check_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON public.authorized_users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authorized_users_phone ON public.authorized_users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON public.authorized_users(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_authorized_users_updated_at
    BEFORE UPDATE ON public.authorized_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only service role can read/write to this table
CREATE POLICY "Service role can manage authorized users" ON public.authorized_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.authorized_users IS 'Whitelist of users authorized to access protected routes';
COMMENT ON COLUMN public.authorized_users.email IS 'User email address for authentication';
COMMENT ON COLUMN public.authorized_users.phone IS 'User phone number for authentication';
COMMENT ON COLUMN public.authorized_users.permissions IS 'JSON object containing user permissions';
COMMENT ON COLUMN public.authorized_users.is_active IS 'Whether the user authorization is currently active';

-- Insert example authorized user (replace with actual data)
-- INSERT INTO public.authorized_users (email, permissions) 
-- VALUES ('admin@example.com', '{"admin": true, "features": ["pandorica"]}');