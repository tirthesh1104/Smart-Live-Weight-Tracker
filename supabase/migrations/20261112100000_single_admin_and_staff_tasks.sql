-- ====================================================================
-- SMART LIVE WEIGHT TRACKER - PHASE 4 ENHANCEMENT MIGRATION
-- Single Admin Enforcement, Staff Task Distribution & Realtime Sync
-- ====================================================================

-- 1. Enforce Strictly ONE Admin Account at Database Level
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin_role 
ON public.profiles (role) 
WHERE (role = 'admin');

-- 2. Staff Tasks Table for Dynamic Work Distribution
CREATE TABLE IF NOT EXISTS public.staff_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN (
      'Coach Inspection', 
      'Sensor Calibration', 
      'Station Duty', 
      'Incident Response', 
      'Weight Monitoring', 
      'Passenger Assistance', 
      'Safety Verification', 
      'General Operations'
    )),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_email TEXT,
    assigned_to_name TEXT,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    train_id UUID REFERENCES public.trains(id) ON DELETE SET NULL,
    coach_no VARCHAR(20),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    due_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_staff_tasks_assigned_to ON public.staff_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON public.staff_tasks(status);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_priority ON public.staff_tasks(priority);

-- Row Level Security
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_tasks TO authenticated;
GRANT SELECT ON public.staff_tasks TO anon;

-- Dynamic Policy Cleanup & Re-creation
DROP POLICY IF EXISTS "Admins full control on staff_tasks" ON public.staff_tasks;
DROP POLICY IF EXISTS "Staff view assigned tasks" ON public.staff_tasks;
DROP POLICY IF EXISTS "Staff update assigned task status" ON public.staff_tasks;

-- RLS Policies
CREATE POLICY "Admins full control on staff_tasks" 
ON public.staff_tasks 
FOR ALL 
TO authenticated 
USING (public.current_user_role() = 'admin') 
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Staff view assigned tasks" 
ON public.staff_tasks 
FOR SELECT 
TO authenticated 
USING (auth.uid() = assigned_to OR public.current_user_role() = 'admin');

CREATE POLICY "Staff update assigned task status" 
ON public.staff_tasks 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = assigned_to OR public.current_user_role() = 'admin') 
WITH CHECK (auth.uid() = assigned_to OR public.current_user_role() = 'admin');

-- Realtime Publication for Staff Tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'staff_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_tasks;
  END IF;
END $$;

-- 3. Provisioning the Single Official Central Administrator
DO $$
DECLARE
  admin_uuid UUID := 'a0000000-0000-0000-0000-000000000001';
  hashed_pw TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    hashed_pw := crypt('Admin@IR2026!', gen_salt('bf'));
  ELSE
    -- Pre-computed standard bcrypt hash for Admin@IR2026!
    hashed_pw := '$2a$10$w09ZkM5J3qE/lJm3h1D8reQ0W5uYhTzZc8uO7F8xP1mG9n4l6vKae';
  END IF;

  -- Insert into auth.users with pre-confirmed email and bcrypt password 'Admin@IR2026!'
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@railway.gov.in') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token
    ) VALUES (
      admin_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@railway.gov.in',
      hashed_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Chief Traffic Controller (Admin)","role":"admin"}'::jsonb,
      now(),
      now(),
      ''
    );
  END IF;

  -- Ensure profile exists with role = 'admin'
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    department,
    employee_id,
    status
  ) VALUES (
    admin_uuid,
    'Chief Traffic Controller (Admin)',
    'admin@railway.gov.in',
    'admin',
    'Central Traffic & Fleet Control',
    'IR-HQ-ADM-001',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      status = 'active',
      department = 'Central Traffic & Fleet Control';
END $$;
