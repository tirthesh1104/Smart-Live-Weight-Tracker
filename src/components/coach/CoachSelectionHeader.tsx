import React from 'react';
import { Train, Coach } from '../../types';
import { CoachLayoutService } from '../../services/coachLayoutService';
import { Train as TrainIcon, Calendar, MapPin, Users, ArrowRight, ShieldCheck } from 'lucide-react';

interface CoachSelectionHeaderProps {
  train: Train;
  trainsList?: Train[];
  onSelectTrain?: (train: Train) => void;
  selectedCoachId: string;
  onSelectCoach: (coach: Coach) => void;
  journeyDate?: string;
  onDateChange?: (date: string) => void;
  compact?: boolean;
}

export const CoachSelectionHeader: React.FC<CoachSelectionHeaderProps> = ({
  train,
  trainsList,
  onSelectTrain,
  selectedCoachId,
  onSelectCoach,
  journeyDate,
  onDateChange,
  compact = false
}) => {
  const currentDate = journeyDate || new Date().toISOString().slice(0, 10);

  return (
    <div className="gov-card p-4 space-y-3.5 border-t-2 border-t-[#003366] dark:border-t-blue-500">
      
      {/* 1. Train Selection & Route Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#003366] dark:bg-blue-900 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-xs">
            <TrainIcon className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-base text-[#002244] dark:text-blue-200">
                #{train.number}
              </span>
              <span className="text-slate-400">&bull;</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                {train.name}
              </h2>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                train.data_source === 'RailRadar'
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                {train.data_source || 'VERIFIED_REAL'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <strong>{train.from_station}</strong>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span><strong>{train.to_station}</strong></span>
            </div>
          </div>
        </div>

        {/* Train Selector Dropdown & Journey Date */}
        <div className="flex items-center gap-2 flex-wrap">
          {trainsList && trainsList.length > 1 && onSelectTrain && (
            <div className="flex items-center gap-1.5 text-xs">
              <label className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Train:</label>
              <select
                value={train.id}
                onChange={(e) => {
                  const found = trainsList.find(t => t.id === e.target.value);
                  if (found) onSelectTrain(found);
                }}
                className="px-2 py-1.5 text-xs font-semibold rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
              >
                {trainsList.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.number} - {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange && onDateChange(e.target.value)}
              className="px-2 py-1 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
            />
          </div>
        </div>
      </div>

      {/* 2. Coach Composition Rake Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <span>Rake Coach Composition ({train.coaches.length} Coaches):</span>
            <span className="font-normal text-slate-400">Click a coach to view seat layout</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            Interactive Berth Manifest Engine
          </span>
        </div>

        {/* Scrollable coach pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {train.coaches.map((c) => {
            const template = CoachLayoutService.getTemplate(c);
            const isSelected = c.id === selectedCoachId;
            const occPct = c.occupancy_percentage || 0;
            const totalSeats = template.total_seats;
            const occupiedSeats = Math.round((occPct / 100) * totalSeats);
            const availableSeats = Math.max(0, totalSeats - occupiedSeats);

            // Badge color based on occupancy
            let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
            if (occPct > 100) {
              badgeBg = 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/80 dark:text-rose-200';
            } else if (occPct >= 76) {
              badgeBg = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200';
            } else if (occPct >= 40) {
              badgeBg = 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200';
            }

            return (
              <button
                key={c.id}
                onClick={() => onSelectCoach(c)}
                className={`flex-shrink-0 text-left p-2.5 rounded-sm border transition-all cursor-pointer min-w-[125px] ${
                  isSelected
                    ? 'border-[#003366] dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-[#003366]/20 dark:ring-blue-500/20 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-sm text-[#002244] dark:text-blue-100">
                    {c.coach_no}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs border ${badgeBg}`}>
                    {occPct}%
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {template.class_code} &bull; {c.coach_type}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1 border-t border-slate-200/80 dark:border-slate-700/80 pt-1">
                  <span>Avail: <strong>{availableSeats}</strong></span>
                  <span>Total: {totalSeats}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
