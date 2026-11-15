import { 
  Coach, 
  Train, 
  SeatBerth, 
  BerthType, 
  CoachClassCode, 
  CoachLayoutTemplate, 
  PassengerSubmission,
  VerificationState,
  BookingStatus,
  PhysicalOccupancyStatus
} from '../types';
import { OfflineStorageService } from './offlineStorage';

// Standard Indian Railways Coach Layout Templates
export const COACH_LAYOUT_TEMPLATES: Record<CoachClassCode, CoachLayoutTemplate> = {
  SL: {
    class_code: 'SL',
    class_name: 'Sleeper Class',
    category: 'Non-AC Sleeper',
    total_seats: 72,
    has_middle_berth: true,
    has_side_berth: true,
    is_chair_car: false,
    bays_count: 9,
    seats_per_bay: 8,
    description: 'Standard 72-berth broad-gauge sleeper rake with Lower, Middle, Upper, and Side Lower/Upper berths.'
  },
  '3A': {
    class_code: '3A',
    class_name: 'AC 3 Tier',
    category: 'Air Conditioned Sleeper',
    total_seats: 64,
    has_middle_berth: true,
    has_side_berth: true,
    is_chair_car: false,
    bays_count: 8,
    seats_per_bay: 8,
    description: '64-berth air-conditioned 3-tier coach with 8 berths per compartment bay.'
  },
  '2A': {
    class_code: '2A',
    class_name: 'AC 2 Tier',
    category: 'Air Conditioned Sleeper',
    total_seats: 48,
    has_middle_berth: false,
    has_side_berth: true,
    is_chair_car: false,
    bays_count: 8,
    seats_per_bay: 6,
    description: 'Spacious 48-berth 2-tier coach without middle berths; 4 berths in cabin bay and 2 on side.'
  },
  '1A': {
    class_code: '1A',
    class_name: 'AC First Class',
    category: 'Air Conditioned Luxury Sleeper',
    total_seats: 24,
    has_middle_berth: false,
    has_side_berth: false,
    is_chair_car: false,
    bays_count: 6,
    seats_per_bay: 4,
    description: '24-berth first class coach configured with private lockable 4-berth Cabins (A-D) and 2-berth Coupes (E-F).'
  },
  '3E': {
    class_code: '3E',
    class_name: 'AC 3 Economy',
    category: 'Air Conditioned High-Density Sleeper',
    total_seats: 83,
    has_middle_berth: true,
    has_side_berth: true,
    is_chair_car: false,
    bays_count: 9,
    seats_per_bay: 9,
    description: 'Modern 3E high-capacity coach with 6 main compartment berths plus Side Lower, Side Middle, and Side Upper.'
  },
  '2S': {
    class_code: '2S',
    class_name: 'Second Sitting',
    category: 'Non-AC Reserved Chair Car',
    total_seats: 108,
    has_middle_berth: false,
    has_side_berth: false,
    is_chair_car: true,
    bays_count: 18,
    seats_per_bay: 6,
    description: '108-seat second-class reserved seating configured with 3+3 seats per row across central aisle.'
  },
  CC: {
    class_code: 'CC',
    class_name: 'AC Chair Car',
    category: 'Air Conditioned Seating',
    total_seats: 73,
    has_middle_berth: false,
    has_side_berth: false,
    is_chair_car: true,
    bays_count: 15,
    seats_per_bay: 5,
    description: 'Intercity air-conditioned chair car arranged with 3 seats on left, aisle, and 2 seats on right.'
  },
  EC: {
    class_code: 'EC',
    class_name: 'Executive Chair Car',
    category: 'Air Conditioned Premium Seating',
    total_seats: 56,
    has_middle_berth: false,
    has_side_berth: false,
    is_chair_car: true,
    bays_count: 14,
    seats_per_bay: 4,
    description: 'Executive class coach with spacious 2+2 ergonomic reclining seats and wide central aisle.'
  },
  GEN: {
    class_code: 'GEN',
    class_name: 'General / Unreserved',
    category: 'Unreserved Bogie',
    total_seats: 90,
    has_middle_berth: false,
    has_side_berth: false,
    is_chair_car: true,
    bays_count: 15,
    seats_per_bay: 6,
    description: 'General unreserved coach for short-distance and unreserved travel.'
  }
};

export class CoachLayoutService {
  /**
   * Identifies the CoachClassCode from coach type or coach number
   */
  static getCoachClassCode(coachType: string, coachNo: string): CoachClassCode {
    const cType = (coachType || '').toLowerCase();
    const cNo = (coachNo || '').toUpperCase();

    if (cType.includes('sleeper') || cNo.startsWith('S')) return 'SL';
    if (cType.includes('3 economy') || cNo.startsWith('M')) return '3E';
    if (cType.includes('3 tier') || cNo.startsWith('B')) return '3A';
    if (cType.includes('2 tier') || cNo.startsWith('A')) return '2A';
    if (cType.includes('first') || cNo.startsWith('H')) return '1A';
    if (cType.includes('second sitting') || cNo.startsWith('D')) return '2S';
    if (cType.includes('chair car') || cNo.startsWith('C')) return 'CC';
    if (cType.includes('executive') || cNo.startsWith('E')) return 'EC';
    return 'GEN';
  }

  /**
   * Returns the layout template for a given coach
   */
  static getTemplate(coach: Coach): CoachLayoutTemplate {
    const code = this.getCoachClassCode(coach.coach_type, coach.coach_no);
    return COACH_LAYOUT_TEMPLATES[code] || COACH_LAYOUT_TEMPLATES.SL;
  }

  /**
   * Deterministically calculates the berth type for a seat number in a given class
   */
  static getBerthType(classCode: CoachClassCode, seatNo: number): BerthType {
    if (classCode === 'SL' || classCode === '3A') {
      const mod = seatNo % 8;
      if (mod === 1 || mod === 4) return 'LB';
      if (mod === 2 || mod === 5) return 'MB';
      if (mod === 3 || mod === 6) return 'UB';
      if (mod === 7) return 'SL';
      return 'SU';
    }

    if (classCode === '2A') {
      const mod = seatNo % 6;
      if (mod === 1 || mod === 3) return 'LB';
      if (mod === 2 || mod === 4) return 'UB';
      if (mod === 5) return 'SL';
      return 'SU';
    }

    if (classCode === '1A') {
      // Cabins 1-16 (A, B, C, D of 4 berths each), Coupes 17-24 (E, F of 2 berths each)
      if (seatNo <= 16) {
        return seatNo % 2 === 1 ? 'CABIN_LB' : 'CABIN_UB';
      }
      return seatNo % 2 === 1 ? 'COUPE_LB' : 'COUPE_UB';
    }

    if (classCode === '3E') {
      const mod = seatNo % 9;
      if (mod === 1 || mod === 4) return 'LB';
      if (mod === 2 || mod === 5) return 'MB';
      if (mod === 3 || mod === 6) return 'UB';
      if (mod === 7) return 'SL';
      if (mod === 8) return 'SM';
      return 'SU';
    }

    if (classCode === 'CC') {
      const mod = seatNo % 5;
      if (mod === 1) return 'WINDOW';
      if (mod === 2) return 'MIDDLE';
      if (mod === 3 || mod === 4) return 'AISLE';
      return 'WINDOW';
    }

    if (classCode === 'EC') {
      const mod = seatNo % 4;
      if (mod === 1 || mod === 0) return 'WINDOW';
      return 'AISLE';
    }

    if (classCode === '2S' || classCode === 'GEN') {
      const mod = seatNo % 6;
      if (mod === 1 || mod === 0) return 'WINDOW';
      if (mod === 2 || mod === 5) return 'MIDDLE';
      return 'AISLE';
    }

    return 'LB';
  }

  /**
   * Generates or loads the seat list for a specific coach
   */
  static getCoachSeats(coach: Coach, train: Train): SeatBerth[] {
    const storageKey = `slwt_seats_${coach.id}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const template = this.getTemplate(coach);
    const total = template.total_seats;
    const classCode = template.class_code;
    const fromStation = train.from_station || 'CSMT';
    const toStation = train.to_station || 'PUNE';

    const seats: SeatBerth[] = [];
    const occPct = coach.occupancy_percentage || 50;

    // Sample commuter names for simulated records
    const sampleNames = [
      { name: 'Aditya Deshmukh', gender: 'M', age: 34 },
      { name: 'Pooja Iyer', gender: 'F', age: 29 },
      { name: 'Rohan Sharma', gender: 'M', age: 42 },
      { name: 'Meera Kulkarni', gender: 'F', age: 51 },
      { name: 'Kavita Nair', gender: 'F', age: 24 },
      { name: 'Vijay Patil', gender: 'M', age: 62 },
      { name: 'Sunil Jadhav', gender: 'M', age: 38 },
      { name: 'Ananya Joshi', gender: 'F', age: 22 },
      { name: 'Ganesh More', gender: 'M', age: 47 },
      { name: 'Sneha Rane', gender: 'F', age: 31 }
    ];

    for (let i = 1; i <= total; i++) {
      const berthType = this.getBerthType(classCode, i);
      const bayNumber = Math.ceil(i / template.seats_per_bay);
      const isSide = berthType === 'SL' || berthType === 'SU' || berthType === 'SM';
      
      // Determine deck level
      let deckLevel: 'lower' | 'middle' | 'upper' = 'lower';
      if (berthType === 'MB' || berthType === 'SM') deckLevel = 'middle';
      if (berthType === 'UB' || berthType === 'SU' || berthType === 'CABIN_UB' || berthType === 'COUPE_UB') deckLevel = 'upper';

      // Seed pseudo-random statuses based on seat number and coach occupancy percentage
      const hash = ((i * 17) + (coach.coach_no.charCodeAt(0) * 31)) % 100;
      let bookingStatus: BookingStatus = 'Available';
      let physicalStatus: PhysicalOccupancyStatus = 'Vacant';
      let passengerInfo = undefined;

      if (hash < occPct) {
        if (hash % 10 === 0) {
          bookingStatus = 'RAC';
          physicalStatus = 'Occupied';
        } else if (hash % 7 === 0) {
          bookingStatus = 'Occupied – Partial Journey';
          physicalStatus = 'Occupied';
        } else if (hash % 13 === 0) {
          bookingStatus = 'Reserved';
          physicalStatus = 'Unconfirmed'; // Reserved on chart but passenger may not have boarded yet
        } else {
          bookingStatus = 'Occupied – Full Journey';
          physicalStatus = 'Occupied';
        }

        const person = sampleNames[i % sampleNames.length];
        const pnrTail = 1000 + (i * 29) % 8999;
        passengerInfo = {
          pnr_masked: `***${pnrTail}`,
          pnr_full: `248567${pnrTail}`,
          passenger_name_masked: `${person.name.charAt(0)}*** ${person.name.split(' ')[1]?.charAt(0) || ''}***`,
          passenger_name_full: person.name,
          gender: person.gender,
          age: person.age
        };
      } else if (hash < occPct + 8) {
        bookingStatus = 'Reserved';
        physicalStatus = 'Vacant'; // Reserved on ticket but seat physically empty (discrepancy)
      } else {
        bookingStatus = 'Available';
        physicalStatus = 'Vacant';
      }

      seats.push({
        id: `${coach.id}-S${i}`,
        coach_id: coach.id,
        coach_no: coach.coach_no,
        seat_number: i,
        berth_type: berthType,
        bay_number: bayNumber,
        deck_level: deckLevel,
        is_side_berth: isSide,
        booking_status: bookingStatus,
        physical_status: physicalStatus,
        journey_from: fromStation,
        journey_to: toStation,
        pnr_masked: passengerInfo?.pnr_masked,
        pnr_full: passengerInfo?.pnr_full,
        passenger_name_masked: passengerInfo?.passenger_name_masked,
        passenger_name_full: passengerInfo?.passenger_name_full,
        gender: passengerInfo?.gender,
        age: passengerInfo?.age,
        last_checked_at: new Date(Date.now() - (i * 120000)).toISOString(),
        data_source: coach.data_source || 'VERIFIED_REAL'
      });
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(seats));
    } catch {}

    return seats;
  }

  /**
   * Persists an updated seat list for a coach
   */
  static saveCoachSeats(coachId: string, seats: SeatBerth[]): void {
    try {
      localStorage.setItem(`slwt_seats_${coachId}`, JSON.stringify(seats));
    } catch (e) {
      console.warn('Error saving coach seats', e);
    }
  }

  /**
   * Updates an individual seat's status (Used by Staff and Admin)
   */
  static updateSeatStatus(
    coachId: string, 
    seatNumber: number, 
    updates: Partial<SeatBerth>, 
    actorId?: string,
    actorRole?: string
  ): SeatBerth | null {
    const storageKey = `slwt_seats_${coachId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      const seats: SeatBerth[] = JSON.parse(stored);
      const idx = seats.findIndex(s => s.seat_number === seatNumber);
      if (idx === -1) return null;

      const oldSeat = seats[idx];
      const updatedSeat: SeatBerth = {
        ...oldSeat,
        ...updates,
        last_checked_at: new Date().toISOString(),
        verified_by: actorId || oldSeat.verified_by
      };

      seats[idx] = updatedSeat;
      localStorage.setItem(storageKey, JSON.stringify(seats));

      OfflineStorageService.addAuditLog('Seat Status Updated', {
        coachId,
        seatNumber,
        previousBooking: oldSeat.booking_status,
        newBooking: updatedSeat.booking_status,
        previousPhysical: oldSeat.physical_status,
        newPhysical: updatedSeat.physical_status,
        actorRole: actorRole || 'Staff'
      }, actorId);

      return updatedSeat;
    } catch (e) {
      console.warn('Error updating seat status', e);
      return null;
    }
  }

  // ==========================================
  // PASSENGER JOURNEY SUBMISSIONS MANAGEMENT
  // ==========================================

  static getPassengerSubmissions(): PassengerSubmission[] {
    try {
      const data = localStorage.getItem('slwt_passenger_submissions');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading passenger submissions', e);
    }
    // No fabricated demo submissions. Returns empty array until real passengers submit seat check-ins.
    return [];
  }

  static addPassengerSubmission(submission: Omit<PassengerSubmission, 'id' | 'created_at' | 'verification_state'>): PassengerSubmission {
    const list = this.getPassengerSubmissions();
    const newSub: PassengerSubmission = {
      ...submission,
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      verification_state: 'Submitted', // Defaults strictly to unverified/submitted
      created_at: new Date().toISOString()
    };

    list.unshift(newSub);
    try {
      localStorage.setItem('slwt_passenger_submissions', JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving passenger submission', e);
    }

    OfflineStorageService.addAuditLog('Passenger Seat Check-in Submitted', {
      trainNumber: newSub.train_number,
      coachNo: newSub.coach_no,
      seatNumber: newSub.seat_number,
      pnrMasked: `***${newSub.pnr_number.slice(-4)}`
    }, newSub.user_id);

    return newSub;
  }

  static updateSubmissionState(
    submissionId: string, 
    newState: VerificationState, 
    staffNotes?: string, 
    verifiedBy?: string
  ): void {
    const list = this.getPassengerSubmissions();
    const updated = list.map(item => {
      if (item.id === submissionId) {
        return {
          ...item,
          verification_state: newState,
          staff_notes: staffNotes !== undefined ? staffNotes : item.staff_notes,
          verified_by: verifiedBy || item.verified_by,
          verified_at: new Date().toISOString()
        };
      }
      return item;
    });

    try {
      localStorage.setItem('slwt_passenger_submissions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error updating submission state', e);
    }

    OfflineStorageService.addAuditLog('Passenger Check-in State Verified', {
      submissionId,
      newState,
      staffNotes
    }, verifiedBy);
  }
}
