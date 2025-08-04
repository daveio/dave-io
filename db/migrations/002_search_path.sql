-- Modify the function to set a fixed, empty search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Explicitly set an empty search path to prevent schema resolution issues
    SET search_path = '';

    -- Rest of your existing function logic here
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
