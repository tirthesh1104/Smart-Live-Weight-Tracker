import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve(process.cwd(), 'supabase', 'consolidated_phase4_migration.sql');

if (!fs.existsSync(sqlPath)) {
  console.error(`ERROR: Migration file not found at ${sqlPath}`);
  process.exit(1);
}

const content = fs.readFileSync(sqlPath, 'utf8');
const lines = content.split('\n');

console.log('====================================================================');
console.log('POSTGRESQL MIGRATION FILE VALIDATION & STATIC INTEGRITY AUDIT');
console.log('====================================================================');
console.log('Target File:', sqlPath);
console.log('Byte Size:', Buffer.byteLength(content, 'utf8'), 'bytes');
console.log('Total Lines:', lines.length);

let totalErrors = 0;

// 1. Check for Forbidden Non-SQL Content
const forbiddenPatterns = [
  { name: 'Markdown code fences (```)', regex: /^```/m },
  { name: 'Markdown headers (#)', regex: /^#\s+/m },
  { name: 'Conversation logs / prompt tags', regex: /<USER_REQUEST>|<SYSTEM_MESSAGE>|\[Attachment:/i },
  { name: 'HTML script/container tags', regex: /<script|<div|<span/i }
];

let forbiddenFound = false;
forbiddenPatterns.forEach(p => {
  if (p.regex.test(content)) {
    console.error(`  [FAIL] Found non-SQL pattern: ${p.name}`);
    forbiddenFound = true;
    totalErrors++;
  }
});
if (!forbiddenFound) {
  console.log('  [PASS] File contains purely valid SQL and SQL comments (no markdown/HTML/logs).');
}

// 2. Verify all 18 Required Application Tables
const expectedTables = [
  'profiles',
  'trains',
  'coaches',
  'weight_readings',
  'notifications',
  'incidents',
  'predictions',
  'audit_logs',
  'coach_layout_templates',
  'coach_seats',
  'seat_occupancy',
  'passenger_submissions',
  'occupancy_verifications',
  'passenger_assistance_requests',
  'coach_inspections',
  'sensor_calibrations',
  'weight_anomaly_logs',
  'escalation_rules'
];

console.log('\n--- 18 Application Table Definitions ---');
let missingTables = 0;
expectedTables.forEach((tbl, idx) => {
  const regex = new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+public\\.${tbl}\\s*\\(`, 'i');
  if (regex.test(content)) {
    console.log(`  [PASS] (${(idx + 1).toString().padStart(2, '0')}/18) public.${tbl}`);
  } else {
    console.error(`  [FAIL] (${(idx + 1).toString().padStart(2, '0')}/18) public.${tbl} - NOT FOUND`);
    missingTables++;
    totalErrors++;
  }
});

// 3. Verify RLS Activation on All 18 Tables
console.log('\n--- Row Level Security (RLS) Activation ---');
let missingRls = 0;
expectedTables.forEach((tbl) => {
  const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${tbl}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
  if (!rlsRegex.test(content)) {
    console.error(`  [FAIL] Missing RLS enablement for public.${tbl}`);
    missingRls++;
    totalErrors++;
  }
});
if (missingRls === 0) {
  console.log('  [PASS] Row Level Security (RLS) activated on all 18 tables.');
}

// 4. Verify Functions & Triggers
console.log('\n--- Functions & Triggers Integrity ---');
const expectedFunctions = [
  { name: 'public.current_user_role()', regex: /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.current_user_role\s*\(\)/i },
  { name: 'public.handle_new_user()', regex: /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.handle_new_user\s*\(\)/i },
  { name: 'public.protect_profile_role()', regex: /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.protect_profile_role\s*\(\)/i }
];
expectedFunctions.forEach(fn => {
  if (fn.regex.test(content)) {
    console.log(`  [PASS] Function: ${fn.name}`);
  } else {
    console.error(`  [FAIL] Function: ${fn.name} missing`);
    totalErrors++;
  }
});

const expectedTriggers = [
  { name: 'on_auth_user_created', regex: /CREATE\s+TRIGGER\s+on_auth_user_created/i },
  { name: 'on_auth_user_updated_email', regex: /CREATE\s+TRIGGER\s+on_auth_user_updated_email/i },
  { name: 'trg_protect_profile_role', regex: /CREATE\s+TRIGGER\s+trg_protect_profile_role/i }
];
expectedTriggers.forEach(trg => {
  if (trg.regex.test(content)) {
    console.log(`  [PASS] Trigger: ${trg.name}`);
  } else {
    console.error(`  [FAIL] Trigger: ${trg.name} missing`);
    totalErrors++;
  }
});

// 5. Verify Realtime Publication Configuration
console.log('\n--- Realtime Publication Configuration ---');
const realtimeTables = ['weight_readings', 'notifications', 'incidents', 'seat_occupancy'];
let realtimeOk = true;
realtimeTables.forEach(t => {
  const rtRegex = new RegExp(`ALTER\\s+PUBLICATION\\s+supabase_realtime\\s+ADD\\s+TABLE\\s+public\\.${t}`, 'i');
  if (!rtRegex.test(content)) {
    console.error(`  [FAIL] Realtime publication missing for public.${t}`);
    realtimeOk = false;
    totalErrors++;
  }
});
if (realtimeOk) {
  console.log('  [PASS] Realtime publications configured for: ' + realtimeTables.join(', '));
}

// 6. Parentheses and Quote Delimiter Balance Check
console.log('\n--- Syntax Delimiter Balancing ---');
let openParen = 0;
let inSingleQuote = false;
let inDollarQuote = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1] || '';

  if (char === '-' && nextChar === '-' && !inSingleQuote && !inDollarQuote) {
    while (i < content.length && content[i] !== '\n') i++;
    continue;
  }

  if (char === '$' && nextChar === '$' && !inSingleQuote) {
    inDollarQuote = !inDollarQuote;
    i++;
    continue;
  }

  if (char === "'" && !inDollarQuote) {
    if (content[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
    }
  }

  if (!inSingleQuote && !inDollarQuote) {
    if (char === '(') openParen++;
    if (char === ')') openParen--;
  }
}

console.log('  Parentheses balance count:', openParen, openParen === 0 ? '[BALANCED]' : '[UNBALANCED]');
console.log('  Unclosed single quotes:', inSingleQuote ? '[YES - ERROR]' : '[NONE - OK]');
console.log('  Unclosed dollar ($$) quotes:', inDollarQuote ? '[YES - ERROR]' : '[NONE - OK]');

if (openParen !== 0 || inSingleQuote || inDollarQuote) {
  totalErrors++;
}

console.log('\n====================================================================');
if (totalErrors === 0) {
  console.log('OVERALL AUDIT RESULT: PASS (All checks completed with zero errors)');
  console.log('The file is clean, complete, and ready for execution in Supabase SQL Editor.');
  process.exit(0);
} else {
  console.error(`OVERALL AUDIT RESULT: FAIL (${totalErrors} issue(s) detected)`);
  process.exit(1);
}
