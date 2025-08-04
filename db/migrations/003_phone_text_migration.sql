-- Migration: Convert phone from BIGINT to TEXT with E.164 validation
-- This fixes the issue where phone numbers with country codes can exceed BIGINT limits
-- and ensures leading zeros are preserved

-- First, alter the column type from BIGINT to TEXT
ALTER TABLE public.contacts
ALTER COLUMN phone TYPE TEXT USING phone::TEXT;

-- Add a check constraint for E.164 phone number format
-- Allows optional + prefix, followed by 1-9 and up to 14 more digits
ALTER TABLE public.contacts
ADD CONSTRAINT check_phone_e164 CHECK (
    phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'
);

-- Update the comment to reflect the new format
COMMENT ON COLUMN public.contacts.phone IS 'User phone number in E.164 format for authentication';