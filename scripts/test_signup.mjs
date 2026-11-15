import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Key prefix:', supabaseKey?.substring(0, 15));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignUp() {
  const email = 'abc123@gmail.com';
  const password = 'Pass@123';
  console.log(`Testing signUp with email: "${email}"...`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'abc',
        phone: '77895632636'
      }
    }
  });

  if (error) {
    console.log('Error occurred during signUp:');
    console.log('Status:', error.status);
    console.log('Code:', error.code);
    console.log('Message:', error.message);
  } else {
    console.log('SignUp succeeded!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Identities count:', data.user?.identities?.length);
  }
}

testSignUp();
