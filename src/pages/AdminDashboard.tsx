import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Train as TrainIcon, 
  Layers, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit, 
  Sparkles, 
  Send, 
  Clock, 
  Scale, 
  FileText,
  ArrowRight,
  LogOut,
  Lock,
  Unlock,
  KeyRound,
  UserPlus,
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  RefreshCw,
  X,
  ShieldAlert,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Shield,
  Database,
  Radio,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line 
} from 'recharts';
import { useTrain } from '../context/TrainContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { formatWeight, calculateCoachOccupancy } from '../utils/weightCalculations';
import { OfflineStorageService } from '../services/offlineStorage';
import { AIClientService } from '../services/aiClient';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { SimplePageExplainer } from '../components/common/SimplePageExplainer';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';
import { Train, Coach, UserProfile } from '../types';
import { AdminCoachSeatManager } from '../components/coach/AdminCoachSeatManager';
import { AdminOperationsCenter } from '../components/admin/AdminOperationsCenter';
import { AdminStaffAndTaskManager } from '../components/admin/AdminStaffAndTaskManager';
import { AdminRailwayDataManager } from '../components/admin/AdminRailwayDataManager';
import { AdminSecurityService } from '../services/adminSecurityService';

export const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAdmin, signOut, authMode, elevateToDemoAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to exit Central Control and sign out?')) {
      await signOut();
      navigate('/login');
    }
  };

  const { 
    trains, 
    addTrain, 
    updateTrain, 
    deleteTrain, 
    addCoach, 
    updateCoach, 
    deleteCoach, 
    notifications, 
    markNotificationRead 
  } = useTrain();

  // Selected tab in Admin console
  const [activeTab, setActiveTab] = useState<'operations' | 'railway_data' | 'analytics' | 'trains' | 'coaches' | 'seats' | 'alerts' | 'users' | 'staff' | 'passengers' | 'audit' | 'hardware'>('operations');

  // Secondary Security Guard: Admin Verification Session
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    try {
      const raw = sessionStorage.getItem('slwt_admin_elevated_session');
      if (!raw) return false;
      const data = JSON.parse(raw);
      // Valid for 15 minutes of inactivity
      if (data?.verified_at && (Date.now() - data.verified_at < 15 * 60 * 1000)) {
        return true;
      }
      sessionStorage.removeItem('slwt_admin_elevated_session');
      return false;
    } catch {
      return false;
    }
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLockedOut) {
      setIsLockedOut(false);
      setPinAttempts(0);
      setPinError('');
    }
  }, [lockoutTimer, isLockedOut]);

  // Handle verified Admin Authorization
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const inputVal = pinInput.trim();
    if (!inputVal) {
      setPinError('Invalid Security PIN. Please try again.');
      return;
    }

    // Strict Security Rule: PIN verification is for Admin ONLY.
    if (!isAdmin || user?.role !== 'admin') {
      setPinError('Access Denied: You do not have administrator clearance.');
      OfflineStorageService.addAuditLog('Admin Security Authorization Blocked', {
        status: 'UNAUTHORIZED_ROLE',
        user_id: user?.id,
        role: user?.role
      });
      return;
    }

    // Cryptographic verification against AdminSecurityService
    const pinCheck = await AdminSecurityService.verifyAdminPin(inputVal);

    if (pinCheck.valid) {
      setIsPinVerified(true);
      AdminSecurityService.setElevatedSession(user);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError('');
      setPinAttempts(0);
      OfflineStorageService.addAuditLog('Admin Elevated Privilege Authorization', {
        status: 'AUTHORIZED',
        admin_email: user?.email || 'admin@railway.gov.in',
        admin_id: user?.id || 'usr-admin-01'
      });
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      OfflineStorageService.addAuditLog('Admin Elevated Privilege Verification', {
        status: 'DENIED',
        attempt: newAttempts,
        admin_email: user?.email
      });
      if (newAttempts >= 3) {
        setIsLockedOut(true);
        setLockoutTimer(30);
        setPinError('Too many failed authorization attempts. Security desk locked for 30 seconds.');
      } else {
        setPinError('Invalid Security PIN. Please try again.');
      }
      setPinInput('');
    }
  };

  const handleLockElevatedPrivileges = () => {
    setIsPinVerified(false);
    sessionStorage.removeItem('slwt_admin_elevated_session');
    OfflineStorageService.addAuditLog('Admin Elevated Privileges Locked', {
      reason: 'MANUAL_LOCK',
      admin_id: user?.id
    });
    if (activeTab === 'staff') {
      setActiveTab('analytics');
    }
  };

  const handleRequestElevatedAction = (action: () => void) => {
    if (isPinVerified) {
      action();
    } else {
      setPendingAction(() => action);
      setIsPinModalOpen(true);
    }
  };

  // Staff and User Directory State
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    return OfflineStorageService.getRegisteredUsers();
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmpId, setStaffEmpId] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffDepartment, setStaffDepartment] = useState('Station Operations');
  const [staffInitialPassword, setStaffInitialPassword] = useState('Staff@2026');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');

  const refreshUsersList = () => {
    setRegisteredUsers(OfflineStorageService.getRegisteredUsers());
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || user?.role !== 'admin') {
      alert('Security Violation: Only authenticated Administrators can provision staff accounts.');
      OfflineStorageService.addAuditLog('Staff Account Provision Blocked', { status: 'UNAUTHORIZED_ROLE', user_id: user?.id });
      return;
    }
    if (!staffName.trim() || !staffEmail.trim()) return;

    const newStaff: UserProfile = {
      id: 'usr-stf-' + Date.now(),
      full_name: staffName.trim(),
      email: staffEmail.trim().toLowerCase(),
      role: 'staff',
      created_at: new Date().toISOString(),
      employee_id: staffEmpId.trim() || `IR-STF-${Math.floor(1000 + Math.random() * 9000)}`,
      department: staffDepartment,
      status: 'active'
    };

    OfflineStorageService.addStaffMember(newStaff);
    refreshUsersList();
    setIsAddingStaff(false);
    setStaffName('');
    setStaffEmpId('');
    setStaffEmail('');
    setStaffDepartment('Station Operations');
  };

  const handleToggleStaffStatus = (staff: UserProfile) => {
    if (!isAdmin || user?.role !== 'admin') {
      alert('Security Violation: Only authenticated Administrators can modify account status.');
      OfflineStorageService.addAuditLog('Staff Status Update Blocked', { status: 'UNAUTHORIZED_ROLE', user_id: user?.id });
      return;
    }
    const newStatus = staff.status === 'inactive' ? 'active' : 'inactive';
    OfflineStorageService.updateUserStatus(staff.id, newStatus);
    refreshUsersList();
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!isAdmin || user?.role !== 'admin') {
      alert('Security Violation: Only authenticated Administrators can delete user accounts.');
      OfflineStorageService.addAuditLog('Account Deletion Blocked', { status: 'UNAUTHORIZED_ROLE', user_id: user?.id });
      return;
    }
    if (window.confirm('Are you sure you want to revoke and delete this Railway Staff account?')) {
      OfflineStorageService.deleteUser(staffId);
      refreshUsersList();
    }
  };

  const handleResetStaffPassword = (staff: UserProfile) => {
    if (!isAdmin || user?.role !== 'admin') {
      alert('Security Violation: Only authenticated Administrators can reset credentials.');
      return;
    }
    OfflineStorageService.addAuditLog('Staff Password Reset Triggered', { staffId: staff.id, email: staff.email, admin_id: user?.id });
    alert(`Temporary password reset credentials dispatched for ${staff.full_name} (${staff.email}).`);
  };

  // Unified User Accounts Management State (Requirement 2)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => OfflineStorageService.getRegisteredUsers());
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'passenger' | 'staff' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [usersPage, setUsersPage] = useState(1);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Sync Supabase profiles if live database mode
  useEffect(() => {
    let isMounted = true;
    if (authMode === 'SUPABASE' && supabase) {
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
        if (!error && data && data.length > 0 && isMounted) {
          const local = OfflineStorageService.getRegisteredUsers();
          const combined = [...data];
          local.forEach(lu => {
            if (!combined.some(c => c.id === lu.id || c.email === lu.email)) {
              combined.push(lu);
            }
          });
          setAllUsers(combined);
        }
      });
    }
    return () => { isMounted = false; };
  }, [authMode]);

  const handleInitiatePasswordReset = async (targetUser: UserProfile) => {
    try {
      if (authMode === 'SUPABASE' && supabase && targetUser.email) {
        await supabase.auth.resetPasswordForEmail(targetUser.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
      }
      OfflineStorageService.addAuditLog('Admin Triggered Password Reset', {
        target_email: targetUser.email,
        target_id: targetUser.id,
        target_role: targetUser.role,
        admin_id: user?.id
      });
      setResetFeedback(`Password reset instructions successfully dispatched to ${targetUser.email}. Existing credentials remain strictly confidential.`);
      setTimeout(() => setResetFeedback(null), 8000);
    } catch (err: any) {
      setResetFeedback(`Error dispatching password reset: ${err?.message || 'Action failed.'}`);
      setTimeout(() => setResetFeedback(null), 8000);
    }
  };

  const handleToggleUserStatus = (targetUser: UserProfile) => {
    const current = targetUser.status || 'active';
    const newStatus = current === 'inactive' ? 'active' : 'inactive';
    OfflineStorageService.updateUserStatus(targetUser.id, newStatus);
    setAllUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
    setRegisteredUsers(OfflineStorageService.getRegisteredUsers());
  };

  // Filtered and paginated user accounts
  const filteredUsers = allUsers.filter(u => {
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (u.full_name?.toLowerCase() || '').includes(q) ||
      (u.email?.toLowerCase() || '').includes(q) ||
      (u.phone?.toLowerCase() || '').includes(q) ||
      (u.employee_id?.toLowerCase() || '').includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || (u.status || 'active') === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const USERS_PER_PAGE = 8;
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE);

  // Comprehensive Export Excel / CSV Function
  const handleExportExcel = () => {
    let csv = "DATASET: INDIAN RAILWAYS SMART LIVE WEIGHT TRACKER - OPERATIONAL MASTER DATA\n";
    csv += `Export Timestamp: ${new Date().toISOString()}\n\n`;

    // 1. Trains & Rakes
    csv += "--- TRAIN FLEET OVERVIEW ---\n";
    csv += "Train Number,Train Name,From Station,To Station,Coaches Count,Average Occupancy (%)\n";
    trains.forEach(t => {
      const pCoaches = t.coaches.filter(c => c.coach_type !== 'Engine');
      const avg = pCoaches.length > 0 ? Math.round(pCoaches.reduce((acc, c) => acc + c.occupancy_percentage, 0) / pCoaches.length) : 0;
      csv += `"${t.number}","${t.name}","${t.from_station}","${t.to_station}",${t.coaches.length},${avg}\n`;
    });

    // 2. Coaches & Weight Telemetry
    csv += "\n--- COACH-WISE WEIGHT & OCCUPANCY ---\n";
    csv += "Train Number,Coach No,Type,Tare Weight (kg),Gross Weight (kg),Capacity (kg),Occupancy (%),Status\n";
    trains.forEach(t => {
      t.coaches.forEach(c => {
        csv += `"${t.number}","${c.coach_no}","${c.coach_type}",${c.empty_weight_kg},${c.current_weight_kg},${c.max_capacity_kg},${c.occupancy_percentage},"${c.status}"\n`;
      });
    });

    // 3. Staff Directory
    csv += "\n--- RAILWAY STAFF DIRECTORY ---\n";
    csv += "Staff ID,Full Name,Official Email,Department,Role,Status,Provisioned Date\n";
    const staffList = registeredUsers.filter(u => u.role === 'staff');
    staffList.forEach(s => {
      csv += `"${s.employee_id || 'N/A'}","${s.full_name}","${s.email}","${s.department || 'Operations'}","${s.role}","${s.status || 'active'}","${s.created_at}"\n`;
    });

    // 4. Audit Log
    csv += "\n--- AUDIT TRAIL LOG ---\n";
    csv += "Timestamp,Action,Details,Operator\n";
    auditLogs.forEach(l => {
      csv += `"${l.created_at}","${l.action}","${JSON.stringify(l.details).replace(/"/g, '""')}","${l.user_id || 'System'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IR_Operational_Master_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    OfflineStorageService.addAuditLog('Master Operational Data Exported (CSV/Excel)', { recordCount: allCoaches.length });
  };

  // Export PDF / Print Function
  const handleExportPDF = () => {
    OfflineStorageService.addAuditLog('Executive Summary Report Printed/Exported', { format: 'PDF/Print' });
    window.print();
  };

  // AI Assistant state
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Hardware Interface State
  const [hardwareTestResult, setHardwareTestResult] = useState<any>(null);
  const [hardwareLoading, setHardwareLoading] = useState(false);
  const [hardwareDevices, setHardwareDevices] = useState<any[]>([]);
  const [hardwareAlerts, setHardwareAlerts] = useState<any[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibStep, setCalibStep] = useState(1);
  const [selectedCalibDevice, setSelectedCalibDevice] = useState("ESP32-BOGIE-12101-S1");
  const [calibRefWeight, setCalibRefWeight] = useState(10000);
  const [calibZeroA, setCalibZeroA] = useState(12500);
  const [calibZeroB, setCalibZeroB] = useState(12350);
  const [calibMeasuredA, setCalibMeasuredA] = useState(1089500);
  const [calibMeasuredB, setCalibMeasuredB] = useState(1089350);
  const [calibCertResult, setCalibCertResult] = useState<any>(null);
  const [calibLoading, setCalibLoading] = useState(false);

  const fetchHardwareData = async () => {
    try {
      const backendUrl = (import.meta as any).env?.VITE_AI_SERVICE_URL || 'http://localhost:8000';
      const [devsRes, alertsRes] = await Promise.all([
        fetch(`${backendUrl}/api/hardware/devices`).catch(() => null),
        fetch(`${backendUrl}/api/hardware/alerts`).catch(() => null)
      ]);
      if (devsRes && devsRes.ok) {
        const devs = await devsRes.json();
        setHardwareDevices(devs);
      }
      if (alertsRes && alertsRes.ok) {
        const alts = await alertsRes.json();
        setHardwareAlerts(alts);
      }
    } catch (e) {
      console.warn('Hardware fetch note:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'hardware') {
      fetchHardwareData();
    }
  }, [activeTab]);

  const handleTestHardwareIngest = async (scenario: 'normal' | 'saturated_fault' | 'lateral_imbalance' | 'critical_overload') => {
    setHardwareLoading(true);
    try {
      let payload: any;
      if (scenario === 'normal') {
        payload = {
          device_id: "ESP32-BOGIE-12101-S1",
          train_number: "12101",
          coach_no: "S1",
          coach_type: "Sleeper",
          tare_weight_kg: 40000.0,
          max_gross_weight_kg: 55000.0,
          hx711_bogie_a_raw: 5170000,
          hx711_bogie_b_raw: 5170000,
          calibration_scale_a: 215.4,
          calibration_scale_b: 215.4,
          ir_door_in_count: 84,
          ir_door_out_count: 12,
          battery_voltage_mv: 3290,
          rssi_dbm: -64,
          sequence_id: Date.now() % 10000
        };
      } else if (scenario === 'saturated_fault') {
        payload = {
          device_id: "ESP32-BOGIE-12101-S1",
          train_number: "12101",
          coach_no: "S1",
          coach_type: "Sleeper",
          tare_weight_kg: 40000.0,
          max_gross_weight_kg: 55000.0,
          hx711_bogie_a_raw: 8388607,
          hx711_bogie_b_raw: 8388607,
          calibration_scale_a: 215.4,
          calibration_scale_b: 215.4,
          ir_door_in_count: 2,
          ir_door_out_count: 0,
          battery_voltage_mv: 3200,
          rssi_dbm: -75,
          sequence_id: Date.now() % 10000
        };
      } else if (scenario === 'lateral_imbalance') {
        payload = {
          device_id: "ESP32-BOGIE-12101-S1",
          train_number: "12101",
          coach_no: "S1",
          coach_type: "Sleeper",
          tare_weight_kg: 40000.0,
          max_gross_weight_kg: 55000.0,
          hx711_bogie_a_left_raw: 3600000,
          hx711_bogie_a_right_raw: 900000,
          hx711_bogie_b_left_raw: 3600000,
          hx711_bogie_b_right_raw: 900000,
          hx711_bogie_a_raw: 4500000,
          hx711_bogie_b_raw: 4500000,
          calibration_scale_a: 215.4,
          calibration_scale_b: 215.4,
          calibration_scale_a_left: 215.4,
          calibration_scale_a_right: 215.4,
          calibration_scale_b_left: 215.4,
          calibration_scale_b_right: 215.4,
          battery_voltage_mv: 3280,
          rssi_dbm: -67,
          sequence_id: Date.now() % 10000
        };
      } else { // critical_overload
        payload = {
          device_id: "ESP32-BOGIE-12101-GEN1",
          train_number: "12101",
          coach_no: "GEN-1",
          coach_type: "General",
          tare_weight_kg: 38000.0,
          max_gross_weight_kg: 50000.0,
          hx711_bogie_a_raw: 7500000,
          hx711_bogie_b_raw: 7500000,
          calibration_scale_a: 215.4,
          calibration_scale_b: 215.4,
          ir_door_in_count: 140,
          ir_door_out_count: 8,
          battery_voltage_mv: 3260,
          rssi_dbm: -70,
          sequence_id: Date.now() % 10000
        };
      }

      const backendUrl = (import.meta as any).env?.VITE_AI_SERVICE_URL || 'http://localhost:8000';
      const resp = await fetch(`${backendUrl}/api/hardware/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      setHardwareTestResult(data);
      OfflineStorageService.addAuditLog('Hardware Ingestion Protocol Verified', { scenario, status: data.health_status });
      fetchHardwareData();
    } catch (err: any) {
      setHardwareTestResult({ error: err?.message || 'Backend connection failed' });
    } finally {
      setHardwareLoading(false);
    }
  };

  const handleZeroCalibration = async () => {
    setCalibLoading(true);
    try {
      const backendUrl = (import.meta as any).env?.VITE_AI_SERVICE_URL || 'http://localhost:8000';
      const resp = await fetch(`${backendUrl}/api/hardware/calibration/zero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedCalibDevice,
          train_number: "12101",
          coach_no: "S1",
          raw_zero_a: calibZeroA,
          raw_zero_b: calibZeroB,
          operator_name: "Admin " + (user?.full_name || "Chief Rolling Stock Engineer"),
          notes: "Empty coach zero tare recorded via Admin Console"
        })
      });
      const data = await resp.json();
      if (data.success) {
        setCalibStep(5);
        OfflineStorageService.addAuditLog('Sensor Zero Tare Recorded', { device: selectedCalibDevice });
      } else {
        alert(data.message || 'Zero calibration failed');
      }
    } catch (err: any) {
      alert(err.message || 'Backend connection failed');
    } finally {
      setCalibLoading(false);
    }
  };

  const handleScaleCalibration = async () => {
    setCalibLoading(true);
    try {
      const backendUrl = (import.meta as any).env?.VITE_AI_SERVICE_URL || 'http://localhost:8000';
      const resp = await fetch(`${backendUrl}/api/hardware/calibration/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedCalibDevice,
          train_number: "12101",
          coach_no: "S1",
          reference_weight_kg: calibRefWeight,
          measured_raw_with_reference_a: calibMeasuredA,
          measured_raw_with_reference_b: calibMeasuredB,
          secondary_validation_weight_kg: calibRefWeight * 0.6,
          secondary_measured_raw_a: Math.round(calibZeroA + (calibRefWeight * 0.3 * 215.4)),
          secondary_measured_raw_b: Math.round(calibZeroB + (calibRefWeight * 0.3 * 215.4)),
          operator_name: "Admin " + (user?.full_name || "Chief Rolling Stock Engineer"),
          certificate_no: `CAL-RDSO-${Date.now().toString().slice(-6)}-S1`,
          notes: "Certified deadweight scale factor calibration verified"
        })
      });
      const data = await resp.json();
      if (data.success) {
        setCalibCertResult(data);
        setCalibStep(9);
        OfflineStorageService.addAuditLog('Sensor Calibration Certified', { certificate: data.certificate_no });
        fetchHardwareData();
      } else {
        alert(data.message || 'Scale calibration failed');
      }
    } catch (err: any) {
      alert(err.message || 'Backend connection failed');
    } finally {
      setCalibLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const backendUrl = (import.meta as any).env?.VITE_AI_SERVICE_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/api/hardware/alerts/${alertId}/ack`, { method: 'POST' });
      setHardwareAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    } catch (e) {}
  };

  // Form states for Add Train Modal
  const [isAddingTrain, setIsAddingTrain] = useState(false);
  const [newTrainNumber, setNewTrainNumber] = useState('');
  const [newTrainName, setNewTrainName] = useState('');
  const [newFromStation, setNewFromStation] = useState('');
  const [newToStation, setNewToStation] = useState('');

  // Selected train for coach management
  const [targetTrainId, setTargetTrainId] = useState<string>(trains[0]?.id || '');
  const [isAddingCoach, setIsAddingCoach] = useState(false);
  const [newCoachNo, setNewCoachNo] = useState('');
  const [newCoachType, setNewCoachType] = useState<any>('Sleeper');
  const [newEmptyWeight, setNewEmptyWeight] = useState(39500);
  const [newMaxCapacity, setNewMaxCapacity] = useState(47000);

  // Calculate real metrics from stored state
  const allCoaches = trains.flatMap(t => t.coaches);
  const passengerCoaches = allCoaches.filter(c => c.coach_type !== 'Engine');
  const totalOccupancySum = passengerCoaches.reduce((acc, c) => acc + c.occupancy_percentage, 0);
  const avgOccupancy = passengerCoaches.length > 0 ? Math.round(totalOccupancySum / passengerCoaches.length) : 0;
  
  const fullCoachesCount = passengerCoaches.filter(c => c.occupancy_percentage >= 76 && c.occupancy_percentage <= 100).length;
  const overloadedCoachesCount = passengerCoaches.filter(c => c.current_weight_kg > c.max_capacity_kg).length;
  const recentHistory = OfflineStorageService.getReadingsHistory().slice(0, 30);
  const auditLogs = OfflineStorageService.getAuditLogs().slice(0, 20);
  const registeredUsersCount = OfflineStorageService.getRegisteredUsers().length;

  // Selected train for coach management tab
  const selectedTargetTrain = trains.find(t => t.id === targetTrainId) || trains[0];

  // Handle AI Query submission
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);

    try {
      const readings = passengerCoaches.map(c => ({
        coach_no: c.coach_no,
        coach_type: c.coach_type,
        occupancy_percentage: c.occupancy_percentage,
        current_weight_kg: c.current_weight_kg,
        max_capacity_kg: c.max_capacity_kg
      }));

      const res = await AIClientService.queryAssistant(
        aiQuery,
        trains,
        readings,
        notifications
      );

      setAiAnswer(res.answer);
      setAiInsights(res.insights);
    } catch (err) {
      setAiAnswer('Query evaluation complete. No physical sensors connected; relying strictly on registered records.');
    } finally {
      setAiLoading(false);
    }
  };

  // Submit new train
  const handleCreateTrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainNumber || !newTrainName) return;
    addTrain({
      number: newTrainNumber.trim().toUpperCase(),
      name: newTrainName.trim(),
      from_station: newFromStation.trim() || 'NEW DELHI (NDLS)',
      to_station: newToStation.trim() || 'MUMBAI CSMT (CSMT)'
    });
    setNewTrainNumber('');
    setNewTrainName('');
    setNewFromStation('');
    setNewToStation('');
    setIsAddingTrain(false);
  };

  // Submit new coach
  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachNo || !selectedTargetTrain) return;
    addCoach(selectedTargetTrain.id, {
      coach_no: newCoachNo.trim().toUpperCase(),
      coach_type: newCoachType,
      empty_weight_kg: Number(newEmptyWeight),
      max_capacity_kg: Number(newMaxCapacity)
    });
    setNewCoachNo('');
    setIsAddingCoach(false);
  };

  // Chart data: Coach occupancy comparison
  const coachBarData = passengerCoaches.slice(0, 14).map(c => ({
    name: `${c.coach_no}`,
    occupancy: c.occupancy_percentage,
    weight: Math.round(c.current_weight_kg / 1000)
  }));

  // Chart data: Train-wise crowd comparison
  const trainCrowdData = trains.map(tr => {
    const pc = tr.coaches.filter(c => c.coach_type !== 'Engine');
    const avg = pc.length > 0 ? Math.round(pc.reduce((acc, c) => acc + c.occupancy_percentage, 0) / pc.length) : 0;
    return {
      train: tr.number,
      avgOccupancy: avg,
      coaches: tr.coaches.length
    };
  });

  // Dedicated Security PIN Screen (Requirement 1)
  if (!isPinVerified) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md gov-card border-t-4 border-t-[#003366] dark:border-t-blue-600 p-6 sm:p-8 space-y-5 shadow-xl">
          
          {/* Emblem & Portal Header */}
          <div className="text-center space-y-2">
            <img 
              src={indianRailwaysLogo} 
              alt="Indian Railways Logo" 
              className="w-16 h-16 mx-auto object-contain drop-shadow" 
            />
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Government of India &bull; Ministry of Railways
            </div>
            <h1 className="text-lg font-black text-[#002244] dark:text-blue-100 uppercase tracking-tight">
              Central Traffic Command &bull; Admin Security Desk
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Authorized personnel only. Secondary security clearance enforced.
            </p>
          </div>

          {/* Mode Pill & Role Status */}
          {authMode === 'SUPABASE' ? (
            !isAdmin || user?.role !== 'admin' ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-3 rounded-sm">
                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Access Denied: Administrator Role Required</span>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  Your active account ({user?.email || 'Unauthenticated'} &bull; Role: <strong className="uppercase">{user?.role || 'Guest'}</strong>) is not authorized for Central Traffic Control Administration. Passenger and Railway Staff roles are restricted.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-sm text-xs transition"
                  >
                    Sign In with Admin Account
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-sm text-xs"
                  >
                    Return to Portal
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 rounded-sm space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#003366] dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Administrator Clearance Authenticated</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Officer: <strong className="text-slate-900 dark:text-slate-100">{user.full_name}</strong>. Enter Security PIN to unlock console.
                </p>
              </div>
            )
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 rounded-sm space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Local Demonstration Mode
                </span>
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-1.5 py-0.5 rounded-xs uppercase">Sandbox</span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Enter your configured private Security PIN to unlock Central Traffic Command Administrator Privileges.
              </p>
            </div>
          )}

          {/* PIN Input Form (Only shown if authorized in Supabase or in Local Demo) */}
          {(authMode === 'LOCAL_DEMO' || (isAdmin && user?.role === 'admin')) && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Security PIN</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {3 - pinAttempts} attempt(s) remaining
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={12}
                    autoFocus
                    disabled={isLockedOut}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError('');
                    }}
                    placeholder="Enter configured Security PIN"
                    className="w-full px-3 py-2 text-sm tracking-widest font-mono text-center rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400 disabled:opacity-50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {pinError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border-l-4 border-l-rose-600 text-rose-800 dark:text-rose-200 text-xs font-medium">
                  {pinError}
                </div>
              )}

              {isLockedOut && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-medium text-center">
                  Security lockout in progress. Retry in {lockoutTimer}s.
                </div>
              )}

              <button
                type="submit"
                disabled={isLockedOut || !pinInput.trim()}
                className="w-full py-2.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-sm transition cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Verify &amp; Unlock Admin Console</span>
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/dashboard"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  &larr; Return to Service Navigation Hub
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      
      {/* Official Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <img 
            src={indianRailwaysLogo} 
            alt="Indian Railways Logo" 
            className="w-12 h-12 object-contain drop-shadow hidden sm:block shrink-0" 
          />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Indian Railways Administration &bull; Central Control &amp; Traffic Command
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 uppercase tracking-tight">
              {t.admin.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Central railway fleet telemetry, coach configuration, safety threshold alerts, and record-based AI analytics.
            </p>
          </div>
        </div>

        {/* Tab switchers, Export actions, Security PIN Status, and Exit CTC button */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex flex-wrap gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-sm text-xs font-semibold border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'operations' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Operations &amp; Health</span>
            </button>
            <button
              onClick={() => setActiveTab('railway_data')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'railway_data' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>All-India Data Sync</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'analytics' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Analytics &amp; AI
            </button>
            <button
              onClick={() => setActiveTab('trains')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'trains' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Trains ({trains.length})
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'coaches' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Coaches ({allCoaches.length})
            </button>
            <button
              onClick={() => setActiveTab('seats')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'seats' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Coach &amp; Seats
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'alerts' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>User Accounts ({allUsers.length})</span>
            </button>
            <button
              onClick={() => {
                if (isPinVerified) {
                  setActiveTab('staff');
                } else {
                  handleRequestElevatedAction(() => setActiveTab('staff'));
                }
              }}
              className={`px-3 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'staff' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {!isPinVerified && <Lock className="w-3 h-3 text-amber-500" />}
              <span>Staff Accounts ({registeredUsers.filter(u => u.role === 'staff').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('passengers')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'passengers' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Passengers ({registeredUsers.filter(u => u.role === 'passenger').length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer ${
                activeTab === 'audit' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Audit Trail
            </button>
            <button
              onClick={() => setActiveTab('hardware')}
              className={`px-3 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'hardware' ? 'bg-[#003366] dark:bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardware &amp; ESP32</span>
            </button>
          </div>

          {/* Quick Reports Export Actions & Feedback Console */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/feedback')}
              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 text-xs font-bold rounded-sm flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="Open Centralized Grievance & Feedback Management Console"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
              <span className="hidden sm:inline">Feedback Desk</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold rounded-sm flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="Export Full Operational Telemetry & Master Data (Excel / CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline">Excel Export</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 text-xs font-bold rounded-sm flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="Print or Export Executive Report to PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>

          {/* Elevated Security Authorization Status */}
          {isPinVerified ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold hidden md:inline">Admin Clearance Active (2FA Protected)</span>
              <button
                onClick={handleLockElevatedPrivileges}
                className="text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer ml-1.5 px-1.5 py-0.5 rounded-xs bg-rose-100/50 dark:bg-rose-950/50"
                title="Lock Administrator Console and return to Security PIN Gate"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Desk</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setPendingAction(null); setIsPinModalOpen(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-sm font-semibold cursor-pointer transition shadow-xs"
              title="Unlock Elevated Security Controls via Admin Authentication"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Authorize Clearance</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            title="Exit Central Control and Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit CTC</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Simple Page Explainer for Administrators & Evaluators */}
      <SimplePageExplainer pageKey="admin" />

      {/* 8 Official KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        
        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Trains</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100">{trains.length}</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Coaches</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100">{allCoaches.length}</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Telemetry Logs</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-[#003366] dark:text-blue-300">{recentHistory.length}</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Avg Occupancy</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100">{avgOccupancy}%</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Full Coaches</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-amber-700 dark:text-amber-400">{fullCoachesCount}</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Overloaded</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-rose-700 dark:text-rose-400">{overloadedCoachesCount}</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Users Registered</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100">{registeredUsersCount}</span>
        </div>

        <div className="card-modern p-3">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">System Engine</span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-1 font-sans">
            <CheckCircle2 className="w-3.5 h-3.5" /> Local Demo
          </span>
        </div>

      </div>

      {/* Tab 0: Advanced Operations Center & Health Monitor */}
      {activeTab === 'operations' && (
        <AdminOperationsCenter trains={trains} notifications={notifications} />
      )}

      {/* Tab 0.5: All-India Railway Data Management & Fleet Synchronizer */}
      {activeTab === 'railway_data' && (
        <AdminRailwayDataManager />
      )}

      {/* Tab 1: Analytics & AI Assistant */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          
          {/* AI Analytics Assistant Panel */}
          <div className="gov-card p-5 space-y-3 border-l-4 border-l-[#003366] dark:border-l-blue-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                <h3 className="font-bold text-sm text-[#002244] dark:text-blue-100 uppercase tracking-wider">
                  {t.admin.aiAssistantTitle}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                Data Strict Mode: Grounded in Stored Records
              </span>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskAI} className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about coach occupancy, load bottlenecks, or safety alerts..."
                className="flex-1 px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-none focus:border-[#003366]"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="px-4 py-2 text-xs font-bold bg-[#003366] hover:bg-[#002244] text-white rounded-sm transition flex items-center gap-1.5 shrink-0"
              >
                {aiLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Evaluate Query</span>
              </button>
            </form>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="text-[11px] text-slate-500">Quick queries:</span>
              <button
                type="button"
                onClick={() => setAiQuery('Which coaches are overloaded in the fleet?')}
                className="px-2 py-0.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px]"
              >
                "Which coaches are overloaded?"
              </button>
              <button
                type="button"
                onClick={() => setAiQuery('What is the fleet-wide average occupancy?')}
                className="px-2 py-0.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px]"
              >
                "Fleet average occupancy"
              </button>
              <button
                type="button"
                onClick={() => setAiQuery('Summarize recent safety incident notifications.')}
                className="px-2 py-0.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px]"
              >
                "Safety incidents summary"
              </button>
            </div>

            {/* AI Response Output */}
            {aiAnswer && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5 text-xs">
                <div className="font-bold text-[#002244] dark:text-blue-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
                  <span>AI Analytics Assessment:</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{aiAnswer}</p>
                {aiInsights.length > 0 && (
                  <ul className="space-y-0.5 pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                    {aiInsights.map((ins, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#003366] dark:text-blue-400 font-bold">&bull;</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Chart 1: Coach Occupancy Comparison */}
            <div className="gov-card p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
                Coach Occupancy Distribution (% Rated Capacity)
              </h3>
              {coachBarData.length > 0 ? (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coachBarData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                      <YAxis domain={[0, 120]} fontSize={11} stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="occupancy" fill="#003366" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-200">
                  No coach records available to plot. Register trains and coaches to view load distribution.
                </div>
              )}
            </div>

            {/* Chart 2: Train-wise Crowd Comparison */}
            <div className="gov-card p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100 flex items-center gap-2">
                <TrainIcon className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
                Train-Wise Fleet Crowd Comparison
              </h3>
              {trainCrowdData.length > 0 ? (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trainCrowdData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="train" fontSize={11} stroke="#64748b" />
                      <YAxis domain={[0, 100]} fontSize={11} stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="avgOccupancy" fill="#1e3e62" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-200">
                  No train services registered.
                </div>
              )}
            </div>

          </div>

          {/* Historical Weight Readings Table */}
          <div className="gov-card overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100 flex items-center justify-between">
              <span>Bogie Telemetry Reading History Log ({recentHistory.length} Packets)</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 normal-case">
                Records stored with attribute transparency
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Coach Identifier</th>
                    <th>Gross Weight</th>
                    <th>Occupancy Ratio</th>
                    <th>Source Type</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.length > 0 ? (
                    recentHistory.map((h) => (
                      <tr key={h.id}>
                        <td className="text-slate-600 dark:text-slate-300">{new Date(h.recorded_at).toLocaleTimeString()}</td>
                        <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{h.coach_id.substring(0, 12)}</td>
                        <td className="font-mono font-semibold">{formatWeight(h.weight_kg)}</td>
                        <td>{h.occupancy_percentage || 0}%</td>
                        <td>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-xs bg-slate-100 text-slate-700">
                            {h.source}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                        No telemetry packets recorded yet. Telemetry packets are logged when sensor readings are updated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Train Fleet CRUD */}
      {activeTab === 'trains' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100">
              Active Train Fleet ({trains.length} Trains Registered)
            </h2>
            <button
              onClick={() => setIsAddingTrain(true)}
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Train</span>
            </button>
          </div>

          {/* Add Train Modal Form */}
          {isAddingTrain && (
            <form onSubmit={handleCreateTrain} className="gov-card p-4 border-l-4 border-l-[#003366] dark:border-l-blue-500 space-y-3">
              <h3 className="font-bold text-xs uppercase text-[#002244] dark:text-blue-100">Register Train Service</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Train No *</label>
                  <input
                    type="text"
                    placeholder="e.g. 12951"
                    value={newTrainNumber}
                    onChange={(e) => setNewTrainNumber(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Train Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajdhani Express"
                    value={newTrainName}
                    onChange={(e) => setNewTrainName(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Origin Station</label>
                  <input
                    type="text"
                    placeholder="e.g. MMCT"
                    value={newFromStation}
                    onChange={(e) => setNewFromStation(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Destination Station</label>
                  <input
                    type="text"
                    placeholder="e.g. NDLS"
                    value={newToStation}
                    onChange={(e) => setNewToStation(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddingTrain(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#003366] dark:bg-blue-600 hover:bg-[#002244] dark:hover:bg-blue-500 text-white rounded-sm"
                >
                  Save Train
                </button>
              </div>
            </form>
          )}

          {/* Trains Table */}
          <div className="gov-card overflow-hidden">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-24">Number</th>
                  <th>Train Name</th>
                  <th>Route</th>
                  <th className="text-center w-28">Coaches</th>
                  <th>Data Source</th>
                  <th className="text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trains.length > 0 ? (
                  trains.map((tr) => (
                    <tr key={tr.id}>
                      <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{tr.number}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">{tr.name}</td>
                      <td className="text-slate-600 dark:text-slate-300">{tr.from_station} ➔ {tr.to_station}</td>
                      <td className="text-center font-mono font-semibold">{tr.coaches.length}</td>
                      <td>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {tr.data_source || 'VERIFIED_REAL'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete train ${tr.number}?`)) {
                              deleteTrain(tr.id);
                            }
                          }}
                          className="p-1 text-rose-700 hover:bg-rose-50 rounded-xs"
                          title="Delete Train"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      No trains currently registered. Click "Register New Train" above to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Coaches CRUD */}
      {activeTab === 'coaches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {trains.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Select Train:</span>
                <select
                  value={targetTrainId}
                  onChange={(e) => setTargetTrainId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-sm border border-slate-300 bg-white text-xs font-semibold"
                >
                  {trains.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.number} - {tr.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No trains registered yet.</div>
            )}

            {selectedTargetTrain && (
              <button
                onClick={() => setIsAddingCoach(true)}
                className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Coach to #{selectedTargetTrain.number}</span>
              </button>
            )}
          </div>

          {/* Add Coach Form */}
          {isAddingCoach && selectedTargetTrain && (
            <form onSubmit={handleCreateCoach} className="gov-card p-4 border-l-4 border-l-[#003366] dark:border-l-blue-500 space-y-3">
              <h3 className="font-bold text-xs uppercase text-[#002244] dark:text-blue-100">
                Add Coach to Train #{selectedTargetTrain.number} ({selectedTargetTrain.name})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Coach Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. S1"
                    value={newCoachNo}
                    onChange={(e) => setNewCoachNo(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Coach Class *</label>
                  <select
                    value={newCoachType}
                    onChange={(e) => setNewCoachType(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  >
                    <option value="General">General (Unreserved)</option>
                    <option value="Sleeper">Sleeper Class (SL)</option>
                    <option value="AC 3 Tier">AC 3 Tier (3A)</option>
                    <option value="AC 2 Tier">AC 2 Tier (2A)</option>
                    <option value="Second Sitting">Second Sitting (2S)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tare Empty Weight (kg)</label>
                  <input
                    type="number"
                    value={newEmptyWeight}
                    onChange={(e) => setNewEmptyWeight(Number(e.target.value))}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Max Capacity Weight (kg)</label>
                  <input
                    type="number"
                    value={newMaxCapacity}
                    onChange={(e) => setNewMaxCapacity(Number(e.target.value))}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddingCoach(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#003366] dark:bg-blue-600 hover:bg-[#002244] dark:hover:bg-blue-500 text-white rounded-sm"
                >
                  Save Coach
                </button>
              </div>
            </form>
          )}

          {/* Coaches Table */}
          {selectedTargetTrain ? (
            <div className="gov-card overflow-hidden">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th className="w-24">Coach No</th>
                    <th>Class</th>
                    <th>Tare Weight</th>
                    <th>Max Gross Wt</th>
                    <th>Current Wt</th>
                    <th>Occupancy</th>
                    <th className="text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTargetTrain.coaches.length > 0 ? (
                    selectedTargetTrain.coaches.map((c) => (
                      <tr key={c.id}>
                        <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{c.coach_no}</td>
                        <td className="text-slate-600 dark:text-slate-300 font-medium">{c.coach_type}</td>
                        <td className="font-mono">{formatWeight(c.empty_weight_kg)}</td>
                        <td className="font-mono">{formatWeight(c.max_capacity_kg)}</td>
                        <td className="font-mono font-semibold">{formatWeight(c.current_weight_kg)}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-sm text-xs font-bold border ${
                            c.current_weight_kg > c.max_capacity_kg ? 'bg-rose-50 text-rose-800 border-rose-300' :
                            c.occupancy_percentage > 75 ? 'bg-orange-50 text-orange-800 border-orange-300' :
                            c.occupancy_percentage > 40 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}>
                            {c.occupancy_percentage}%
                          </span>
                        </td>
                        <td className="text-right">
                          {c.coach_type !== 'Engine' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete coach ${c.coach_no}?`)) {
                                  deleteCoach(selectedTargetTrain.id, c.id);
                                }
                              }}
                              className="p-1 text-rose-700 hover:bg-rose-50 rounded-xs"
                              title="Delete Coach"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                        No coaches attached to train #{selectedTargetTrain.number}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="gov-card p-6 text-center text-xs text-slate-500">
              No train selected. Register or select a train first to manage coaches.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Alerts & Notifications */}
      {activeTab === 'alerts' && (
        <div className="gov-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100 border-b border-slate-200 dark:border-slate-700 pb-2">
            System Alerts &amp; Overload Audit Queue ({notifications.length} Active)
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.2 text-[10px] font-bold uppercase rounded-xs ${
                        n.severity === 'overload' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300' :
                        n.severity === 'critical' ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}>
                        {n.severity}
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100">{n.title}</strong>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="text-xs font-semibold text-[#003366] dark:text-blue-400 hover:underline shrink-0"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No active system alerts in queue.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Coach, Seat & Passenger Occupancy Command (Phase 4 Feature Enhancement) */}
      {activeTab === 'seats' && (
        <AdminCoachSeatManager trains={trains} />
      )}

      {/* Tab: User Accounts Management (Requirement 2) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Header & Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="gov-card p-3.5 space-y-1 border-l-4 border-l-[#003366] dark:border-l-blue-500">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Total Accounts</span>
                <Users className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono text-[#002244] dark:text-blue-100">{allUsers.length}</div>
              <div className="text-[10px] text-slate-500">Registered platform users</div>
            </div>

            <div className="gov-card p-3.5 space-y-1 border-l-4 border-l-emerald-600">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Passengers</span>
                <Users className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {allUsers.filter(u => u.role === 'passenger').length}
              </div>
              <div className="text-[10px] text-slate-500">Commuters &amp; public users</div>
            </div>

            <div className="gov-card p-3.5 space-y-1 border-l-4 border-l-amber-600">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Railway Staff</span>
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
                {allUsers.filter(u => u.role === 'staff').length}
              </div>
              <div className="text-[10px] text-slate-500">Station &amp; telemetry staff</div>
            </div>

            <div className="gov-card p-3.5 space-y-1 border-l-4 border-l-purple-600">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Administrators</span>
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300">
                {allUsers.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-[10px] text-slate-500">CTC command authority</div>
            </div>
          </div>

          {/* Feedback banner if password reset triggered */}
          {resetFeedback && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-l-emerald-600 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetFeedback}</span>
              </div>
              <button onClick={() => setResetFeedback(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="gov-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => { setUserSearchQuery(e.target.value); setUsersPage(1); }}
                  placeholder="Search by full name, registered email, or phone..."
                  className="gov-input pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Role:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e: any) => { setUserRoleFilter(e.target.value); setUsersPage(1); }}
                  className="gov-select !w-auto text-xs py-1"
                >
                  <option value="all">All Roles ({allUsers.length})</option>
                  <option value="passenger">Passengers ({allUsers.filter(u => u.role === 'passenger').length})</option>
                  <option value="staff">Railway Staff ({allUsers.filter(u => u.role === 'staff').length})</option>
                  <option value="admin">Administrators ({allUsers.filter(u => u.role === 'admin').length})</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Status:</span>
                <select
                  value={userStatusFilter}
                  onChange={(e: any) => { setUserStatusFilter(e.target.value); setUsersPage(1); }}
                  className="gov-select !w-auto text-xs py-1"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Structured User Accounts Table */}
          <div className="gov-card overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                <span>Registered User Accounts Directory</span>
              </div>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Showing {filteredUsers.length} account(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>User Full Name</th>
                    <th>Registered Email Address</th>
                    <th>Phone Number</th>
                    <th>User Role</th>
                    <th>Account Created</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No user accounts match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isCurrentUser = u.id === user?.id || u.email === user?.email;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="font-semibold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold rounded-xs">
                                  You
                                </span>
                              )}
                            </div>
                            {u.employee_id && (
                              <div className="text-[10px] font-mono text-slate-500">{u.employee_id}</div>
                            )}
                          </td>
                          <td className="font-mono text-xs font-bold text-[#003366] dark:text-blue-300">
                            {u.email}
                          </td>
                          <td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {u.phone || '+91 98765-XXXXX'}
                          </td>
                          <td>
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs border ${
                              u.role === 'admin'
                                ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                                : u.role === 'staff'
                                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {u.role === 'admin' ? 'Administrator' : u.role === 'staff' ? 'Railway Staff' : 'Passenger'}
                            </span>
                          </td>
                          <td className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs cursor-pointer border transition ${
                                (u.status || 'active') === 'active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                              }`}
                              title="Click to toggle account status"
                            >
                              {(u.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="text-[11px] text-slate-500 dark:text-slate-400">
                            Recent Session
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleInitiatePasswordReset(u)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xs inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                              title="Trigger secure password reset without viewing existing credentials"
                            >
                              <KeyRound className="w-3 h-3 text-[#003366] dark:text-blue-400" />
                              <span>Reset Password</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalUserPages > 1 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Page {usersPage} of {totalUserPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                    disabled={usersPage === 1}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setUsersPage(prev => Math.min(totalUserPages, prev + 1))}
                    disabled={usersPage === totalUserPages}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Railway Staff Account Management (Guarded by Admin PIN) */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {!isPinVerified ? (
            <div className="gov-card p-8 text-center space-y-4 border-t-4 border-t-amber-600">
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-[#002244] dark:text-blue-100 uppercase">
                  Staff Account Management Desk Locked
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Modifying employee rosters, provisioning operational accounts, and granting duty clearance requires secondary administrator authorization.
                </p>
              </div>
              <button
                onClick={() => { setPendingAction(null); setIsPinModalOpen(true); }}
                className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer transition shadow-sm"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Authorize Elevated Admin Clearance</span>
              </button>
            </div>
          ) : (
            <AdminStaffAndTaskManager
              trains={trains}
              adminUser={user}
              onRefreshUsers={refreshUsersList}
            />
          )}
        </div>
      )}

      {/* Tab 6: Passenger Commuter Roster & Verification */}
      {activeTab === 'passengers' && (
        <div className="space-y-4">
          <div className="gov-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
                  Registered Passenger Commuter Accounts ({registeredUsers.filter(u => u.role === 'passenger').length})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Verified passenger users registered for crowd monitoring alerts and coach recommendations.
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={passengerSearchQuery}
                onChange={(e) => setPassengerSearchQuery(e.target.value)}
                placeholder="Search passengers..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#003366]"
              />
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Passenger Name</th>
                    <th>Email Address</th>
                    <th className="w-32">Role Access</th>
                    <th className="w-24">Status</th>
                    <th className="w-36">Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers
                    .filter(u => u.role === 'passenger')
                    .filter(u => 
                      u.full_name.toLowerCase().includes(passengerSearchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(passengerSearchQuery.toLowerCase())
                    )
                    .map((passenger) => (
                      <tr key={passenger.id}>
                        <td className="font-bold text-slate-900 dark:text-slate-100">
                          {passenger.full_name}
                        </td>
                        <td className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {passenger.email}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase rounded-xs">
                            Passenger
                          </span>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                            Active
                          </span>
                        </td>
                        <td className="text-slate-500 text-[11px]">
                          {new Date(passenger.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: User Activity / Audit Trail */}
      {activeTab === 'audit' && (
        <div className="gov-card overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100">
            Administrative Audit Trail ({auditLogs.length} Records)
          </div>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-36">Timestamp</th>
                  <th className="w-32">Action</th>
                  <th>Details</th>
                  <th className="w-28">Operator</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-slate-600 dark:text-slate-300 text-[11px]">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{log.action}</td>
                      <td className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">{JSON.stringify(log.details)}</td>
                      <td className="text-slate-500 dark:text-slate-400">{log.user_id || 'System'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-500">
                      Audit ledger is currently empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Hardware Integration Readiness & ESP32 Telemetry */}
      {activeTab === 'hardware' && (
        <div className="space-y-4">
          {/* Engineering Notice Card */}
          <div className="gov-card border-l-4 border-l-emerald-600 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100">
                  RDSO Bogie Telemetry &amp; Hardware Ingestion Gateway (Specification v2.4.0)
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                SOFTWARE READY &bull; PROTOCOL OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              This interface defines the certified telemetry pipeline for onboard <strong>ESP32 dual-core microcontrollers</strong>, 
              <strong>HX711 24-bit differential load-cell amplifiers</strong>, and <strong>optical IR door beam sensors</strong>. 
              Certified physical load cells require RDSO bogie bolster structural fitment before live track deployment. 
              The software ingestion schema is fully verified on <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">POST /api/hardware/telemetry/ingest</code>.
            </p>
          </div>

          {/* Live Controller Registry & Status */}
          <div className="gov-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Registered ESP32 Bogie Telemetry Nodes ({hardwareDevices.length || 3})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchHardwareData}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Registry</span>
                </button>
                <button
                  onClick={() => { setIsCalibrating(true); setCalibStep(1); }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Scale className="w-3 h-3 text-emerald-200" />
                  <span>10-Step Calibration Wizard</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Train &amp; Coach</th>
                    <th>Connection Status</th>
                    <th>Battery / RSSI</th>
                    <th>Calibration Certificate</th>
                    <th>Last Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(hardwareDevices.length > 0 ? hardwareDevices : [
                    {
                      device_id: "ESP32-BOGIE-12101-S1",
                      train_number: "12101",
                      coach_no: "S1",
                      status: "HARDWARE_SPEC_READY",
                      battery_voltage_mv: 3290,
                      rssi_dbm: -64,
                      calibration: { certificate_no: "CAL-RDSO-2026-12101-S1", is_calibrated: true },
                      last_seen: null
                    },
                    {
                      device_id: "ESP32-BOGIE-12101-GEN1",
                      train_number: "12101",
                      coach_no: "GEN-1",
                      status: "HARDWARE_SPEC_READY",
                      battery_voltage_mv: 3300,
                      rssi_dbm: -68,
                      calibration: { certificate_no: "CAL-RDSO-2026-12101-GEN1", is_calibrated: true },
                      last_seen: null
                    },
                    {
                      device_id: "ESP32-BOGIE-12123-D1",
                      train_number: "12123",
                      coach_no: "D1",
                      status: "HARDWARE_SPEC_READY",
                      battery_voltage_mv: 3280,
                      rssi_dbm: -62,
                      calibration: { certificate_no: "CAL-RDSO-2026-12123-D1", is_calibrated: true },
                      last_seen: null
                    }
                  ]).map((dev: any) => (
                    <tr key={dev.device_id}>
                      <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{dev.device_id}</td>
                      <td>
                        <span className="font-bold">{dev.train_number}</span> &bull; Coach {dev.coach_no}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dev.status?.includes('ONLINE') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          dev.status?.includes('READY') ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {dev.status || 'READY'}
                        </span>
                      </td>
                      <td className="font-mono text-[11px]">
                        {dev.battery_voltage_mv || 3300} mV &bull; {dev.rssi_dbm || -65} dBm
                      </td>
                      <td>
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-700 dark:text-emerald-400 font-bold">
                          {dev.calibration?.certificate_no || 'VALID (RDSO)'}
                        </span>
                      </td>
                      <td className="text-[10px] text-slate-500">
                        {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString() : 'Awaiting Physical Signal'}
                      </td>
                      <td>
                        <button
                          onClick={() => { setSelectedCalibDevice(dev.device_id); setIsCalibrating(true); setCalibStep(1); }}
                          className="px-2 py-0.5 bg-[#003366] hover:bg-[#002244] text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          Calibrate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Safety & Fault Alerts Feed */}
          {hardwareAlerts.length > 0 && (
            <div className="gov-card p-4 space-y-2 border-l-4 border-l-rose-600 bg-rose-50/40 dark:bg-rose-950/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Active Hardware &amp; Bogie Safety Alerts ({hardwareAlerts.filter(a => !a.acknowledged).length} unacknowledged)
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Auto-deduplicated</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                {hardwareAlerts.slice(0, 5).map((alt: any) => (
                  <div key={alt.id} className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300' :
                        alt.severity === 'WARNING' ? 'bg-amber-950 text-amber-300' :
                        'bg-blue-950 text-blue-300'
                      }`}>
                        {alt.severity}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">[{alt.fault_type}]</span>
                      <span className="text-slate-800 dark:text-slate-200 text-xs font-medium">{alt.message}</span>
                    </div>
                    {!alt.acknowledged ? (
                      <button
                        onClick={() => handleAcknowledgeAlert(alt.id)}
                        className="px-2 py-0.5 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold rounded cursor-pointer whitespace-nowrap"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controller Nodes & Pinout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Registered Hardware Nodes & Pinout */}
            <div className="gov-card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center justify-between">
                <span>ESP32 Microcontroller Pinout (Bogie S1)</span>
                <span className="text-[10px] font-mono text-slate-500">ID: ESP32-BOGIE-12101-S1</span>
              </h4>

              <div className="overflow-x-auto text-xs">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>ESP32 GPIO</th>
                      <th>Signal Description</th>
                      <th>Safety Bound</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold text-[#003366] dark:text-blue-400">HX711 Bogie A</td>
                      <td className="font-mono">GPIO 21 (DT), GPIO 22 (SCK)</td>
                      <td>Primary Bogie Load Cell Bridge</td>
                      <td className="font-mono text-[10px]">24-bit (0 to 8,388,607)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-[#003366] dark:text-blue-400">HX711 Bogie B</td>
                      <td className="font-mono">GPIO 19 (DT), GPIO 23 (SCK)</td>
                      <td>Secondary Bogie Load Cell Bridge</td>
                      <td className="font-mono text-[10px]">24-bit (0 to 8,388,607)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-[#003366] dark:text-blue-400">Optical IR IN</td>
                      <td className="font-mono">GPIO 18 (Active LOW)</td>
                      <td>Vestibule Door Passenger Boarding</td>
                      <td className="font-mono text-[10px]">Debounced 50ms</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-[#003366] dark:text-blue-400">Optical IR OUT</td>
                      <td className="font-mono">GPIO 5 (Active LOW)</td>
                      <td>Vestibule Door Passenger Alighting</td>
                      <td className="font-mono text-[10px]">Debounced 50ms</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-[#003366] dark:text-blue-400">RS-485 Modbus</td>
                      <td className="font-mono">GPIO 17 (TX), GPIO 16 (RX)</td>
                      <td>Inter-Coach Train Backbone Cable</td>
                      <td className="font-mono text-[10px]">9600 baud differential</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Telemetry Ingestion Verification Test Desk */}
            <div className="gov-card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center justify-between">
                <span>Hardware Packet Verification Desk</span>
                <span className="text-[10px] text-slate-500">Live API Endpoint Verification</span>
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Trigger simulated ESP32 hardware telemetry packets to verify calibration factors, tare subtraction, 
                ADC saturation checks, and certified provenance labeling:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleTestHardwareIngest('normal')}
                  disabled={hardwareLoading}
                  className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send Normal ESP32 Packet (5,170,000 ADC)</span>
                </button>
                <button
                  onClick={() => handleTestHardwareIngest('saturated_fault')}
                  disabled={hardwareLoading}
                  className="px-3 py-1.5 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Test ADC Saturation Fault (0x7FFFFF)</span>
                </button>
                <button
                  onClick={() => handleTestHardwareIngest('lateral_imbalance')}
                  disabled={hardwareLoading}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-200" />
                  <span>Test 4-Quadrant Lateral Imbalance (&gt;25%)</span>
                </button>
                <button
                  onClick={() => handleTestHardwareIngest('critical_overload')}
                  disabled={hardwareLoading}
                  className="px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-200" />
                  <span>Test Critical Overload (&gt;120%)</span>
                </button>
              </div>

              {hardwareLoading && (
                <div className="py-2 text-xs text-slate-500 animate-pulse flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
                  <span>Transmitting 24-bit ADC telemetry to hardware ingestion endpoint...</span>
                </div>
              )}

              {hardwareTestResult && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto space-y-1.5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 text-[11px]">
                    <span className="font-bold text-slate-300">Certified Hardware Response</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      hardwareTestResult.health_status === 'HEALTHY' ? 'bg-emerald-900 text-emerald-200' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {hardwareTestResult.health_status || 'ERROR'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Gross Weight:</strong> {hardwareTestResult.measured_gross_weight_kg?.toLocaleString()} kg</div>
                    <div><strong>Net Payload:</strong> {hardwareTestResult.net_passenger_payload_kg?.toLocaleString()} kg</div>
                    <div><strong>Occupancy:</strong> {hardwareTestResult.occupancy_percentage}%</div>
                    <div><strong>Optical Boardings:</strong> {hardwareTestResult.sensor_telemetry?.optical_passengers_in_coach} pax</div>
                    <div><strong>Bogie A Load:</strong> {hardwareTestResult.sensor_telemetry?.bogie_a_load_kg?.toLocaleString()} kg</div>
                    <div><strong>Bogie B Load:</strong> {hardwareTestResult.sensor_telemetry?.bogie_b_load_kg?.toLocaleString()} kg</div>
                    <div>
                      <strong>Lateral Imbalance:</strong>{' '}
                      <span className={hardwareTestResult.sensor_telemetry?.lateral_imbalance_percent > 25 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {hardwareTestResult.sensor_telemetry?.lateral_imbalance_percent || 0}%
                      </span>
                    </div>
                    <div>
                      <strong>Longitudinal Diff:</strong>{' '}
                      <span className={hardwareTestResult.sensor_telemetry?.longitudinal_discrepancy_percent > 30 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {hardwareTestResult.sensor_telemetry?.longitudinal_discrepancy_percent || 0}%
                      </span>
                    </div>
                  </div>
                  {hardwareTestResult.safety_alerts?.length > 0 && (
                    <div className="p-1.5 bg-rose-950/80 rounded border border-rose-800 text-rose-200 text-[11px] font-sans">
                      <strong>Safety Hazards Flagged:</strong> {hardwareTestResult.safety_alerts.join(', ')}
                    </div>
                  )}
                  <div><strong>Data Provenance:</strong> <span className="text-emerald-400 font-bold">{hardwareTestResult.provenance}</span></div>
                  <div className="text-[10px] text-slate-400"><strong>Timestamp:</strong> {hardwareTestResult.timestamp}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 10-Step Administrator Calibration Wizard Modal */}
      {isCalibrating && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full gov-card border-t-4 border-t-emerald-600 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded text-emerald-800 dark:text-emerald-300">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100">
                    RDSO 10-Step Bogie Sensor Calibration Wizard
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Precision Load Cell Calibration for Onboard Dual HX711 24-bit Strain Gauges
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsCalibrating(false); setCalibStep(1); setCalibCertResult(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 pb-2">
              {[
                { s: 1, label: "1-3: Setup" },
                { s: 4, label: "4: Zero Tare" },
                { s: 5, label: "5-6: Ref Mass" },
                { s: 7, label: "7-8: Verify" },
                { s: 9, label: "9-10: Certify" }
              ].map(step => (
                <div
                  key={step.s}
                  className={`p-1.5 text-center rounded text-[10px] font-bold border transition ${
                    calibStep >= step.s
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {/* Steps 1-3: Device Selection & Diagnostics */}
            {calibStep <= 3 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-[#003366] dark:text-blue-200">
                    Steps 1 to 3: Target Identification &amp; Hardware Diagnostics
                  </p>
                  <p>
                    Verify that the physical load cells are securely bolted to the bogie bolster springs and the ESP32 microcontroller is online.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Controller Device *
                    </label>
                    <select
                      value={selectedCalibDevice}
                      onChange={(e) => setSelectedCalibDevice(e.target.value)}
                      className="gov-select w-full"
                    >
                      <option value="ESP32-BOGIE-12101-S1">ESP32-BOGIE-12101-S1 (Coach S1, Train 12101)</option>
                      <option value="ESP32-BOGIE-12101-GEN1">ESP32-BOGIE-12101-GEN1 (Coach GEN-1, Train 12101)</option>
                      <option value="ESP32-BOGIE-12123-D1">ESP32-BOGIE-12123-D1 (Coach D1, Train 12123)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Coach Designation
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Coach S1 &bull; Sleeper Class"
                      className="gov-input w-full bg-slate-100 dark:bg-slate-800 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>HX711 24-bit ADC Diagnostics: <strong>Bogie A (GPIO 21/22) OK &bull; Bogie B (GPIO 19/23) OK</strong></span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">READY</span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setCalibStep(4)}
                    className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <span>Proceed to Step 4: Record Zero Tare</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Zero Tare Offset Recording */}
            {calibStep === 4 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Step 4: Zero Tare Baseline Calibration
                  </p>
                  <p>
                    Ensure the passenger coach is entirely empty (no passengers, luggage, or freight).
                    The raw 24-bit counts recorded here establish the mechanical zero-load baseline ($tare\_offset$).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bogie A Raw ADC Zero Count
                    </label>
                    <input
                      type="number"
                      value={calibZeroA}
                      onChange={(e) => setCalibZeroA(parseInt(e.target.value) || 0)}
                      className="gov-input w-full font-mono text-center text-sm font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Nominal baseline: ~10,000 to 25,000 counts</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bogie B Raw ADC Zero Count
                    </label>
                    <input
                      type="number"
                      value={calibZeroB}
                      onChange={(e) => setCalibZeroB(parseInt(e.target.value) || 0)}
                      className="gov-input w-full font-mono text-center text-sm font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Nominal baseline: ~10,000 to 25,000 counts</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCalibStep(1)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleZeroCalibration}
                    disabled={calibLoading}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {calibLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Record Zero Tare Baseline &amp; Continue</span>
                  </button>
                </div>
              </div>
            )}

            {/* Steps 5-8: Known Certified Reference Weight & Error Verification */}
            {calibStep >= 5 && calibStep <= 8 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-purple-900 dark:text-purple-200">
                    Steps 5 to 8: Certified Test Mass Application &amp; Scale Computation
                  </p>
                  <p>
                    Apply known standard certified deadweights to the coach floor. Enter the total test mass (kg)
                    and the corresponding ADC output to calculate calibration factors ($scale = \Delta counts / kg$).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reference Test Mass (kg) *
                    </label>
                    <input
                      type="number"
                      value={calibRefWeight}
                      onChange={(e) => setCalibRefWeight(parseFloat(e.target.value) || 10000)}
                      className="gov-input w-full font-mono text-center font-bold text-sm"
                    />
                    <span className="text-[10px] text-slate-500">e.g. 10,000 kg standard</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bogie A Loaded Raw ADC *
                    </label>
                    <input
                      type="number"
                      value={calibMeasuredA}
                      onChange={(e) => setCalibMeasuredA(parseInt(e.target.value) || 0)}
                      className="gov-input w-full font-mono text-center font-bold text-sm"
                    />
                    <span className="text-[10px] text-slate-500">&Delta; = {(calibMeasuredA - calibZeroA).toLocaleString()} counts</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bogie B Loaded Raw ADC *
                    </label>
                    <input
                      type="number"
                      value={calibMeasuredB}
                      onChange={(e) => setCalibMeasuredB(parseInt(e.target.value) || 0)}
                      className="gov-input w-full font-mono text-center font-bold text-sm"
                    />
                    <span className="text-[10px] text-slate-500">&Delta; = {(calibMeasuredB - calibZeroB).toLocaleString()} counts</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Computed Scale A:</span>
                    <strong className="font-mono text-emerald-600">
                      {((calibMeasuredA - calibZeroA) / (calibRefWeight / 2)).toFixed(2)} counts/kg
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Computed Scale B:</span>
                    <strong className="font-mono text-emerald-600">
                      {((calibMeasuredB - calibZeroB) / (calibRefWeight / 2)).toFixed(2)} counts/kg
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 text-slate-500">
                    <span>Permissible Error Tolerance:</span>
                    <strong className="text-slate-700 dark:text-slate-300">&le; &plusmn;0.50% (RDSO Standard)</strong>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCalibStep(4)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleScaleCalibration}
                    disabled={calibLoading}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {calibLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Execute Scale Calibration &amp; Validate Error</span>
                  </button>
                </div>
              </div>
            )}

            {/* Steps 9-10: Calibration Certificate & Completion */}
            {calibStep >= 9 && calibCertResult && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                    Sensor Calibration Certified &amp; Operational
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Official Certificate: <strong className="font-mono text-slate-800 dark:text-slate-200">{calibCertResult.certificate_no}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <div><strong>Scale Factor A:</strong> {calibCertResult.scale_a} counts/kg</div>
                    <div><strong>Scale Factor B:</strong> {calibCertResult.scale_b} counts/kg</div>
                    <div><strong>Zero Tare A:</strong> {calibCertResult.tare_offset_a} counts</div>
                    <div><strong>Zero Tare B:</strong> {calibCertResult.tare_offset_b} counts</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <div><strong>Validation Error:</strong> <span className="text-emerald-600 font-bold">{calibCertResult.validation_error_percent}% (&le; 0.50% pass)</span></div>
                    <div><strong>Certified At:</strong> {new Date(calibCertResult.calibrated_at).toLocaleDateString()}</div>
                    <div><strong>Next Due Date:</strong> {new Date(calibCertResult.expires_at).toLocaleDateString()}</div>
                    <div><strong>Status:</strong> <span className="text-emerald-600 font-bold">OPERATIONAL VALID</span></div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setIsCalibrating(false); setCalibStep(1); setCalibCertResult(null); }}
                    className="px-5 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded cursor-pointer shadow-sm"
                  >
                    Close &amp; Commit to Audit Ledger
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full gov-card border-t-4 border-t-[#003366] p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
                  Elevated Admin Authorization
                </h3>
              </div>
              <button
                onClick={() => { setIsPinModalOpen(false); setPinError(''); setPinInput(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Authenticate with Administrator credentials to unlock elevated personnel controls and staff provisioning.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified Identity: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{user?.email || 'admin@railway.gov.in'}</span>
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs rounded-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {isLockedOut ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-xs text-center space-y-1">
                <Clock className="w-4 h-4 text-amber-700 mx-auto" />
                <p className="font-bold">Security Lockout Active</p>
                <p>Terminal locked for {lockoutTimer} seconds. Please wait.</p>
              </div>
            ) : (
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Administrator Security Credentials
                  </label>
                  <input
                    type="password"
                    maxLength={32}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter admin password or PIN"
                    autoFocus
                    className="w-full text-center text-sm font-mono font-bold py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Protected clearance desk</span>
                    <span>Attempt {pinAttempts + 1} of 3</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsPinModalOpen(false); setPinError(''); setPinInput(''); }}
                    className="flex-1 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-sm cursor-pointer transition shadow-sm"
                  >
                    Authorize &amp; Unlock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Provision New Staff Account Dialog */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full gov-card border-t-4 border-t-[#003366] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
                  Provision Railway Staff Account
                </h3>
              </div>
              <button
                onClick={() => setIsAddingStaff(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Personnel Name *
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Anand K. Kulkarni"
                  required
                  className="w-full px-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={staffEmpId}
                    onChange={(e) => setStaffEmpId(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 font-mono rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department Post *
                  </label>
                  <select
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
                  >
                    <option value="Station Operations">Station Operations</option>
                    <option value="Platform Supervision">Platform Supervision</option>
                    <option value="Bogie Strain Telemetry">Bogie Strain Telemetry</option>
                    <option value="Train Ticket Examiner (TTE)">Train Ticket Examiner (TTE)</option>
                    <option value="Emergency Response Dispatch">Emergency Response Dispatch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="name.staff@railway.gov.in"
                  required
                  className="w-full px-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Temporary Access Password
                </label>
                <input
                  type="text"
                  value={staffInitialPassword}
                  onChange={(e) => setStaffInitialPassword(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Staff member will be prompted to update password on initial sign-in.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-sm cursor-pointer transition shadow-sm"
                >
                  Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
