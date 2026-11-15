import { Train, UserProfile, SystemNotification, IncidentReport, AuditLog, WeightReading, StaffTask, FeedbackSubmission } from '../types';
import { supabase, isSupabaseConfigured, STORAGE_KEYS } from './supabaseClient';

export interface SyncQueueItem {
  id: string;
  entity: 'notification' | 'incident' | 'audit_log' | 'weight_reading' | 'prediction' | 'anomaly' | 'inspection' | 'assistance_request' | 'feedback';
  payload: any;
  queued_at: string;
  attempts: number;
}

export interface CloudSyncStatusInfo {
  mode: 'cloud' | 'local_demo';
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime?: string;
  statusLabel: string;
}

export class OfflineStorageService {
  // Operational Trains
  static getTrains(): Train[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRAINS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading trains from localStorage', e);
    }

    // Zero mock/demo trains per strict official data policy.
    // Real trains are loaded dynamically from verified Supabase PostgreSQL storage.
    return [];
  }

  static saveTrains(trains: Train[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRAINS, JSON.stringify(trains));
    } catch (e) {
      console.warn('Error writing trains to localStorage', e);
    }
  }

  // Weight Readings History
  static getReadingsHistory(): WeightReading[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.READINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading weight readings from localStorage', e);
    }
    return [];
  }

  static appendReading(reading: WeightReading): void {
    try {
      const history = this.getReadingsHistory();
      history.unshift(reading);
      const trimmed = history.slice(0, 500);
      localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(trimmed));

      // Asynchronous Cloud Persistence with Safe Queue Fallback
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('weight_readings')
          .insert([{
            id: reading.id,
            coach_id: reading.coach_id,
            weight_kg: reading.weight_kg,
            recorded_at: reading.recorded_at || new Date().toISOString(),
            source: reading.source || 'piezoelectric_bogie_sensor',
            is_simulated: reading.is_simulated ?? true
          }])
          .then(
            ({ error }) => {
              if (error) {
                this.enqueueForSync('weight_reading', reading);
              }
            },
            () => {
              this.enqueueForSync('weight_reading', reading);
            }
          );
      }
    } catch (e) {
      console.warn('Error saving weight reading', e);
    }
  }

  static addPrediction(prediction: {
    id?: string;
    coach_id: string;
    predicted_occupancy: number;
    prediction_horizon_minutes: number;
    confidence: number;
    created_at?: string;
  }): void {
    const payload = {
      id: prediction.id || `pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      coach_id: prediction.coach_id,
      predicted_occupancy: Math.max(0, prediction.predicted_occupancy),
      prediction_horizon_minutes: prediction.prediction_horizon_minutes,
      confidence: Math.max(0, Math.min(1.0, prediction.confidence)),
      created_at: prediction.created_at || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('predictions')
        .insert([payload])
        .then(
          ({ error }) => {
            if (error) {
              this.enqueueForSync('prediction', payload);
            }
          },
          () => {
            this.enqueueForSync('prediction', payload);
          }
        );
    }
  }

  static addWeightAnomaly(anomaly: {
    id?: string;
    coach_id: string;
    anomaly_type: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    weight_delta_kg: number;
    data_source?: string;
    detected_at?: string;
  }): void {
    const payload = {
      id: anomaly.id || `anom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      coach_id: anomaly.coach_id,
      anomaly_type: anomaly.anomaly_type,
      severity: anomaly.severity,
      weight_delta_kg: Math.round(anomaly.weight_delta_kg),
      data_source: anomaly.data_source || 'SIMULATED DATA',
      detected_at: anomaly.detected_at || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('weight_anomaly_logs')
        .insert([payload])
        .then(
          ({ error }) => {
            if (error) {
              this.enqueueForSync('anomaly', payload);
            }
          },
          () => {
            this.enqueueForSync('anomaly', payload);
          }
        );
    }
  }

  static addCoachInspection(inspection: {
    id?: string;
    coach_id: string;
    inspector_name: string;
    inspector_id?: string;
    status?: string;
    readiness_score?: number;
    findings?: string;
    action_taken?: string;
    created_at?: string;
  }): void {
    const payload = {
      id: inspection.id || `insp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      coach_id: inspection.coach_id,
      inspector_name: inspection.inspector_name,
      inspector_id: inspection.inspector_id || null,
      status: inspection.status || 'Fit to Run',
      readiness_score: inspection.readiness_score ?? 100,
      findings: inspection.findings || 'Standard pre-departure mechanical inspection passed.',
      action_taken: inspection.action_taken || null,
      created_at: inspection.created_at || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('coach_inspections')
        .insert([payload])
        .then(
          ({ error }) => {
            if (error) {
              this.enqueueForSync('inspection', payload);
            }
          },
          () => {
            this.enqueueForSync('inspection', payload);
          }
        );
    }
  }

  static addPassengerAssistanceRequest(req: {
    id?: string;
    user_id?: string;
    category: string;
    station: string;
    contact_phone?: string;
    status?: 'Submitted' | 'Pending' | 'Assigned' | 'Completed';
    tracking_token: string;
    created_at?: string;
  }): void {
    const payload = {
      id: req.id || `ast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: req.user_id || null,
      category: req.category,
      station: req.station,
      contact_phone: req.contact_phone || null,
      status: req.status || 'Submitted',
      tracking_token: req.tracking_token,
      created_at: req.created_at || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('passenger_assistance_requests')
        .insert([payload])
        .then(
          ({ error }) => {
            if (error) {
              this.enqueueForSync('assistance_request', payload);
            }
          },
          () => {
            this.enqueueForSync('assistance_request', payload);
          }
        );
    }
  }

  // Operational Notifications / Alerts
  static getNotifications(): SystemNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading notifications', e);
    }
    return [];
  }

  static saveNotifications(notifications: SystemNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Error saving notifications', e);
    }
  }

  static addNotification(notif: SystemNotification): void {
    const list = this.getNotifications();
    
    // Duplicate alert prevention: suppress identical alert within 5 minutes
    const isDuplicate = list.some(existing => 
      existing.title === notif.title &&
      existing.coach_id === notif.coach_id &&
      existing.train_id === notif.train_id &&
      (Date.now() - new Date(existing.created_at).getTime()) < 5 * 60 * 1000
    );
    if (isDuplicate) return;

    list.unshift(notif);
    this.saveNotifications(list.slice(0, 100));

    // Asynchronous Cloud Persistence with Safe Queue Fallback
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('notifications')
        .insert([{
          id: notif.id,
          title: notif.title,
          message: notif.message,
          severity: notif.severity,
          train_id: notif.train_id || null,
          coach_id: notif.coach_id || null,
          created_at: notif.created_at || new Date().toISOString(),
          is_read: notif.is_read || false
        }])
        .then(
          ({ error }) => {
            if (error) {
              this.enqueueForSync('notification', notif);
            }
          },
          () => {
            this.enqueueForSync('notification', notif);
          }
        );
    }
  }

  // Incidents
  static getIncidents(): IncidentReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading incidents', e);
    }
    return [];
  }

  static saveIncidents(incidents: IncidentReport[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
    } catch (e) {
      console.warn('Error saving incidents', e);
    }
  }

  static addIncident(incident: IncidentReport): void {
    const list = this.getIncidents();
    list.unshift(incident);
    this.saveIncidents(list);

    // Asynchronous Cloud Persistence with Safe Queue Fallback
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('incidents')
        .insert([{
          id: incident.id,
          train_id: incident.train_id,
          coach_id: incident.coach_id || null,
          reported_by: incident.reported_by,
          severity: incident.severity,
          title: incident.title,
          description: incident.description,
          created_at: incident.created_at || new Date().toISOString()
        }])
        .then(
          ({ error }) => {
            if (error) {
              this.enqueueForSync('incident', incident);
            }
          },
          () => {
            this.enqueueForSync('incident', incident);
          }
        );
    }
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading audit logs', e);
    }
    return [];
  }

  static addAuditLog(action: string, details: Record<string, any>, userId?: string): void {
    try {
      const logItem: AuditLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        details,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      const logs = this.getAuditLogs();
      logs.unshift(logItem);
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));

      // Asynchronous Cloud Persistence with Safe Queue Fallback
      if (isSupabaseConfigured && supabase) {
        supabase
          .from('audit_logs')
          .insert([{
            id: logItem.id,
            user_id: logItem.user_id || null,
            action: logItem.action,
            details: logItem.details,
            created_at: logItem.created_at
          }])
          .then(
            ({ error }) => {
              if (error) {
                this.enqueueForSync('audit_log', logItem);
              }
            },
            () => {
              this.enqueueForSync('audit_log', logItem);
            }
          );
      }
    } catch (e) {
      console.warn('Error writing audit log', e);
    }
  }

  // --- OFFLINE SYNC QUEUE & SUPABASE CLOUD RECONCILIATION ---
  static getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading sync queue', e);
    }
    return [];
  }

  static saveSyncQueue(queue: SyncQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue.slice(0, 500)));
    } catch (e) {
      console.warn('Error saving sync queue', e);
    }
  }

  static enqueueForSync(entity: SyncQueueItem['entity'], payload: any): void {
    try {
      const queue = this.getSyncQueue();
      const exists = queue.some(item => item.entity === entity && item.payload?.id === payload?.id);
      if (!exists) {
        queue.push({
          id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          entity,
          payload,
          queued_at: new Date().toISOString(),
          attempts: 0
        });
        this.saveSyncQueue(queue);
      }
    } catch (e) {
      console.warn('Error enqueuing item for sync', e);
    }
  }

  static async reconcileOfflineQueue(): Promise<{ synced: number; failed: number }> {
    if (!isSupabaseConfigured || !supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { synced: 0, failed: 0 };
    }

    const queue = this.getSyncQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        let table = '';
        if (item.entity === 'notification') table = 'notifications';
        else if (item.entity === 'incident') table = 'incidents';
        else if (item.entity === 'audit_log') table = 'audit_logs';
        else if (item.entity === 'weight_reading') table = 'weight_readings';
        else if (item.entity === 'prediction') table = 'predictions';
        else if (item.entity === 'anomaly') table = 'weight_anomaly_logs';
        else if (item.entity === 'inspection') table = 'coach_inspections';
        else if (item.entity === 'assistance_request') table = 'passenger_assistance_requests';

        if (table) {
          // Idempotent existence check preventing duplicate inserts
          const { data: existing } = await supabase
            .from(table)
            .select('id, created_at')
            .eq('id', item.payload.id)
            .maybeSingle();

          if (existing) {
            const cloudTime = new Date(existing.created_at).getTime();
            const localTime = new Date(item.payload.created_at || item.queued_at).getTime();
            if (localTime > cloudTime) {
              await supabase.from(table).update(item.payload).eq('id', item.payload.id);
            }
            synced++;
          } else {
            const { error: insertErr } = await supabase.from(table).insert([item.payload]);
            if (!insertErr) {
              synced++;
            } else {
              item.attempts += 1;
              if (item.attempts < 5) remaining.push(item);
            }
          }
        }
      } catch {
        item.attempts += 1;
        if (item.attempts < 5) remaining.push(item);
      }
    }

    this.saveSyncQueue(remaining);
    if (synced > 0) {
      try {
        localStorage.setItem('slwt_last_sync_timestamp', new Date().toISOString());
      } catch {}
    }
    return { synced, failed: remaining.length };
  }

  static getCloudSyncStatus(): CloudSyncStatusInfo {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const queue = this.getSyncQueue();
    let lastSync: string | undefined = undefined;
    try {
      lastSync = localStorage.getItem('slwt_last_sync_timestamp') || undefined;
    } catch {}

    if (!isSupabaseConfigured) {
      return {
        mode: 'local_demo',
        isOnline,
        pendingCount: 0,
        lastSyncTime: lastSync,
        statusLabel: 'Local Storage Demo Mode (Supabase not configured)'
      };
    }

    if (!isOnline) {
      return {
        mode: 'cloud',
        isOnline: false,
        pendingCount: queue.length,
        lastSyncTime: lastSync,
        statusLabel: `Offline (Pending Sync: ${queue.length})`
      };
    }

    if (queue.length > 0) {
      return {
        mode: 'cloud',
        isOnline: true,
        pendingCount: queue.length,
        lastSyncTime: lastSync,
        statusLabel: `Pending Sync (${queue.length} items queued)`
      };
    }

    return {
      mode: 'cloud',
      isOnline: true,
      pendingCount: 0,
      lastSyncTime: lastSync,
      statusLabel: 'Cloud Persistence Active'
    };
  }

  // Current User Session
  static getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading current user', e);
    }
    return null; // Starts as Guest until genuine user signs in or registers
  }

  static setCurrentUser(user: UserProfile | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn('Error setting current user', e);
    }
  }

  // Separate Simulation Scenarios
  static getSimulationScenario(): Train | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SIMULATION_SCENARIO);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading simulation scenario', e);
    }
    return null;
  }

  static saveSimulationScenario(scenario: Train | null): void {
    try {
      if (scenario) {
        localStorage.setItem(STORAGE_KEYS.SIMULATION_SCENARIO, JSON.stringify(scenario));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SIMULATION_SCENARIO);
      }
    } catch (e) {
      console.warn('Error saving simulation scenario', e);
    }
  }

  static clearSimulationScenario(): void {
    localStorage.removeItem(STORAGE_KEYS.SIMULATION_SCENARIO);
  }

  // User Credentials Store (for offline verification and fallback)
  static saveUserCredential(email: string, password: string): void {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const credsRaw = localStorage.getItem('slwt_user_credentials');
      const creds: Record<string, string> = credsRaw ? JSON.parse(credsRaw) : {};
      creds[cleanEmail] = password;
      localStorage.setItem('slwt_user_credentials', JSON.stringify(creds));
    } catch (e) {
      console.warn('Error saving user credential', e);
    }
  }

  static verifyUserCredential(email: string, password: string): boolean {
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Default seed accounts
      if (cleanEmail === 'admin@railway.gov.in') {
        if (password === 'Pass@123' || password === 'Admin@123' || password === 'admin123' || password === 'Pass123') return true;
      }
      if (cleanEmail === 'staff@railway.gov.in') {
        if (password === 'Pass@123' || password === 'Staff@123' || password === 'staff123' || password === 'Pass123') return true;
      }
      if (cleanEmail === 'passenger@railway.gov.in') {
        if (password === 'Pass@123' || password === 'Passenger@123' || password === 'passenger123' || password === 'Pass123') return true;
      }

      const credsRaw = localStorage.getItem('slwt_user_credentials');
      if (credsRaw) {
        const creds = JSON.parse(credsRaw);
        if (creds[cleanEmail] && creds[cleanEmail] === password) {
          return true;
        }
      }
    } catch (e) {
      console.warn('Error verifying user credential', e);
    }
    return false;
  }

  static getRegisteredUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem('slwt_registered_users');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading registered users', e);
    }

    // Default Seed Accounts for Local Demo and Offline Evaluation
    const defaultAccounts: UserProfile[] = [
      {
        id: 'usr-admin-01',
        full_name: 'Rajesh Sharma (Chief Controller)',
        email: 'admin@railway.gov.in',
        role: 'admin',
        created_at: '2026-01-15T08:00:00.000Z',
        employee_id: 'IR-HQ-ADM-001',
        department: 'Central Traffic & Fleet Control',
        status: 'active'
      },
      {
        id: 'usr-staff-01',
        full_name: 'Suresh Patil (Station Superintendent)',
        email: 'staff@railway.gov.in',
        role: 'staff',
        created_at: '2026-02-10T09:30:00.000Z',
        employee_id: 'IR-CSTM-STF-042',
        department: 'Station Operations (CSMT Platform 3)',
        status: 'active'
      },
      {
        id: 'usr-passenger-01',
        full_name: 'Pooja Verma (Commuter)',
        email: 'passenger@railway.gov.in',
        role: 'passenger',
        created_at: '2026-03-01T11:15:00.000Z',
        status: 'active'
      }
    ];

    try {
      localStorage.setItem('slwt_registered_users', JSON.stringify(defaultAccounts));
    } catch {}

    return defaultAccounts;
  }

  static saveRegisteredUsers(users: UserProfile[]): void {
    try {
      localStorage.setItem('slwt_registered_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving registered users', e);
    }
  }

  static addStaffMember(staff: UserProfile): void {
    const users = this.getRegisteredUsers();
    users.push(staff);
    this.saveRegisteredUsers(users);
    this.addAuditLog('Staff Account Provisioned', {
      employee_id: staff.employee_id,
      email: staff.email,
      department: staff.department,
      full_name: staff.full_name
    });
  }

  static updateUser(updatedUser: UserProfile): void {
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    this.saveRegisteredUsers(users);
  }

  static updateUserStatus(userId: string, status: 'active' | 'inactive' | 'pending'): void {
    const users = this.getRegisteredUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status } : u);
    this.saveRegisteredUsers(updated);
    this.addAuditLog('User Account Status Updated', { userId, newStatus: status });
  }

  static getPendingRequests(): UserProfile[] {
    const users = this.getRegisteredUsers();
    return users.filter(u => u.status === 'pending');
  }

  static approveRegistrationRequest(userId: string): { success: boolean; message: string } {
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Registration request not found.' };
    }

    user.status = 'active';
    this.saveRegisteredUsers(users);
    this.addAuditLog('Registration Request Approved by Admin', {
      userId,
      email: user.email,
      role: user.role,
      name: user.full_name
    });

    return {
      success: true,
      message: `Account for ${user.full_name} (${user.email}) has been approved and activated.`
    };
  }

  static rejectRegistrationRequest(userId: string, reason?: string): { success: boolean; message: string } {
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return { success: false, message: 'Registration request not found.' };
    }

    const filtered = users.filter(u => u.id !== userId);
    this.saveRegisteredUsers(filtered);
    this.addAuditLog('Registration Request Rejected by Admin', {
      userId,
      email: user.email,
      role: user.role,
      reason: reason || 'Administrative Discretion'
    });

    return {
      success: true,
      message: `Registration request for ${user.full_name} has been rejected.`
    };
  }

  static clearSessionCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing session cache', e);
    }
  }

  static deleteUser(userId: string): void {
    const users = this.getRegisteredUsers();
    const filtered = users.filter(u => u.id !== userId);
    this.saveRegisteredUsers(filtered);
    this.addAuditLog('User Account Removed', { userId });
  }

  // Staff Task Work Distribution
  static getStaffTasks(): StaffTask[] {
    try {
      const data = localStorage.getItem('slwt_staff_tasks');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading staff tasks', e);
    }

    // No fake demonstration staff tasks injected. Returns empty list if no operational tasks exist.
    return [];
  }

  static saveStaffTasks(tasks: StaffTask[]): void {
    try {
      localStorage.setItem('slwt_staff_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Error saving staff tasks', e);
    }
  }

  static addStaffTask(task: StaffTask): void {
    const tasks = this.getStaffTasks();
    tasks.unshift(task);
    this.saveStaffTasks(tasks);
    this.addAuditLog('Staff Task Assigned', {
      taskId: task.id,
      title: task.title,
      assigned_to: task.assigned_to_name || task.assigned_to,
      priority: task.priority
    });
  }

  static updateStaffTask(updatedTask: StaffTask): void {
    const tasks = this.getStaffTasks();
    const idx = tasks.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) {
      tasks[idx] = { ...updatedTask, updated_at: new Date().toISOString() };
    } else {
      tasks.unshift(updatedTask);
    }
    this.saveStaffTasks(tasks);
    this.addAuditLog('Staff Task Updated', {
      taskId: updatedTask.id,
      status: updatedTask.status,
      assigned_to: updatedTask.assigned_to_name
    });
  }

  static deleteStaffTask(taskId: string): void {
    const tasks = this.getStaffTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.saveStaffTasks(filtered);
    this.addAuditLog('Staff Task Removed', { taskId });
  }

  // -------------------------------------------------------------
  // FEEDBACK & ISSUE RESOLUTION MANAGEMENT
  // -------------------------------------------------------------
  static getFeedbackSubmissions(): FeedbackSubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading feedback submissions from localStorage', e);
    }

    // Default demonstration feedback records covering multiple roles
    const seedFeedback: FeedbackSubmission[] = [
      {
        id: 'fb-seed-001',
        ticket_id: 'FB-2026-0001',
        user_id: 'usr-pax-101',
        user_name: 'Rohit Sharma (Commuter)',
        user_email: 'rohit.commuter@gmail.com',
        user_role: 'passenger',
        title: 'Coach S2 crowd indicator status discrepancy at Dadar Junction',
        category: 'Coach Monitoring Issue',
        description: 'On Train 12101 arriving at Dadar Platform 4, the platform display showed Coach S2 at 45% occupancy, but physical observation indicated heavy boarding (~85%). Please verify sensor calibration.',
        related_module: 'Passenger Portal / Platform Display',
        priority: 'Medium',
        status: 'Under Review',
        admin_response: 'Senior Section Engineer (Dadar Depot) has been notified to run zero tare recalibration on Rake 12101 bogie sensors.',
        admin_responder_name: 'Central Control Admin',
        assigned_to_name: 'Dadar Rolling Stock Wing',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'fb-seed-002',
        ticket_id: 'FB-2026-0002',
        user_id: 'usr-stf-202',
        user_name: 'Amit Deshmukh (Station Master)',
        user_email: 'staff@railway.gov.in',
        user_role: 'staff',
        title: 'Request automated audible klaxon on lateral bogie weight imbalance > 15%',
        category: 'Feature Request',
        description: 'When coaches exhibit extreme lateral weight delta (>15% across bogie secondary coils), Station Master desk needs an audible horn alert in addition to visual toast notification.',
        related_module: 'Staff Operations Desk',
        priority: 'High',
        status: 'In Progress',
        admin_response: 'Feature approved and integrated into Phase 4 safety escalation matrix under escalation rule ER-001.',
        admin_responder_name: 'Chief Rolling Stock Engineer',
        assigned_to_name: 'Software Automation Lead',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        id: 'fb-seed-003',
        ticket_id: 'FB-2026-0003',
        user_id: 'usr-fac-303',
        user_name: 'Dr. S. K. Kulkarni (Project Guide / Faculty)',
        user_email: 'faculty.guide@engg.edu',
        user_role: 'faculty',
        title: 'Holt-Winters crowd prediction MAE / RMSE validation metrics export',
        category: 'Improvement Suggestion',
        description: 'For project defense, faculty evaluation requires direct export of forecast accuracy metrics comparing predicted vs ground-truth simulated weight values over 15-, 30-, and 60-minute horizons.',
        related_module: 'AI Predictions / Operational Reports',
        priority: 'Low',
        status: 'Resolved',
        admin_response: 'Holt-Winters accuracy table (MAE: 1.48% / RMSE: 2.12%) is now exported in the System Diagnostics Report CSV and visible under Reports Page.',
        admin_responder_name: 'Lead AI Engineer',
        assigned_to_name: 'Data Science Division',
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        resolved_at: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ];

    this.saveFeedbackSubmissions(seedFeedback);
    return seedFeedback;
  }

  static saveFeedbackSubmissions(items: FeedbackSubmission[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving feedback submissions to localStorage', e);
    }
  }

  static generateFeedbackTicketId(): string {
    const existing = this.getFeedbackSubmissions();
    const currentYear = new Date().getFullYear();
    const count = existing.length + 1;
    return `FB-${currentYear}-${String(count).padStart(4, '0')}`;
  }

  static addFeedbackSubmission(data: Omit<FeedbackSubmission, 'id' | 'ticket_id' | 'created_at' | 'updated_at' | 'status'> & { status?: FeedbackSubmission['status'] }): FeedbackSubmission {
    const submissions = this.getFeedbackSubmissions();
    const ticket_id = this.generateFeedbackTicketId();
    const newSubmission: FeedbackSubmission = {
      ...data,
      id: 'fb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      ticket_id,
      status: data.status || 'Submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    submissions.unshift(newSubmission);
    this.saveFeedbackSubmissions(submissions);

    // Audit Log
    this.addAuditLog('Feedback Submitted', {
      ticket_id: newSubmission.ticket_id,
      title: newSubmission.title,
      category: newSubmission.category,
      role: newSubmission.user_role
    });

    // Notify Admin of new submission
    this.addNotification({
      id: 'notif-fb-' + Date.now(),
      created_at: new Date().toISOString(),
      title: `New ${newSubmission.user_role.toUpperCase()} Feedback: ${newSubmission.ticket_id}`,
      message: `[${newSubmission.category}] ${newSubmission.title} (Priority: ${newSubmission.priority}) submitted by ${newSubmission.user_name}`,
      severity: newSubmission.priority === 'Critical' ? 'critical' : newSubmission.priority === 'High' ? 'warning' : 'info',
      is_read: false
    });

    return newSubmission;
  }

  static updateFeedbackSubmission(id: string, updates: Partial<FeedbackSubmission>): FeedbackSubmission | null {
    const submissions = this.getFeedbackSubmissions();
    const idx = submissions.findIndex(f => f.id === id || f.ticket_id === id);
    if (idx === -1) return null;

    const previous = submissions[idx];
    const updated: FeedbackSubmission = {
      ...previous,
      ...updates,
      updated_at: new Date().toISOString(),
      resolved_at: updates.status === 'Resolved' || updates.status === 'Closed' ? (previous.resolved_at || new Date().toISOString()) : previous.resolved_at
    };

    submissions[idx] = updated;
    this.saveFeedbackSubmissions(submissions);

    // Audit Log
    this.addAuditLog('Feedback Status Updated', {
      ticket_id: updated.ticket_id,
      status: updated.status,
      admin_response: Boolean(updates.admin_response)
    });

    // Notify submitting user of status change / response
    if (updates.status && updates.status !== previous.status) {
      this.addNotification({
        id: 'notif-fb-' + Date.now(),
        created_at: new Date().toISOString(),
        title: `Feedback ${updated.ticket_id} Status: ${updated.status}`,
        message: `Your issue "${updated.title}" has been moved to ${updated.status}.${updated.admin_response ? ' Response: ' + updated.admin_response.substring(0, 80) + '...' : ''}`,
        severity: updated.status === 'Resolved' ? 'info' : 'warning',
        is_read: false
      });
    }

    return updated;
  }

  static getFeedbackStatistics() {
    const items = this.getFeedbackSubmissions();
    return {
      total: items.length,
      submitted: items.filter(i => i.status === 'Submitted').length,
      underReview: items.filter(i => i.status === 'Under Review').length,
      inProgress: items.filter(i => i.status === 'In Progress').length,
      awaitingInfo: items.filter(i => i.status === 'Awaiting Information').length,
      resolved: items.filter(i => i.status === 'Resolved').length,
      closed: items.filter(i => i.status === 'Closed').length,
      rejected: items.filter(i => i.status === 'Rejected').length,
      critical: items.filter(i => i.priority === 'Critical').length
    };
  }

  // Complete clean state reset
  static resetAllToCleanState(): void {
    localStorage.removeItem(STORAGE_KEYS.TRAINS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    localStorage.removeItem(STORAGE_KEYS.READINGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SIMULATION_SCENARIO);
    // Also remove legacy v1 keys if present
    localStorage.removeItem('slwt_trains_v1');
    localStorage.removeItem('slwt_readings_history_v1');
    localStorage.removeItem('slwt_notifications_v1');
    localStorage.removeItem('slwt_profiles_v1');
    localStorage.removeItem('slwt_current_user_v1');
    localStorage.removeItem('slwt_incidents_v1');
    localStorage.removeItem('slwt_audit_logs_v1');
  }

  static resetAllToDefaults(): void {
    this.resetAllToCleanState();
  }
}
