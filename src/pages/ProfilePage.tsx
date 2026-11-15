import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Key, 
  UserCheck, 
  Users, 
  Activity, 
  CheckCircle2, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Bell, 
  Clock, 
  LifeBuoy, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { CoachLayoutService } from '../services/coachLayoutService';
import { OfflineStorageService } from '../services/offlineStorage';
import { UserRole } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'details' | 'edit' | 'security' | 'requests' | 'notifications'>('details');

  // Edit details state
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Assistance requests state
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setEditName(user.full_name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    // Load passenger's own assistance requests with strict user data isolation
    try {
      const stored = localStorage.getItem('slwt_passenger_assistance_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const userSpecific = parsed.filter((r: any) => 
            (user?.id && r.userId === user.id) || 
            (user?.email && r.userEmail && r.userEmail.toLowerCase() === user.email.toLowerCase())
          );
          setMyRequests(userSpecific);
          return;
        }
      }
      
      // No fabricated sample requests. Strictly load real user-submitted requests.
      setMyRequests([]);
    } catch {
      setMyRequests([]);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsSavingProfile(true);

    if (!editName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be blank.' });
      setIsSavingProfile(false);
      return;
    }

    if (editPhone && !/^\d{10}$/.test(editPhone.replace(/[\s-]/g, ''))) {
      setProfileMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile phone number.' });
      setIsSavingProfile(false);
      return;
    }

    const res = await updateProfile(editName, editPhone);
    setIsSavingProfile(false);
    if (res.success) {
      setProfileMsg({ type: 'success', text: res.message || 'Profile saved successfully.' });
      setTimeout(() => setProfileMsg(null), 4000);
    } else {
      setProfileMsg({ type: 'error', text: res.message || 'Unable to update profile.' });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setIsSavingPassword(true);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters in length.' });
      setIsSavingPassword(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      setIsSavingPassword(false);
      return;
    }

    const res = await updatePassword(newPassword);
    setIsSavingPassword(false);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } else {
      setPasswordMsg({ type: 'error', text: res.message || 'Unable to update password.' });
    }
  };

  const roleDetails = {
    admin: {
      title: 'Chief Traffic Controller (CTC / Administrator)',
      badge: 'bg-[#003366] text-white',
      permissions: [
        'Fleet Management (Register, update, and remove train rakes and coaches)',
        'Full Structural Tare & Gross Weight Configuration',
        'Fleet-Wide Occupancy Analytics & Historical Telemetry',
        'Natural Language AI Analytics Assistant (Deterministic Records Mode)',
        'System Safety Incident & Overload Alert Queue'
      ]
    },
    staff: {
      title: 'Station Master / RPF Duty Officer',
      badge: 'bg-amber-800 text-white',
      permissions: [
        'Assigned Train Live Bogie Strain Gauge Monitoring',
        'Overload Safety Alarm Verification',
        'Platform Crowd Regulation and Flow Diversion',
        'Official Safety Incident Filing Desk'
      ]
    },
    passenger: {
      title: 'Railway Commuter / Passenger',
      badge: 'bg-emerald-800 text-white',
      permissions: [
        'Live Train Coach Occupancy Enquiry',
        'Pre-Boarding Rake Composition Inspection',
        'AI Least-Crowded Coach Recommendation',
        'Station Platform Display Board Access',
        'Passenger Assistance Request Pipeline'
      ]
    },
    faculty: {
      title: 'Academic Faculty / Project Guide',
      badge: 'bg-purple-800 text-white',
      permissions: [
        'AI Prediction Model Performance Validation',
        'Holt-Winters MAE/RMSE Verification Metrics',
        'Academic Evaluation & Telemetry Simulation Inspection',
        'Official Project Feedback & Technical Review Desk'
      ]
    }
  };

  const currentRoleInfo = roleDetails[user?.role || 'passenger'];

  // Personal notifications
  const userNotifications = [
    {
      id: 'notif-1',
      title: 'Coach S2 Load Normalization Advisory',
      body: 'Platform 3 dwell time completed. Coach S2 crowd levels reduced to 64%. Boarding cleared.',
      time: '14:20 IST',
      read: true
    },
    {
      id: 'notif-2',
      title: 'Assistance Request Dispatched',
      body: 'Your wheelchair request (REQ-1092) for Train 12123 has been accepted by Platform Master CSMT.',
      time: '14:15 IST',
      read: false
    },
    {
      id: 'notif-3',
      title: 'Welcome to Indian Railways Smart Weight Tracker',
      body: 'Commuter portal connected. Real-time bogie strain gauge telemetry is active for all arriving rakes.',
      time: 'Yesterday',
      read: true
    }
  ];

  return (
    <div className="space-y-5 py-4 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Indian Railways Portal Services &bull; User Account &amp; Credentials
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
          User Profile &amp; Role Authorization Desk
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Authenticated user profile, personal information management, and authorized system privileges.
        </p>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-sm text-xs font-semibold border border-slate-300 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'details' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('edit')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'edit' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requests' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>My Assistance Requests ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications ({userNotifications.filter(n => !n.read).length})</span>
        </button>
      </div>

      {/* 1. PROFILE OVERVIEW TAB */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left Column: Profile Card */}
          <div className="gov-card p-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-sm bg-[#003366] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {user?.full_name || 'Guest Commuter'}
              </h2>
              <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold uppercase rounded-xs ${currentRoleInfo.badge}`}>
                {user?.role}
              </span>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email || 'unassigned@railway.gov.in'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user?.phone || 'No phone registered'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px] truncate">ID: {user?.id || 'usr-local'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Registered: {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Role Permissions */}
          <div className="md:col-span-2 space-y-4">
            <div className="gov-card p-5 space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                  Assigned Operational Role: {currentRoleInfo.title}
                </h3>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Authorized System Privileges:
                </span>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  {currentRoleInfo.permissions.map((perm: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="gov-card p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">
                Session Security Notice
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Account role assignment is enforced strictly through Row Level Security (RLS) on PostgreSQL. Commuter accounts are segregated from staff operational commands.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT PERSONAL DETAILS TAB */}
      {activeTab === 'edit' && (
        <div className="gov-card p-5 border-l-4 border-l-[#003366] space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider">
              Edit Permitted Personal Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your registered full name and contact phone number. Email address is cryptographically linked to your authentication session.
            </p>
          </div>

          {profileMsg && (
            <div className={`p-3 text-xs flex items-center gap-2 rounded-xs border ${
              profileMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs max-w-md">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email (Read-Only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Email is tied to primary Supabase Auth record and cannot be altered client-side.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (10 digits)
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={10}
                className="w-full px-3 py-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Used strictly for authorized Station Staff boarding assistance notifications.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. CHANGE PASSWORD TAB */}
      {activeTab === 'security' && (
        <div className="gov-card p-5 border-l-4 border-l-amber-600 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider">
              Change Security Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ensure your new password contains at least 6 characters. Authentication is verified cryptographically.
            </p>
          </div>

          {passwordMsg && (
            <div className={`p-3 text-xs flex items-center gap-2 rounded-xs border ${
              passwordMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs max-w-md">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-3 pr-10 py-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full px-3 py-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSavingPassword ? 'Updating Password...' : 'Update Password Securely'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. MY ASSISTANCE REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="gov-card p-5 border-l-4 border-l-teal-600 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <div>
              <h3 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider">
                My Passenger Boarding Assistance Requests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track real-time status of wheelchair, senior citizen, porter, or coach cleanliness requests.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-2xs bg-teal-100 text-teal-900 text-xs font-mono font-bold">
              {myRequests.length} Active Records
            </span>
          </div>

          <div className="space-y-2.5">
            {myRequests.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-sm border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                <LifeBuoy className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Assistance Requests Logged for This Account</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can submit wheelchair, porter, or coach cleanliness requests from the Passenger Dashboard assistance desk.
                </p>
              </div>
            ) : (
              myRequests.map((req, i) => (
                <div
                  key={req.id || i}
                  className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#003366] dark:text-blue-400">{req.id}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{req.category}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-2xs text-[10px] font-bold font-mono uppercase self-start sm:self-auto ${
                      req.status === 'Completed' ? 'bg-emerald-100 text-emerald-900' :
                      req.status === 'Assigned' ? 'bg-blue-100 text-blue-900' :
                      req.status === 'Pending' ? 'bg-amber-100 text-amber-900' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      Status: {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    <div>Train: <strong>{req.trainNumber}</strong></div>
                    <div>Location: <strong>{req.coach} &bull; {req.seat}</strong></div>
                    <div>Logged: <strong>{req.timestamp}</strong></div>
                    <div>RPF Desk: <strong className="text-emerald-600">Dispatched</strong></div>
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                      Station Master Note: {req.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. NOTIFICATION HISTORY TAB */}
      {activeTab === 'notifications' && (
        <div className="gov-card p-5 border-l-4 border-l-purple-600 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider">
              Personal Passenger Notification History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crowd alerts, boarding position changes, and assistance updates sent to your account.
            </p>
          </div>

          <div className="space-y-2">
            {userNotifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-xs border text-xs space-y-1 ${
                  n.read ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{n.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};