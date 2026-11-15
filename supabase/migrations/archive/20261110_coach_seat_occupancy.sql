-- ====================================================================
-- Smart Live Weight Tracker - Phase 4 Feature Enhancement Migration
-- Coach Layout, Seat/Berth Telemetry & Passenger Occupancy Management
-- Safe, Non-Destructive Addition with Row Level Security (RLS)
-- ====================================================================

-- 1. COACH LAYOUT TEMPLATES TABLE
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

-- 2. COACH SEATS / BERTHS TABLE
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

-- 3. SEAT OCCUPANCY RECORDS TABLE
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

-- 4. PASSENGER JOURNEY SUBMISSIONS TABLE
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

-- 5. OCCUPANCY VERIFICATION AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS public.occupancy_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.passenger_submissions(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_coach_seats_coach_id ON public.coach_seats(coach_id);
CREATE INDEX IF NOT EXISTS idx_seat_occupancy_coach_seat_id ON public.seat_occupancy(coach_seat_id);
CREATE INDEX IF NOT EXISTS idx_passenger_submissions_user_id ON public.passenger_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_passenger_submissions_train_id ON public.passenger_submissions(train_id);
CREATE INDEX IF NOT EXISTS idx_passenger_submissions_verification_state ON public.passenger_submissions(verification_state);
CREATE INDEX IF NOT EXISTS idx_occupancy_verifications_submission_id ON public.occupancy_verifications(submission_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) ACTIVATION
-- ====================================================================
ALTER TABLE public.coach_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_verifications ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TARGETED GRANTS (Least-Privilege)
-- ====================================================================
GRANT SELECT ON TABLE public.coach_layout_templates TO anon, authenticated;
GRANT ALL ON TABLE public.coach_layout_templates TO service_role, postgres;

GRANT SELECT ON TABLE public.coach_seats TO anon, authenticated;
GRANT ALL ON TABLE public.coach_seats TO service_role, postgres;

GRANT SELECT ON TABLE public.seat_occupancy TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.seat_occupancy TO authenticated;
GRANT ALL ON TABLE public.seat_occupancy TO service_role, postgres;

GRANT SELECT, INSERT, UPDATE ON TABLE public.passenger_submissions TO authenticated;
GRANT ALL ON TABLE public.passenger_submissions TO service_role, postgres;

GRANT SELECT, INSERT ON TABLE public.occupancy_verifications TO authenticated;
GRANT ALL ON TABLE public.occupancy_verifications TO service_role, postgres;

-- ====================================================================
-- RLS POLICIES FOR COACH LAYOUT AND OCCUPANCY
-- ====================================================================

-- 1. COACH LAYOUT TEMPLATES: Public read, Admin manage
CREATE POLICY "Public read for coach templates" ON public.coach_layout_templates
  FOR SELECT USING (true);

CREATE POLICY "Admin manage coach templates" ON public.coach_layout_templates
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 2. COACH SEATS: Public read, Admin manage
CREATE POLICY "Public read for coach seats" ON public.coach_seats
  FOR SELECT USING (true);

CREATE POLICY "Admin manage coach seats" ON public.coach_seats
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 3. SEAT OCCUPANCY: Public read, Staff and Admin manage
CREATE POLICY "Public view seat occupancy" ON public.seat_occupancy
  FOR SELECT USING (true);

CREATE POLICY "Staff and admin manage seat occupancy" ON public.seat_occupancy
  FOR ALL USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

-- 4. PASSENGER SUBMISSIONS: Commuter privacy protection
-- Commuters see only their own submissions
CREATE POLICY "Passengers view own submissions" ON public.passenger_submissions
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.current_user_role() IN ('staff', 'admin')
  );

-- Authenticated users can insert their own journey check-in declaration
CREATE POLICY "Passengers can submit check-in" ON public.passenger_submissions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id IS NULL OR user_id = auth.uid())
  );

-- Staff and Admin can update verification state
CREATE POLICY "Staff and admin update submissions" ON public.passenger_submissions
  FOR UPDATE USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

-- Admin full management
CREATE POLICY "Admin manage all passenger submissions" ON public.passenger_submissions
  FOR DELETE USING (public.current_user_role() = 'admin');

-- 5. OCCUPANCY VERIFICATIONS: Staff and Admin audit access
CREATE POLICY "Staff and admin view verifications" ON public.occupancy_verifications
  FOR SELECT USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin insert verifications" ON public.occupancy_verifications
  FOR INSERT WITH CHECK (
    public.current_user_role() IN ('staff', 'admin') AND
    verifier_id = auth.uid()
  );
