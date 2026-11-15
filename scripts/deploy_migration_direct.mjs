import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployMigrationDirect() {
  console.log('='.repeat(70));
  console.log('SUPABASE DIRECT DATABASE MIGRATION RUNNER (AUTHORIZED DDL)');
  console.log('='.repeat(70));

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('\n[ERROR] Missing Database Connection String.');
    console.error('Please provide DATABASE_URL via environment variable.');
    console.error('Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
    console.error('Example (PowerShell):');
    console.error('  $env:DATABASE_URL="postgresql://postgres.wvtsqnyzgpbprywesolb:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"');
    console.error('  node scripts/deploy_migration_direct.mjs');
    process.exit(1);
  }

  // Sanitize display URL to never print password
  const sanitizedUrl = dbUrl.replace(/:([^@]+)@/, ':***@');
  console.log(`[INFO] Connecting to target database: ${sanitizedUrl}`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[PASS] Connected successfully to PostgreSQL database engine.');

    // Verify engine version
    const versionRes = await client.query('SELECT version();');
    console.log(`[INFO] Remote Engine: ${versionRes.rows[0].version}`);

    // Load master migration file
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261112000000_phase4_master_schema.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`[INFO] Loaded migration script (${sql.length} bytes, ${sql.split('\n').length} lines)`);

    console.log('\n[STEP 1] Executing migration in transaction...');
    const start = Date.now();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`[PASS] Migration successfully committed in ${Date.now() - start}ms!`);

    // Record in migration tracking table if exists
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
          version TEXT PRIMARY KEY,
          inserted_at TIMESTAMPTZ DEFAULT now()
        );
      `);
      await client.query(`
        INSERT INTO supabase_migrations.schema_migrations (version)
        VALUES ('20261112000000')
        ON CONFLICT (version) DO NOTHING;
      `);
      console.log('[PASS] Recorded migration 20261112000000 in supabase_migrations history.');
    } catch (e) {
      // Supabase migrations schema might not exist on custom direct connects, ignore safely
    }

    console.log('\n[STEP 2] Verifying all 18 tables in public schema...');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Total public tables: ${tables.length}`);
    const expected = [
      'profiles', 'trains', 'coaches', 'weight_readings', 'notifications',
      'incidents', 'predictions', 'audit_logs', 'coach_layout_templates',
      'coach_seats', 'seat_occupancy', 'passenger_submissions',
      'occupancy_verifications', 'passenger_assistance_requests',
      'coach_inspections', 'sensor_calibrations', 'weight_anomaly_logs',
      'escalation_rules'
    ];

    let missing = 0;
    for (const t of expected) {
      if (tables.includes(t)) {
        console.log(`  [PASS] public.${t}`);
      } else {
        console.error(`  [FAIL] Missing: public.${t}`);
        missing++;
      }
    }

    if (missing === 0) {
      console.log('\n====================================================================');
      console.log('MIGRATION COMPLETE: All 18 application tables are live in Supabase!');
      console.log('====================================================================');
    } else {
      console.error(`\n[WARNING] ${missing} tables are missing.`);
      process.exit(1);
    }

  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\n[FATAL] Migration execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deployMigrationDirect();
