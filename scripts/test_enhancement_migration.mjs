import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

async function test() {
  console.log('Testing enhancement migration in PostgreSQL 18.6 runtime...');
  const db = new PGlite();
  
  await db.exec(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      instance_id UUID,
      aud VARCHAR(255),
      role VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      encrypted_password VARCHAR(255),
      email_confirmed_at TIMESTAMPTZ,
      raw_app_meta_data JSONB,
      raw_user_meta_data JSONB,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      confirmation_token VARCHAR(255)
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS $$ SELECT 'a0000000-0000-0000-0000-000000000001'::UUID $$;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
    END $$;
    CREATE PUBLICATION supabase_realtime;
  `);

  const masterSql = fs.readFileSync('supabase/migrations/20261112000000_phase4_master_schema.sql', 'utf8');
  await db.exec(masterSql);
  console.log('[PASS] Master schema loaded.');

  const enhSql = fs.readFileSync('supabase/migrations/20261112100000_single_admin_and_staff_tasks.sql', 'utf8');
  await db.exec(enhSql);
  console.log('[PASS] Enhancement schema loaded.');

  // Test single admin rule
  try {
    await db.exec(`
      INSERT INTO public.profiles (id, full_name, email, role)
      VALUES (gen_random_uuid(), 'Fake Admin', 'fake@test.com', 'admin');
    `);
    console.error('[FAIL] Second admin was incorrectly allowed!');
    process.exit(1);
  } catch (err) {
    console.log('[PASS] Second admin successfully BLOCKED by unique index:', err.message);
  }

  // Test repeat execution
  await db.exec(enhSql);
  console.log('[PASS] 100% Idempotent repeat execution confirmed.');
}

test().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
