-- ====================================================================
-- SMART LIVE WEIGHT TRACKER - CONSOLIDATED PHASE 4 MASTER MIGRATION
-- Railway Passenger Coach Weight Monitoring, Crowd Management & Passenger Safety
-- Dependency-Ordered, Idempotent, Safe Repeatable Deployment Script
-- Covers All 18 Application Tables, Functions, Triggers, RLS & Seed Data
-- ====================================================================

-- Enable UUID extension if available (PostgreSQL 13+ includes gen_random_uuid() natively in core)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'uuid-ossp') THEN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  END IF;
END $$;

-- ====================================================================
-- PART 1: CORE APPLICATION TABLES (1 to 8)
-- ====================================================================

-- 1. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'passenger')) DEFAULT 'passenger',
    phone TEXT,
    department TEXT,
    employee_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
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
    max_capacity_kg NUMERIC(10, 2) NOT NULL CHECK (max_capacity_kg >= empty_weight_kg),
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

-- 6. INCIDENTS TABLE
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

-- 7. PREDICTIONS TABLE (AI Horizons)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    predicted_occupancy NUMERIC(5, 2) NOT NULL CHECK (predicted_occupancy >= 0),
    prediction_horizon_minutes INTEGER NOT NULL CHECK (prediction_horizon_minutes IN (15, 30, 60)),
    confidence NUMERIC(4, 3) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. AUDIT_LOGS TABLE (Append-Only Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- PART 2: COACH SEAT & PASSENGER OCCUPANCY TABLES (9 to 13)
-- ====================================================================

-- 9. COACH LAYOUT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.coach_layout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code VARCHAR(10) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    has_middle_berth BOOLEAN NOT NULL DEFAULT false,
    has_side_berth BOOLEAN NOT NULL DEFAULT false,
    is_chair_car BOOLEAN NOT NULL DEFAULT false,
    bays_count INTEGER NOT NULL CHECK (bays_count > 0),
    seats_per_bay INTEGER NOT NULL CHECK (seats_per_bay > 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. COACH SEATS / BERTHS TABLE
CREATE TABLE IF NOT EXISTS public.coach_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL CHECK (seat_number > 0),
    berth_type VARCHAR(20) NOT NULL,
    bay_number INTEGER NOT NULL CHECK (bay_number > 0),
    is_side_berth BOOLEAN NOT NULL DEFAULT false,
    deck_level VARCHAR(20) DEFAULT 'lower',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(coach_id, seat_number)
);

-- 11. SEAT OCCUPANCY TABLE
CREATE TABLE IF NOT EXISTS public.seat_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_seat_id UUID NOT NULL REFERENCES public.coach_seats(id) ON DELETE CASCADE,
    booking_status VARCHAR(50) NOT NULL DEFAULT 'Available',
    physical_status VARCHAR(50) NOT NULL DEFAULT 'Vacant',
    journey_from VARCHAR(100),
    journey_to VARCHAR(100),
    pnr_masked VARCHAR(20),
    discrepancy_note TEXT,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. PASSENGER SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.passenger_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    train_id UUID NOT NULL REFERENCES public.trains(id) ON DELETE CASCADE,
    coach_no VARCHAR(10) NOT NULL,
    seat_number INTEGER NOT NULL CHECK (seat_number > 0),
    pnr_number VARCHAR(30) NOT NULL,
    passenger_name TEXT NOT NULL,
    mobile_masked VARCHAR(20),
    journey_from VARCHAR(100) NOT NULL,
    journey_to VARCHAR(100) NOT NULL,
    journey_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_physically_present BOOLEAN NOT NULL DEFAULT true,
    verification_state VARCHAR(30) NOT NULL CHECK (verification_state IN ('Submitted', 'Pending Verification', 'Verified', 'Rejected')) DEFAULT 'Submitted',
    staff_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. OCCUPANCY VERIFICATIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.occupancy_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.passenger_submissions(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- PART 3: ADVANCED OPERATIONAL TABLES (14 to 18)
-- ====================================================================

-- 14. PASSENGER ASSISTANCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.passenger_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    station TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Pending', 'Assigned', 'Completed')),
    tracking_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 15. COACH INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.coach_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    inspector_name TEXT NOT NULL,
    inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Fit to Run',
    readiness_score INT NOT NULL DEFAULT 100,
    findings TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 16. SENSOR CALIBRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.sensor_calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_code TEXT NOT NULL,
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    last_calibrated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    next_due_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '90 days'),
    calibration_status TEXT NOT NULL DEFAULT 'Valid' CHECK (calibration_status IN ('Valid', 'Calibration Due', 'Recalibrating')),
    offset_kg INT DEFAULT 0,
    technician_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 17. WEIGHT ANOMALY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.weight_anomaly_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    weight_delta_kg INT NOT NULL,
    data_source TEXT NOT NULL DEFAULT 'SIMULATED DATA',
    detected_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 18. ALERT ESCALATION RULES TABLE
CREATE TABLE IF NOT EXISTS public.escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    trigger_severity TEXT NOT NULL,
    recipient_roles TEXT[] NOT NULL,
    timeout_minutes INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- PART 4: PERFORMANCE INDEXES (All 18 Tables)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_coaches_train ON public.coaches(train_id);
CREATE INDEX IF NOT EXISTS idx_weight_coach_time ON public.weight_readings(coach_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_time ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON public.notifications(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_train ON public.incidents(train_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_coach ON public.predictions(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_time ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_seats_coach_id ON public.coach_seats(coach_id);
CREATE INDEX IF NOT EXISTS idx_seat_occupancy_coach_seat_id ON public.seat_occupancy(coach_seat_id);
CREATE INDEX IF NOT EXISTS idx_passenger_submissions_user_id ON public.passenger_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_passenger_submissions_train_id ON public.passenger_submissions(train_id);
CREATE INDEX IF NOT EXISTS idx_passenger_submissions_verification_state ON public.passenger_submissions(verification_state);
CREATE INDEX IF NOT EXISTS idx_occupancy_verifications_submission_id ON public.occupancy_verifications(submission_id);
CREATE INDEX IF NOT EXISTS idx_assistance_token ON public.passenger_assistance_requests(tracking_token);
CREATE INDEX IF NOT EXISTS idx_assistance_status ON public.passenger_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_coach_inspections_coach ON public.coach_inspections(coach_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_sensor ON public.sensor_calibrations(sensor_code);
CREATE INDEX IF NOT EXISTS idx_anomalies_coach ON public.weight_anomaly_logs(coach_id);

-- ====================================================================
-- PART 5: SECURITY DEFINER FUNCTIONS & AUTH TRIGGERS
-- ====================================================================

-- Helper: Recursion-free role lookup
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

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role, postgres;

-- Automatic profile provisioning upon auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, full_name, email, role, phone)
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
      'passenger', -- strictly defaults to passenger
      NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '')
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
  ELSIF (TG_OP = 'UPDATE') THEN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile role escalation protection
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security Violation: Profile ID cannot be altered.';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Security Violation: Profile creation timestamp cannot be altered.';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL THEN
      IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Security Violation: Only Administrators are authorized to modify user roles.';
      END IF;
    ELSIF SESSION_USER NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Security Violation: Direct role updates require authorized database owner session.';
    END IF;
  END IF;

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

-- ====================================================================
-- PART 6: LEAST-PRIVILEGE TABLE GRANTS (All 18 Tables)
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Public tables for Station Displays & Commuters
GRANT SELECT ON public.trains TO anon, authenticated;
GRANT SELECT ON public.coaches TO anon, authenticated;
GRANT SELECT ON public.weight_readings TO anon, authenticated;
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT SELECT ON public.predictions TO anon, authenticated;
GRANT SELECT ON public.coach_layout_templates TO anon, authenticated;
GRANT SELECT ON public.coach_seats TO anon, authenticated;
GRANT SELECT ON public.seat_occupancy TO anon, authenticated;
GRANT SELECT ON public.coach_inspections TO anon, authenticated;
GRANT SELECT ON public.sensor_calibrations TO anon, authenticated;
GRANT SELECT ON public.weight_anomaly_logs TO anon, authenticated;
GRANT SELECT ON public.passenger_assistance_requests TO anon, authenticated;

-- Authenticated operational grants
GRANT INSERT, UPDATE, DELETE ON public.trains TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT INSERT, DELETE ON public.weight_readings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.seat_occupancy TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.passenger_submissions TO authenticated;
GRANT SELECT, INSERT ON public.occupancy_verifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.passenger_assistance_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coach_inspections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sensor_calibrations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.weight_anomaly_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escalation_rules TO authenticated;

-- Master service role grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres;

-- ====================================================================
-- PART 7: ROW LEVEL SECURITY & POLICIES (All 18 Tables)
-- ====================================================================

-- Activate RLS on all 18 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_anomaly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- Idempotent policy cleanup across all 18 application tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'profiles', 'trains', 'coaches', 'weight_readings', 'notifications', 
        'incidents', 'predictions', 'audit_logs', 'coach_layout_templates', 
        'coach_seats', 'seat_occupancy', 'passenger_submissions', 
        'occupancy_verifications', 'passenger_assistance_requests', 
        'coach_inspections', 'sensor_calibrations', 'weight_anomaly_logs', 
        'escalation_rules'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 1. Profiles Policies
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.current_user_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.current_user_role() = 'admin');

CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE USING (public.current_user_role() = 'admin');

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'passenger');

-- 2. Trains Policies
CREATE POLICY "Anyone view trains" ON public.trains FOR SELECT USING (true);
CREATE POLICY "Admins manage trains" ON public.trains FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- 3. Coaches Policies
CREATE POLICY "Anyone view coaches" ON public.coaches FOR SELECT USING (true);
CREATE POLICY "Admins manage coaches" ON public.coaches FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- 4. Weight Readings Policies
CREATE POLICY "Anyone view weight readings" ON public.weight_readings FOR SELECT USING (true);
CREATE POLICY "Staff and admin insert weight readings" ON public.weight_readings FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin'));
CREATE POLICY "Admins delete weight readings" ON public.weight_readings FOR DELETE USING (public.current_user_role() = 'admin');

-- 5. Notifications Policies
CREATE POLICY "Anyone view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Staff and admin insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin'));
CREATE POLICY "Staff and admin update notifications" ON public.notifications FOR UPDATE USING (public.current_user_role() IN ('staff', 'admin')) WITH CHECK (public.current_user_role() IN ('staff', 'admin'));
CREATE POLICY "Admins delete notifications" ON public.notifications FOR DELETE USING (public.current_user_role() = 'admin');

-- 6. Incidents Policies
CREATE POLICY "Staff and admin view incidents" ON public.incidents FOR SELECT USING (public.current_user_role() IN ('staff', 'admin'));
CREATE POLICY "Staff and admin insert incidents" ON public.incidents FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin'));
CREATE POLICY "Admins manage incidents" ON public.incidents FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- 7. Predictions Policies
CREATE POLICY "Anyone view predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Admins manage predictions" ON public.predictions FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- 8. Audit Logs Policies
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT USING (public.current_user_role() = 'admin');
CREATE POLICY "Operators append audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.current_user_role() IN ('staff', 'admin') AND (user_id IS NULL OR user_id = auth.uid()));

-- 9. Coach Templates Policies
CREATE POLICY "Anyone view coach templates" ON public.coach_layout_templates FOR SELECT USING (true);
CREATE POLICY "Admins manage coach templates" ON public.coach_layout_templates FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- 10. Coach Seats Policies
CREATE POLICY "Anyone view coach seats" ON public.coach_seats FOR SELECT USING (true);
CREATE POLICY "Admins manage coach seats" ON public.coach_seats FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- 11. Seat Occupancy Policies
CREATE POLICY "Anyone view seat occupancy" ON public.seat_occupancy FOR SELECT USING (true);
CREATE POLICY "Staff and admin manage seat occupancy" ON public.seat_occupancy FOR ALL USING (public.current_user_role() IN ('staff', 'admin')) WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

-- 12. Passenger Submissions Policies
CREATE POLICY "Passengers view own submissions" ON public.passenger_submissions FOR SELECT USING (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Passengers create submissions" ON public.passenger_submissions FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);
CREATE POLICY "Staff and admin update submissions" ON public.passenger_submissions FOR UPDATE USING (public.current_user_role() IN ('admin', 'staff')) WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- 13. Occupancy Verifications Policies
CREATE POLICY "Staff and admin view occupancy verifications" ON public.occupancy_verifications FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Staff and admin create occupancy verifications" ON public.occupancy_verifications FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- 14. Assistance Requests Policies
CREATE POLICY "Users view own assistance requests" ON public.passenger_assistance_requests FOR SELECT USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Users insert assistance requests" ON public.passenger_assistance_requests FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Staff and admin update assistance requests" ON public.passenger_assistance_requests FOR UPDATE USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Admins delete assistance requests" ON public.passenger_assistance_requests FOR DELETE USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.current_user_role() = 'admin');

-- 15. Coach Inspections Policies
CREATE POLICY "Anyone view coach inspections" ON public.coach_inspections FOR SELECT USING (true);
CREATE POLICY "Staff and admin insert inspections" ON public.coach_inspections FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- 16. Sensor Calibrations Policies
CREATE POLICY "Anyone view sensor calibrations" ON public.sensor_calibrations FOR SELECT USING (true);
CREATE POLICY "Staff and admin manage sensor calibrations" ON public.sensor_calibrations FOR ALL USING (public.current_user_role() IN ('admin', 'staff')) WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- 17. Weight Anomaly Logs Policies
CREATE POLICY "Staff and admin view weight anomalies" ON public.weight_anomaly_logs FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Staff and admin insert weight anomalies" ON public.weight_anomaly_logs FOR INSERT WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- 18. Escalation Rules Policies
CREATE POLICY "Staff and admin view escalation rules" ON public.escalation_rules FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));
CREATE POLICY "Admins manage escalation rules" ON public.escalation_rules FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- ====================================================================
-- PART 8: REALTIME SUBSCRIPTION PUBLICATIONS
-- ====================================================================
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'seat_occupancy'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_occupancy;
  END IF;
END $$;

-- ====================================================================
-- PART 9: REFERENCE & DEMO SEED DATA (Non-Destructive)
-- ====================================================================

-- Coach Layout Templates
INSERT INTO public.coach_layout_templates (id, class_code, class_name, total_seats, has_middle_berth, has_side_berth, is_chair_car, bays_count, seats_per_bay, description)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'SL', 'Sleeper Class (Non-AC)', 72, true, true, false, 9, 8, 'Standard Indian Railways Sleeper with 8 berths per bay (Lower, Middle, Upper, Side Lower, Side Upper).'),
    ('10000000-0000-0000-0000-000000000002', '3A', 'AC 3 Tier (Air Conditioned)', 64, true, true, false, 8, 8, 'Air conditioned 3-tier sleeper coach with sealed windows and climate control.'),
    ('10000000-0000-0000-0000-000000000003', '2A', 'AC 2 Tier (Air Conditioned)', 48, false, true, false, 8, 6, 'Spacious AC 2 Tier coach without middle berths.'),
    ('10000000-0000-0000-0000-000000000004', 'CC', 'AC Chair Car', 73, false, false, true, 15, 5, 'Executive push-back chair car with 3x2 seating arrangement.'),
    ('10000000-0000-0000-0000-000000000005', 'GS', 'Second Class Unreserved (General)', 90, false, false, false, 10, 9, 'High-capacity unreserved commuter seating.')
ON CONFLICT (class_code) DO NOTHING;

-- Trains
INSERT INTO public.trains (id, number, name, from_station, to_station) VALUES
    ('11111111-1111-1111-1111-111111111111', '12101', 'Jnaneshwari Express', 'Lokmanya Tilak Terminus (LTT)', 'Howrah Junction (HWH)'),
    ('22222222-2222-2222-2222-222222222222', '11020', 'Konark Express', 'Bhubaneswar (BBS)', 'Mumbai CSMT (CSMT)'),
    ('33333333-3333-3333-3333-333333333333', '12115', 'Siddheshwar Express', 'Mumbai CSMT (CSMT)', 'Solapur Junction (SUR)')
ON CONFLICT (number) DO NOTHING;

-- Coaches for Train 12101
INSERT INTO public.coaches (id, train_id, coach_no, coach_type, empty_weight_kg, max_capacity_kg) VALUES
    ('a1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'LOCO', 'Engine', 123000, 123000),
    ('a1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'GEN-1', 'General', 38000, 48500),
    ('a1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'S1', 'Sleeper', 39500, 47000),
    ('a1111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'S2', 'Sleeper', 39500, 47000),
    ('a1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'S3', 'Sleeper', 39500, 47000),
    ('a1111111-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'B1', 'AC 3 Tier', 44000, 50500),
    ('a1111111-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'B2', 'AC 3 Tier', 44000, 50500),
    ('a1111111-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'B3', 'AC 3 Tier', 44000, 50500),
    ('a1111111-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'A1', 'AC 2 Tier', 45000, 50000),
    ('a1111111-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'PC', 'Pantry Car', 41000, 46000),
    ('a1111111-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'S4', 'Sleeper', 39500, 47000),
    ('a1111111-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'GEN-2', 'General', 38000, 48500)
ON CONFLICT (train_id, coach_no) DO NOTHING;

-- Coaches for Train 11020
INSERT INTO public.coaches (id, train_id, coach_no, coach_type, empty_weight_kg, max_capacity_kg) VALUES
    ('b2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'LOCO', 'Engine', 123000, 123000),
    ('b2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'GEN-1', 'General', 38000, 48500),
    ('b2222222-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'D1', 'Second Sitting', 38500, 47500),
    ('b2222222-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'S1', 'Sleeper', 39500, 47000),
    ('b2222222-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'S2', 'Sleeper', 39500, 47000),
    ('b2222222-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'B1', 'AC 3 Tier', 44000, 50500),
    ('b2222222-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'B2', 'AC 3 Tier', 44000, 50500),
    ('b2222222-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'A1', 'AC 2 Tier', 45000, 50000),
    ('b2222222-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 'S3', 'Sleeper', 39500, 47000),
    ('b2222222-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'GEN-2', 'General', 38000, 48500)
ON CONFLICT (train_id, coach_no) DO NOTHING;

-- Realistic Current Readings for Train 12101 (Simulated Demonstration Telemetry)
INSERT INTO public.weight_readings (id, coach_id, weight_kg, recorded_at, source, is_simulated) VALUES
    ('f1000000-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000002', 47240.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000003', 42125.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000004', 44600.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000005', 41600.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000006', 47575.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000007', 48550.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000008', 49000.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000008', 'a1111111-0000-0000-0000-000000000009', 46500.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000009', 'a1111111-0000-0000-0000-000000000010', 42200.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000010', 'a1111111-0000-0000-0000-000000000011', 44100.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('f1000000-0000-0000-0000-000000000011', 'a1111111-0000-0000-0000-000000000012', 49200.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true)
ON CONFLICT (id) DO NOTHING;

-- Notifications
INSERT INTO public.notifications (id, title, message, severity, train_id, coach_id, created_at, is_read) VALUES
    ('f2000000-0000-0000-0000-000000000001', 'Overload Warning Detected', 'Coach GEN-2 on Train 12101 (Jnaneshwari Express) exceeded maximum gross weight threshold (49,200 kg / 48,500 kg max). Passenger safety alert dispatched to Dadar / Kalyan RPF.', 'overload', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000012', now() - INTERVAL '5 minutes', false),
    ('f2000000-0000-0000-0000-000000000002', 'Coach Capacity Alert', 'Coach B3 on Train 12101 has reached 77% capacity. Passengers are advised to seek adjacent coaches.', 'warning', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000008', now() - INTERVAL '12 minutes', false),
    ('f2000000-0000-0000-0000-000000000003', 'Sensor Diagnostics Check', 'Telemetry bogie strain gauge calibrator verified all sensors active on Train 11020.', 'info', '22222222-2222-2222-2222-222222222222', NULL, now() - INTERVAL '25 minutes', true)
ON CONFLICT (id) DO NOTHING;

-- Escalation Rules
INSERT INTO public.escalation_rules (id, rule_name, trigger_severity, recipient_roles, timeout_minutes, is_active) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Critical Structural Overload Protocol', 'overload', ARRAY['admin', 'staff'], 5, true),
    ('e0000000-0000-0000-0000-000000000002', 'Safety Incident Dispatch to RPF Desk', 'critical', ARRAY['staff'], 10, true),
    ('e0000000-0000-0000-0000-000000000003', 'High Crowd Threshold Warning', 'warning', ARRAY['staff'], 15, true)
ON CONFLICT (id) DO NOTHING;

-- Sensor Calibrations Reference
INSERT INTO public.sensor_calibrations (id, sensor_code, coach_id, last_calibrated_at, next_due_at, calibration_status, offset_kg, technician_notes) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'SNSR-BOGIE-12101-GEN1-A', 'a1111111-0000-0000-0000-000000000002', now() - INTERVAL '10 days', now() + INTERVAL '80 days', 'Valid', 0, 'Zero tare calibration verified on Dadar test track.'),
    ('c0000000-0000-0000-0000-000000000002', 'SNSR-BOGIE-12101-S1-A', 'a1111111-0000-0000-0000-000000000003', now() - INTERVAL '20 days', now() + INTERVAL '70 days', 'Valid', 0, 'Piezoelectric sensor response linear within 0.2% tolerance.')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- FEEDBACK & ISSUE RESOLUTION SYSTEM
-- Supports: Passenger, Staff, Faculty, and Admin feedback & resolution
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(30) NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('passenger', 'staff', 'faculty', 'admin')),
    title VARCHAR(250) NOT NULL,
    category VARCHAR(60) NOT NULL CHECK (category IN (
        'General Feedback',
        'Technical Problem',
        'Login or Registration Issue',
        'Train Information Issue',
        'Coach Monitoring Issue',
        'Weight Simulation Issue',
        'AI Prediction Issue',
        'Dashboard Issue',
        'Feature Request',
        'Improvement Suggestion',
        'Other'
    )),
    description TEXT NOT NULL,
    related_module VARCHAR(100) NOT NULL DEFAULT 'General',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN (
        'Submitted',
        'Under Review',
        'In Progress',
        'Awaiting Information',
        'Resolved',
        'Closed',
        'Rejected'
    )),
    attachment_url TEXT,
    admin_response TEXT,
    admin_responder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_responder_name VARCHAR(150),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_ticket_id ON public.feedback_submissions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback_submissions(category);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_user_role ON public.feedback_submissions(user_role);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback_submissions(created_at DESC);

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_submissions TO authenticated;
GRANT SELECT, INSERT ON public.feedback_submissions TO anon;

DROP POLICY IF EXISTS "Admins full control on feedback_submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users view own feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Public insert feedback" ON public.feedback_submissions;

CREATE POLICY "Admins full control on feedback_submissions"
ON public.feedback_submissions
FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Users view own feedback"
ON public.feedback_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

CREATE POLICY "Users can insert feedback"
ON public.feedback_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

CREATE POLICY "Public insert feedback"
ON public.feedback_submissions
FOR INSERT
TO anon
WITH CHECK (true);

