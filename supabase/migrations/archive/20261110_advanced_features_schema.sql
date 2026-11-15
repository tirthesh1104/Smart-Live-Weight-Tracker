-- ==============================================================================
-- SMART LIVE WEIGHT TRACKER - ADVANCED FEATURES EXTENSION SCHEMA
-- Phase 4 Feature Extension: Assistance Requests, Inspections, Calibrations,
-- Weight Anomaly Logs, and Alert Escalation Rules.
-- Non-destructive SQL migration script (DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL)
-- ==============================================================================

-- 1. PASSENGER ASSISTANCE REQUESTS
CREATE TABLE IF NOT EXISTS public.passenger_assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  station TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Pending', 'Assigned', 'Completed')),
  tracking_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COACH INSPECTIONS HISTORY
CREATE TABLE IF NOT EXISTS public.coach_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Fit to Run',
  readiness_score INT NOT NULL DEFAULT 100,
  findings TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SENSOR CALIBRATION RECORDS
CREATE TABLE IF NOT EXISTS public.sensor_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_code TEXT NOT NULL,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  last_calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  calibration_status TEXT NOT NULL DEFAULT 'Valid' CHECK (calibration_status IN ('Valid', 'Calibration Due', 'Recalibrating')),
  offset_kg INT DEFAULT 0,
  technician_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WEIGHT ANOMALY LOGS
CREATE TABLE IF NOT EXISTS public.weight_anomaly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  weight_delta_kg INT NOT NULL,
  data_source TEXT NOT NULL DEFAULT 'SIMULATED DATA',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ALERT ESCALATION RULES
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  trigger_severity TEXT NOT NULL,
  recipient_roles TEXT[] NOT NULL,
  timeout_minutes INT NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_assistance_token ON public.passenger_assistance_requests(tracking_token);
CREATE INDEX IF NOT EXISTS idx_assistance_status ON public.passenger_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_coach_inspections_coach ON public.coach_inspections(coach_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_sensor ON public.sensor_calibrations(sensor_code);
CREATE INDEX IF NOT EXISTS idx_anomalies_coach ON public.weight_anomaly_logs(coach_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ==============================================================================
ALTER TABLE public.passenger_assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_anomaly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- Targeted Grants (Least-Privilege)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.passenger_assistance_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.coach_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sensor_calibrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.weight_anomaly_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.escalation_rules TO authenticated;

GRANT SELECT ON TABLE public.passenger_assistance_requests TO anon;
GRANT SELECT ON TABLE public.coach_inspections TO anon;
GRANT SELECT ON TABLE public.sensor_calibrations TO anon;
GRANT SELECT ON TABLE public.weight_anomaly_logs TO anon;

GRANT ALL ON TABLE 
  public.passenger_assistance_requests, 
  public.coach_inspections, 
  public.sensor_calibrations, 
  public.weight_anomaly_logs, 
  public.escalation_rules 
TO service_role, postgres;

-- Assistance requests: Users can see own requests; Staff and Admin can view all
CREATE POLICY "Users can view own assistance requests"
  ON public.passenger_assistance_requests
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "Users can insert assistance requests"
  ON public.passenger_assistance_requests
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "Staff and admin can update assistance requests"
  ON public.passenger_assistance_requests
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.current_user_role() IN ('admin', 'staff')
  );

CREATE POLICY "Users and admins can delete assistance requests"
  ON public.passenger_assistance_requests
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.current_user_role() = 'admin'
  );

-- Coach inspections: Public read-only; Staff and Admin can insert
CREATE POLICY "Public can view coach inspections"
  ON public.coach_inspections
  FOR SELECT
  USING (true);

CREATE POLICY "Staff and admin can record inspections"
  ON public.coach_inspections
  FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- Sensor calibrations: Public read-only; Admin and Staff can manage
CREATE POLICY "Public can view sensor calibrations"
  ON public.sensor_calibrations
  FOR SELECT
  USING (true);

CREATE POLICY "Staff and admin can manage calibrations"
  ON public.sensor_calibrations
  FOR ALL
  USING (public.current_user_role() IN ('admin', 'staff'));

-- Weight anomalies: Public read-only; System and staff can insert
CREATE POLICY "Public can view weight anomaly logs"
  ON public.weight_anomaly_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Staff and admin can insert weight anomaly logs"
  ON public.weight_anomaly_logs
  FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'staff'));

-- Escalation rules: Admin can manage, staff can view
CREATE POLICY "Admin can manage escalation rules"
  ON public.escalation_rules
  FOR ALL
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Staff can view escalation rules"
  ON public.escalation_rules
  FOR SELECT
  USING (public.current_user_role() IN ('admin', 'staff'));
