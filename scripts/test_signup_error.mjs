import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase Auth signUp with abc123@gmail.com...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignUp() {
  const email = 'abc123@gmail.com';
  const password = 'Pass@123';
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

  console.log('Error:', error);
  console.log('Data:', data);
}

testSignUp();
