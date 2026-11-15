-- ====================================================================
-- SMART LIVE WEIGHT TRACKER - FEEDBACK & ISSUE RESOLUTION SYSTEM
-- Migration: 20261115120000_feedback_and_issue_management.sql
-- Supports: Passenger, Staff, Faculty, Admin feedback & resolution
-- ====================================================================

-- 1. Create Feedback Submissions Table
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

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_ticket_id ON public.feedback_submissions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback_submissions(category);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_user_role ON public.feedback_submissions(user_role);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback_submissions(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_submissions TO authenticated;
GRANT SELECT, INSERT ON public.feedback_submissions TO anon;

-- Policy Cleanup & Recreation
DROP POLICY IF EXISTS "Admins full control on feedback_submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users view own feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Public insert feedback" ON public.feedback_submissions;

-- Admins: Full control to read, update status, and add responses
CREATE POLICY "Admins full control on feedback_submissions"
ON public.feedback_submissions
FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- Users: Read own feedback submissions
CREATE POLICY "Users view own feedback"
ON public.feedback_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- Authenticated Users: Insert feedback
CREATE POLICY "Users can insert feedback"
ON public.feedback_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.current_user_role() = 'admin');

-- Anonymous / Public Passengers: Insert allowed for public service accessibility
CREATE POLICY "Public insert feedback"
ON public.feedback_submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Realtime Publication Membership
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'feedback_submissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_submissions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
