import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

async function testAuth() {
  console.log('Testing Supabase Auth SignUp & Error Responses...');
  const testEmail = `test.commuter.${Date.now()}@example.com`;
  const testPassword = 'TestPassword@2026';

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Commuter User'
        }
      }
    });

    if (error) {
      console.log('SignUp Error Status:', error.status);
      console.log('SignUp Error Code:', error.code);
      console.log('SignUp Error Message:', error.message);
    } else {
      console.log('SignUp Success! User ID:', data.user ? data.user.id : 'No user object');
      console.log('Session created:', Boolean(data.session));
    }
  } catch (err) {
    console.error('Unexpected Auth Exception:', err.message);
  }
}

testAuth();
