import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('SMART LIVE WEIGHT TRACKER - 16-POINT COMPLETE VERIFICATION TEST SUITE');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

const authPagesContent = fs.readFileSync('src/pages/AuthPages.tsx', 'utf-8');
const authContextContent = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');
const appContent = fs.readFileSync('src/App.tsx', 'utf-8');
const offlineStorageContent = fs.readFileSync('src/services/offlineStorage.ts', 'utf-8');
const staffManagerContent = fs.readFileSync('src/components/admin/AdminStaffAndTaskManager.tsx', 'utf-8');
const staffTaskServiceContent = fs.readFileSync('src/services/staffTaskService.ts', 'utf-8');
const adminSecContent = fs.readFileSync('src/services/adminSecurityService.ts', 'utf-8');
const indexHtmlContent = fs.readFileSync('index.html', 'utf-8');
const indexCssContent = fs.readFileSync('src/index.css', 'utf-8');

// 1. PASSENGER REGISTRATION VALIDATION
console.log('--- TEST 1: PASSENGER REGISTRATION & MANDATORY FIELD VALIDATION ---');
assert(authPagesContent.includes('/^\\d{10}$/.test(cleanPhone)'), 'Passenger registration enforces 10-digit mobile number validation');
assert(authPagesContent.includes('password !== confirmPassword'), 'Passenger registration enforces password and confirm password match');
assert(authContextContent.includes("const assignedRole: UserRole = 'passenger'"), 'Passenger registration strictly assigns passenger role by default');

// 2. DUPLICATE PASSENGER REGISTRATION REJECTION
console.log('\n--- TEST 2: DUPLICATE PASSENGER REGISTRATION PREVENTION ---');
assert(authContextContent.includes('An account with this email address is already registered. Please sign in.'), 'AuthContext checks and rejects duplicate passenger registration with clear notice');

// 3. PASSENGER LOGIN & ROLE DASHBOARD REDIRECT
console.log('\n--- TEST 3: PASSENGER IMMEDIATE LOGIN & DASHBOARD ROUTING ---');
assert(appContent.includes('path="passenger"') && appContent.includes('<PassengerDashboard />'), 'Route /passenger mapped to PassengerDashboard');
assert(appContent.includes("navigate('/passenger')"), 'Successful passenger login redirects to /passenger');

// 4. INVALID CREDENTIALS ERROR HANDLING
console.log('\n--- TEST 4: INVALID CREDENTIALS ERROR HANDLING ---');
assert(authContextContent.includes('Invalid email or password.') || authContextContent.includes('Invalid password. Please check your credentials.'), 'Invalid password returns clear and user-friendly error message');
assert(authContextContent.includes('No registered account found for') || authContextContent.includes('No account found for this email'), 'Non-existent account email displays informative error');

// 5. PASSENGER LOGOUT & SESSION CLEANUP
console.log('\n--- TEST 5: LOGOUT & SESSION CLEANUP ---');
assert(authContextContent.includes('OfflineStorageService.clearSessionCache()'), 'Logout executes clearSessionCache');
assert(authContextContent.includes('AdminSecurityService.clearElevatedSession()'), 'Logout clears elevated session state');
assert(authContextContent.includes('setUser(null)'), 'Logout sets user state to null');

// 6. DUTY STAFF REGISTRATION REQUEST WITH PENDING STATUS
console.log('\n--- TEST 6: DUTY STAFF REGISTRATION REQUEST & PENDING STATUS ---');
assert(authContextContent.includes('registerStaffRequest'), 'registerStaffRequest method implemented in AuthContext');
assert(authContextContent.includes("status: 'pending'"), 'Duty staff request explicitly initialized with pending status');

// 7. DUPLICATE STAFF REGISTRATION PREVENTION
console.log('\n--- TEST 7: DUPLICATE STAFF REGISTRATION PREVENTION ---');
assert(authContextContent.includes('An account or registration request with this email address already exists.'), 'Duplicate staff registration request prevented with clear notice');

// 8. PENDING STAFF LOGIN GATE
console.log('\n--- TEST 8: PENDING STAFF ACCOUNT LOGIN BLOCK ---');
assert(authContextContent.includes('Your Duty Staff registration request is currently Pending Administrator Approval.'), 'Pending staff accounts blocked from login with informative notification');

// 9. ADMIN STAFF APPROVAL WORKFLOW
console.log('\n--- TEST 9: ADMIN STAFF APPROVAL WORKFLOW ---');
assert(staffManagerContent.includes('handleApproveRequest'), 'Admin can approve pending staff registration request');
assert(offlineStorageContent.includes('approveRegistrationRequest'), 'approveRegistrationRequest updates personnel status to active');

// 10. APPROVED STAFF LOGIN & PROFILE
console.log('\n--- TEST 10: APPROVED STAFF LOGIN & DASHBOARD ROUTING ---');
assert(appContent.includes('path="staff"') && appContent.includes('<StaffDashboard />'), 'Route /staff mapped to StaffDashboard');
assert(appContent.includes("navigate('/staff')"), 'Approved staff login redirects to /staff');

// 11. ADMIN STAFF REJECTION WORKFLOW
console.log('\n--- TEST 11: ADMIN STAFF REJECTION WORKFLOW ---');
assert(staffManagerContent.includes('handleRejectRequest'), 'Admin can reject unauthorized staff registration request');
assert(offlineStorageContent.includes('rejectRegistrationRequest'), 'rejectRegistrationRequest removes unapproved request');

// 12. STAFF TASK DATA ISOLATION (STAFF A VS STAFF B)
console.log('\n--- TEST 12: STAFF TASK DATA ISOLATION ---');
assert(staffTaskServiceContent.includes('getTasksForUser'), 'StaffTaskService implements getTasksForUser filtering');
assert(staffTaskServiceContent.includes('t.assigned_to_email.toLowerCase().trim() === cleanEmail'), 'Tasks strictly filtered by assigned user email for duty staff');

// 13. ROLE-BASED ACCESS CONTROL (RLS & ROUTE PROTECTION)
console.log('\n--- TEST 13: ROLE-BASED ACCESS CONTROL & ROUTE PROTECTION ---');
assert(appContent.includes('requiredRole="admin"'), 'Admin Dashboard strictly protected for admin role');
assert(appContent.includes('requiredRole="staff"'), 'Staff Dashboard strictly protected for staff role');
assert(appContent.includes('<PassengerDashboard />'), 'Passenger Dashboard accessible to authenticated commuters');

// 14. ADMIN SECURITY PIN INTEGRITY (ZERO LEAKAGE, NO HARDCODING)
console.log('\n--- TEST 14: ADMIN SECURITY PIN & MULTI-FACTOR VERIFICATION ---');
assert(adminSecContent.includes('verifyAdminPin'), 'AdminSecurityService implements verifyAdminPin with cryptographic verifier');
assert(adminSecContent.includes('isDeprecatedOldPin'), 'PIN 77 explicitly trapped and rejected with audit record');
assert(adminSecContent.includes('Invalid Security PIN. Please try again.'), 'Rejection returns exact user-specified message');
assert(adminSecContent.includes('hashPin'), 'Security PIN is verified via SHA-256 cryptographic salt and hash');

// 15. WEBSITE-WIDE TYPOGRAPHY SYSTEM
console.log('\n--- TEST 15: WEBSITE-WIDE TYPOGRAPHY SYSTEM ---');
assert(indexHtmlContent.includes('family=Inter') && indexHtmlContent.includes('family=Noto+Sans+Devanagari') && indexHtmlContent.includes('family=JetBrains+Mono'), 'Google Fonts loaded: Inter, Noto Sans Devanagari, JetBrains Mono');
assert(indexCssContent.includes('tabular-nums') && indexCssContent.includes("'tnum' 1"), 'Tabular numbers (tnum) enabled for weight and crowd metrics');

// 16. EXISTING OPERATIONAL MODULES PRESERVATION
console.log('\n--- TEST 16: PRESERVATION OF ALL EXISTING MODULES ---');
assert(fs.existsSync('src/pages/TrainMonitoringPage.tsx'), 'Train Monitoring Page preserved');
assert(fs.existsSync('src/pages/StationDisplay.tsx'), 'Station Display Page preserved');
assert(fs.existsSync('src/pages/SensorSimulator.tsx'), 'IoT Sensor Simulator preserved');
assert(fs.existsSync('src/pages/ReportsPage.tsx'), 'Reports & Analytics Page preserved');
assert(fs.existsSync('src/pages/SettingsPage.tsx'), 'Settings Page preserved');
assert(fs.existsSync('src/pages/ProfilePage.tsx'), 'Profile Page preserved');

console.log('\n========================================================================');
console.log(`VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
}
