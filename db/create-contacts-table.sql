-- Authorized users table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"categories": ["api"]}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (admin operations)
CREATE POLICY "Service role can manage authorized users" ON contacts
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for checking user authorization
CREATE POLICY "Check user authorization" ON contacts
  FOR SELECT USING (
    auth.uid()::text = id::text OR
    auth.jwt() ->> 'email' = email OR
    auth.jwt() ->> 'phone' = phone
  );
