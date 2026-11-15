import { StaffTask, StaffTaskStatus, StaffTaskPriority, StaffTaskType } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { OfflineStorageService } from './offlineStorage';

export class StaffTaskService {
  /**
   * Fetch tasks with strict isolation:
   * - If role is 'staff' and userId is provided, return ONLY tasks assigned to this staff member.
   * - If role is 'admin', return all tasks.
   */
  static async getTasksForUser(userId?: string, userEmail?: string, isAdmin: boolean = false): Promise<StaffTask[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('staff_tasks').select('*').order('created_at', { ascending: false });
        
        // Strict Data Isolation: Staff can only query their own tasks
        if (!isAdmin && userId) {
          query = query.or(`assigned_to.eq.${userId},assigned_to_email.eq.${userEmail || ''}`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data as StaffTask[];
        }
      } catch (e) {
        console.warn('Supabase staff_tasks fetch failed, falling back to local storage', e);
      }
    }

    // Local / Offline fallback with strict role filtering
    const allLocal = OfflineStorageService.getStaffTasks();
    if (isAdmin) {
      return allLocal;
    }

    if (!userId && !userEmail) {
      return [];
    }

    const cleanEmail = (userEmail || '').toLowerCase().trim();
    return allLocal.filter(t => 
      (userId && t.assigned_to === userId) ||
      (cleanEmail && t.assigned_to_email && t.assigned_to_email.toLowerCase().trim() === cleanEmail)
    );
  }

  /**
   * Create a new task (Admin only)
   */
  static async createTask(task: Omit<StaffTask, 'id' | 'created_at' | 'updated_at'>): Promise<StaffTask> {
    const newTask: StaffTask = {
      ...task,
      id: 'tsk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('staff_tasks').insert([
          {
            title: newTask.title,
            description: newTask.description,
            task_type: newTask.task_type,
            assigned_to: newTask.assigned_to || null,
            assigned_to_email: newTask.assigned_to_email || null,
            assigned_to_name: newTask.assigned_to_name || null,
            assigned_by: newTask.assigned_by || null,
            train_id: newTask.train_id || null,
            coach_no: newTask.coach_no || null,
            priority: newTask.priority,
            status: newTask.status,
            due_date: newTask.due_date || null,
            notes: newTask.notes || null
          }
        ]).select().maybeSingle();

        if (data && !error) {
          newTask.id = data.id;
        }
      } catch (e) {
        console.warn('Supabase staff_tasks insert error, stored locally', e);
      }
    }

    OfflineStorageService.addStaffTask(newTask);
    return newTask;
  }

  /**
   * Update task status and/or notes (Staff or Admin)
   */
  static async updateTaskStatus(taskId: string, status: StaffTaskStatus, notes?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: any = { status, updated_at: new Date().toISOString() };
        if (notes !== undefined) payload.notes = notes;
        await supabase.from('staff_tasks').update(payload).eq('id', taskId);
      } catch (e) {
        console.warn('Supabase staff_tasks update error, updating locally', e);
      }
    }

    const tasks = OfflineStorageService.getStaffTasks();
    const existing = tasks.find(t => t.id === taskId);
    if (existing) {
      existing.status = status;
      if (notes !== undefined) existing.notes = notes;
      existing.updated_at = new Date().toISOString();
      OfflineStorageService.updateStaffTask(existing);
    }
  }

  /**
   * Reassign a task to another staff member (Admin only)
   */
  static async reassignTask(
    taskId: string, 
    assignedTo: { id: string; name: string; email: string },
    priority?: StaffTaskPriority
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: any = {
          assigned_to: assignedTo.id,
          assigned_to_name: assignedTo.name,
          assigned_to_email: assignedTo.email,
          updated_at: new Date().toISOString()
        };
        if (priority) payload.priority = priority;
        await supabase.from('staff_tasks').update(payload).eq('id', taskId);
      } catch (e) {
        console.warn('Supabase staff_tasks reassign error', e);
      }
    }

    const tasks = OfflineStorageService.getStaffTasks();
    const existing = tasks.find(t => t.id === taskId);
    if (existing) {
      existing.assigned_to = assignedTo.id;
      existing.assigned_to_name = assignedTo.name;
      existing.assigned_to_email = assignedTo.email;
      if (priority) existing.priority = priority;
      existing.updated_at = new Date().toISOString();
      OfflineStorageService.updateStaffTask(existing);
    }
  }

  /**
   * Delete a task (Admin only)
   */
  static async deleteTask(taskId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('staff_tasks').delete().eq('id', taskId);
      } catch (e) {}
    }
    OfflineStorageService.deleteStaffTask(taskId);
  }
}
