-- ====================================================================
-- Seed Data for Smart Live Weight Tracker
-- 3 Trains with 10-12 coaches each, realistic tare/gross weights
-- ====================================================================

-- 1. PROFILES (DEMO ACCOUNTS) - Only inserted if corresponding auth.users records exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO profiles (id, full_name, email, role) VALUES
            ('00000000-0000-0000-0000-000000000001', 'Chief Traffic Controller (Admin)', 'admin@railway.gov.in', 'admin')
        ON CONFLICT (email) DO NOTHING;
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002') THEN
        INSERT INTO profiles (id, full_name, email, role) VALUES
            ('00000000-0000-0000-0000-000000000002', 'Station Master Rajesh K (Staff)', 'staff@railway.gov.in', 'staff')
        ON CONFLICT (email) DO NOTHING;
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000003') THEN
        INSERT INTO profiles (id, full_name, email, role) VALUES
            ('00000000-0000-0000-0000-000000000003', 'Aniket Deshmukh (Passenger)', 'passenger@gmail.com', 'passenger')
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- 2. SAMPLE TRAINS
INSERT INTO trains (id, number, name, from_station, to_station) VALUES
    ('11111111-1111-1111-1111-111111111111', '12101', 'Jnaneshwari Express', 'Lokmanya Tilak Terminus (LTT)', 'Howrah Junction (HWH)'),
    ('22222222-2222-2222-2222-222222222222', '11020', 'Konark Express', 'Bhubaneswar (BBS)', 'Mumbai CSMT (CSMT)'),
    ('33333333-3333-3333-3333-333333333333', '12115', 'Siddheshwar Express', 'Mumbai CSMT (CSMT)', 'Solapur Junction (SUR)')
ON CONFLICT (number) DO NOTHING;

-- 3. COACHES FOR TRAIN 12101 (Jnaneshwari Express) - 11 coaches + Engine
INSERT INTO coaches (id, train_id, coach_no, coach_type, empty_weight_kg, max_capacity_kg) VALUES
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

-- 4. COACHES FOR TRAIN 11020 (Konark Express) - 10 coaches + Engine
INSERT INTO coaches (id, train_id, coach_no, coach_type, empty_weight_kg, max_capacity_kg) VALUES
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

-- 5. COACHES FOR TRAIN 12115 (Siddheshwar Express) - 11 coaches + Engine
INSERT INTO coaches (id, train_id, coach_no, coach_type, empty_weight_kg, max_capacity_kg) VALUES
    ('c3333333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'LOCO', 'Engine', 123000, 123000),
    ('c3333333-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'GEN-1', 'General', 38000, 48500),
    ('c3333333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'S1', 'Sleeper', 39500, 47000),
    ('c3333333-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'S2', 'Sleeper', 39500, 47000),
    ('c3333333-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'S3', 'Sleeper', 39500, 47000),
    ('c3333333-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'S4', 'Sleeper', 39500, 47000),
    ('c3333333-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', 'B1', 'AC 3 Tier', 44000, 50500),
    ('c3333333-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 'B2', 'AC 3 Tier', 44000, 50500),
    ('c3333333-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', 'A1', 'AC 2 Tier', 45000, 50000),
    ('c3333333-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 'S5', 'Sleeper', 39500, 47000),
    ('c3333333-0000-0000-0000-000000000011', '33333333-3333-3333-3333-333333333333', 'GEN-2', 'General', 38000, 48500)
ON CONFLICT (train_id, coach_no) DO NOTHING;

-- 6. REALISTIC CURRENT & HISTORICAL READINGS FOR 12101
-- General coach GEN-1: heavily loaded (88%)
INSERT INTO weight_readings (coach_id, weight_kg, recorded_at, source, is_simulated) VALUES
    ('a1111111-0000-0000-0000-000000000002', 47240.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true),
    ('a1111111-0000-0000-0000-000000000003', 42125.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- S1: ~35%
    ('a1111111-0000-0000-0000-000000000004', 44600.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- S2: ~68%
    ('a1111111-0000-0000-0000-000000000005', 41600.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- S3: ~28% (least crowded recommendation)
    ('a1111111-0000-0000-0000-000000000006', 47575.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- B1: ~55%
    ('a1111111-0000-0000-0000-000000000007', 48550.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- B2: ~70%
    ('a1111111-0000-0000-0000-000000000008', 49000.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- B3: ~77% (Full)
    ('a1111111-0000-0000-0000-000000000009', 46500.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- A1: ~30%
    ('a1111111-0000-0000-0000-000000000010', 42200.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- PC: ~24%
    ('a1111111-0000-0000-0000-000000000011', 44100.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true), -- S4: ~61%
    ('a1111111-0000-0000-0000-000000000012', 49200.00, now() - INTERVAL '1 minute', 'piezoelectric_bogie_sensor', true); -- GEN-2: Overloaded (106%)

-- 7. INITIAL NOTIFICATIONS
INSERT INTO notifications (title, message, severity, train_id, coach_id, created_at, is_read) VALUES
    ('Overload Warning Detected', 'Coach GEN-2 on Train 12101 (Jnaneshwari Express) exceeded maximum gross weight threshold (49,200 kg / 48,500 kg max). Passenger safety alert dispatched to Dadar / Kalyan RPF.', 'overload', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000012', now() - INTERVAL '5 minutes', false),
    ('Coach Capacity Alert', 'Coach B3 on Train 12101 has reached 77% capacity. Passengers are advised to seek adjacent coaches.', 'warning', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000008', now() - INTERVAL '12 minutes', false),
    ('Sensor Diagnostics Check', 'Telemetry bogie strain gauge calibrator verified all sensors active on Train 11020.', 'info', '22222222-2222-2222-2222-222222222222', NULL, now() - INTERVAL '25 minutes', true);
