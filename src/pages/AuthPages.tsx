import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  Eye, 
  EyeOff, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  UserCheck, 
  Shield, 
  Building2,
  Briefcase,
  MapPin
} from 'lucide-react';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { isValidEmail, normalizeEmail, getEmailValidationError } from '../utils/emailValidation';

interface AuthPagesProps {
  mode: 'login' | 'register' | 'forgot' | 'reset';
  onSuccess: (role: UserRole) => void;
  onNavigate: (route: string) => void;
}

const DEPARTMENTS = [
  'Operations & Station Control',
  'Mechanical & Bogie Maintenance',
  'Electrical & Telemetry Systems',
  'Railway Protection Force (RPF) Security',
  'Commercial & Passenger Services',
  'Safety & Track Quality'
];

const DESIGNATIONS = [
  'Station Master',
  'Station Superintendent',
  'Senior Section Engineer',
  'Bogie Telemetry Technician',
  'RPF Sub-Inspector',
  'Train Ticket Examiner (TTE)',
  'Coach Attendant & Field Inspector'
];

const STATIONS = ['CSMT', 'NDLS', 'HWH', 'MAS', 'PUNE', 'SBC', 'DLI', 'KYN'];

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, onSuccess, onNavigate }) => {
  const { 
    login, 
    adminLogin, 
    register, 
    registerStaffRequest, 
    registerAdmin, 
    resetPassword, 
    updatePassword 
  } = useAuth();
  const { t } = useLanguage();

  // Role selections:
  // For Login: 'admin' | 'staff' | 'passenger'
  const [selectedLoginRole, setSelectedLoginRole] = useState<'admin' | 'staff' | 'passenger'>('passenger');
  // For Registration: 'passenger' | 'staff' | 'admin'
  const [selectedRegisterRole, setSelectedRegisterRole] = useState<'passenger' | 'staff' | 'admin'>('passenger');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [stationCode, setStationCode] = useState(STATIONS[0]);
  const [adminPin, setAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [submittedReset, setSubmittedReset] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear inputs and errors when switching roles
  const handleSelectLoginRole = (role: 'admin' | 'staff' | 'passenger') => {
    setSelectedLoginRole(role);
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setAdminPin('');
  };

  const handleSelectRegisterRole = (role: 'passenger' | 'staff' | 'admin') => {
    setSelectedRegisterRole(role);
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAdminPin('');
    setConfirmAdminPin('');
    setFullName('');
    setPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // 1. PASSWORD RESET CONFIRMATION
      if (mode === 'reset') {
        if (!password || password.length < 6) {
          setErrorMsg('New password must be at least 6 characters in length.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Password and confirmation password do not match.');
          setIsLoading(false);
          return;
        }

        const res = await updatePassword(password);
        if (!res.success) {
          setErrorMsg(res.message || 'Unable to update password. Please try again.');
          setIsLoading(false);
          return;
        }

        setSuccessMsg(res.message || 'Your password has been reset successfully! You can now sign in.');
        setIsLoading(false);
        return;
      }

      // 2. FORGOT PASSWORD RECOVERY
      if (mode === 'forgot') {
        const cleanEmail = normalizeEmail(email);
        if (!cleanEmail) {
          setErrorMsg('Please enter your registered email address.');
          setIsLoading(false);
          return;
        }

        if (!isValidEmail(cleanEmail)) {
          setErrorMsg(getEmailValidationError(email) || 'Please enter a valid registered email address.');
          setIsLoading(false);
          return;
        }

        const res = await resetPassword(cleanEmail);
        if (!res.success) {
          if (res.message?.toLowerCase().includes('rate limit')) {
            setErrorMsg('Password recovery request received. Due to email provider rate limits, if you do not receive an email shortly, please contact your administrator or try again later.');
          } else {
            setErrorMsg(res.message || 'Unable to process password reset request. Please check your email or contact support.');
          }
          setIsLoading(false);
          return;
        }

        setSubmittedReset(true);
        setIsLoading(false);
        return;
      }

      // 3. ROLE-WISE REGISTRATION (PASSENGER | STAFF | ADMIN WITH PIN SETUP)
      if (mode === 'register') {
        const cleanEmail = normalizeEmail(email);
        const cleanName = fullName.trim();
        const cleanPhone = phone.trim().replace(/[\s-]/g, '');

        if (!cleanName || !cleanEmail || !cleanPhone || !password || !confirmPassword) {
          setErrorMsg('Please complete all required fields.');
          setIsLoading(false);
          return;
        }

        if (!isValidEmail(cleanEmail)) {
          setErrorMsg(getEmailValidationError(email) || 'Please enter a valid email address (e.g. commuter@example.com).');
          setIsLoading(false);
          return;
        }

        if (!/^\+?\d{10,13}$/.test(cleanPhone)) {
          setErrorMsg('Phone number must be a valid 10 to 12 digit mobile number.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters in length.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Password and confirmation password do not match.');
          setIsLoading(false);
          return;
        }

        // --- A. PASSENGER PUBLIC REGISTRATION (INSTANT ACCESS WITHOUT EMAIL CONFIRMATION) ---
        if (selectedRegisterRole === 'passenger') {
          const res = await register(cleanName, cleanEmail, 'passenger', password, cleanPhone);
          if (!res.success) {
            setErrorMsg(res.message || 'Registration failed. Please check details.');
            setIsLoading(false);
            return;
          }

          // Automatic instant sign-in attempt
          const autoLogin = await login(cleanEmail, password, 'passenger');
          if (autoLogin.success) {
            onSuccess('passenger');
            return;
          }

          setSuccessMsg('Account registered successfully! You can now sign in immediately with your email and password.');
          setIsLoading(false);
          return;
        }

        // --- B. DUTY STAFF REGISTRATION REQUEST ---
        if (selectedRegisterRole === 'staff') {
          const res = await registerStaffRequest(
            cleanName,
            cleanEmail,
            cleanPhone,
            department,
            designation,
            stationCode,
            password
          );

          if (!res.success) {
            setErrorMsg(res.message || 'Staff registration request could not be processed.');
            setIsLoading(false);
            return;
          }

          setSuccessMsg(res.message || 'Your Duty Staff registration request has been submitted for Railway Administration review.');
          setIsLoading(false);
          return;
        }

        // --- C. ADMIN REGISTRATION WITH SECURITY PIN SETUP ---
        if (selectedRegisterRole === 'admin') {
          const cleanPin = adminPin.trim();
          const cleanConfirmPin = confirmAdminPin.trim();

          if (!cleanPin) {
            setErrorMsg('Please create your private Administrator Security PIN.');
            setIsLoading(false);
            return;
          }

          if (cleanPin.length < 4 || cleanPin.length > 8 || !/^\d+$/.test(cleanPin)) {
            setErrorMsg('Security PIN must be between 4 and 8 numeric digits.');
            setIsLoading(false);
            return;
          }

          if (cleanPin !== cleanConfirmPin) {
            setErrorMsg('Security PIN and confirmation PIN do not match.');
            setIsLoading(false);
            return;
          }

          const res = await registerAdmin(
            cleanName,
            cleanEmail,
            cleanPhone,
            password,
            cleanPin
          );

          if (!res.success) {
            setErrorMsg(res.message || 'Admin registration could not be completed.');
            setIsLoading(false);
            return;
          }

          setSuccessMsg(res.message || 'Central Administrator account configured successfully with private Security PIN.');
          setIsLoading(false);
          return;
        }
      }

      // 4. THREE SEPARATE ROLE-BASED LOGIN OPTIONS
      if (mode === 'login') {
        
        // --- A. ADMIN LOGIN (EMAIL + PASSWORD + HIDDEN SECURITY PIN) ---
        if (selectedLoginRole === 'admin') {
          const cleanEmail = normalizeEmail(email);
          const cleanPin = adminPin.trim();

          if (!cleanEmail || !password) {
            setErrorMsg('Please enter Administrator Email and Password.');
            setIsLoading(false);
            return;
          }

          if (!isValidEmail(cleanEmail)) {
            setErrorMsg(getEmailValidationError(email) || 'Please enter a valid administrator email address.');
            setIsLoading(false);
            return;
          }

          if (!cleanPin) {
            setErrorMsg('Invalid Security PIN. Please try again.');
            setIsLoading(false);
            return;
          }

          // Multi-factor verification: email + password + server-side PIN verifier
          const res = await adminLogin(cleanPin, cleanEmail, password);
          if (!res.success) {
            setErrorMsg(res.message || 'Invalid Security PIN. Please try again.');
            setIsLoading(false);
            return;
          }

          // All three checks succeeded: open complete Admin Dashboard
          onSuccess('admin');
          return;
        }

        // --- B. DUTY STAFF LOGIN ---
        if (selectedLoginRole === 'staff') {
          const cleanEmail = normalizeEmail(email);
          if (!cleanEmail || !password) {
            setErrorMsg('Please enter your official Staff Email ID and Password.');
            setIsLoading(false);
            return;
          }

          if (!isValidEmail(cleanEmail)) {
            setErrorMsg(getEmailValidationError(email) || 'Please enter a valid staff email address.');
            setIsLoading(false);
            return;
          }

          const res = await login(cleanEmail, password, 'staff');
          if (!res.success) {
            setErrorMsg(res.message || 'Invalid Staff credentials. Please check your credentials or contact Central Command.');
            setIsLoading(false);
            return;
          }

          if (res.role !== 'staff' && res.role !== 'admin') {
            setErrorMsg('Access Denied: This account does not possess Railway Staff clearance.');
            setIsLoading(false);
            return;
          }

          onSuccess(res.role || 'staff');
          return;
        }

        // --- C. PASSENGER LOGIN ---
        if (selectedLoginRole === 'passenger') {
          const cleanEmail = normalizeEmail(email);
          if (!cleanEmail || !password) {
            setErrorMsg('Please enter your registered email address and password.');
            setIsLoading(false);
            return;
          }

          if (!isValidEmail(cleanEmail)) {
            setErrorMsg(getEmailValidationError(email) || 'Please enter a valid registered email address.');
            setIsLoading(false);
            return;
          }

          const res = await login(cleanEmail, password, 'passenger');
          if (!res.success) {
            setErrorMsg(res.message || 'Invalid email or password. Please verify your credentials or register.');
            setIsLoading(false);
            return;
          }

          onSuccess(res.role || 'passenger');
          return;
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication service encountered an unexpected error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[72vh] flex items-center justify-center py-8 px-4 font-sans">
      <div className="w-full max-w-lg gov-card border-t-4 border-t-[#003366] dark:border-t-blue-600 p-6 sm:p-8 space-y-5 shadow-lg">
        
        {/* Official Indian Railways Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img 
              src={indianRailwaysLogo} 
              alt="Indian Railways Official Emblem" 
              className="w-16 h-16 object-contain drop-shadow-md hover:scale-105 transition-transform" 
            />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Indian Railways Information Portal &bull; Access Desk
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#002244] dark:text-blue-300 tracking-tight">
            {mode === 'login' ? 'Official Portal Authentication' :
             mode === 'register' ? 'Official Account Registration Desk' :
             mode === 'reset' ? 'Set New Account Password' :
             'Password Recovery Assistance'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {mode === 'login' ? 'Select your authorized portal desk below to continue.' :
             mode === 'register' ? 'Choose your registration category below to initiate account creation.' :
             mode === 'reset' ? 'Choose a new secure password for your account (minimum 6 characters).' :
             'Enter your registered email address to receive secure recovery instructions.'}
          </p>
        </div>

        {/* ======================================================== */}
        {/* 1. LOGIN PAGE – THREE SEPARATE ROLE OPTIONS              */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-center">
              Select Authorized Portal Desk:
            </span>
            <div className="grid grid-cols-3 gap-2">
              
              {/* Option 1: ADMIN */}
              <button
                type="button"
                onClick={() => handleSelectLoginRole('admin')}
                className={`p-2.5 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  selectedLoginRole === 'admin'
                    ? 'bg-[#002244] text-white border-[#002244] shadow-sm ring-2 ring-purple-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${selectedLoginRole === 'admin' ? 'text-purple-300' : 'text-purple-600 dark:text-purple-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">ADMIN</span>
                <span className={`text-[9px] font-semibold ${selectedLoginRole === 'admin' ? 'text-purple-200' : 'text-slate-500'}`}>
                  Central Control
                </span>
              </button>

              {/* Option 2: DUTY STAFF */}
              <button
                type="button"
                onClick={() => handleSelectLoginRole('staff')}
                className={`p-2.5 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  selectedLoginRole === 'staff'
                    ? 'bg-[#003366] text-white border-[#003366] shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${selectedLoginRole === 'staff' ? 'text-emerald-300' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">DUTY STAFF</span>
                <span className={`text-[9px] font-semibold ${selectedLoginRole === 'staff' ? 'text-blue-200' : 'text-slate-500'}`}>
                  Station &amp; Field
                </span>
              </button>

              {/* Option 3: PASSENGER */}
              <button
                type="button"
                onClick={() => handleSelectLoginRole('passenger')}
                className={`p-2.5 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  selectedLoginRole === 'passenger'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <User className={`w-5 h-5 ${selectedLoginRole === 'passenger' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">PASSENGER</span>
                <span className={`text-[9px] font-semibold ${selectedLoginRole === 'passenger' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Public Commuter
                </span>
              </button>

            </div>

            {/* Context Banner */}
            <div className={`p-2 rounded-xs border text-[11px] flex items-center justify-between ${
              selectedLoginRole === 'admin'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200'
                : selectedLoginRole === 'staff'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            }`}>
              <span className="font-bold flex items-center gap-1.5">
                {selectedLoginRole === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />}
                {selectedLoginRole === 'staff' && <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                {selectedLoginRole === 'passenger' && <User className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                <span>
                  {selectedLoginRole === 'admin' ? 'Central Traffic Control Desk' :
                   selectedLoginRole === 'staff' ? 'Station Master & Telemetry Field Desk' :
                   'Passenger Crowd & Weight Enquiry Desk'}
                </span>
              </span>
              <span className="text-[10px] font-mono uppercase font-semibold">
                {selectedLoginRole === 'admin' ? 'CTC Protected Desk' : selectedLoginRole === 'staff' ? 'Duty Staff Access' : 'Public Access'}
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. REGISTRATION PAGE – THREE SEPARATE ROLE OPTIONS       */}
        {/* ======================================================== */}
        {mode === 'register' && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-center">
              Select Registration Category:
            </span>
            <div className="grid grid-cols-3 gap-2">
              
              {/* Option 1: PASSENGER REGISTRATION */}
              <button
                type="button"
                onClick={() => handleSelectRegisterRole('passenger')}
                className={`p-2.5 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  selectedRegisterRole === 'passenger'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <User className={`w-5 h-5 ${selectedRegisterRole === 'passenger' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">PASSENGER</span>
                <span className={`text-[9px] font-semibold ${selectedRegisterRole === 'passenger' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Instant Access
                </span>
              </button>

              {/* Option 2: DUTY STAFF REGISTRATION */}
              <button
                type="button"
                onClick={() => handleSelectRegisterRole('staff')}
                className={`p-2.5 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  selectedRegisterRole === 'staff'
                    ? 'bg-[#003366] text-white border-[#003366] shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${selectedRegisterRole === 'staff' ? 'text-emerald-300' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">DUTY STAFF</span>
                <span className={`text-[9px] font-semibold ${selectedRegisterRole === 'staff' ? 'text-blue-200' : 'text-slate-500'}`}>
                  Admin Approval
                </span>
              </button>

              {/* Option 3: ADMIN REGISTRATION */}
              <button
                type="button"
                onClick={() => handleSelectRegisterRole('admin')}
                className={`p-2.5 rounded-sm border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  selectedRegisterRole === 'admin'
                    ? 'bg-[#002244] text-white border-[#002244] shadow-sm ring-2 ring-purple-400/40'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${selectedRegisterRole === 'admin' ? 'text-purple-300' : 'text-purple-600 dark:text-purple-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">ADMIN</span>
                <span className={`text-[9px] font-semibold ${selectedRegisterRole === 'admin' ? 'text-purple-200' : 'text-slate-500'}`}>
                  PIN Setup
                </span>
              </button>

            </div>

            {/* Context Banner */}
            <div className={`p-2 rounded-xs border text-[11px] flex items-center justify-between ${
              selectedRegisterRole === 'admin'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200'
                : selectedRegisterRole === 'staff'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            }`}>
              <span className="font-bold flex items-center gap-1.5">
                {selectedRegisterRole === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />}
                {selectedRegisterRole === 'staff' && <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />}
                {selectedRegisterRole === 'passenger' && <User className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                <span>
                  {selectedRegisterRole === 'admin' ? 'Administrator Setup with Security PIN' :
                   selectedRegisterRole === 'staff' ? 'Duty Staff Field Account Registration' :
                   'Public Commuter Instant Registration'}
                </span>
              </span>
              <span className="text-[10px] font-mono uppercase font-semibold">
                {selectedRegisterRole === 'admin' ? 'Single Admin Rule' : selectedRegisterRole === 'staff' ? 'Pending Approval' : 'No Email Verify Req'}
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-l-4 border-rose-700 dark:border-rose-600 text-rose-900 dark:text-rose-200 border-r border-t border-b border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 border-r border-t border-b border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            {mode === 'reset' && (
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 text-white font-bold rounded-sm text-xs cursor-pointer transition text-center"
              >
                Sign In with New Password &rarr;
              </button>
            )}
            {mode === 'register' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLoginRole(selectedRegisterRole);
                  setErrorMsg('');
                  setSuccessMsg('');
                  setPassword('');
                  setConfirmPassword('');
                  setAdminPin('');
                  setConfirmAdminPin('');
                  onNavigate('login');
                }}
                className={`w-full py-2 text-white font-bold rounded-sm text-xs cursor-pointer transition text-center flex items-center justify-center gap-1.5 shadow-xs ${
                  selectedRegisterRole === 'admin'
                    ? 'bg-purple-700 hover:bg-purple-800'
                    : selectedRegisterRole === 'passenger'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#003366] hover:bg-[#002244]'
                }`}
              >
                <span>Proceed to {selectedRegisterRole === 'admin' ? 'Admin Dashboard Sign In' : selectedRegisterRole === 'staff' ? 'Duty Staff Sign In' : 'Passenger Sign In'} &rarr;</span>
              </button>
            )}
          </div>
        )}

        {/* Reset Confirmation */}
        {submittedReset ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-3 text-center">
            <CheckCircle className="w-7 h-7 text-emerald-700 dark:text-emerald-400 mx-auto" />
            <p className="font-bold text-sm">Recovery Request Processed</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If an account exists for <strong className="font-mono">{email}</strong>, secure recovery instructions have been dispatched.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setSubmittedReset(false);
                  onNavigate('reset-password');
                }}
                className="px-3 py-2 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 text-white font-bold rounded-sm text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Enter Reset Token / Set Password</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedReset(false);
                  onNavigate('login');
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : !successMsg || mode !== 'reset' ? (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            {/* ======================================================== */}
            {/* REGISTRATION FORMS                                       */}
            {/* ======================================================== */}
            {mode === 'register' && (
              <>
                {/* 1. PASSENGER REGISTRATION FORM (IMMEDIATE ACCESS WITHOUT EMAIL VERIFICATION) */}
                {selectedRegisterRole === 'passenger' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-sans"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="commuter@example.com"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number (10 Digits) *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password * (minimum 6 characters)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-600 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-600 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] rounded-xs flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>Instant Access: Email verification is not required. You can immediately access your passenger crowd and coach occupancy dashboard.</span>
                    </div>
                  </>
                )}

                {/* 2. DUTY STAFF REGISTRATION REQUEST FORM */}
                {selectedRegisterRole === 'staff' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Staff Personnel Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Suresh Patil"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#003366]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Official Staff Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="suresh.patil@railway.gov.in"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#003366] font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number (10 Digits) *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#003366] font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Department *
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-2 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#003366]"
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Designation *
                        </label>
                        <select
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full px-2 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#003366]"
                        >
                          {DESIGNATIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Station / Division Code *
                      </label>
                      <select
                        value={stationCode}
                        onChange={(e) => setStationCode(e.target.value)}
                        className="w-full px-2 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#003366]"
                      >
                        {STATIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password * (minimum 6 characters)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px] rounded-xs flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span>Administrative Clearance Protocol: Duty Staff registration requests remain in 'Pending' status until approved by the Railway Central Administrator.</span>
                    </div>
                  </>
                )}

                {/* 3. ADMIN REGISTRATION WITH SECURITY PIN SETUP */}
                {selectedRegisterRole === 'admin' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Officer Name"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-sans"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="officer@railway.gov.in"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number (10 Digits) *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password * (minimum 6 characters)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* CREATE SECURITY PIN (HIDDEN MASKED INPUT) */}
                    <div>
                      <label className="block font-bold text-purple-900 dark:text-purple-200 mb-1">
                        Create Security PIN * (4-8 Numeric Digits)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-purple-700 dark:text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPin ? 'text' : 'password'}
                          maxLength={8}
                          value={adminPin}
                          onChange={(e) => setAdminPin(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-950 dark:text-purple-100 font-mono tracking-widest text-sm focus:outline-none focus:border-purple-600"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM SECURITY PIN (HIDDEN MASKED INPUT) */}
                    <div>
                      <label className="block font-bold text-purple-900 dark:text-purple-200 mb-1">
                        Confirm Security PIN *
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-purple-700 dark:text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPin ? 'text' : 'password'}
                          maxLength={8}
                          value={confirmAdminPin}
                          onChange={(e) => setConfirmAdminPin(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-950 dark:text-purple-100 font-mono tracking-widest text-sm focus:outline-none focus:border-purple-600"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-[11px] rounded-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Shield className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 shrink-0" />
                        <span>Cryptographically Salted &amp; Hashed PIN Protection</span>
                      </div>
                      <p className="text-[10px] text-purple-800 dark:text-purple-300 leading-relaxed">
                        Security Notice: Your private Security PIN is stored only as a protected cryptographic verifier, never in plaintext. Strict Single Active Administrator policy applies.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* LOGIN FORMS (SEPARATE FOR EACH ROLE)                     */}
            {/* ======================================================== */}
            {mode === 'login' && (
              <>
                {/* 1. ADMIN LOGIN FORM: EMAIL, PASSWORD & HIDDEN SECURITY PIN */}
                {selectedLoginRole === 'admin' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Registered Admin Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@railway.gov.in"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Admin Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 text-xs font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* HIDDEN SECURITY PIN INPUT */}
                    <div>
                      <label className="block font-bold text-purple-900 dark:text-purple-200 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                          <span>Security PIN *</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold rounded-xs">
                          2FA Protected
                        </span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          maxLength={8}
                          value={adminPin}
                          onChange={(e) => setAdminPin(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-950 dark:text-purple-100 font-mono tracking-widest text-sm focus:outline-none focus:border-purple-600"
                        />
                      </div>
                      <p className="text-[10px] text-purple-800 dark:text-purple-300 leading-relaxed mt-1">
                        Multi-factor verification: All three credentials (Email, Password, and Security PIN) must verify before console access is granted.
                      </p>
                    </div>
                  </>
                )}

                {/* 2. DUTY STAFF LOGIN FORM */}
                {selectedLoginRole === 'staff' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Individual Staff Official Email ID *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. suresh.patil@railway.gov.in"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Staff Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => onNavigate('forgot-password')}
                          className="text-[11px] text-[#003366] dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot Staff Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px] rounded-xs flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                      <span>Individual Accountability: Each staff member operates an independent profile and sees only their own assigned field tasks and station work orders.</span>
                    </div>
                  </>
                )}

                {/* 3. PASSENGER LOGIN FORM */}
                {selectedLoginRole === 'passenger' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Registered Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="commuter@example.com"
                          className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-600 font-mono text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => onNavigate('forgot-password')}
                          className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-600 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded-xs border-slate-300 text-amber-600 focus:ring-amber-600"
                        />
                        <span>Remember this device</span>
                      </label>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* FORGOT / RESET PASSWORD FORMS                            */}
            {/* ======================================================== */}
            {mode === 'forgot' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono text-xs"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter your registered Passenger or Staff email to receive secure recovery instructions.
                </p>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password * (minimum 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 font-bold text-white rounded-sm transition flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-50 cursor-pointer tracking-wide ${
                mode === 'login' && selectedLoginRole === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700'
                  : mode === 'login' && selectedLoginRole === 'passenger'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : mode === 'register' && selectedRegisterRole === 'passenger'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : mode === 'register' && selectedRegisterRole === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700'
                  : 'bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && selectedLoginRole === 'admin'
                      ? 'Sign In to Admin Dashboard'
                      : mode === 'login' && selectedLoginRole === 'staff'
                      ? 'Sign In to Duty Staff Desk'
                      : mode === 'login' && selectedLoginRole === 'passenger'
                      ? 'Sign In to Passenger Portal'
                      : mode === 'register' && selectedRegisterRole === 'passenger'
                      ? 'Complete Passenger Registration'
                      : mode === 'register' && selectedRegisterRole === 'staff'
                      ? 'Submit Duty Staff Registration Request'
                      : mode === 'register' && selectedRegisterRole === 'admin'
                      ? 'Complete Admin Registration & Save PIN'
                      : mode === 'reset'
                      ? 'Confirm & Save New Password'
                      : 'Send Password Reset Instructions'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : null}

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
          
          {/* Under Login Forms: Links to Registration */}
          {mode === 'login' && selectedLoginRole === 'passenger' && (
            <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-sm">
              <span className="text-slate-700 dark:text-slate-300">New passenger commuter? </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegisterRole('passenger');
                  onNavigate('register');
                }}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
              >
                <span>Register New Passenger Account</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {mode === 'login' && selectedLoginRole === 'staff' && (
            <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-sm flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 text-[11px]">New field staff member?</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegisterRole('staff');
                  onNavigate('register');
                }}
                className="font-bold text-[#003366] dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 text-[11px]"
              >
                <span>Submit Staff Registration Request</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {mode === 'login' && selectedLoginRole === 'admin' && (
            <div className="p-2.5 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-sm flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 text-[11px]">Authorized officer setup?</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegisterRole('admin');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setPassword('');
                  setConfirmPassword('');
                  setAdminPin('');
                  setConfirmAdminPin('');
                  onNavigate('register');
                }}
                className="font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer inline-flex items-center gap-1 text-[11px]"
              >
                <span>Admin Registration &amp; PIN Setup</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Under Registration Forms: Return to Login */}
          {mode === 'register' && (
            <p>
              Already registered or hold active credentials?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-[#003366] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Sign In to existing account
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <p>
              Remembered your credentials?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-[#003366] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Return to Role Selection
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
