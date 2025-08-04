-- Migration: Create contacts table for Supabase auth whitelist
-- This table stores authorized users who are allowed to access protected routes

-- Create the contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure at least one identifier is provided
    CONSTRAINT check_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
    CONSTRAINT check_phone_e164 CHECK (
        phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'
    )
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_active ON public.contacts(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only service role can read/write to this table
CREATE POLICY "Service role can manage authorized users" ON public.contacts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.contacts IS 'Whitelist of users authorized to access protected routes';
COMMENT ON COLUMN public.contacts.email IS 'User email address for authentication';
COMMENT ON COLUMN public.contacts.phone IS 'User phone number in E.164 format for authentication';
COMMENT ON COLUMN public.contacts.permissions IS 'JSON object containing user permissions';
COMMENT ON COLUMN public.contacts.is_active IS 'Whether the user authorization is currently active';

-- Insert example authorized user (replace with actual data)
-- INSERT INTO public.contacts (email, permissions)
-- VALUES ('admin@example.com', '{"admin": true, "features": ["pandorica"]}');
