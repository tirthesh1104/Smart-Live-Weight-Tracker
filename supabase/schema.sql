-- ====================================================================
-- Smart Live Weight Tracker - PostgreSQL & Supabase Database Schema
-- Railway Passenger Coach Crowd Monitoring & Management System
-- Phase 4: Non-Destructive, Hardened Role-Based Security Schema (Step 2.6 Final)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'passenger')) DEFAULT 'passenger',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TRAINS TABLE
CREATE TABLE IF NOT EXISTS public.trains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    from_station VARCHAR(100) NOT NULL,
    to_station VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. COACHES TABLE
CREATE TABLE IF NOT EXISTS public.coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
    coach_no VARCHAR(10) NOT NULL,
    coach_type VARCHAR(30) NOT NULL CHECK (coach_type IN ('Sleeper', 'AC 3 Tier', 'AC 2 Tier', 'General', 'Second Sitting', 'Pantry Car', 'Engine')),
    empty_weight_kg NUMERIC(10, 2) NOT NULL CHECK (empty_weight_kg > 0),
    max_capacity_kg NUMERIC(10, 2) NOT NULL CHECK (max_capacity_kg > empty_weight_kg),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(train_id, coach_no)
);

-- 4. WEIGHT_READINGS TABLE
CREATE TABLE IF NOT EXISTS public.weight_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg >= 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source VARCHAR(50) NOT NULL DEFAULT 'piezoelectric_bogie_sensor',
    is_simulated BOOLEAN NOT NULL DEFAULT true
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'overload')),
    train_id UUID REFERENCES public.trains(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_read BOOLEAN NOT NULL DEFAULT false
);

-- 6. INCIDENTS TABLE (Safety & Overload Reports - Staff/Admin Only)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
    reported_by VARCHAR(150) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PREDICTIONS TABLE (AI Generated Horizons)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    predicted_occupancy NUMERIC(5, 2) NOT NULL CHECK (predicted_occupancy >= 0),
    prediction_horizon_minutes INTEGER NOT NULL CHECK (prediction_horizon_minutes IN (15, 30, 60)),
    confidence NUMERIC(4, 3) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. AUDIT_LOGS TABLE (Append-Only Operational Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_coaches_train ON public.coaches(train_id);
CREATE INDEX IF NOT EXISTS idx_weight_coach_time ON public.weight_readings(coach_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_time ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON public.notifications(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_train ON public.incidents(train_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_coach ON public.predictions(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_time ON public.audit_logs(created_at DESC);

-- ====================================================================
-- TARGETED LEAST-PRIVILEGE DATABASE PERMISSIONS & GRANTS
-- ====================================================================
-- Reset permissions scoped strictly to the eight application tables
REVOKE ALL ON TABLE 
  public.profiles, 
  public.trains, 
  public.coaches, 
  public.weight_readings, 
  public.notifications, 
  public.incidents, 
  public.predictions, 
  public.audit_logs 
FROM anon, authenticated, PUBLIC;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Public Read Tables (Passenger, Station Displays, Public Monitoring)
GRANT SELECT ON public.trains TO anon, authenticated;
GRANT SELECT ON public.coaches TO anon, authenticated;
GRANT SELECT ON public.weight_readings TO anon, authenticated;
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT SELECT ON public.predictions TO anon, authenticated;

-- Authenticated Operational Tables (Operations strictly filtered by RLS policies)
GRANT INSERT, UPDATE, DELETE ON public.trains TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT INSERT, DELETE ON public.weight_readings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.predictions TO authenticated;

-- Restricted Tables (No anon access under any circumstance)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Full Administrative Privileges on the eight application tables for Service Role & Postgres
GRANT ALL ON TABLE 
  public.profiles, 
  public.trains, 
  public.coaches, 
  public.weight_readings, 
  public.notifications, 
  public.incidents, 
  public.predictions, 
  public.audit_logs 
TO service_role, postgres;

-- ====================================================================
-- SECURE RECURSION-FREE ROLE HELPER FUNCTION
-- ====================================================================
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

-- ====================================================================
-- AUTOMATIC USER PROVISIONING & EMAIL SYNCHRONIZATION TRIGGER FUNCTION
-- ====================================================================
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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin';
  END IF;
END $$;

-- Separate Trigger Definitions on auth.users for Strict PostgreSQL Syntax Compliance
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- DATABASE-LEVEL PROFILE FIELDS PROTECTION TRIGGER
-- ====================================================================
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

REVOKE ALL ON FUNCTION public.protect_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.protect_profile_role() TO authenticated, service_role, postgres;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- DYNAMIC CATALOG-BASED LEGACY POLICY CLEANUP
-- ====================================================================
-- Removes all legacy or conflicting policies across application tables safely
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'trains', 'coaches', 'weight_readings', 'notifications', 'incidents', 'predictions', 'audit_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ====================================================================
-- SECURE ROLE-BASED ACCESS CONTROL (RBAC) POLICIES
-- ====================================================================

-- 0. PROFILES: Privacy-guarded, Non-recursive
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    public.current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.current_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.current_user_role() = 'admin');

CREATE POLICY "Users can insert their profile on signup" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND role = 'passenger'
  );

-- 1. TRAINS: Public read, Admin write
CREATE POLICY "Anyone can view trains" ON public.trains 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage trains" ON public.trains
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 2. COACHES: Public read, Admin write
CREATE POLICY "Anyone can view coaches" ON public.coaches 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage coaches" ON public.coaches
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 3. WEIGHT READINGS: Public read, Staff/Admin insert, Admin purge
CREATE POLICY "Anyone can view weight readings" ON public.weight_readings 
  FOR SELECT USING (true);

CREATE POLICY "Staff and admin can insert weight readings" ON public.weight_readings
  FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Admins can manage weight readings" ON public.weight_readings
  FOR DELETE USING (public.current_user_role() = 'admin');

-- 4. NOTIFICATIONS: Public read, Staff/Admin insert/update, Admin delete
CREATE POLICY "Anyone can view active notifications" ON public.notifications 
  FOR SELECT USING (true);

CREATE POLICY "Staff and admin can manage notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin can update notifications" ON public.notifications
  FOR UPDATE USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE USING (public.current_user_role() = 'admin');

-- 5. INCIDENTS: Internal staff/admin read, staff/admin insert, Admin manage
CREATE POLICY "Staff and admin can view incidents" ON public.incidents 
  FOR SELECT USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin can insert incidents" ON public.incidents
  FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Admins can manage incidents" ON public.incidents
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 6. PREDICTIONS: Public read, Admin manage
CREATE POLICY "Anyone can view predictions" ON public.predictions 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage predictions" ON public.predictions
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 7. AUDIT LOGS: Admin read, Staff/Admin append-only, NO user update/delete
CREATE POLICY "Admins can view audit logs" ON public.audit_logs 
  FOR SELECT USING (public.current_user_role() = 'admin');

CREATE POLICY "Authorized operators can append audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    public.current_user_role() IN ('staff', 'admin') AND 
    (user_id IS NULL OR user_id = auth.uid())
  );

-- REALTIME SUBSCRIPTIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'weight_readings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_readings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;
END $$;
