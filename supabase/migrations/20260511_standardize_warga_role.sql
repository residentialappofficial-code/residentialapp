-- Update Profiles table role constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'warga', 'resident'));

-- Update any other tables that might have similar checks
-- For example, if there's a roles table with a check
-- We also keep 'resident' for backward compatibility during migration

-- Update existing data
UPDATE public.profiles SET role = 'warga' WHERE role = 'resident';
UPDATE public.perumahan_roles SET name = 'Warga' WHERE name = 'Resident';
