import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Ticket, 
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';
import { SeatBerth, UserRole, BookingStatus, PhysicalOccupancyStatus } from '../../types';

interface SeatDetailModalProps {
  seat: SeatBerth | null;
  onClose: () => void;
  viewerRole?: UserRole | 'display';
  onUpdateSeatStatus?: (seatNumber: number, updates: Partial<SeatBerth>) => void;
  currentUserId?: string;
}

export const SeatDetailModal: React.FC<SeatDetailModalProps> = ({
  seat,
  onClose,
  viewerRole = 'passenger',
  onUpdateSeatStatus,
  currentUserId
}) => {
  if (!seat) return null;

  const [physicalStatus, setPhysicalStatus] = useState<PhysicalOccupancyStatus>(seat.physical_status);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(seat.booking_status);
  const [discrepancyNote, setDiscrepancyNote] = useState(seat.discrepancy_note || '');
  const [isSaved, setIsSaved] = useState(false);

  const isStaffOrAdmin = viewerRole === 'staff' || viewerRole === 'admin';
  const isDisplay = viewerRole === 'display';

  // Handle staff/admin status modification
  const handleSaveOperationalCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSeatStatus) return;

    onUpdateSeatStatus(seat.seat_number, {
      physical_status: physicalStatus,
      booking_status: bookingStatus,
      discrepancy_note: discrepancyNote.trim() || undefined
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  // Human-readable berth type descriptions
  const getBerthTypeLabel = (type: string) => {
    switch (type) {
      case 'LB': return 'Lower Berth (LB)';
      case 'MB': return 'Middle Berth (MB)';
      case 'UB': return 'Upper Berth (UB)';
      case 'SL': return 'Side Lower Berth (SL)';
      case 'SU': return 'Side Upper Berth (SU)';
      case 'SM': return 'Side Middle Berth (SM)';
      case 'WINDOW': return 'Window Seat (W)';
      case 'MIDDLE': return 'Middle Seat (M)';
      case 'AISLE': return 'Aisle Seat (A)';
      case 'CABIN_LB': return 'Cabin Lower Berth';
      case 'CABIN_UB': return 'Cabin Upper Berth';
      case 'COUPE_LB': return 'Coupe Lower Berth';
      case 'COUPE_UB': return 'Coupe Upper Berth';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full gov-card border-t-4 border-t-[#003366] dark:border-t-blue-500 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-sm bg-[#003366] text-white flex flex-col items-center justify-center font-mono font-bold shrink-0 shadow-xs">
              <span className="text-[10px] text-amber-300 font-semibold">{seat.coach_no}</span>
              <span className="text-base leading-none">#{seat.seat_number}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#002244] dark:text-blue-100 uppercase tracking-tight">
                  Coach {seat.coach_no} &bull; Seat {seat.seat_number}
                </h3>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {getBerthTypeLabel(seat.berth_type)} &bull; Bay {seat.bay_number}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-xs"
            aria-label="Close Seat Details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Physical Presence vs Reservation Disclaimer */}
        <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-[11px] rounded-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>Operational Booking vs Physical Sensor Verification</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Reservation chart status reflects ticket issuance and does not establish physical presence in the coach. Physical state is verified via strain sensors and staff charting.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Reservation Chart Status
            </span>
            <span className={`px-2 py-0.5 rounded-xs text-[11px] font-bold inline-block border ${
              seat.booking_status === 'Available'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : seat.booking_status.includes('Occupied')
                ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {seat.booking_status}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Physical Bogie Presence
            </span>
            <span className={`px-2 py-0.5 rounded-xs text-[11px] font-bold inline-block border ${
              seat.physical_status === 'Occupied'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : seat.physical_status === 'Vacant'
                ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}>
              {seat.physical_status}
            </span>
          </div>
        </div>

        {/* Station Journey Limits */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xs text-xs flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400">Journey Leg:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {seat.journey_from || 'Source'} &rarr; {seat.journey_to || 'Destination'}
          </span>
        </div>

        {/* Role-Based Passenger Visibility */}
        {!isDisplay && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xs p-3 space-y-2 text-xs bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Passenger Roster Data</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Access: {viewerRole}
              </span>
            </div>

            {viewerRole === 'admin' ? (
              // Admin sees full passenger records
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Full Passenger Name:</span>
                  <strong className="text-slate-900 dark:text-slate-100">{seat.passenger_name_full || 'Roster Record Attached'}</strong>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>PNR Number:</span>
                  <strong className="text-[#003366] dark:text-blue-300">{seat.pnr_full || '2485671042'}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Age / Gender:</span>
                  <span>{seat.age ? `${seat.age} yrs / ${seat.gender}` : 'Adult / Confirmed'}</span>
                </div>
              </div>
            ) : viewerRole === 'staff' ? (
              // Staff sees operational masked records
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Passenger (Operational):</span>
                  <strong>{seat.passenger_name_masked || 'Commuter on Chart'}</strong>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>PNR Reference:</span>
                  <span>{seat.pnr_masked || '***1042'}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Boarding Verification:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {seat.verification_state || 'Chart Allocated'}
                  </span>
                </div>
              </div>
            ) : (
              // Passenger role: strict privacy masking
              <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Personal information protected under Railway Data Privacy norms.</span>
                </div>
                <p>
                  Commuters can submit and view their own personal journey details in the Passenger Self Check-in tab.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Staff / Admin Operational Action Controls */}
        {isStaffOrAdmin && onUpdateSeatStatus && (
          <form onSubmit={handleSaveOperationalCheck} className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300">
              Station Master / TTE Physical Charting Action
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Physical State:
                </label>
                <select
                  value={physicalStatus}
                  onChange={(e) => setPhysicalStatus(e.target.value as PhysicalOccupancyStatus)}
                  className="w-full px-2 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#003366]"
                >
                  <option value="Occupied">Physically Occupied</option>
                  <option value="Vacant">Physically Vacant</option>
                  <option value="Unconfirmed">Unconfirmed / En-route</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Chart Status:
                </label>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                  className="w-full px-2 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#003366]"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied – Full Journey">Occupied – Full</option>
                  <option value="Occupied – Partial Journey">Occupied – Partial</option>
                  <option value="Reserved">Reserved</option>
                  <option value="RAC">RAC</option>
                  <option value="Waiting List">Waiting List</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Discrepancy / Observation Note (Optional):
              </label>
              <input
                type="text"
                value={discrepancyNote}
                onChange={(e) => setDiscrepancyNote(e.target.value)}
                placeholder="e.g. Passenger deboarded at Lonavala, seat vacant"
                className="w-full px-2.5 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#003366]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-sm text-xs cursor-pointer transition shadow-sm flex items-center justify-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Physical Chart Updated!</span>
                </>
              ) : (
                <>
                  <span>Record Operational Physical Check</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Close */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-sm cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
