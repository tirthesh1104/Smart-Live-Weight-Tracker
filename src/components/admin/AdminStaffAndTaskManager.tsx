import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  KeyRound, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ListTodo, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Filter, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { UserProfile, StaffTask, StaffTaskPriority, StaffTaskStatus, StaffTaskType, Train } from '../../types';
import { StaffTaskService } from '../../services/staffTaskService';
import { OfflineStorageService } from '../../services/offlineStorage';
import { AdminSecurityService } from '../../services/adminSecurityService';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

interface AdminStaffAndTaskManagerProps {
  trains: Train[];
  adminUser: UserProfile | null;
  onRefreshUsers: () => void;
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
  'Station Superintendent',
  'Station Master',
  'Senior Section Engineer',
  'Bogie Telemetry Technician',
  'RPF Sub-Inspector',
  'Train Ticket Examiner (TTE)',
  'Coach Attendant & Field Inspector'
];

const STATIONS = ['CSMT', 'NDLS', 'HWH', 'MAS', 'PUNE', 'SBC', 'DLI', 'KYN'];

const TASK_TYPES: StaffTaskType[] = [
  'Coach Inspection',
  'Sensor Calibration',
  'Weight Anomaly Verification',
  'Passenger Assistance',
  'Station Duty',
  'Emergency Response',
  'Incident Response',
  'Weight Monitoring',
  'Safety Verification',
  'General Operations'
];

export const AdminStaffAndTaskManager: React.FC<AdminStaffAndTaskManagerProps> = ({
  trains,
  adminUser,
  onRefreshUsers
}) => {
  const [subTab, setSubTab] = useState<'roster' | 'tasks' | 'requests' | 'security'>('roster');

  // Staff list state
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Security Key Rotation state
  const [currentSecurityPin, setCurrentSecurityPin] = useState('');
  const [newSecurityPin, setNewSecurityPin] = useState('');
  const [confirmSecurityPin, setConfirmSecurityPin] = useState('');
  const [pinRotationError, setPinRotationError] = useState('');
  const [pinRotationSuccess, setPinRotationSuccess] = useState('');
  const [isRotatingPin, setIsRotatingPin] = useState(false);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffDepartment, setNewStaffDepartment] = useState(DEPARTMENTS[0]);
  const [newStaffDesignation, setNewStaffDesignation] = useState(DESIGNATIONS[0]);
  const [newStaffStation, setNewStaffStation] = useState(STATIONS[0]);
  const [newStaffPassword, setNewStaffPassword] = useState('Staff@IR2026!');
  const [newStaffStatus, setNewStaffStatus] = useState<'active' | 'inactive'>('active');
  const [staffFormError, setStaffFormError] = useState('');
  const [staffSuccessFeedback, setStaffSuccessFeedback] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilterStaff, setTaskFilterStaff] = useState<string>('all');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('all');
  const [taskFilterType, setTaskFilterType] = useState<string>('all');

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<StaffTaskType>('Coach Inspection');
  const [taskTrainNumber, setTaskTrainNumber] = useState('');
  const [taskCoachNo, setTaskCoachNo] = useState('');
  const [taskPriority, setTaskPriority] = useState<StaffTaskPriority>('Medium');
  const [taskAssignedToId, setTaskAssignedToId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskFormError, setTaskFormError] = useState('');

  // Reassign modal state
  const [reassigningTask, setReassigningTask] = useState<StaffTask | null>(null);
  const [reassignTargetStaffId, setReassignTargetStaffId] = useState('');

  // Load staff members, pending requests, and tasks
  const loadData = async () => {
    // 1. Load users from storage / database
    let allUsers = OfflineStorageService.getRegisteredUsers();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          const combined = [...data];
          allUsers.forEach(lu => {
            if (!combined.some(c => c.id === lu.id || c.email === lu.email)) {
              combined.push(lu);
            }
          });
          allUsers = combined;
        }
      } catch (e) {}
    }

    const staffOnly = allUsers.filter(u => u.role === 'staff' && u.status !== 'pending');
    setStaffList(staffOnly);

    // Pending registration requests (staff and admin requests)
    const pendingOnly = allUsers.filter(u => u.status === 'pending');
    setPendingRequests(pendingOnly);

    // 2. Load all tasks (admin perspective)
    const allTasks = await StaffTaskService.getTasksForUser(adminUser?.id, adminUser?.email, true);
    setTasks(allTasks);
  };

  useEffect(() => {
    loadData();
  }, [adminUser]);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate random strong temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pw = 'Staff@';
    for (let i = 0; i < 6; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaffPassword(pw);
  };

  // Submit new staff
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError('');

    const cleanName = newStaffName.trim();
    const cleanEmail = newStaffEmail.trim().toLowerCase();
    const cleanPhone = newStaffPhone.trim().replace(/[\s-]/g, '');

    if (!cleanName || !cleanEmail) {
      setStaffFormError('Personnel name and official email are required.');
      return;
    }

    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      setStaffFormError('Phone number must be a valid 10-digit number.');
      return;
    }

    const staffId = 'usr-stf-' + Date.now();
    const empId = `IR-${newStaffStation}-STF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newStaff: UserProfile = {
      id: staffId,
      full_name: cleanName,
      email: cleanEmail,
      role: 'staff',
      employee_id: empId,
      department: newStaffDepartment,
      designation: newStaffDesignation,
      station_code: newStaffStation,
      phone: cleanPhone || '+91 98765-XXXXX',
      status: newStaffStatus,
      created_at: new Date().toISOString()
    };

    // If Supabase configured, create real auth user and profile in profiles table
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Provision Auth record in Supabase GoTrue
        await supabase.auth.signUp({
          email: cleanEmail,
          password: newStaffPassword,
          options: {
            data: {
              full_name: cleanName,
              role: 'staff',
              employee_id: empId,
              phone: cleanPhone
            }
          }
        });
      } catch (err) {
        console.warn('Supabase staff auth signup note', err);
      }

      try {
        // 2. Sync profile in public.profiles table
        await supabase.from('profiles').upsert([
          {
            id: newStaff.id,
            full_name: newStaff.full_name,
            email: newStaff.email,
            role: 'staff',
            employee_id: newStaff.employee_id,
            department: newStaff.department,
            designation: newStaff.designation,
            station_code: newStaff.station_code,
            phone: newStaff.phone,
            status: newStaff.status
          }
        ]);
      } catch (err) {
        console.warn('Supabase staff profile sync note', err);
      }
    }

    OfflineStorageService.addStaffMember(newStaff);
    OfflineStorageService.addAuditLog('Admin Provisioned Staff Member', {
      employee_id: newStaff.employee_id,
      name: newStaff.full_name,
      email: newStaff.email,
      department: newStaff.department,
      designation: newStaff.designation,
      station: newStaff.station_code,
      status: newStaff.status,
      admin_id: adminUser?.id
    });

    setStaffSuccessFeedback(`Staff profile created for ${cleanName} (${empId}). Credentials ready to share.`);
    setTimeout(() => setStaffSuccessFeedback(null), 8000);

    // Reset form
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setIsAddingStaff(false);
    loadData();
    onRefreshUsers();
  };

  // Toggle staff status
  const handleToggleStaffStatus = async (staff: UserProfile) => {
    const nextStatus = (staff.status || 'active') === 'active' ? 'inactive' : 'active';

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ status: nextStatus }).eq('id', staff.id);
      } catch (e) {}
    }

    OfflineStorageService.updateUserStatus(staff.id, nextStatus);
    OfflineStorageService.addAuditLog('Staff Duty Status Toggled', {
      staffId: staff.id,
      staffEmail: staff.email,
      newStatus: nextStatus,
      admin_id: adminUser?.id
    });

    loadData();
    onRefreshUsers();
  };

  // Delete staff member
  const handleDeleteStaff = async (staff: UserProfile) => {
    if (window.confirm(`Revoke duty clearance and delete staff account for ${staff.full_name} (${staff.email})?`)) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('profiles').delete().eq('id', staff.id);
        } catch (e) {}
      }
      OfflineStorageService.deleteUser(staff.id);
      loadData();
      onRefreshUsers();
    }
  };

  // Trigger password reset for staff
  const handleTriggerStaffPasswordReset = async (staff: UserProfile) => {
    if (isSupabaseConfigured && supabase && staff.email) {
      try {
        await supabase.auth.resetPasswordForEmail(staff.email, {
          redirectTo: `${window.location.origin}/#/reset-password`
        });
      } catch (e) {}
    }
    OfflineStorageService.addAuditLog('Staff Password Reset Triggered by Admin', {
      staff_email: staff.email,
      admin_id: adminUser?.id
    });
    setStaffSuccessFeedback(`Password reset instructions dispatched to ${staff.email}.`);
    setTimeout(() => setStaffSuccessFeedback(null), 6000);
  };

  // Approve pending registration request
  const handleApproveRequest = async (request: UserProfile) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ status: 'active' }).eq('id', request.id);
      } catch (e) {}
    }
    const res = OfflineStorageService.approveRegistrationRequest(request.id);
    setStaffSuccessFeedback(res.message);
    setTimeout(() => setStaffSuccessFeedback(null), 6000);
    loadData();
    onRefreshUsers();
  };

  // Reject pending registration request
  const handleRejectRequest = async (request: UserProfile) => {
    if (window.confirm(`Reject registration request for ${request.full_name} (${request.email})?`)) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('profiles').delete().eq('id', request.id);
        } catch (e) {}
      }
      const res = OfflineStorageService.rejectRegistrationRequest(request.id);
      setStaffSuccessFeedback(res.message);
      setTimeout(() => setStaffSuccessFeedback(null), 6000);
      loadData();
      onRefreshUsers();
    }
  };

  // Rotate / Update Administrator Security PIN
  const handleRotatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinRotationError('');
    setPinRotationSuccess('');
    setIsRotatingPin(true);

    try {
      if (newSecurityPin !== confirmSecurityPin) {
        setPinRotationError('New PIN and confirmation PIN do not match.');
        setIsRotatingPin(false);
        return;
      }

      const res = await AdminSecurityService.updateAdminPin(currentSecurityPin, newSecurityPin);
      if (!res.success) {
        setPinRotationError(res.message);
        setIsRotatingPin(false);
        return;
      }

      setPinRotationSuccess(res.message);
      setCurrentSecurityPin('');
      setNewSecurityPin('');
      setConfirmSecurityPin('');
    } catch (err: any) {
      setPinRotationError(err?.message || 'Error updating Administrator Security PIN.');
    } finally {
      setIsRotatingPin(false);
    }
  };

  // Submit new task
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError('');

    if (!taskTitle.trim()) {
      setTaskFormError('Task title is required.');
      return;
    }

    const assignedStaff = staffList.find(s => s.id === taskAssignedToId);

    const newTask = await StaffTaskService.createTask({
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      task_type: taskType,
      train_number: taskTrainNumber || undefined,
      coach_no: taskCoachNo || undefined,
      priority: taskPriority,
      status: 'Pending',
      assigned_to: assignedStaff?.id,
      assigned_to_name: assignedStaff?.full_name,
      assigned_to_email: assignedStaff?.email,
      assigned_by: adminUser?.id,
      due_date: taskDueDate ? new Date(taskDueDate).toISOString() : new Date(Date.now() + 6 * 3600 * 1000).toISOString()
    });

    setStaffSuccessFeedback(`Task "${newTask.title}" assigned to ${assignedStaff?.full_name || 'Staff'}.`);
    setTimeout(() => setStaffSuccessFeedback(null), 6000);

    // Reset task form
    setTaskTitle('');
    setTaskDescription('');
    setTaskCoachNo('');
    setIsAddingTask(false);
    loadData();
  };

  // Reassign task
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassigningTask || !reassignTargetStaffId) return;

    const targetStaff = staffList.find(s => s.id === reassignTargetStaffId);
    if (!targetStaff) return;

    await StaffTaskService.reassignTask(reassigningTask.id, {
      id: targetStaff.id,
      name: targetStaff.full_name,
      email: targetStaff.email
    });

    setStaffSuccessFeedback(`Task reassigned to ${targetStaff.full_name}.`);
    setTimeout(() => setStaffSuccessFeedback(null), 5000);
    setReassigningTask(null);
    setReassignTargetStaffId('');
    loadData();
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to remove this assigned task?')) {
      await StaffTaskService.deleteTask(taskId);
      loadData();
    }
  };

  // Filtered staff
  const filteredStaff = staffList.filter(s => {
    const q = staffSearchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.designation && s.designation.toLowerCase().includes(q)) ||
      (s.station_code && s.station_code.toLowerCase().includes(q))
    );
  });

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    if (taskFilterStaff !== 'all' && t.assigned_to !== taskFilterStaff) return false;
    if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
    if (taskFilterPriority !== 'all' && t.priority !== taskFilterPriority) return false;
    if (taskFilterType !== 'all' && t.task_type !== taskFilterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('roster')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'roster'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Staff Directory ({staffList.length})</span>
          </button>
          <button
            onClick={() => setSubTab('tasks')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'tasks'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Task Distribution ({tasks.length})</span>
          </button>
          <button
            onClick={() => setSubTab('requests')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'requests'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Pending Requests ({pendingRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setSubTab('security')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'security'
                ? 'bg-[#003366] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span>Security Key (PIN)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'roster' && (
            <button
              onClick={() => {
                generateTempPassword();
                setIsAddingStaff(true);
              }}
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Staff Member</span>
            </button>
          )}
          {subTab === 'tasks' && (
            <button
              onClick={() => {
                if (staffList.length > 0 && !taskAssignedToId) {
                  setTaskAssignedToId(staffList[0].id);
                }
                setIsAddingTask(true);
              }}
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {staffSuccessFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-l-emerald-600 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{staffSuccessFeedback}</span>
          </div>
          <button onClick={() => setStaffSuccessFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: STAFF DIRECTORY ROSTER                        */}
      {/* ======================================================== */}
      {subTab === 'roster' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="gov-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, department, station..."
                className="gov-input pl-8"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
              <span>Total Active Personnel: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{staffList.filter(s => (s.status || 'active') === 'active').length}</strong></span>
              <span>Inactive: <strong className="text-rose-700 dark:text-rose-400 font-mono">{staffList.filter(s => s.status === 'inactive').length}</strong></span>
            </div>
          </div>

          {/* Staff Roster Table */}
          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Employee Details</th>
                    <th>Designation &amp; Station</th>
                    <th>Department</th>
                    <th>Contact Info</th>
                    <th>Assigned Tasks</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No railway staff members found. Click "Add New Staff Member" to provision an account.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const staffTasksCount = tasks.filter(t => t.assigned_to === staff.id || t.assigned_to_email === staff.email).length;
                      const isInactive = staff.status === 'inactive';

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{staff.full_name}</div>
                            <div className="text-[10px] font-mono text-[#003366] dark:text-blue-300 font-semibold">
                              {staff.employee_id || 'IR-STF-GEN'}
                            </div>
                          </td>
                          <td>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {staff.designation || 'Duty Officer'}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>Station: {staff.station_code || 'CSMT'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              {staff.department || 'Operations'}
                            </span>
                          </td>
                          <td>
                            <div className="text-xs font-mono text-slate-800 dark:text-slate-200">{staff.email}</div>
                            <div className="text-[10px] font-mono text-slate-500">{staff.phone || '+91 98765-XXXXX'}</div>
                          </td>
                          <td>
                            <span className={`inline-block px-2 py-0.5 rounded-xs text-xs font-mono font-bold ${
                              staffTasksCount > 0 
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#003366] dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                                : 'text-slate-400'
                            }`}>
                              {staffTasksCount} task(s)
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleStaffStatus(staff)}
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs cursor-pointer border transition ${
                                !isInactive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                              }`}
                              title="Click to toggle account access"
                            >
                              {!isInactive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleTriggerStaffPasswordReset(staff)}
                              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xs cursor-pointer transition inline-flex items-center gap-1"
                              title="Trigger secure password reset email"
                            >
                              <KeyRound className="w-3 h-3 text-[#003366] dark:text-blue-400" />
                              <span>Reset</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1 text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xs cursor-pointer transition inline-block align-middle"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: STAFF TASK DISTRIBUTION & ISOLATION           */}
      {/* ======================================================== */}
      {subTab === 'tasks' && (
        <div className="space-y-4">
          
          {/* Task Filters */}
          <div className="gov-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500">Staff:</span>
                <select
                  value={taskFilterStaff}
                  onChange={(e) => setTaskFilterStaff(e.target.value)}
                  className="gov-select !w-auto text-xs py-1"
                >
                  <option value="all">All Personnel ({staffList.length})</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500">Status:</span>
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="gov-select !w-auto text-xs py-1"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500">Priority:</span>
                <select
                  value={taskFilterPriority}
                  onChange={(e) => setTaskFilterPriority(e.target.value)}
                  className="gov-select !w-auto text-xs py-1"
                >
                  <option value="all">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500">Type:</span>
                <select
                  value={taskFilterType}
                  onChange={(e) => setTaskFilterType(e.target.value)}
                  className="gov-select !w-auto text-xs py-1"
                >
                  <option value="all">All Task Types</option>
                  {TASK_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>

          {/* Tasks List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full gov-card p-8 text-center text-slate-500">
                No tasks match the selected filter criteria. Click "Assign New Task" to delegate operational work.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== 'Completed';

                return (
                  <div 
                    key={task.id} 
                    className={`gov-card p-4 space-y-3 border-l-4 ${
                      task.priority === 'Critical' ? 'border-l-rose-600' :
                      task.priority === 'High' ? 'border-l-orange-500' :
                      task.priority === 'Medium' ? 'border-l-blue-600' :
                      'border-l-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            task.priority === 'Critical' ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300' :
                            task.priority === 'High' ? 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300' :
                            task.priority === 'Medium' ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-xs">
                            {task.task_type}
                          </span>
                          {task.train_number && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-[#003366] dark:text-blue-300 font-bold rounded-xs">
                              Train #{task.train_number} {task.coach_no ? `• Coach ${task.coach_no}` : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5">
                          {task.title}
                        </h4>
                      </div>

                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border shrink-0 ${
                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        task.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                        task.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                        'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {task.notes && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xs text-[11px] text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-500 block text-[10px] uppercase">Staff Field Findings:</strong>
                        {task.notes}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Assigned To: </span>
                        <strong className="text-[#003366] dark:text-blue-300 font-semibold">
                          {task.assigned_to_name || task.assigned_to_email || 'Unassigned'}
                        </strong>
                      </div>

                      {task.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                          <Clock className="w-3 h-3" />
                          <span>Due: {new Date(task.due_date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions: Reassign, Delete */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setReassigningTask(task);
                          setReassignTargetStaffId(task.assigned_to || '');
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#003366] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xs cursor-pointer transition"
                      >
                        Reassign Task
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: PENDING REGISTRATION APPROVAL QUEUE           */}
      {/* ======================================================== */}
      {subTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-sm text-xs text-blue-950 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Administrative Verification Desk:</strong> Review, verify, and approve incoming Duty Staff and Administrator authorization requests.
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded-xs">
              {pendingRequests.length} Pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="gov-card p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Pending Requests</p>
              <p>All incoming duty staff and administrator registration requests have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map(req => (
                <div 
                  key={req.id} 
                  className={`gov-card p-4 space-y-3 border-l-4 ${
                    req.role === 'admin' 
                      ? 'border-l-purple-600 dark:border-l-purple-500' 
                      : 'border-l-blue-600 dark:border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase font-mono ${
                          req.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        }`}>
                          {req.role === 'admin' ? 'ADMIN REQUEST' : 'DUTY STAFF REQUEST'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {req.full_name}
                      </h4>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xs border border-slate-200 dark:border-slate-700">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{req.email}</span>
                    </p>
                    {req.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.phone}</span>
                      </p>
                    )}
                    {req.department && (
                      <p className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.department}</span>
                      </p>
                    )}
                    {req.designation && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.designation} &bull; Station {req.station_code || 'HQ'}</span>
                      </p>
                    )}
                  </div>

                  {req.justification && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xs text-[11px] text-purple-950 dark:text-purple-200">
                      <strong className="block text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 mb-0.5">
                        Administrative Justification:
                      </strong>
                      <p className="italic">{req.justification}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleRejectRequest(req)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-sm cursor-pointer transition"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleApproveRequest(req)}
                      className={`px-3 py-1.5 text-white text-xs font-bold rounded-sm cursor-pointer transition shadow-xs flex items-center gap-1.5 ${
                        req.role === 'admin'
                          ? 'bg-purple-700 hover:bg-purple-800 dark:bg-purple-600'
                          : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Activate Account</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: ADMINISTRATOR SECURITY KEY ROTATION           */}
      {/* ======================================================== */}
      {subTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="gov-card border-t-4 border-t-purple-700 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
              <KeyRound className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Administrator Security Key Management
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure and rotate your Central Traffic Control 2FA Security Key
                </p>
              </div>
            </div>

            {pinRotationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs rounded-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinRotationError}</span>
              </div>
            )}

            {pinRotationSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinRotationSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRotatePinSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Administrator Security PIN *
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={currentSecurityPin}
                  onChange={(e) => setCurrentSecurityPin(e.target.value)}
                  placeholder="Enter current PIN"
                  className="gov-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Administrator Security PIN (4-8 Numeric Digits) *
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newSecurityPin}
                  onChange={(e) => setNewSecurityPin(e.target.value)}
                  placeholder="Enter new 4-8 digit numeric PIN"
                  className="gov-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Administrator Security PIN *
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmSecurityPin}
                  onChange={(e) => setConfirmSecurityPin(e.target.value)}
                  placeholder="Re-enter new PIN"
                  className="gov-input font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xs text-[11px] text-purple-950 dark:text-purple-200 space-y-1">
                <strong className="block font-bold">Strict Security Compliance Rules:</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  <li>Deprecated PIN (77) is permanently blacklisted and cannot be reused.</li>
                  <li>Security keys are cryptographically salted and hashed using SHA-256 before storage.</li>
                  <li>PIN rotation takes effect immediately for all subsequent Administrator logins.</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isRotatingPin}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-sm text-xs cursor-pointer transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRotatingPin ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Cryptographic Key...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Save &amp; Activate New Security Key</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PROVISION NEW STAFF MEMBER                        */}
      {/* ======================================================== */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full gov-card border-t-4 border-t-[#003366] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
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

            {staffFormError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs rounded-xs">
                {staffFormError}
              </div>
            )}

            <form onSubmit={handleCreateStaffSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Personnel Full Name *
                  </label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Ramesh S. Patil"
                    className="gov-input"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="ramesh.patil@railway.gov.in"
                    className="gov-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (10 Digits)
                  </label>
                  <input
                    type="tel"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="gov-input"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Station / Division *
                  </label>
                  <select
                    value={newStaffStation}
                    onChange={(e) => setNewStaffStation(e.target.value)}
                    className="gov-select"
                  >
                    {STATIONS.map(st => (
                      <option key={st} value={st}>{st} Junction / Division</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={newStaffDepartment}
                    onChange={(e) => setNewStaffDepartment(e.target.value)}
                    className="gov-select"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Designation *
                  </label>
                  <select
                    value={newStaffDesignation}
                    onChange={(e) => setNewStaffDesignation(e.target.value)}
                    className="gov-select"
                  >
                    {DESIGNATIONS.map(desig => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Temporary Password & One-Time Copy Action */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Temporary Access Password:
                  </label>
                  <button
                    type="button"
                    onClick={generateTempPassword}
                    className="text-[10px] text-[#003366] dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="gov-input font-mono font-bold text-[#003366] dark:text-blue-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyText(`Email: ${newStaffEmail}\nTemporary Password: ${newStaffPassword}`, 'staff-pw')}
                    className="px-2.5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-sm flex items-center gap-1 cursor-pointer shrink-0 transition"
                    title="Copy Email & Password to Clipboard"
                  >
                    {copiedKey === 'staff-pw' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'staff-pw' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Copy credentials to dispatch to employee. Role is strictly assigned as <strong className="font-mono">staff</strong> in database profiles.
                </p>
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
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASSIGN NEW TASK                                   */}
      {/* ======================================================== */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full gov-card border-t-4 border-t-[#003366] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
                  Assign Staff Task
                </h3>
              </div>
              <button
                onClick={() => setIsAddingTask(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {taskFormError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs rounded-xs">
                {taskFormError}
              </div>
            )}

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Bogie Tare Calibration on Coach S2"
                  className="gov-input"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Task Description
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={2}
                  placeholder="Provide instructions and safety verification parameters..."
                  className="gov-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Task Type *
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as StaffTaskType)}
                    className="gov-select"
                  >
                    {TASK_TYPES.map(tt => (
                      <option key={tt} value={tt}>{tt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as StaffTaskPriority)}
                    className="gov-select"
                  >
                    <option value="Critical">Critical (Immediate Response)</option>
                    <option value="High">High (Within 2 Hours)</option>
                    <option value="Medium">Medium (Before Departure)</option>
                    <option value="Low">Low (Routine Check)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign To Staff Member *
                  </label>
                  <select
                    value={taskAssignedToId}
                    onChange={(e) => setTaskAssignedToId(e.target.value)}
                    className="gov-select font-semibold"
                    required
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.designation || 'Staff'} • {s.station_code || 'CSMT'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Related Train (Optional)
                  </label>
                  <select
                    value={taskTrainNumber}
                    onChange={(e) => setTaskTrainNumber(e.target.value)}
                    className="gov-select"
                  >
                    <option value="">None / General Station Duty</option>
                    {trains.map(tr => (
                      <option key={tr.id} value={tr.number}>
                        #{tr.number} - {tr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Related Coach No (Optional)
                  </label>
                  <input
                    type="text"
                    value={taskCoachNo}
                    onChange={(e) => setTaskCoachNo(e.target.value)}
                    placeholder="e.g. S1, D1, B2"
                    className="gov-input"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="gov-input"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-sm cursor-pointer transition shadow-sm"
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REASSIGN TASK                                     */}
      {/* ======================================================== */}
      {reassigningTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full gov-card border-t-4 border-t-[#003366] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
                Reassign Task
              </h3>
              <button
                onClick={() => setReassigningTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{reassigningTask.title}</p>
              <p className="text-slate-500">Currently assigned to: {reassigningTask.assigned_to_name || 'None'}</p>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select New Staff Assignee:
                </label>
                <select
                  value={reassignTargetStaffId}
                  onChange={(e) => setReassignTargetStaffId(e.target.value)}
                  className="gov-select font-semibold"
                  required
                >
                  <option value="">Select Staff Member...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.designation || 'Staff'} • {s.station_code || 'CSMT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReassigningTask(null)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reassignTargetStaffId}
                  className="flex-1 py-2 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-sm cursor-pointer transition shadow-sm disabled:opacity-50"
                >
                  Save Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
