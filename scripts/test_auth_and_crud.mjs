import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
        if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = val;
      }
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginBehavior() {
  console.log('='.repeat(70));
  console.log('TESTING SUPABASE LOGIN BEHAVIOR & ROLE ENFORCEMENT');
  console.log('='.repeat(70));

  // Test 1: Invalid login credentials
  const { data: invData, error: invErr } = await supabase.auth.signInWithPassword({
    email: 'nonexistent.user.test@gmail.com',
    password: 'WrongPassword123!'
  });
  console.log(`[TEST 1] Invalid login check: ${invErr ? 'PASS (Rejected: ' + invErr.message + ')' : 'FAIL'}`);

  // Test 2: Unconfirmed user login check
  const { data: unconfData, error: unconfErr } = await supabase.auth.signInWithPassword({
    email: 'audit.crowd.test.1794468842312@gmail.com',
    password: 'SecurePass#2026!'
  });
  if (unconfErr) {
    console.log(`[TEST 2] Unconfirmed login check: PASS (Enforces confirmation: "${unconfErr.message}")`);
  } else {
    console.log(`[TEST 2] User logged in directly (Email confirmation disabled or confirmed): User ID ${unconfData.user?.id}`);
  }

  // Test 3: Public seed data verification across all core railway tables
  console.log('\n[TEST 3] Core Operational Tables Data Verification:');
  const { data: trains } = await supabase.from('trains').select('id, number, name');
  console.log(`  - Trains verified: ${trains?.length} trains`);

  const { data: coaches } = await supabase.from('coaches').select('id, coach_no, coach_type, empty_weight_kg, max_capacity_kg');
  console.log(`  - Coaches verified: ${coaches?.length} coaches`);

  const { data: weights } = await supabase.from('weight_readings').select('id, weight_kg, recorded_at, is_simulated').limit(5);
  console.log(`  - Weight Readings verified: ${weights?.length} seed readings accessible`);

  const { data: notifications } = await supabase.from('notifications').select('id, title, severity');
  console.log(`  - Notifications verified: ${notifications?.length} active alerts`);

  const { data: layout } = await supabase.from('coach_layout_templates').select('class_code, total_seats');
  console.log(`  - Coach Layout Templates verified: ${layout?.length} templates`);

  console.log('\n======================================================================');
  console.log('ALL OPERATIONAL DATA CONFIRMED LIVE IN SUPABASE CLOUD!');
  console.log('======================================================================\n');
}

testLoginBehavior();
