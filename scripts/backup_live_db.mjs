import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backupDb() {
  console.log("=== CREATING LIVE DATABASE BACKUP ===");
  const tables = [
    'profiles', 'trains', 'coaches', 'weight_readings', 'notifications',
    'incidents', 'predictions', 'audit_logs', 'coach_layout_templates',
    'coach_seats', 'seat_occupancy', 'passenger_submissions',
    'occupancy_verifications', 'passenger_assistance_requests',
    'coach_inspections', 'sensor_calibrations', 'weight_anomaly_logs',
    'escalation_rules'
  ];

  const backupData = {
    backup_timestamp: new Date().toISOString(),
    source_url: supabaseUrl,
    tables: {}
  };

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) {
      console.warn(`Warning on table ${t}: ${error.message}`);
      backupData.tables[t] = { error: error.message };
    } else {
      backupData.tables[t] = { count: data.length, rows: data };
      console.log(`Backed up table [${t}]: ${data.length} rows`);
    }
  }

  fs.writeFileSync('scripts/db_backup_pre_cleanup.json', JSON.stringify(backupData, null, 2));
  console.log("Backup successfully saved to scripts/db_backup_pre_cleanup.json");
}

backupDb();
