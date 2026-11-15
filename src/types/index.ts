export type UserRole = 'admin' | 'staff' | 'passenger' | 'faculty';

export type FeedbackCategory =
  | 'General Feedback'
  | 'Technical Problem'
  | 'Login or Registration Issue'
  | 'Train Information Issue'
  | 'Coach Monitoring Issue'
  | 'Weight Simulation Issue'
  | 'AI Prediction Issue'
  | 'Dashboard Issue'
  | 'Feature Request'
  | 'Improvement Suggestion'
  | 'Other';

export type FeedbackPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type FeedbackStatus =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Awaiting Information'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export interface FeedbackSubmission {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  user_role: UserRole;
  title: string;
  category: FeedbackCategory;
  description: string;
  related_module: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  attachment_url?: string;
  admin_response?: string;
  admin_responder_id?: string;
  admin_responder_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  station_code?: string;
  status?: 'active' | 'inactive' | 'pending';
  phone?: string;
  justification?: string;
}

export type StaffTaskType = 
  | 'Coach Inspection' 
  | 'Sensor Calibration' 
  | 'Weight Anomaly Verification' 
  | 'Passenger Assistance' 
  | 'Station Duty' 
  | 'Emergency Response'
  | 'Incident Response'
  | 'Weight Monitoring'
  | 'Safety Verification'
  | 'General Operations';

export type StaffTaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type StaffTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  task_type: StaffTaskType;
  assigned_to?: string;
  assigned_to_email?: string;
  assigned_to_name?: string;
  assigned_by?: string;
  train_id?: string;
  train_number?: string;
  coach_no?: string;
  priority: StaffTaskPriority;
  status: StaffTaskStatus;
  due_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type CoachType = 
  | 'Engine' 
  | 'General' 
  | 'Sleeper' 
  | 'AC 3 Tier' 
  | 'AC 2 Tier' 
  | 'Second Sitting' 
  | 'Pantry Car'
  | 'AC First Class'
  | 'AC 3 Economy'
  | 'AC Chair Car'
  | 'Executive Chair Car';

export type CoachClassCode = 'SL' | '3A' | '2A' | '1A' | '3E' | '2S' | 'CC' | 'EC' | 'GEN';

export type BerthType = 
  | 'LB' // Lower Berth
  | 'MB' // Middle Berth
  | 'UB' // Upper Berth
  | 'SL' // Side Lower
  | 'SU' // Side Upper
  | 'SM' // Side Middle (3E)
  | 'WINDOW' // Chair Car Window
  | 'MIDDLE' // Chair Car Middle
  | 'AISLE' // Chair Car Aisle
  | 'CABIN_LB' // 1A Cabin Lower
  | 'CABIN_UB' // 1A Cabin Upper
  | 'COUPE_LB' // 1A Coupe Lower
  | 'COUPE_UB'; // 1A Coupe Upper

export type BookingStatus = 
  | 'Available'
  | 'Occupied – Full Journey'
  | 'Occupied – Partial Journey'
  | 'Reserved'
  | 'RAC'
  | 'Waiting List'
  | 'Unverified'
  | 'Not Applicable';

export type PhysicalOccupancyStatus =
  | 'Occupied'
  | 'Vacant'
  | 'Unconfirmed';

export type VerificationState =
  | 'Submitted'
  | 'Pending Verification'
  | 'Verified'
  | 'Rejected';

export interface SeatBerth {
  id: string;
  coach_id: string;
  coach_no: string;
  seat_number: number;
  berth_type: BerthType;
  bay_number: number;
  deck_level?: 'lower' | 'middle' | 'upper';
  is_side_berth?: boolean;
  booking_status: BookingStatus;
  physical_status: PhysicalOccupancyStatus;
  journey_from?: string;
  journey_to?: string;
  pnr_masked?: string;
  pnr_full?: string;
  passenger_name_masked?: string;
  passenger_name_full?: string;
  gender?: string;
  age?: number;
  last_checked_at?: string;
  verified_by?: string;
  verification_state?: VerificationState;
  discrepancy_note?: string;
  data_source?: DataSourceType;
}

export interface PassengerSubmission {
  id: string;
  user_id?: string;
  train_id: string;
  train_number: string;
  train_name: string;
  coach_no: string;
  seat_number: number;
  pnr_number: string;
  passenger_name: string;
  mobile_masked?: string;
  journey_from: string;
  journey_to: string;
  journey_date: string;
  is_physically_present: boolean;
  verification_state: VerificationState;
  staff_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface CoachLayoutTemplate {
  class_code: CoachClassCode;
  class_name: string;
  category: string;
  total_seats: number;
  has_middle_berth: boolean;
  has_side_berth: boolean;
  is_chair_car: boolean;
  bays_count: number;
  seats_per_bay: number;
  description: string;
}

export type OccupancyStatus = 'available' | 'moderate' | 'full' | 'overloaded';

export type DataSourceType = 
  | 'SIMULATED DATA' 
  | 'DEMO DATA' 
  | 'REAL DATA' 
  | 'VERIFIED_REAL' 
  | 'OFFICIAL_HISTORICAL' 
  | 'AUTHORIZED_LIVE' 
  | 'MANUAL_ENTRY' 
  | 'MANUAL_VERIFIED' 
  | 'SIMULATED_TEST' 
  | 'ACCESS_NOT_AUTHORIZED' 
  | 'UNAVAILABLE'
  | 'THIRD_PARTY_LIVE'
  | 'THIRD_PARTY_SCHEDULED'
  | 'THIRD_PARTY_API'
  | 'DUAL_VERIFIED'
  | 'RailRadar'
  | 'RailCore'
  | 'Qrail';

export interface Coach {
  id: string;
  train_id: string;
  coach_no: string;
  coach_type: CoachType;
  empty_weight_kg: number;
  max_capacity_kg: number;
  created_at?: string;
  // Live state
  current_weight_kg: number;
  occupancy_percentage: number;
  status: OccupancyStatus;
  last_updated: string;
  data_source?: DataSourceType;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  from_station: string;
  to_station: string;
  coaches: Coach[];
  created_at?: string;
  data_source?: DataSourceType;
}

export interface WeightReading {
  id: string;
  coach_id: string;
  weight_kg: number;
  recorded_at: string;
  source: string;
  is_simulated: boolean;
  data_source?: DataSourceType;
  occupancy_percentage?: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'overload';
  train_id?: string;
  coach_id?: string;
  created_at: string;
  is_read: boolean;
}

export type Notification = SystemNotification;

export interface PredictionHorizon {
  horizon_minutes: 15 | 30 | 60;
  predicted_occupancy: number;
  predicted_weight_kg: number;
  lower_bound_kg?: number;
  upper_bound_kg?: number;
  confidence_score: number;
  status: string;
  explanation: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface IncidentReport {
  id: string;
  train_id: string;
  coach_id?: string;
  reported_by: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  created_at: string;
}
