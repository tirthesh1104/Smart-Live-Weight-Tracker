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

async function inspectDb() {
  console.log("=== INSPECTING LIVE SUPABASE TABLES ===");
  
  const tables = ['trains', 'coaches', 'notifications', 'incidents', 'audit_logs', 'weight_readings', 'predictions'];
  for (const t of tables) {
    const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' }).limit(5);
    if (error) {
      console.log(`Table [${t}]: Error: ${error.message}`);
    } else {
      console.log(`Table [${t}]: ${count} rows`);
      if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          console.log(`  Row ${i}:`, JSON.stringify(data[i]));
        }
      }
    }
  }
}

inspectDb();
