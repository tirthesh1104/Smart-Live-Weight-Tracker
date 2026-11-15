import React, { useState } from 'react';
import { 
  Train, 
  Coach, 
  SeatBerth 
} from '../../types';
import { CoachLayoutService } from '../../services/coachLayoutService';
import { 
  Tv, 
  Train as TrainIcon, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface StationDisplayCoachSeatViewProps {
  train: Train;
}

export const StationDisplayCoachSeatView: React.FC<StationDisplayCoachSeatViewProps> = ({
  train
}) => {
  const [selectedCoachId, setSelectedCoachId] = useState<string>(
    train.coaches[0]?.id || ''
  );
  const activeCoach = train.coaches.find(c => c.id === selectedCoachId) || train.coaches[0];

  const seats: SeatBerth[] = activeCoach 
    ? CoachLayoutService.getCoachSeats(activeCoach, train)
    : [];

  const template = activeCoach 
    ? CoachLayoutService.getTemplate(activeCoach)
    : null;

  const availableCount = seats.filter(s => s.booking_status === 'Available').length;
  const occupiedCount = seats.filter(s => s.booking_status.includes('Occupied') || s.physical_status === 'Occupied').length;
  const reservedCount = seats.filter(s => s.booking_status === 'Reserved' || s.booking_status === 'RAC').length;

  return (
    <div className="bg-slate-950 text-white rounded-xl border-2 border-amber-500/40 p-4 sm:p-6 space-y-5 shadow-2xl">
      
      {/* 1. High-Contrast Platform Station TV Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl shrink-0 shadow-lg">
            <Tv className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-2xl text-amber-400">
                #{train.number}
              </span>
              <span className="text-slate-600 text-lg">&bull;</span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {train.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold mt-0.5">
              <span>{train.from_station}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>{train.to_station}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-amber-400">PLATFORM LIVE DISPLAY</span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
              Available Berths
            </span>
            <span className="text-2xl font-black font-mono text-emerald-300">
              {availableCount}
            </span>
          </div>

          <div className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Occupied Berths
            </span>
            <span className="text-2xl font-black font-mono text-slate-200">
              {occupiedCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Coach Composition Strip for Commuters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400">
          <span>Select Coach to Check Available Berths:</span>
          <span className="text-slate-400">Tap coach pill below</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {train.coaches.map((c) => {
            const isSelected = c.id === selectedCoachId;
            const tmpl = CoachLayoutService.getTemplate(c);
            const total = tmpl.total_seats;
            const occPct = c.occupancy_percentage || 0;
            const occupied = Math.round((occPct / 100) * total);
            const avail = Math.max(0, total - occupied);

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCoachId(c.id)}
                className={`flex-shrink-0 text-left p-3 rounded-lg border-2 transition-all cursor-pointer min-w-[140px] ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 text-white ring-2 ring-amber-400/30'
                    : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-lg text-white">
                    {c.coach_no}
                  </span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    avail > 10 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {avail} Avail
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">
                  {tmpl.class_code} &bull; {c.coach_type}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Read-Only Platform Seat Availability Matrix */}
      {activeCoach && template && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-amber-400 tracking-tight uppercase">
                Coach {activeCoach.coach_no} &bull; {template.class_name} ({template.class_code})
              </h3>
              <p className="text-xs text-slate-400">
                {template.total_seats} Total Berths &bull; {availableCount} Vacant for Boarding &bull; Public Station Display Mode
              </p>
            </div>

            {/* Privacy Protection Notice */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Personal passenger data protected &amp; hidden</span>
            </div>
          </div>

          {/* Platform Status Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-500 border border-emerald-300 shadow-sm" />
              <strong className="text-emerald-300">Vacant / Available</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-700 border border-slate-600" />
              <span className="text-slate-400">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-600 border border-amber-400" />
              <span className="text-amber-300">Reserved / RAC</span>
            </div>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-[380px] overflow-y-auto p-1 scrollbar-thin">
            {seats.map((seat) => {
              const isAvail = seat.booking_status === 'Available';
              const isRes = seat.booking_status === 'Reserved' || seat.booking_status === 'RAC';

              let cellColor = 'bg-slate-800 text-slate-500 border-slate-700';
              if (isAvail) {
                cellColor = 'bg-emerald-600 hover:bg-emerald-500 text-white font-black border-emerald-400 shadow-md';
              } else if (isRes) {
                cellColor = 'bg-amber-700/80 text-amber-200 border-amber-500';
              }

              return (
                <div
                  key={seat.id}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center ${cellColor}`}
                  title={`Seat #${seat.seat_number} (${seat.berth_type}): ${isAvail ? 'Available' : 'Occupied'}`}
                >
                  <span className="font-mono text-base font-bold leading-none">
                    {seat.seat_number}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-tighter opacity-80 mt-1">
                    {seat.berth_type}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 4. Footer Guidelines */}
      <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-500">
        Indian Railways Smart Live Weight Tracker &bull; Telemetry Platform Digital Signage System &bull; Certified Commuter Privacy Standard
      </div>

    </div>
  );
};
