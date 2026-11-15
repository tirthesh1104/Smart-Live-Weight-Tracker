-- ====================================================================
-- Smart Live Weight Tracker - Phase 4 Auth & Profiles Migration
-- Hardened, Recursion-Free Role-Based Security & Profile Provisioning (Step 2.9 Final)
-- ====================================================================

-- 1. Ensure profiles table references auth.users safely
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'passenger')) DEFAULT 'passenger',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Targeted least-privilege grants for profiles
REVOKE ALL ON TABLE public.profiles FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role, postgres;

-- 2. Secure recursion-free role lookup helper function
-- Returns the role of the calling authenticated user, or 'anon' if unauthenticated
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'anon'
  );
$$;

-- Grant execution to anon, authenticated, service_role, and postgres
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role, postgres;

-- 3. Automatic user provisioning and email synchronization trigger function
-- Collision-proof unique fallback email generation prevents duplicate key violations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        'Passenger Commuter'
      ),
      COALESCE(
        NULLIF(TRIM(NEW.email), ''),
        'passenger-' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 12) || '@railway.local'
      ),
      'passenger' -- strictly default to passenger, never trust client-supplied metadata
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = CASE 
          WHEN NULLIF(TRIM(EXCLUDED.full_name), '') IS NOT NULL AND EXCLUDED.full_name <> 'Passenger Commuter'
          THEN EXCLUDED.full_name 
          ELSE public.profiles.full_name 
        END,
        email = CASE 
          WHEN NULLIF(TRIM(EXCLUDED.email), '') IS NOT NULL AND EXCLUDED.email NOT LIKE '%@railway.local'
          THEN EXCLUDED.email 
          ELSE public.profiles.email 
        END;
        -- NOTE: role is NEVER updated on conflict to prevent accidental elevation or demotion
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Synchronize email update from auth.users if changed through verified auth lifecycle
    IF NEW.email IS DISTINCT FROM OLD.email AND NULLIF(TRIM(NEW.email), '') IS NOT NULL THEN
      UPDATE public.profiles
      SET email = TRIM(NEW.email)
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function Execution Permissions for handle_new_user (Targeted)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin';
  END IF;
END $$;

-- 4. Separate Trigger Definitions on auth.users for Strict PostgreSQL Syntax Compliance
-- Trigger A: User Registration Trigger (AFTER INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger B: Email Synchronization Trigger (AFTER UPDATE OF email)
DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Database-level profile fields protection trigger (Role, Email, ID, and created_at Guards)
-- Uses session context verification: protects against both unauthorized API callers and unauthenticated abuse
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 1. Prevent ID modification
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security Violation: Profile ID cannot be altered.';
  END IF;

  -- 2. Prevent created_at modification
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Security Violation: Profile creation timestamp cannot be altered.';
  END IF;

  -- 3. Prevent Role modification unless caller is genuinely an authenticated admin or database-owner session
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL THEN
      IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Security Violation: Only Administrators are authorized to modify user roles.';
      END IF;
    ELSIF SESSION_USER NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Security Violation: Direct role updates require authorized database owner session.';
    END IF;
  END IF;

  -- 4. Prevent Email tampering or desynchronization (profile email MUST match auth.users.email)
  -- Enforced universally for all callers (passenger, staff, and admin):
  -- Neither ordinary users nor administrators can directly alter profiles.email to an arbitrary unverified value.
  -- Verified changes via Supabase Auth lifecycle synchronize seamlessly because auth.users is already updated.
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = NEW.id AND (email = NEW.email OR TRIM(email) = TRIM(NEW.email))
    ) THEN
      RAISE EXCEPTION 'Security Violation: Profile email must strictly match verified auth.users credentials.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Function Execution Permissions for protect_profile_role (Targeted)
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.protect_profile_role() TO authenticated, service_role, postgres;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 6. Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Dynamic Catalog-based cleanup of all legacy policies on profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Allow users to view their own profile, and allow staff/admin to view operator profiles (RECURSION-FREE)
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    public.current_user_role() IN ('admin', 'staff')
  );

-- Allow users to update their own profile; trigger enforces that non-admins cannot change role, email, id, or created_at
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.current_user_role() = 'admin');

-- Only Admin can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.current_user_role() = 'admin');

-- Allow authenticated users to insert their own profile on signup strictly as passenger
CREATE POLICY "Users can insert their profile on signup" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND role = 'passenger'
  );
