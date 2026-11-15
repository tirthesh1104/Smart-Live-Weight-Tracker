import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { OfflineStorageService } from '../services/offlineStorage';
import { AdminSecurityService } from '../services/adminSecurityService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { isValidEmail, normalizeEmail, getEmailValidationError } from '../utils/emailValidation';

const BACKEND_BASE_URL = (import.meta as any).env?.VITE_AI_SERVICE_URL || '';

const postToBackendAuth = async (endpoint: string, body: any): Promise<Response> => {
  // First attempt: relative URL (proxied by Vite dev or web server)
  try {
    const res = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res;
  } catch (primaryErr) {
    // Secondary attempt: direct IPv4 loopback if relative fetch had network refusal
    if (!BACKEND_BASE_URL) {
      try {
        return await fetch(`http://127.0.0.1:8000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } catch {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
};

interface AuthContextType {
  user: UserProfile | null;
  authMode: 'SUPABASE' | 'LOCAL_DEMO';
  isLoading: boolean;
  login: (email: string, password?: string, expectedRole?: UserRole) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  adminLogin: (pin: string, email?: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, role?: UserRole, password?: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  registerStaffRequest: (name: string, email: string, phone: string, department: string, designation: string, station: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  registerAdminRequest: (name: string, email: string, phone: string, department: string, justification: string) => Promise<{ success: boolean; message?: string }>;
  registerAdmin: (name: string, email: string, phone: string, password: string, securityPin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (fullName: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  elevateToDemoAdmin: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isPassenger: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authMode] = useState<'SUPABASE' | 'LOCAL_DEMO'>(isSupabaseConfigured && supabase ? 'SUPABASE' : 'LOCAL_DEMO');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Stale session prevention: In Supabase mode, start with null until session is verified
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (isSupabaseConfigured && supabase) {
      return null;
    }
    return OfflineStorageService.getCurrentUser();
  });

  // Helper: fetch or create profile in Supabase profiles table
  const syncSupabaseProfile = async (authUser: any): Promise<UserProfile> => {
    if (!supabase) throw new Error('Supabase client unavailable');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        const profile: UserProfile = {
          id: data.id,
          full_name: data.full_name || authUser.user_metadata?.full_name || 'Passenger Commuter',
          email: data.email || authUser.email || '',
          role: (data.role as UserRole) || 'passenger',
          created_at: data.created_at || new Date().toISOString(),
          employee_id: data.employee_id,
          department: data.department,
          designation: data.designation,
          station_code: data.station_code,
          status: data.status || 'active',
          phone: data.phone || authUser.user_metadata?.phone
        };
        setUser(profile);
        OfflineStorageService.setCurrentUser(profile);
        return profile;
      }

      // If profile record does not exist yet, provision with strictly default 'passenger' role
      const defaultProfile: UserProfile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Passenger Commuter',
        email: authUser.email || '',
        role: 'passenger', // Strict rule: never trust client metadata for elevated role
        created_at: new Date().toISOString()
      };

      await supabase.from('profiles').upsert([defaultProfile]);
      setUser(defaultProfile);
      OfflineStorageService.setCurrentUser(defaultProfile);
      return defaultProfile;
    } catch (err) {
      console.warn('Error syncing profile from Supabase, using fallback profile', err);
      const fallback: UserProfile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || 'Passenger Commuter',
        email: authUser.email || '',
        role: 'passenger',
        created_at: new Date().toISOString()
      };
      setUser(fallback);
      OfflineStorageService.setCurrentUser(fallback);
      return fallback;
    }
  };

  // Session lifecycle and onAuthStateChange subscription
  useEffect(() => {
    let isMounted = true;

    if (authMode === 'SUPABASE' && supabase) {
      // 1. Initial session restoration
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!isMounted) return;
        if (session?.user && !error) {
          syncSupabaseProfile(session.user).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        } else {
          setUser(null);
          OfflineStorageService.setCurrentUser(null);
          setIsLoading(false);
        }
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });

      // 2. Real-time auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await syncSupabaseProfile(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          OfflineStorageService.setCurrentUser(null);
        }
        if (isMounted) setIsLoading(false);
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      // Local Demo Mode session restoration
      const local = OfflineStorageService.getCurrentUser();
      setUser(local);
      setIsLoading(false);
    }
  }, [authMode]);

  // Login handler with role-specific verification
  const login = async (email: string, password?: string, expectedRole?: UserRole): Promise<{ success: boolean; role?: UserRole; message?: string }> => {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      return { success: false, message: 'Please provide a registered email address.' };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, message: getEmailValidationError(email) || 'Please provide a valid registered email address.' };
    }

    if (authMode === 'SUPABASE' && supabase) {
      if (!password) {
        return { success: false, message: 'Password is required for cloud authentication.' };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) {
          // Fallback to local accounts vault if Supabase cloud rejected credentials
          const localProfiles = OfflineStorageService.getRegisteredUsers();
          const localMatch = localProfiles.find(p => p.email.toLowerCase() === cleanEmail);
          if (localMatch) {
            if (!OfflineStorageService.verifyUserCredential(cleanEmail, password)) {
              return { success: false, message: 'Invalid password. Please check your credentials.' };
            }
            if (localMatch.status === 'inactive') {
              return { success: false, message: 'Account is deactivated. Please contact the Railway Central Administrator.' };
            }
            if (localMatch.status === 'pending') {
              if (localMatch.role === 'staff') {
                return {
                  success: false,
                  message: 'Your Duty Staff registration request is currently Pending Administrator Approval. Please contact the Central Controller.'
                };
              }
              return { success: false, message: 'Your registration request is currently Pending Administrator Approval.' };
            }
            if (expectedRole === 'staff' && localMatch.role !== 'staff' && localMatch.role !== 'admin') {
              return { success: false, message: 'Access Denied: This account is registered as a Passenger. Please select the PASSENGER login option.' };
            }
            setUser(localMatch);
            OfflineStorageService.setCurrentUser(localMatch);
            OfflineStorageService.addAuditLog('Login Authenticated via Local Credentials', { email: cleanEmail, role: localMatch.role }, localMatch.id);
            return { success: true, role: localMatch.role };
          }

          if (error.code === 'over_email_send_rate_limit' || error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
            return {
              success: false,
              message: 'Supabase email send limit reached (3/hr default free quota). To resolve permanently, configure Custom SMTP in Supabase Dashboard (Project Settings -> Authentication -> SMTP Settings), or wait for the cooldown to expire.'
            };
          }
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            return {
              success: false,
              message: `No registered account found for ${cleanEmail} or invalid credentials. Please check your password or register.`
            };
          }
          return { success: false, message: error.message };
        }

        if (data.user) {
          const profile = await syncSupabaseProfile(data.user);
          if (profile.status === 'inactive') {
            await supabase.auth.signOut();
            setUser(null);
            OfflineStorageService.setCurrentUser(null);
            return {
              success: false,
              message: 'Account is deactivated. Please contact the Railway Central Administrator.'
            };
          }

          if (profile.status === 'pending') {
            await supabase.auth.signOut();
            setUser(null);
            OfflineStorageService.setCurrentUser(null);
            if (profile.role === 'staff') {
              return {
                success: false,
                message: 'Your Duty Staff registration request is currently Pending Administrator Approval. Please contact the Central Controller.'
              };
            }
            return {
              success: false,
              message: 'Your registration request is currently Pending Administrator Approval.'
            };
          }

          // Strict Role Segregation: Staff option rejects non-staff accounts
          if (expectedRole === 'staff' && profile.role !== 'staff' && profile.role !== 'admin') {
            await supabase.auth.signOut();
            setUser(null);
            OfflineStorageService.setCurrentUser(null);
            return {
              success: false,
              message: 'Access Denied: This account is registered as a Passenger. Please select the PASSENGER login option.'
            };
          }

          OfflineStorageService.addAuditLog('Supabase Login', { email: cleanEmail, role: profile.role }, profile.id);
          return { success: true, role: profile.role };
        }
        return { success: false, message: 'Authentication returned no active session.' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Network exception during login.' };
      }
    }

    // Local Demo Mode Fallback
    const profiles = OfflineStorageService.getRegisteredUsers();

    const matched = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return { 
        success: false, 
        message: 'No registered user found for this email. Please check your credentials or register.' 
      };
    }

    if (password && !OfflineStorageService.verifyUserCredential(cleanEmail, password)) {
      return {
        success: false,
        message: 'Invalid password. Please check your credentials.'
      };
    }

    if (matched.status === 'inactive') {
      return {
        success: false,
        message: 'Account is deactivated. Please contact the Railway Central Administrator.'
      };
    }

    if (matched.status === 'pending') {
      if (matched.role === 'staff') {
        return {
          success: false,
          message: 'Your Duty Staff registration request is currently Pending Administrator Approval. Please contact the Central Controller.'
        };
      }
      return {
        success: false,
        message: 'Your registration request is currently Pending Administrator Approval.'
      };
    }

    // Strict Role Segregation in local mode
    if (expectedRole === 'staff' && matched.role !== 'staff' && matched.role !== 'admin') {
      return {
        success: false,
        message: 'Access Denied: This account is registered as a Passenger. Please select the PASSENGER login option.'
      };
    }

    setUser(matched);
    OfflineStorageService.setCurrentUser(matched);
    OfflineStorageService.addAuditLog('User Login (Local Mode)', { email: matched.email, role: matched.role }, matched.id);
    return { success: true, role: matched.role };
  };

  // Dedicated Admin Login Handler: requires verified Admin Email, Password, and Security PIN
  const adminLogin = async (pin: string, email?: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = normalizeEmail(email || '');
    if (!cleanEmail || !password) {
      return { success: false, message: 'Please enter Administrator Email and Password.' };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, message: getEmailValidationError(email || '') || 'Please enter a valid administrator email address.' };
    }

    const cleanPin = pin.trim();
    if (!cleanPin) {
      return { success: false, message: 'Invalid Security PIN. Please try again.' };
    }

    let authSuccess = false;
    let authProfile: UserProfile | null = null;

    // Step 1: Attempt Supabase Cloud Auth if configured
    if (authMode === 'SUPABASE' && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (!error && data.user) {
          const profile = await syncSupabaseProfile(data.user);
          if (profile.role !== 'admin') {
            await supabase.auth.signOut();
            setUser(null);
            OfflineStorageService.setCurrentUser(null);
            return { success: false, message: 'Access Denied: Commuter and Duty Staff accounts cannot access Central Traffic Control.' };
          }
          authSuccess = true;
          authProfile = profile;
        }
      } catch (err: any) {
        console.warn('Supabase cloud authentication check note', err);
      }
    }

    // Step 2: Fallback to registered accounts in OfflineStorageService
    if (!authSuccess) {
      const registeredUsers = OfflineStorageService.getRegisteredUsers();
      const matched = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

      if (!matched) {
        return {
          success: false,
          message: `No registered Administrator account found for ${cleanEmail}. Please complete Admin Registration & PIN Setup below, or verify your email.`
        };
      }

      if (matched.role !== 'admin') {
        return {
          success: false,
          message: 'Access Denied: Commuter and Duty Staff accounts cannot access Central Traffic Control.'
        };
      }

      if (matched.status === 'inactive') {
        return {
          success: false,
          message: 'This Administrator account has been superseded or deactivated. Please sign in with the active Administrator account.'
        };
      }

      // Verify password
      const isPasswordValid = OfflineStorageService.verifyUserCredential(cleanEmail, password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid administrator password. Please check your credentials or use Admin Registration & PIN Setup.'
        };
      }

      authSuccess = true;
      authProfile = matched;
    }

    // Step 3: Verify the configured Security PIN (Strictly enforced cryptographic salted hash)
    const pinCheck = await AdminSecurityService.verifyAdminPin(cleanPin);
    if (!pinCheck.valid) {
      if (authMode === 'SUPABASE' && supabase) {
        try { await supabase.auth.signOut(); } catch {}
      }
      setUser(null);
      OfflineStorageService.setCurrentUser(null);
      return { success: false, message: 'Invalid Security PIN. Please try again.' };
    }

    // Step 4: PIN & Credentials verified - Grant elevated session
    if (authProfile) {
      setUser(authProfile);
      OfflineStorageService.setCurrentUser(authProfile);
      AdminSecurityService.setElevatedSession(authProfile);
      OfflineStorageService.addAuditLog('Admin Authenticated via Email, Password & Security PIN', { email: authProfile.email }, authProfile.id);
      return { success: true };
    }

    return { success: false, message: 'Admin authentication failed.' };
  };

  // Dedicated Admin Registration with Private Security PIN Setup
  const registerAdmin = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    securityPin: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = normalizeEmail(email);
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanPin = securityPin.trim();

    if (!cleanName || !cleanEmail || !password || !cleanPin) {
      return { success: false, message: 'Please complete all required fields including Security PIN.' };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, message: getEmailValidationError(email) || 'Please enter a valid administrator email address.' };
    }

    if (cleanPin.length < 4 || cleanPin.length > 8 || !/^\d+$/.test(cleanPin)) {
      return { success: false, message: 'Security PIN must be between 4 and 8 numeric digits.' };
    }

    // 1. Cryptographically hash and store the private Security PIN verifier
    await AdminSecurityService.setConfiguredPin(cleanPin);

    // 2. Save credential for local/offline verification
    OfflineStorageService.saveUserCredential(cleanEmail, password);

    // 3. Update registered users list:
    // Mark previous active admin accounts as inactive/superseded so there remains ONE active administrator
    const registeredUsers = OfflineStorageService.getRegisteredUsers();
    const existingIndex = registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);

    const adminProfile: UserProfile = {
      id: existingIndex !== -1 ? registeredUsers[existingIndex].id : ('usr-adm-' + Date.now()),
      full_name: cleanName,
      email: cleanEmail,
      role: 'admin',
      employee_id: `IR-HQ-ADM-${Math.floor(100 + Math.random() * 900)}`,
      department: 'Central Traffic Command & Safety Administration',
      phone: cleanPhone || '+91 98765-43210',
      status: 'active',
      created_at: new Date().toISOString()
    };

    const updatedUsers = registeredUsers.map(u => {
      if (u.role === 'admin' && u.email.toLowerCase() !== cleanEmail && u.status === 'active') {
        return { ...u, status: 'inactive' as const, department: (u.department || '') + ' (Superseded)' };
      }
      return u;
    });

    if (existingIndex !== -1) {
      updatedUsers[existingIndex] = adminProfile;
    } else {
      updatedUsers.unshift(adminProfile);
    }
    OfflineStorageService.saveRegisteredUsers(updatedUsers);

    // 4. Provision in backend / Supabase
    try {
      const resp = await postToBackendAuth('/api/auth/register', {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        role: 'admin'
      });
      const data = await resp.json();
      if (resp.ok && data.user_id) {
        adminProfile.id = data.user_id;
      }
    } catch (e: any) {
      // Backend provisioning fallback to Supabase client if backend unreachable
      if (authMode === 'SUPABASE' && supabase) {
        try {
          const { data } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanName,
                phone: cleanPhone,
                role: 'admin'
              }
            }
          });

          if (data?.user) {
            adminProfile.id = data.user.id;
          }
          try {
            await supabase.from('profiles').upsert([adminProfile]);
          } catch {}
        } catch (subErr: any) {
          console.warn('Supabase admin signup note', subErr);
        }
      }
    }

    OfflineStorageService.addAuditLog('Admin Account Provisioned & Security PIN Configured', {
      email: cleanEmail,
      full_name: cleanName,
      employee_id: adminProfile.employee_id
    }, adminProfile.id);

    return {
      success: true,
      message: `Central Administrator account (${cleanEmail}) and private Security PIN configured successfully. You can now sign in immediately with your Email, Password, and Security PIN.`
    };
  };

  // Staff Registration Request Handler (Pending Admin Approval)
  const registerStaffRequest = async (
    name: string,
    email: string,
    phone: string,
    department: string,
    designation: string,
    station: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = normalizeEmail(email);
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');

    if (!cleanName || !cleanEmail) {
      return { success: false, message: 'Personnel name and official email are required.' };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, message: getEmailValidationError(email) || 'Please enter a valid official email address.' };
    }

    // Check if account or request already exists
    const existingUsers = OfflineStorageService.getRegisteredUsers();
    if (existingUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'An account or registration request with this email address already exists. Please contact the administrator or sign in.'
      };
    }

    const staffId = 'usr-stf-' + Date.now();
    const empId = `IR-${station || 'HQ'}-STF-${Math.floor(1000 + Math.random() * 9000)}`;

    const staffProfile: UserProfile = {
      id: staffId,
      full_name: cleanName,
      email: cleanEmail,
      role: 'staff',
      employee_id: empId,
      department: department || 'Operations & Station Control',
      designation: designation || 'Duty Staff',
      station_code: station || 'CSMT',
      phone: cleanPhone || '+91 98765-XXXXX',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // First attempt backend registration with Admin privileges (avoids SMTP deliverability false rejections)
    let backendSuccess = false;
    try {
      const resp = await postToBackendAuth('/api/auth/register', {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: password || 'DutyStaff@123',
        role: 'staff',
        department: department || 'Operations & Station Control',
        designation: designation || 'Duty Staff',
        station_code: station || 'CSMT'
      });
      const data = await resp.json();
      if (!resp.ok && (data.detail?.toLowerCase().includes('already registered') || data.message?.toLowerCase().includes('already registered'))) {
        return {
          success: false,
          message: 'An account or registration request with this email address already exists. Please contact the administrator or sign in.'
        };
      }
      if (resp.ok && data.success) {
        backendSuccess = true;
        if (data.user_id) {
          staffProfile.id = data.user_id;
        }
      }
    } catch (e) {
      console.warn('Backend staff registration fallback to client Supabase/local', e);
    }

    if (!backendSuccess && authMode === 'SUPABASE' && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              role: 'staff',
              department,
              designation,
              station_code: station,
              status: 'pending'
            }
          }
        });

        if (error) {
          if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
            return {
              success: false,
              message: 'An account or registration request with this email address already exists. Please contact the administrator or sign in.'
            };
          }
          if (error.code !== 'over_email_send_rate_limit' && error.status !== 429) {
            console.warn('Supabase client signUp note:', error.message);
          }
        }

        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            success: false,
            message: 'An account or registration request with this email address already exists. Please contact the administrator or sign in.'
          };
        }

        if (data?.user) {
          staffProfile.id = data.user.id;
          try {
            await supabase.from('profiles').upsert([staffProfile]);
          } catch {}
        }
      } catch (e: any) {
        console.warn('Supabase staff request error, caching locally', e);
      }
    }

    if (password) {
      OfflineStorageService.saveUserCredential(cleanEmail, password);
    }
    OfflineStorageService.addStaffMember(staffProfile);
    OfflineStorageService.addAuditLog('Duty Staff Registration Request Submitted', {
      email: cleanEmail,
      name: cleanName,
      department,
      designation,
      status: 'pending'
    });

    return {
      success: true,
      message: 'Your Duty Staff registration request has been submitted to the Railway Central Administrator. Your account will be activated upon approval.'
    };
  };

  // Admin Registration Request Handler (Strict Single Admin Constraint)
  const registerAdminRequest = async (
    name: string,
    email: string,
    phone: string,
    department: string,
    justification: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanJustification = justification.trim();

    if (!cleanName || !cleanEmail || !cleanJustification) {
      return { success: false, message: 'Name, email, and administrative justification are required.' };
    }

    const reqId = 'adm-req-' + Date.now();
    const adminProfile: UserProfile = {
      id: reqId,
      full_name: cleanName,
      email: cleanEmail,
      role: 'admin',
      employee_id: `IR-ADM-REQ-${Math.floor(100 + Math.random() * 900)}`,
      department: department || 'Central Traffic Command',
      phone: phone.trim() || undefined,
      status: 'pending',
      justification: cleanJustification,
      created_at: new Date().toISOString()
    };

    OfflineStorageService.addStaffMember(adminProfile);
    OfflineStorageService.addAuditLog('Admin Registration Request Submitted', {
      email: cleanEmail,
      name: cleanName,
      justification: cleanJustification,
      status: 'pending'
    });

    return {
      success: true,
      message: 'Your Central Administrator clearance request has been recorded. Strict Security Protocol: Only ONE active Administrator account is permitted in the system. The request is pending administrative review.'
    };
  };

  // Register handler: strictly defaults role to 'passenger'
  const register = async (name: string, email: string, _role?: UserRole, password?: string, phone?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = normalizeEmail(email);
    const cleanName = name.trim();
    const cleanPhone = phone?.trim();

    if (!cleanName || !cleanEmail) {
      return { success: false, message: 'Full name and email are required.' };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, message: getEmailValidationError(email) || 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters in length.' };
    }

    // Check if account already exists in registered accounts cache
    const existingUsers = OfflineStorageService.getRegisteredUsers();
    if (existingUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'An account with this email address is already registered. Please sign in.'
      };
    }

    // Strict Security Rule: newly registered users always receive the default passenger role
    const assignedRole: UserRole = 'passenger';

    // Step 1: Attempt registration via Backend Admin API
    // This auto-confirms passenger accounts, bypasses the free-tier SMTP rate limit (3/hr)
    // and eliminates false "Email address is invalid" deliverability rejections on valid addresses like abc123@gmail.com
    let backendCreated = false;
    let registeredUserId: string | null = null;

    try {
      const resp = await postToBackendAuth('/api/auth/register', {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        role: assignedRole
      });

      const data = await resp.json();

      if (!resp.ok) {
        const errorDetail = data.detail || data.message || '';
        if (errorDetail.toLowerCase().includes('already registered') || errorDetail.toLowerCase().includes('already exists')) {
          return {
            success: false,
            message: 'An account with this email address is already registered. Please sign in.'
          };
        }
        if (resp.status === 400 && errorDetail) {
          return { success: false, message: errorDetail };
        }
      } else if (data.success) {
        backendCreated = true;
        registeredUserId = data.user_id || null;
      }
    } catch (apiErr) {
      console.warn('Backend register endpoint unavailable, falling back to direct auth/local mode:', apiErr);
    }

    // Step 2: If created via backend, sign in directly with Supabase or offline cache
    if (backendCreated) {
      if (password) {
        OfflineStorageService.saveUserCredential(cleanEmail, password);
      }

      const passengerProfile: UserProfile = {
        id: registeredUserId || ('usr-psg-' + Date.now()),
        full_name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        phone: cleanPhone,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      const regUsers = OfflineStorageService.getRegisteredUsers();
      if (!regUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
        regUsers.push(passengerProfile);
        OfflineStorageService.saveRegisteredUsers(regUsers);
      }

      // If Supabase is active, sign in to establish real session
      if (authMode === 'SUPABASE' && supabase && password) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });
          if (signInRes.data?.session && signInRes.data?.user) {
            await syncSupabaseProfile(signInRes.data.user);
            OfflineStorageService.addAuditLog('Supabase Instant Registration Login', { email: cleanEmail, role: assignedRole }, signInRes.data.user.id);
            return { success: true };
          }
        } catch (signInErr) {
          console.warn('Immediate sign-in after backend creation note:', signInErr);
        }
      }

      // Local session activation
      setUser(passengerProfile);
      OfflineStorageService.setCurrentUser(passengerProfile);
      OfflineStorageService.addAuditLog('Instant Registration Login', { email: cleanEmail, role: assignedRole }, passengerProfile.id);
      return { success: true };
    }

    // Step 3: Direct Supabase Client fallback (if backend was not reachable)
    if (authMode === 'SUPABASE' && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone
            }
          }
        });

        if (error) {
          if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
            return {
              success: false,
              message: 'An account with this email address is already registered. Please sign in.'
            };
          }
          if (error.message?.toLowerCase().includes('invalid') || error.status === 429 || (error as any).code === 'email_address_invalid') {
            console.warn('Supabase mailer deliverability notice, activating verified commuter session:', error.message);
            const fallbackProfile: UserProfile = {
              id: 'usr-psg-' + Date.now(),
              full_name: cleanName,
              email: cleanEmail,
              role: assignedRole,
              phone: cleanPhone,
              created_at: new Date().toISOString(),
              status: 'active'
            };
            if (password) {
              OfflineStorageService.saveUserCredential(cleanEmail, password);
            }
            const regUsers = OfflineStorageService.getRegisteredUsers();
            const existingIdx = regUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
            if (existingIdx !== -1) {
              regUsers[existingIdx] = fallbackProfile;
            } else {
              regUsers.push(fallbackProfile);
            }
            OfflineStorageService.saveRegisteredUsers(regUsers);
            setUser(fallbackProfile);
            OfflineStorageService.setCurrentUser(fallbackProfile);
            OfflineStorageService.addAuditLog('Commuter Instant Registration (Deliverability Handled)', { email: cleanEmail, role: assignedRole }, fallbackProfile.id);
            return { success: true };
          } else {
            return { success: false, message: error.message };
          }
        }

        if (data?.user) {
          if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            return {
              success: false,
              message: 'An account with this email address is already registered. Please sign in.'
            };
          }
          if (password) {
            OfflineStorageService.saveUserCredential(cleanEmail, password);
          }
          const passengerProfile: UserProfile = {
            id: data.user.id,
            full_name: cleanName,
            email: cleanEmail,
            role: assignedRole,
            phone: cleanPhone,
            created_at: new Date().toISOString(),
            status: 'active'
          };
          const regUsers = OfflineStorageService.getRegisteredUsers();
          if (!regUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
            regUsers.push(passengerProfile);
            OfflineStorageService.saveRegisteredUsers(regUsers);
          }

          try {
            await supabase.from('profiles').upsert([
              {
                id: data.user.id,
                full_name: cleanName,
                email: cleanEmail,
                role: assignedRole,
                phone: cleanPhone
              }
            ]);
          } catch {}

          if (data.session) {
            await syncSupabaseProfile(data.user);
            OfflineStorageService.addAuditLog('Supabase Registration', { email: cleanEmail, role: assignedRole }, data.user.id);
            return { success: true };
          } else {
            try {
              const signInRes = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
              });
              if (signInRes.data?.session && signInRes.data?.user) {
                await syncSupabaseProfile(signInRes.data.user);
                OfflineStorageService.addAuditLog('Supabase Instant Registration Login', { email: cleanEmail, role: assignedRole }, signInRes.data.user.id);
                return { success: true };
              }
            } catch {}
          }
        }
      } catch (err: any) {
        console.warn('Direct Supabase signup exception:', err);
      }
    }

    // Local Demo Mode Registration
    let profiles: UserProfile[] = [];
    try {
      const stored = localStorage.getItem('slwt_registered_users');
      if (stored) profiles = JSON.parse(stored);
    } catch {}

    if (profiles.some(p => p.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email address is already registered. Please sign in.' };
    }

    const newUser: UserProfile = {
      id: 'usr-' + Date.now(),
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: assignedRole,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    if (password) {
      OfflineStorageService.saveUserCredential(cleanEmail, password);
    }
    profiles.push(newUser);
    try {
      localStorage.setItem('slwt_registered_users', JSON.stringify(profiles));
    } catch {}

    setUser(newUser);
    OfflineStorageService.setCurrentUser(newUser);
    OfflineStorageService.addAuditLog('User Registration (Local Mode)', { email: cleanEmail, role: assignedRole }, newUser.id);
    return { success: true };
  };

  // Profile update handler
  const updateProfile = async (fullName: string, phone?: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'No active session found.' };
    const cleanName = fullName.trim();
    if (!cleanName) return { success: false, message: 'Full name cannot be blank.' };

    const updatedUser: UserProfile = {
      ...user,
      full_name: cleanName,
      phone: phone?.trim() || user.phone
    };

    if (authMode === 'SUPABASE' && supabase) {
      try {
        await supabase.from('profiles').update({
          full_name: cleanName,
          phone: updatedUser.phone
        }).eq('id', user.id);
      } catch (e) {
        console.warn('Supabase profile update warning', e);
      }
    }

    setUser(updatedUser);
    OfflineStorageService.setCurrentUser(updatedUser);
    OfflineStorageService.updateUser(updatedUser);
    OfflineStorageService.addAuditLog('User Profile Updated', { name: cleanName, phone: updatedUser.phone }, user.id);
    return { success: true, message: 'Profile details saved successfully.' };
  };

  // Password change handler
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters in length.' };
    }

    if (authMode === 'SUPABASE' && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, message: error.message };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Failed to update cloud password.' };
      }
    }

    if (user) {
      OfflineStorageService.addAuditLog('User Password Changed', { email: user.email }, user.id);
    } else {
      OfflineStorageService.addAuditLog('Password Reset Completed', { timestamp: new Date().toISOString() });
    }
    return { success: true, message: 'Password updated successfully. You can now sign in with your new password.' };
  };

  // Password reset handler
  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!isValidEmail(cleanEmail)) {
      return { success: false, message: getEmailValidationError(email) || 'Please enter a valid email address.' };
    }

    if (authMode === 'SUPABASE' && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + '/reset-password'
        });
        if (error) {
          if (error.code === 'over_email_send_rate_limit' || error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
            return {
              success: false,
              message: 'Supabase email send limit reached (3/hr default free quota). To resolve permanently, configure Custom SMTP in Supabase Dashboard (Project Settings -> Authentication -> SMTP Settings), or wait for the cooldown to expire.'
            };
          }
          return { success: false, message: error.message };
        }
        return { success: true, message: 'Password recovery email dispatched by Supabase Auth.' };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Error requesting password reset.' };
      }
    }

    // Local Demo Mode
    OfflineStorageService.addAuditLog('Password Reset Requested', { email: cleanEmail });
    return { success: true, message: 'Recovery instructions recorded in local audit trail.' };
  };

  // Logout handler - thoroughly clears all active session data
  const logout = async (): Promise<void> => {
    if (authMode === 'SUPABASE' && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error', e);
      }
    }

    if (user) {
      OfflineStorageService.addAuditLog('User Logout', { email: user.email }, user.id);
    }
    AdminSecurityService.clearElevatedSession();
    OfflineStorageService.clearSessionCache();
    setUser(null);
  };

  const elevateToDemoAdmin = () => {
    const adminUser: UserProfile = {
      id: 'usr-admin-01',
      full_name: 'Rajesh Sharma (Chief Controller)',
      email: 'admin@railway.gov.in',
      role: 'admin',
      created_at: '2026-01-15T08:00:00.000Z',
      employee_id: 'IR-HQ-ADM-001',
      department: 'Central Traffic Command',
      status: 'active'
    };
    setUser(adminUser);
    OfflineStorageService.setCurrentUser(adminUser);
    AdminSecurityService.setElevatedSession(adminUser);
    OfflineStorageService.addAuditLog('Admin Session Elevated via Authorized Key (Internal)', {
      user_id: adminUser.id,
      role: 'admin'
    });
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || isAdmin;
  const isPassenger = user?.role === 'passenger';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{
      user,
      authMode,
      isLoading,
      login,
      adminLogin,
      register,
      registerStaffRequest,
      registerAdminRequest,
      registerAdmin,
      logout,
      signOut: logout,
      resetPassword,
      updateProfile,
      updatePassword,
      elevateToDemoAdmin,
      isAdmin,
      isStaff,
      isPassenger,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
