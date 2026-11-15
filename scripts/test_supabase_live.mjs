import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';
let secretKey = '';

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
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') secretKey = val;
      }
    }
  });
}

console.log('Testing Supabase Connectivity...');
console.log('URL Host:', supabaseUrl ? new URL(supabaseUrl).host : 'MISSING');
console.log('Publishable Key Configured:', Boolean(supabaseKey));
console.log('Secret Service Key Configured:', Boolean(secretKey));

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('\n--- 1. Testing Auth API Health ---');
  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/health`);
    console.log('Auth API status:', authRes.status, authRes.statusText);
    const authData = await authRes.json();
    console.log('Auth API health response:', JSON.stringify(authData));
  } catch (e) {
    console.log('Auth API fetch error:', e.message);
  }

  console.log('\n--- 2. Testing PostgREST API Health & Schema ---');
  try {
    const authKeyToUse = secretKey || supabaseKey;
    const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': authKeyToUse,
        'Authorization': `Bearer ${authKeyToUse}`
      }
    });
    console.log('PostgREST status:', restRes.status, restRes.statusText);
    if (restRes.ok) {
      const restDoc = await restRes.json();
      const tableNames = Object.keys(restDoc.definitions || {});
      console.log('Exposed Schema Definitions/Tables count:', tableNames.length);
      console.log('Tables found:', tableNames);
    } else {
      const text = await restRes.text();
      console.log('PostgREST response body:', text);
    }
  } catch (e) {
    console.log('PostgREST fetch error:', e.message);
  }

  console.log('\n--- 3. Testing Direct Table Queries via Client SDK ---');
  const tables = [
    'profiles', 'trains', 'coaches', 'weight_readings', 'incidents',
    'coach_inspections', 'sensor_calibrations', 'passenger_assistance_requests',
    'passenger_crowd_submissions', 'coach_seats', 'seat_occupancy_logs',
    'notifications', 'live_crowd_reports', 'ai_crowd_forecasts'
  ];

  for (const t of tables) {
    try {
      const { data, error, status } = await supabase.from(t).select('*').limit(1);
      if (error) {
        console.log(`Table [${t}]: Status ${status} - Error code: ${error.code} (${error.message})`);
      } else {
        console.log(`Table [${t}]: Status ${status} - Rows: ${data ? data.length : 0}. Table EXISTS.`);
      }
    } catch (err) {
      console.log(`Table [${t}]: Exception ${err.message}`);
    }
  }
}

runTest();
