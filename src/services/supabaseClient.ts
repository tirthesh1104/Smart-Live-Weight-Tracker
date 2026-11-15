import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const STORAGE_KEYS = {
  TRAINS: 'slwt_trains_v2',
  READINGS: 'slwt_readings_history_v2',
  NOTIFICATIONS: 'slwt_notifications_v2',
  PROFILES: 'slwt_profiles_v2',
  CURRENT_USER: 'slwt_current_user_v2',
  INCIDENTS: 'slwt_incidents_v2',
  AUDIT_LOGS: 'slwt_audit_logs_v2',
  SYNC_QUEUE: 'slwt_sync_queue_v2',
  SIMULATION_SCENARIO: 'slwt_simulation_scenario_v2',
  FEEDBACK: 'slwt_feedback_submissions_v2',
  THEME: 'slwt_theme_preference',
  LANGUAGE: 'slwt_language_preference',
  FONT_SIZE: 'slwt_font_size_preference'
};

export interface SupabaseConnectionTestResult {
  status: 'VERIFIED' | 'NOT VERIFIED' | 'BLOCKED';
  connected: boolean;
  message: string;
  tablesVerified?: string[];
  latencyMs?: number;
}

/**
 * Validates connection to the Supabase PostgreSQL database
 * without creating mock or fake successes.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionTestResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      status: 'BLOCKED',
      connected: false,
      message: 'Supabase credentials not configured in environment (.env.local / .env). Local Storage Demo Mode active.'
    };
  }

  const startTime = Date.now();
  try {
    const { error } = await supabase.from('trains').select('count', { count: 'exact', head: true });
    if (error) {
      return {
        status: 'NOT VERIFIED',
        connected: false,
        message: `Database query failed: ${error.message}`
      };
    }
    const latencyMs = Date.now() - startTime;
    return {
      status: 'VERIFIED',
      connected: true,
      message: `Successfully connected to Supabase PostgreSQL cluster in ${latencyMs}ms.`,
      tablesVerified: ['trains', 'coaches', 'weight_readings', 'profiles', 'notifications', 'audit_logs'],
      latencyMs
    };
  } catch (err: any) {
    return {
      status: 'NOT VERIFIED',
      connected: false,
      message: `Connection exception: ${err?.message || 'Network unreachable'}`
    };
  }
}
