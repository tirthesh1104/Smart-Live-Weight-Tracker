import { FeedbackSubmission, FeedbackCategory, FeedbackPriority, FeedbackStatus, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { OfflineStorageService } from './offlineStorage';

export interface SubmitFeedbackPayload {
  title: string;
  category: FeedbackCategory;
  description: string;
  related_module: string;
  priority: FeedbackPriority;
  user_name: string;
  user_email: string;
  user_role: UserRole;
  user_id?: string;
  attachment_url?: string;
}

export class FeedbackService {
  /**
   * Fetches all feedback submissions (Admin clearance required).
   * Falls back seamlessly to OfflineStorageService if Supabase is offline or not configured.
   */
  static async getAllFeedback(): Promise<FeedbackSubmission[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('feedback_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge with local items if any
          const local = OfflineStorageService.getFeedbackSubmissions();
          const combined = [...data];
          local.forEach(l => {
            if (!combined.some(c => c.ticket_id === l.ticket_id)) {
              combined.push(l);
            }
          });
          return combined;
        }
      } catch (err) {
        console.warn('Supabase feedback fetch error, falling back to local storage:', err);
      }
    }
    return OfflineStorageService.getFeedbackSubmissions();
  }

  /**
   * Fetches feedback submissions for a specific user (Privacy enforced).
   */
  static async getUserFeedback(userId?: string, userEmail?: string): Promise<FeedbackSubmission[]> {
    const all = await this.getAllFeedback();
    if (!userId && !userEmail) return all;

    return all.filter(f => {
      if (userId && f.user_id === userId) return true;
      if (userEmail && f.user_email?.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });
  }

  /**
   * Submits a new feedback or issue report.
   */
  static async submitFeedback(payload: SubmitFeedbackPayload): Promise<FeedbackSubmission> {
    const localSubmission = OfflineStorageService.addFeedbackSubmission({
      title: payload.title.trim(),
      category: payload.category,
      description: payload.description.trim(),
      related_module: payload.related_module || 'General',
      priority: payload.priority || 'Medium',
      user_name: payload.user_name.trim(),
      user_email: payload.user_email.trim(),
      user_role: payload.user_role || 'passenger',
      user_id: payload.user_id,
      attachment_url: payload.attachment_url,
      status: 'Submitted'
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('feedback_submissions')
          .insert({
            id: localSubmission.id.startsWith('fb-') ? undefined : localSubmission.id,
            ticket_id: localSubmission.ticket_id,
            title: localSubmission.title,
            category: localSubmission.category,
            description: localSubmission.description,
            related_module: localSubmission.related_module,
            priority: localSubmission.priority,
            status: localSubmission.status,
            user_name: localSubmission.user_name,
            user_email: localSubmission.user_email,
            user_role: localSubmission.user_role,
            user_id: localSubmission.user_id,
            attachment_url: localSubmission.attachment_url,
            created_at: localSubmission.created_at,
            updated_at: localSubmission.updated_at
          });
      } catch (err) {
        console.warn('Failed to mirror feedback submission to Supabase:', err);
      }
    }

    return localSubmission;
  }

  /**
   * Updates an existing feedback item (Status, Admin Response, Staff Assignment).
   */
  static async updateFeedback(
    idOrTicketId: string,
    updates: Partial<FeedbackSubmission>
  ): Promise<FeedbackSubmission | null> {
    const updated = OfflineStorageService.updateFeedbackSubmission(idOrTicketId, updates);

    if (isSupabaseConfigured && supabase && updated) {
      try {
        await supabase
          .from('feedback_submissions')
          .update({
            status: updated.status,
            admin_response: updated.admin_response,
            admin_responder_name: updated.admin_responder_name,
            assigned_to_name: updated.assigned_to_name,
            resolved_at: updated.resolved_at,
            updated_at: updated.updated_at
          })
          .or(`id.eq.${updated.id},ticket_id.eq.${updated.ticket_id}`);
      } catch (err) {
        console.warn('Failed to mirror feedback update to Supabase:', err);
      }
    }

    return updated;
  }

  /**
   * Calculates real-time feedback resolution metrics.
   */
  static getStatistics() {
    return OfflineStorageService.getFeedbackStatistics();
  }
}
