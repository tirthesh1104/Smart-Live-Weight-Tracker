import React, { useState } from 'react';
import { 
  Coach, 
  Train, 
  SeatBerth, 
  UserRole,
  CoachLayoutTemplate
} from '../../types';
import { CoachLayoutService } from '../../services/coachLayoutService';
import { SeatDetailModal } from './SeatDetailModal';
import { 
  Info, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Scale, 
  Filter,
  Maximize2
} from 'lucide-react';

interface CoachVisualLayoutProps {
  coach: Coach;
  train: Train;
  viewerRole?: UserRole | 'display';
  onSeatSelect?: (seat: SeatBerth) => void;
  userSubmittedSeatNumber?: number;
}

export const CoachVisualLayout: React.FC<CoachVisualLayoutProps> = ({
  coach,
  train,
  viewerRole = 'passenger',
  onSeatSelect,
  userSubmittedSeatNumber
}) => {
  const [seats, setSeats] = useState<SeatBerth[]>(() => {
    return CoachLayoutService.getCoachSeats(coach, train);
  });
  const [selectedSeat, setSelectedSeat] = useState<SeatBerth | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'occupied' | 'discrepancy'>('all');

  const template = CoachLayoutService.getTemplate(coach);
  const classCode = template.class_code;

  // Handle seat click
  const handleSeatClick = (seat: SeatBerth) => {
    setSelectedSeat(seat);
    if (onSeatSelect) {
      onSeatSelect(seat);
    }
  };

  // Handle operational update by staff/admin
  const handleUpdateSeatStatus = (seatNumber: number, updates: Partial<SeatBerth>) => {
    const updated = CoachLayoutService.updateSeatStatus(
      coach.id,
      seatNumber,
      updates,
      viewerRole,
      viewerRole
    );
    if (updated) {
      setSeats(prev => prev.map(s => s.seat_number === seatNumber ? updated : s));
      setSelectedSeat(updated);
    }
  };

  // Seat visual coloring helper
  const getSeatColor = (seat: SeatBerth) => {
    const isUserSeat = userSubmittedSeatNumber === seat.seat_number;
    if (isUserSeat) {
      return 'bg-amber-400 text-slate-950 border-amber-600 ring-2 ring-amber-400 font-black animate-pulse';
    }

    // Check discrepancy: sensor says occupied but chart says available, or vice versa
    if (seat.discrepancy_note || (seat.booking_status === 'Available' && seat.physical_status === 'Occupied')) {
      return 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-400 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700';
    }

    if (seat.booking_status === 'Available') {
      return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }

    if (seat.booking_status === 'Occupied – Full Journey') {
      return 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-400 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-700';
    }

    if (seat.booking_status === 'Occupied – Partial Journey') {
      return 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700';
    }

    if (seat.booking_status === 'Reserved' || seat.booking_status === 'RAC' || seat.booking_status === 'Waiting List') {
      return 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700';
    }

    return 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  // Group seats by compartment bays
  const totalBays = template.bays_count;
  const bays = Array.from({ length: totalBays }, (_, i) => i + 1);

  // Summary counts
  const availableCount = seats.filter(s => s.booking_status === 'Available').length;
  const occupiedCount = seats.filter(s => s.booking_status.includes('Occupied') || s.physical_status === 'Occupied').length;
  const discrepancyCount = seats.filter(s => s.discrepancy_note || (s.booking_status === 'Available' && s.physical_status === 'Occupied')).length;

  return (
    <div className="gov-card p-4 space-y-4">
      
      {/* 1. Coach Info & Visual Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#002244] dark:text-blue-100 uppercase tracking-tight">
              Coach {coach.coach_no} &bull; Interior Layout ({template.class_name})
            </h3>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#003366] text-white rounded-xs">
              {template.class_code}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {template.description}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-sm text-xs font-semibold self-start sm:self-auto border border-slate-300 dark:border-slate-700">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
              filterMode === 'all' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            All ({seats.length})
          </button>
          <button
            onClick={() => setFilterMode('available')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
              filterMode === 'available' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Avail ({availableCount})
          </button>
          <button
            onClick={() => setFilterMode('occupied')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
              filterMode === 'occupied' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Occupied ({occupiedCount})
          </button>
          {discrepancyCount > 0 && (
            <button
              onClick={() => setFilterMode('discrepancy')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer ${
                filterMode === 'discrepancy' ? 'bg-rose-700 text-white shadow-xs' : 'text-rose-700 dark:text-rose-300 font-bold'
              }`}
            >
              Alerts ({discrepancyCount})
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Coach Status Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-sm border border-slate-200 dark:border-slate-700">
        <span className="font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 block sm:inline">
          Seat Status Legend:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-emerald-100 border border-emerald-400 dark:bg-emerald-950/80" />
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-blue-100 border border-blue-400 dark:bg-blue-950/80" />
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Occupied (Full Journey)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-indigo-100 border border-indigo-400 dark:bg-indigo-950/80" />
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Occupied (Partial Leg)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-amber-100 border border-amber-400 dark:bg-amber-950/80" />
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Reserved / RAC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-xs bg-rose-100 border border-rose-400 dark:bg-rose-950/80" />
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Sensor Discrepancy</span>
        </div>
        {userSubmittedSeatNumber && (
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <span className="w-3.5 h-3.5 rounded-xs bg-amber-400 border border-amber-600 animate-pulse" />
            <span className="text-[11px]">Your Assigned Seat (#{userSubmittedSeatNumber})</span>
          </div>
        )}
      </div>

      {/* 3. Physical Coach Shell Visualization */}
      <div className="relative border-4 border-slate-700 dark:border-slate-600 rounded-xl bg-slate-200 dark:bg-slate-900/90 p-3 shadow-inner overflow-x-auto scrollbar-thin">
        
        {/* Exterior Shell Identifiers */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-300 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-800 text-white rounded-xs">DOOR 1 / VESTIBULE</span>
            <span>TOILET A &amp; B</span>
          </div>
          <span className="text-[#002244] dark:text-blue-300 uppercase tracking-widest font-black">
            INDIAN RAILWAYS &bull; COACH {coach.coach_no} ({template.class_code})
          </span>
          <div className="flex items-center gap-2">
            <span>TOILET C &amp; D</span>
            <span className="px-2 py-0.5 bg-slate-800 text-white rounded-xs">DOOR 2 / VESTIBULE</span>
          </div>
        </div>

        {/* Scrollable Layout Track */}
        <div className="py-3 flex gap-3 min-w-max">
          
          {/* Left Door & Toilets Block */}
          <div className="w-16 flex flex-col justify-between py-2 border-r-2 border-dashed border-slate-400 dark:border-slate-700 pr-2 shrink-0 text-center text-[10px] font-mono font-bold text-slate-500">
            <div className="p-2 bg-slate-300 dark:bg-slate-800 rounded-sm">WC 1</div>
            <div className="my-auto py-4 text-slate-400">ENTRY<br/>&darr;</div>
            <div className="p-2 bg-slate-300 dark:bg-slate-800 rounded-sm">WC 2</div>
          </div>

          {/* Bays / Compartments Container */}
          <div className="flex gap-3">
            {bays.map((bayNo) => {
              const baySeats = seats.filter(s => s.bay_number === bayNo);
              if (baySeats.length === 0) return null;

              // Render according to class layout
              if (template.is_chair_car) {
                // Chair Car / 2S / EC Layout: Rows across central aisle
                const half = Math.ceil(baySeats.length / 2);
                const leftSeats = baySeats.slice(0, half);
                const rightSeats = baySeats.slice(half);

                return (
                  <div 
                    key={bayNo} 
                    className="p-2 bg-white dark:bg-slate-800/90 rounded-sm border border-slate-300 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-[90px]"
                  >
                    <div className="text-[10px] font-mono font-bold text-center text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-700">
                      Row {bayNo}
                    </div>

                    {/* Left seats */}
                    <div className="flex flex-col gap-1 py-1">
                      {leftSeats.map(seat => renderSeatButton(seat))}
                    </div>

                    {/* Central Aisle */}
                    <div className="text-[9px] font-mono text-center text-slate-400 py-1 bg-slate-100 dark:bg-slate-900/60 rounded-xs border border-dashed border-slate-300 dark:border-slate-700">
                      AISLE
                    </div>

                    {/* Right seats */}
                    <div className="flex flex-col gap-1 py-1">
                      {rightSeats.map(seat => renderSeatButton(seat))}
                    </div>
                  </div>
                );
              }

              // Sleeper / 3A / 2A / 3E / 1A Compartment Layout
              const mainSeats = baySeats.filter(s => !s.is_side_berth);
              const sideSeats = baySeats.filter(s => s.is_side_berth);

              return (
                <div 
                  key={bayNo} 
                  className="p-2 bg-white dark:bg-slate-800/90 rounded-sm border border-slate-300 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-[130px]"
                >
                  <div className="text-[10px] font-mono font-bold text-center text-[#002244] dark:text-blue-300 pb-1 border-b border-slate-200 dark:border-slate-700">
                    {template.class_code === '1A' ? `Cabin ${String.fromCharCode(64 + bayNo)}` : `Bay ${bayNo}`}
                  </div>

                  {/* Main Compartment Berths (LB, MB, UB facing) */}
                  <div className="grid grid-cols-2 gap-1.5 py-1.5">
                    {mainSeats.map(seat => renderSeatButton(seat))}
                  </div>

                  {/* Aisle Divider */}
                  <div className="text-[9px] font-mono text-center text-slate-400 py-0.5 bg-slate-100 dark:bg-slate-900/60 rounded-xs border-y border-dashed border-slate-300 dark:border-slate-700 my-1">
                    &bull;&bull;&bull; AISLE CORRIDOR &bull;&bull;&bull;
                  </div>

                  {/* Side Berths (SL, SU, SM) */}
                  {sideSeats.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {sideSeats.map(seat => renderSeatButton(seat))}
                    </div>
                  ) : (
                    <div className="text-[9px] text-center text-slate-400 font-mono py-1">
                      Corridor Side
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Door & Toilets Block */}
          <div className="w-16 flex flex-col justify-between py-2 border-l-2 border-dashed border-slate-400 dark:border-slate-700 pl-2 shrink-0 text-center text-[10px] font-mono font-bold text-slate-500">
            <div className="p-2 bg-slate-300 dark:bg-slate-800 rounded-sm">WC 3</div>
            <div className="my-auto py-4 text-slate-400">EXIT<br/>&darr;</div>
            <div className="p-2 bg-slate-300 dark:bg-slate-800 rounded-sm">WC 4</div>
          </div>

        </div>

      </div>

      {/* 4. Seat Detail Modal Drawer */}
      <SeatDetailModal
        seat={selectedSeat}
        onClose={() => setSelectedSeat(null)}
        viewerRole={viewerRole}
        onUpdateSeatStatus={handleUpdateSeatStatus}
      />

    </div>
  );

  // Seat Button Render Helper
  function renderSeatButton(seat: SeatBerth) {
    const isFilteredOut = 
      (filterMode === 'available' && seat.booking_status !== 'Available') ||
      (filterMode === 'occupied' && !(seat.booking_status.includes('Occupied') || seat.physical_status === 'Occupied')) ||
      (filterMode === 'discrepancy' && !(seat.discrepancy_note || (seat.booking_status === 'Available' && seat.physical_status === 'Occupied')));

    return (
      <button
        key={seat.id}
        onClick={() => handleSeatClick(seat)}
        disabled={isFilteredOut}
        className={`p-1.5 rounded-sm border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-w-[50px] ${
          isFilteredOut 
            ? 'opacity-20 cursor-not-allowed bg-slate-100 border-slate-200' 
            : getSeatColor(seat)
        }`}
        title={`Seat ${seat.seat_number} (${seat.berth_type}): ${seat.booking_status} | Physical: ${seat.physical_status}`}
      >
        <span className="font-mono font-black text-xs leading-none">
          {seat.seat_number}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80 mt-0.5">
          {seat.berth_type}
        </span>
      </button>
    );
  }
};
