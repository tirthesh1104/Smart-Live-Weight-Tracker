import React, { useState, useRef, useEffect } from 'react';
import { Coach } from '../../types';
import { calculateCoachOccupancy, formatWeight } from '../../utils/weightCalculations';
import { CoachLayoutService } from '../../services/coachLayoutService';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  Scale, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Radio, 
  Layers, 
  ShieldCheck, 
  Zap,
  Users,
  Compass
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface TrainHorizontalViewProps {
  coaches: Coach[];
  recommendedCoachId?: string;
  onSelectCoach?: (coach: Coach) => void;
  selectedCoachId?: string;
}

export const TrainHorizontalView: React.FC<TrainHorizontalViewProps> = ({
  coaches,
  recommendedCoachId,
  onSelectCoach,
  selectedCoachId
}) => {
  const { language } = useLanguage();
  const isMr = language === 'mr';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string>('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Active selected coach: controlled prop takes precedence, fallback to internal, fallback to first passenger coach
  const passengerCoaches = coaches.filter(c => c.coach_type !== 'Engine');
  const activeSelectedId = selectedCoachId || internalSelectedId || (passengerCoaches[0]?.id ?? '');
  const activeSelected = coaches.find(c => c.id === activeSelectedId) || passengerCoaches[0];

  useEffect(() => {
    if (!selectedCoachId && !internalSelectedId && passengerCoaches.length > 0) {
      setInternalSelectedId(passengerCoaches[0].id);
    }
  }, [coaches, selectedCoachId, internalSelectedId, passengerCoaches]);

  const handleCoachClick = (coach: Coach) => {
    setInternalSelectedId(coach.id);
    if (onSelectCoach) {
      onSelectCoach(coach);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, coach: Coach) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCoachClick(coach);
    }
  };

  const scrollRake = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Find least and most crowded passenger coaches for quick jump
  const sortedByCrowd = [...passengerCoaches].sort((a, b) => a.occupancy_percentage - b.occupancy_percentage);
  const leastCrowdedCoach = sortedByCrowd[0];
  const mostCrowdedCoach = sortedByCrowd[sortedByCrowd.length - 1];

  // Selected coach layout & occupancy details
  const activeTemplate = activeSelected ? CoachLayoutService.getTemplate(activeSelected) : null;
  const activeTotalSeats = activeTemplate?.total_seats || 72;
  const activeOcc = activeSelected ? calculateCoachOccupancy(
    activeSelected.current_weight_kg,
    activeSelected.empty_weight_kg,
    activeSelected.max_capacity_kg,
    activeSelected.coach_type
  ) : null;

  const activeOccupiedSeats = activeSelected
    ? Math.min(activeTotalSeats, Math.round((activeOcc?.clampedOccupancy || activeSelected.occupancy_percentage) / 100 * activeTotalSeats))
    : 0;
  const activeAvailableSeats = Math.max(0, activeTotalSeats - activeOccupiedSeats);

  // Simulated 6-point weight history curve for selected coach
  const baseWeight = activeSelected?.current_weight_kg || 45000;
  const weightTrendData = [
    { time: '-25m', weight: Math.round(baseWeight * 0.88 / 1000) },
    { time: '-20m', weight: Math.round(baseWeight * 0.92 / 1000) },
    { time: '-15m', weight: Math.round(baseWeight * 0.97 / 1000) },
    { time: '-10m', weight: Math.round(baseWeight * 0.95 / 1000) },
    { time: '-5m', weight: Math.round(baseWeight * 0.99 / 1000) },
    { time: 'Now', weight: Math.round(baseWeight / 1000) },
  ];

  // Rake-wide coach comparison chart data
  const comparisonData = passengerCoaches.map((c, idx) => ({
    coachNo: c.coach_no,
    occupancy: c.occupancy_percentage,
    isOverloaded: c.current_weight_kg > c.max_capacity_kg,
    id: c.id,
    isSelected: c.id === activeSelected?.id
  }));

  // AI predictions for selected coach
  const currentOccValue = activeOcc?.clampedOccupancy ?? (activeSelected?.occupancy_percentage || 50);
  const aiForecast15 = Math.min(130, Math.max(10, Math.round(currentOccValue + (Math.sin(activeTotalSeats) * 8))));
  const aiForecast30 = Math.min(140, Math.max(15, Math.round(currentOccValue + (Math.cos(activeTotalSeats) * 14))));
  const aiForecast60 = Math.min(140, Math.max(20, Math.round(currentOccValue - 6)));

  return (
    <div className="w-full space-y-4">

      {/* Rake Header Controls & Quick Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-wider text-slate-800 dark:text-slate-200 uppercase">
            Horizontal Rake Composition &bull; Side-Elevation Telemetry
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
            ({passengerCoaches.length} Coaches + 1 WAP-7 Loco + 1 SLR Brake Van)
          </span>
        </div>

        {/* Quick jump badges and Pan arrows */}
        <div className="flex items-center gap-2">
          {leastCrowdedCoach && (
            <button
              onClick={() => handleCoachClick(leastCrowdedCoach)}
              className="px-2 py-0.5 rounded-xs bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
              title={`Jump to Coach ${leastCrowdedCoach.coach_no} (${leastCrowdedCoach.occupancy_percentage}% occupied)`}
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>Least Crowded: {leastCrowdedCoach.coach_no} ({leastCrowdedCoach.occupancy_percentage}%)</span>
            </button>
          )}

          {mostCrowdedCoach && mostCrowdedCoach.id !== leastCrowdedCoach?.id && (
            <button
              onClick={() => handleCoachClick(mostCrowdedCoach)}
              className="px-2 py-0.5 rounded-xs bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-400 dark:border-rose-700 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
              title={`Jump to Coach ${mostCrowdedCoach.coach_no} (${mostCrowdedCoach.occupancy_percentage}% occupied)`}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
              <span>Highest Crowd: {mostCrowdedCoach.coach_no} ({mostCrowdedCoach.occupancy_percentage}%)</span>
            </button>
          )}

          {/* Scroll Navigation Buttons */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => scrollRake('left')}
              className="p-1 rounded-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              aria-label="Scroll rake left"
              title="Pan Rake Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollRake('right')}
              className="p-1 rounded-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              aria-label="Scroll rake right"
              title="Pan Rake Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Realistic Railway Rake & Track Assembly */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-2 pt-1 scrollbar-thin select-none rounded-sm bg-linear-to-b from-slate-100 via-slate-100 to-slate-200 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950 border border-slate-300 dark:border-slate-800 shadow-inner"
      >
        <div className="inline-flex flex-col min-w-max px-4 pt-3 pb-1">

          {/* Train Rolling Stock Row */}
          <div className="flex items-end gap-0.5">

            {/* 1. LEAD ELECTRIC LOCOMOTIVE (WAP-7 / WAP-4 Realistic Side View) */}
            <div className="flex flex-col items-center shrink-0">
              <div 
                className="relative cursor-default"
                title="WAP-7 High-Speed Electric Passenger Locomotive (6350 HP, Co-Co Bogies, 3-Phase AC Traction)"
              >
                {/* WAP-7 SVG Illustration */}
                <svg width="250" height="115" viewBox="0 0 250 115" className="drop-shadow-md">
                  <defs>
                    {/* Metallic Body Gradients */}
                    <linearGradient id="locoBodyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="35%" stopColor="#dc2626" />
                      <stop offset="50%" stopColor="#fef08a" />
                      <stop offset="65%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#7f1d1d" />
                    </linearGradient>
                    <linearGradient id="locoRoofGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="bogieSteel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <radialGradient id="wheelRim" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="70%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </radialGradient>
                    <radialGradient id="headlightGlow" cx="0%" cy="50%" r="90%">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#fef08a" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* High Voltage Pantograph Assembly */}
                  <g stroke="#94a3b8" strokeWidth="2" fill="none">
                    {/* Pantograph base insulators */}
                    <rect x="75" y="16" width="6" height="4" fill="#cbd5e1" stroke="none" />
                    <rect x="135" y="16" width="6" height="4" fill="#cbd5e1" stroke="none" />
                    {/* Articulated diamond arms */}
                    <polyline points="80,16 95,5 110,14" />
                    <polyline points="140,16 125,5 110,14" />
                    {/* Top contact carbon shoe pan */}
                    <line x1="90" y1="5" x2="130" y2="5" stroke="#f8fafc" strokeWidth="2.5" />
                    <line x1="86" y1="4" x2="90" y2="6" stroke="#f8fafc" strokeWidth="2" />
                    <line x1="134" y1="4" x2="130" y2="6" stroke="#f8fafc" strokeWidth="2" />
                  </g>

                  {/* Aerodynamic Locomotive Body */}
                  {/* Streamlined Cab Nose at Front (Left) */}
                  <path 
                    d="M 5,82 L 20,42 Q 35,22 65,20 L 245,20 L 245,82 Z" 
                    fill="url(#locoBodyGrad)" 
                    stroke="#1e293b" 
                    strokeWidth="1.5"
                  />

                  {/* Roof Profile & Air Intake Vents */}
                  <path d="M 58,20 Q 65,18 90,18 L 245,18 L 245,22 L 58,22 Z" fill="url(#locoRoofGrad)" />
                  <line x1="95" y1="23" x2="235" y2="23" stroke="#0f172a" strokeWidth="1" />
                  <line x1="95" y1="25" x2="235" y2="25" stroke="#0f172a" strokeWidth="1" />

                  {/* Front Driver Windshield Glass (Dual tinted panes) */}
                  <polygon points="25,44 48,28 65,28 42,44" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2" opacity="0.9" />
                  <polygon points="45,44 68,28 78,28 55,44" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2" opacity="0.9" />
                  {/* Windshield Wipers */}
                  <line x1="38" y1="44" x2="33" y2="34" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="58" y1="44" x2="53" y2="34" stroke="#0f172a" strokeWidth="1.5" />

                  {/* Indian Railways Cream/Yellow Center Speed Stripe */}
                  <polygon points="12,62 245,62 245,70 9,70" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
                  <text x="110" y="68" fill="#1e293b" fontSize="7.5" fontWeight="900" fontFamily="monospace" letterSpacing="1">
                    INDIAN RAILWAYS
                  </text>

                  {/* Headlights Cluster & Forward Beam */}
                  {/* Beam glow extending forward */}
                  <polygon points="2,60 -50,30 -50,90 2,74" fill="url(#headlightGlow)" pointerEvents="none" />
                  {/* Twin high-intensity headlamp casings */}
                  <circle cx="9" cy="67" r="4.5" fill="#fef08a" stroke="#475569" strokeWidth="1.2" />
                  <circle cx="9" cy="67" r="2.5" fill="#ffffff" />
                  {/* Marker Lamps */}
                  <circle cx="16" cy="52" r="2.5" fill="#ef4444" stroke="#475569" strokeWidth="0.8" />
                  <circle cx="16" cy="52" r="1.2" fill="#fca5a5" />

                  {/* Side Louvers / Ventilation Grilles */}
                  <g fill="#334155" opacity="0.8">
                    <rect x="90" y="32" width="22" height="18" rx="1" />
                    <rect x="120" y="32" width="22" height="18" rx="1" />
                    <rect x="150" y="32" width="22" height="18" rx="1" />
                    <rect x="180" y="32" width="22" height="18" rx="1" />
                    <rect x="210" y="32" width="22" height="18" rx="1" />
                  </g>
                  {/* Grille slits */}
                  <line x1="93" y1="36" x2="109" y2="36" stroke="#0f172a" strokeWidth="1" />
                  <line x1="93" y1="40" x2="109" y2="40" stroke="#0f172a" strokeWidth="1" />
                  <line x1="93" y1="44" x2="109" y2="44" stroke="#0f172a" strokeWidth="1" />
                  <line x1="123" y1="36" x2="139" y2="36" stroke="#0f172a" strokeWidth="1" />
                  <line x1="123" y1="40" x2="139" y2="40" stroke="#0f172a" strokeWidth="1" />
                  <line x1="123" y1="44" x2="139" y2="44" stroke="#0f172a" strokeWidth="1" />

                  {/* Locomotive Marking & Crest */}
                  <rect x="25" y="73" width="38" height="7" fill="#0f172a" rx="1" />
                  <text x="27" y="79" fill="#fef08a" fontSize="6" fontWeight="bold" fontFamily="monospace">
                    WAP-7 30201
                  </text>

                  {/* Cowcatcher / Cattle Guard (Front Pilot) */}
                  <polygon points="2,84 15,84 22,96 1,96" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                  <line x1="4" y1="87" x2="10" y2="95" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1="8" y1="87" x2="14" y2="95" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1="12" y1="87" x2="18" y2="95" stroke="#94a3b8" strokeWidth="1.2" />

                  {/* Heavy Underframe Skirt */}
                  <rect x="18" y="82" width="227" height="6" fill="#1e293b" />

                  {/* BOGIE 1 (Front 3-Axle Co-Co Truck) */}
                  <g fill="url(#bogieSteel)">
                    <rect x="30" y="87" width="85" height="7" rx="2" />
                    {/* Springs & dampers */}
                    <rect x="42" y="85" width="5" height="6" fill="#94a3b8" />
                    <rect x="70" y="85" width="5" height="6" fill="#94a3b8" />
                    <rect x="98" y="85" width="5" height="6" fill="#94a3b8" />
                    {/* Wheel 1 */}
                    <circle cx="45" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="45" cy="98" r="4" fill="#94a3b8" />
                    {/* Wheel 2 */}
                    <circle cx="73" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="73" cy="98" r="4" fill="#94a3b8" />
                    {/* Wheel 3 */}
                    <circle cx="101" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="101" cy="98" r="4" fill="#94a3b8" />
                  </g>

                  {/* Fuel/Battery Underslung Tank */}
                  <rect x="120" y="86" width="30" height="9" fill="#0f172a" rx="1" />
                  <line x1="123" y1="90" x2="147" y2="90" stroke="#475569" strokeWidth="1" />

                  {/* BOGIE 2 (Rear 3-Axle Co-Co Truck) */}
                  <g fill="url(#bogieSteel)">
                    <rect x="155" y="87" width="85" height="7" rx="2" />
                    {/* Springs & dampers */}
                    <rect x="167" y="85" width="5" height="6" fill="#94a3b8" />
                    <rect x="195" y="85" width="5" height="6" fill="#94a3b8" />
                    <rect x="223" y="85" width="5" height="6" fill="#94a3b8" />
                    {/* Wheel 4 */}
                    <circle cx="170" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="170" cy="98" r="4" fill="#94a3b8" />
                    {/* Wheel 5 */}
                    <circle cx="198" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="198" cy="98" r="4" fill="#94a3b8" />
                    {/* Wheel 6 */}
                    <circle cx="226" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="226" cy="98" r="4" fill="#94a3b8" />
                  </g>
                </svg>

                {/* Locomotive Sub-label */}
                <div className="text-center mt-1">
                  <span className="px-2 py-0.5 rounded-xs bg-[#002244] text-amber-300 font-mono font-bold text-[10px] tracking-widest border border-amber-500/40">
                    LOCO &bull; WAP-7
                  </span>
                </div>
              </div>

              {/* Inter-coach Gangway Bellows & CBC Coupler */}
              <div className="w-4 h-9 bg-slate-800 dark:bg-slate-700 flex flex-col justify-between items-center my-auto shrink-0 border-y border-slate-600 rounded-xs -ml-1 z-10">
                <div className="w-full h-1 bg-slate-900 border-b border-slate-600" />
                <div className="w-2.5 h-1.5 bg-slate-400 rounded-xs shadow-xs" title="Center Buffer Coupler (CBC)" />
                <div className="w-full h-1 bg-slate-900 border-t border-slate-600" />
              </div>
            </div>

            {/* 2. PASSENGER COACHES IN RAKE ORDER */}
            {passengerCoaches.map((coach, index) => {
              const isRecommended = coach.id === recommendedCoachId;
              const isSelected = coach.id === activeSelected?.id;
              const occ = calculateCoachOccupancy(
                coach.current_weight_kg,
                coach.empty_weight_kg,
                coach.max_capacity_kg,
                coach.coach_type
              );

              // Coach visual livery theme by class
              const isAC = coach.coach_type.includes('AC') || coach.coach_type.includes('Chair') || coach.coach_type.includes('Executive');
              const isGeneral = coach.coach_type.includes('General') || coach.coach_no.startsWith('GS') || coach.coach_no.startsWith('GEN');
              
              // Base colors
              let coachBodyTop = '#0284c7'; // Sky blue
              let coachBodyBottom = '#0369a1'; // ICF Blue
              let stripeColor = '#bae6fd';
              let windowGlass = '#38bdf8';

              if (isAC) {
                // Rajdhani / Tejas LHB Red & Cream Livery
                coachBodyTop = '#dc2626';
                coachBodyBottom = '#991b1b';
                stripeColor = '#fef08a';
                windowGlass = '#1e293b'; // Sleek dark tinted glass
              } else if (isGeneral) {
                // General class with yellow warning chevron accents
                coachBodyTop = '#0284c7';
                coachBodyBottom = '#0f766e';
                stripeColor = '#facc15';
              }

              // Occupancy boundary highlights:
              // 0-40%: Emerald Green, 41-75%: Amber Yellow, 76-100%: Deep Orange, >100%: Rose Overload
              let statusBorder = 'border-slate-300 dark:border-slate-700';
              let statusBadgeBg = 'bg-emerald-500 text-white';
              let glowRing = '';

              if (occ.isOverloaded || occ.clampedOccupancy > 100) {
                statusBorder = 'border-rose-600 dark:border-rose-500';
                statusBadgeBg = 'bg-rose-600 text-white animate-pulse';
                glowRing = 'ring-2 ring-rose-500 ring-offset-1';
              } else if (occ.clampedOccupancy > 75) {
                statusBorder = 'border-orange-500 dark:border-orange-400';
                statusBadgeBg = 'bg-orange-500 text-white';
              } else if (occ.clampedOccupancy > 40) {
                statusBorder = 'border-amber-500 dark:border-amber-400';
                statusBadgeBg = 'bg-amber-500 text-slate-950 font-bold';
              } else {
                statusBorder = 'border-emerald-500 dark:border-emerald-400';
                statusBadgeBg = 'bg-emerald-600 text-white';
              }

              return (
                <div key={coach.id} className="flex items-center shrink-0">
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label={`Coach ${coach.coach_no}, ${coach.coach_type}, ${occ.clampedOccupancy}% occupied. ${occ.statusLabel}`}
                    onClick={() => handleCoachClick(coach)}
                    onKeyDown={(e) => handleKeyDown(e, coach)}
                    className={`relative group cursor-pointer transition-all duration-150 p-1 rounded-sm focus:outline-hidden ${
                      isSelected 
                        ? 'bg-amber-100/70 dark:bg-blue-950/60 ring-2 ring-[#003366] dark:ring-blue-400 -translate-y-1' 
                        : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top Floating Badge: Recommended or Overloaded */}
                    {isRecommended && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-white z-20 shadow-md whitespace-nowrap">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span>Best Space</span>
                      </div>
                    )}

                    {occ.isOverloaded && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-xs text-[9px] font-black uppercase tracking-wider bg-rose-700 text-white z-20 shadow-md whitespace-nowrap animate-bounce">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>OVERLOAD</span>
                      </div>
                    )}

                    {/* Realistic Passenger Coach SVG */}
                    <svg width="220" height="115" viewBox="0 0 220 115" className="drop-shadow-sm">
                      <defs>
                        <linearGradient id={`coachRoof-${coach.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="50%" stopColor="#64748b" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        <linearGradient id={`coachBody-${coach.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={coachBodyTop} />
                          <stop offset="50%" stopColor={coachBodyTop} />
                          <stop offset="52%" stopColor={stripeColor} />
                          <stop offset="58%" stopColor={stripeColor} />
                          <stop offset="60%" stopColor={coachBodyBottom} />
                          <stop offset="100%" stopColor={coachBodyBottom} />
                        </linearGradient>
                      </defs>

                      {/* Coach Corrugated Steel Roof */}
                      <rect x="6" y="24" width="208" height="8" rx="3" fill={`url(#coachRoof-${coach.id})`} stroke="#1e293b" strokeWidth="0.8" />
                      {/* Roof AC unit / Vents */}
                      {isAC ? (
                        <g fill="#334155" stroke="#1e293b" strokeWidth="0.6">
                          <rect x="40" y="21" width="35" height="4" rx="1" />
                          <rect x="145" y="21" width="35" height="4" rx="1" />
                        </g>
                      ) : (
                        <g fill="#475569">
                          <circle cx="50" cy="23" r="2.5" />
                          <circle cx="110" cy="23" r="2.5" />
                          <circle cx="170" cy="23" r="2.5" />
                        </g>
                      )}

                      {/* Main Coach Body Shell */}
                      <rect 
                        x="6" 
                        y="30" 
                        width="208" 
                        height="52" 
                        rx="2" 
                        fill={`url(#coachBody-${coach.id})`} 
                        stroke={isSelected ? '#003366' : '#1e293b'} 
                        strokeWidth={isSelected ? '2' : '1'} 
                      />

                      {/* Left Passenger Door & Handrail */}
                      <rect x="12" y="32" width="16" height="46" rx="1" fill="#1e293b" opacity="0.35" />
                      <rect x="14" y="36" width="12" height="18" rx="1" fill="#38bdf8" opacity="0.8" />
                      <line x1="26" y1="42" x2="26" y2="68" stroke="#facc15" strokeWidth="1.5" />

                      {/* Passenger Window Array */}
                      <g fill={windowGlass} stroke="#0f172a" strokeWidth="0.8">
                        {/* 6 panoramic passenger windows */}
                        <rect x="34" y="36" width="20" height="15" rx="1.5" opacity={isAC ? 0.95 : 0.85} />
                        <rect x="60" y="36" width="20" height="15" rx="1.5" opacity={isAC ? 0.95 : 0.85} />
                        <rect x="86" y="36" width="20" height="15" rx="1.5" opacity={isAC ? 0.95 : 0.85} />
                        <rect x="114" y="36" width="20" height="15" rx="1.5" opacity={isAC ? 0.95 : 0.85} />
                        <rect x="140" y="36" width="20" height="15" rx="1.5" opacity={isAC ? 0.95 : 0.85} />
                        <rect x="166" y="36" width="20" height="15" rx="1.5" opacity={isAC ? 0.95 : 0.85} />

                        {/* Safety bars on windows for non-AC coaches */}
                        {!isAC && (
                          <g stroke="#ffffff" strokeWidth="0.6" opacity="0.7">
                            <line x1="34" y1="41" x2="54" y2="41" />
                            <line x1="34" y1="46" x2="54" y2="46" />
                            <line x1="60" y1="41" x2="80" y2="41" />
                            <line x1="60" y1="46" x2="80" y2="46" />
                            <line x1="86" y1="41" x2="106" y2="41" />
                            <line x1="86" y1="46" x2="106" y2="46" />
                            <line x1="114" y1="41" x2="134" y2="41" />
                            <line x1="114" y1="46" x2="134" y2="46" />
                            <line x1="140" y1="41" x2="160" y2="41" />
                            <line x1="140" y1="46" x2="160" y2="46" />
                            <line x1="166" y1="41" x2="186" y2="41" />
                            <line x1="166" y1="46" x2="186" y2="46" />
                          </g>
                        )}
                      </g>

                      {/* Right Passenger Door & Handrail */}
                      <rect x="192" y="32" width="16" height="46" rx="1" fill="#1e293b" opacity="0.35" />
                      <rect x="194" y="36" width="12" height="18" rx="1" fill="#38bdf8" opacity="0.8" />
                      <line x1="194" y1="42" x2="194" y2="68" stroke="#facc15" strokeWidth="1.5" />

                      {/* Coach Designation Label Plate */}
                      <rect x="76" y="62" width="68" height="14" rx="2" fill="#0f172a" opacity="0.9" stroke="#ffffff" strokeWidth="0.5" />
                      <text x="110" y="72" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {coach.coach_no} &bull; {coach.coach_type.substring(0, 8)}
                      </text>

                      {/* General class yellow hazard stripes if applicable */}
                      {isGeneral && (
                        <g stroke="#facc15" strokeWidth="2" opacity="0.9">
                          <line x1="28" y1="32" x2="33" y2="42" />
                          <line x1="31" y1="32" x2="36" y2="42" />
                          <line x1="185" y1="32" x2="190" y2="42" />
                          <line x1="188" y1="32" x2="193" y2="42" />
                        </g>
                      )}

                      {/* Coach Footboards / Underframe Steps */}
                      <rect x="10" y="78" width="20" height="3" fill="#334155" />
                      <rect x="190" y="78" width="20" height="3" fill="#334155" />

                      {/* Heavy Underframe Chassis Skirt */}
                      <rect x="12" y="81" width="196" height="4" fill="#0f172a" />

                      {/* Underslung Equipment Boxes (Battery, Air Brake Reservoir, Water Tank) */}
                      <rect x="85" y="85" width="50" height="7" fill="#1e293b" rx="1" />
                      <line x1="88" y1="88" x2="132" y2="88" stroke="#475569" strokeWidth="1" />

                      {/* BOGIE 1 (Front 2-Axle LHB Bogie) */}
                      <g fill="url(#bogieSteel)">
                        <rect x="25" y="86" width="55" height="6" rx="1.5" />
                        {/* Primary coil suspension springs */}
                        <rect x="35" y="84" width="4" height="4" fill="#94a3b8" />
                        <rect x="65" y="84" width="4" height="4" fill="#94a3b8" />
                        {/* Wheel 1 */}
                        <circle cx="37" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                        <circle cx="37" cy="98" r="4" fill="#94a3b8" />
                        {/* Wheel 2 */}
                        <circle cx="67" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                        <circle cx="67" cy="98" r="4" fill="#94a3b8" />
                      </g>

                      {/* BOGIE 2 (Rear 2-Axle LHB Bogie) */}
                      <g fill="url(#bogieSteel)">
                        <rect x="140" y="86" width="55" height="6" rx="1.5" />
                        {/* Primary coil suspension springs */}
                        <rect x="150" y="84" width="4" height="4" fill="#94a3b8" />
                        <rect x="180" y="84" width="4" height="4" fill="#94a3b8" />
                        {/* Wheel 3 */}
                        <circle cx="152" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                        <circle cx="152" cy="98" r="4" fill="#94a3b8" />
                        {/* Wheel 4 */}
                        <circle cx="182" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                        <circle cx="182" cy="98" r="4" fill="#94a3b8" />
                      </g>
                    </svg>

                    {/* Coach Status & Occupancy Meter Below the Coach Graphic */}
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold font-tabular tabular-nums text-slate-700 dark:text-slate-300">
                          {coach.coach_no}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded-xs font-tabular font-bold tabular-nums text-[9px] ${statusBadgeBg}`}>
                          {occ.clampedOccupancy}%
                        </span>
                      </div>

                      {/* Mini linear occupancy progress bar */}
                      <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            occ.isOverloaded ? 'bg-rose-600' :
                            occ.clampedOccupancy > 75 ? 'bg-orange-500' :
                            occ.clampedOccupancy > 40 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, occ.clampedOccupancy)}%` }}
                        />
                      </div>

                      {/* Selected Pointer Indicator */}
                      {isSelected && (
                        <div className="flex flex-col items-center mt-0.5 animate-bounce">
                          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-[#003366] dark:border-b-blue-400" />
                          <span className="text-[8px] font-bold uppercase text-[#003366] dark:text-blue-300 tracking-wider">
                            ACTIVE
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inter-coach Gangway Bellows & Coupler */}
                  <div className="w-3.5 h-9 bg-slate-800 dark:bg-slate-700 flex flex-col justify-between items-center my-auto shrink-0 border-y border-slate-600 rounded-xs -mx-0.5 z-10">
                    <div className="w-full h-1 bg-slate-900 border-b border-slate-600" />
                    <div className="w-2 h-1 bg-slate-400 rounded-xs" title="Center Buffer Coupler (CBC)" />
                    <div className="w-full h-1 bg-slate-900 border-t border-slate-600" />
                  </div>
                </div>
              );
            })}

            {/* 3. REAR GUARD / BRAKE VAN (SLR) */}
            <div className="flex flex-col items-center shrink-0">
              <div 
                className="relative cursor-default"
                title="SLR Guard & Luggage Brake Van (Train End Rear Unit)"
              >
                <svg width="190" height="115" viewBox="0 0 190 115" className="drop-shadow-md">
                  {/* Roof */}
                  <rect x="6" y="24" width="176" height="8" rx="3" fill="url(#locoRoofGrad)" stroke="#1e293b" strokeWidth="0.8" />
                  {/* SLR Body Shell */}
                  <rect x="6" y="30" width="176" height="52" rx="2" fill="#002244" stroke="#1e293b" strokeWidth="1" />
                  {/* Guard Luggage Shutter Doors */}
                  <rect x="25" y="35" width="45" height="42" fill="#334155" stroke="#0f172a" strokeWidth="1" />
                  <line x1="25" y1="42" x2="70" y2="42" stroke="#475569" strokeWidth="1" />
                  <line x1="25" y1="49" x2="70" y2="49" stroke="#475569" strokeWidth="1" />
                  <line x1="25" y1="56" x2="70" y2="56" stroke="#475569" strokeWidth="1" />
                  <line x1="25" y1="63" x2="70" y2="63" stroke="#475569" strokeWidth="1" />
                  {/* Guard Cab Cupola Window */}
                  <rect x="110" y="36" width="22" height="18" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
                  {/* Guard Rear Flasher Lamp (Flashing Red LED) */}
                  <circle cx="172" cy="46" r="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                  <circle cx="172" cy="46" r="2" fill="#fca5a5" className="animate-ping" />
                  {/* SLR Label */}
                  <rect x="90" y="62" width="60" height="14" rx="2" fill="#0f172a" opacity="0.9" />
                  <text x="120" y="72" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    SLR &bull; GUARD
                  </text>
                  {/* Underframe */}
                  <rect x="8" y="81" width="172" height="4" fill="#0f172a" />
                  {/* Bogies */}
                  <g fill="url(#bogieSteel)">
                    <rect x="20" y="86" width="55" height="6" rx="1.5" />
                    <circle cx="32" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="32" cy="98" r="4" fill="#94a3b8" />
                    <circle cx="62" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="62" cy="98" r="4" fill="#94a3b8" />
                    <rect x="105" y="86" width="55" height="6" rx="1.5" />
                    <circle cx="117" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="117" cy="98" r="4" fill="#94a3b8" />
                    <circle cx="147" cy="98" r="10" fill="url(#wheelRim)" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="147" cy="98" r="4" fill="#94a3b8" />
                  </g>
                </svg>
                <div className="text-center mt-1">
                  <span className="px-2 py-0.5 rounded-xs bg-[#002244] text-slate-200 font-mono font-bold text-[10px] tracking-widest border border-slate-700">
                    SLR &bull; GUARD
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 4. REALISTIC RAILWAY TRACK SYSTEM UNDERNEATH ENTIRE TRAIN */}
          <div className="relative w-full h-8 mt-[-8px]">
            {/* Granite Stone Ballast Bed Gradient */}
            <div className="absolute inset-x-0 top-3 h-5 bg-linear-to-b from-slate-500 via-slate-600 to-slate-700 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border-t border-slate-400 dark:border-slate-600 shadow-sm opacity-95">
              {/* Ballast texture specks */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:6px_6px] opacity-70" />
            </div>

            {/* Repeating Concrete/Wood Sleepers (Ties) */}
            <div className="absolute inset-x-0 top-2 h-4.5 flex justify-between gap-2 px-1 pointer-events-none">
              {Array.from({ length: 80 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-3.5 h-full bg-linear-to-b from-stone-300 via-stone-400 to-stone-500 dark:from-stone-700 dark:via-stone-800 dark:to-stone-900 rounded-2xs border-x border-stone-600/50 dark:border-stone-950 shadow-xs relative shrink-0"
                >
                  {/* Pandrol rail clip fastener dots */}
                  <div className="w-1 h-1 rounded-full bg-slate-900 absolute top-0.5 left-1/2 -translate-x-1/2" />
                </div>
              ))}
            </div>

            {/* Heavy Continuous Dual Steel Rails (3D Burnished Profile) */}
            {/* Top reflective steel crown */}
            <div className="absolute inset-x-0 top-1 h-1.5 bg-linear-to-b from-slate-200 via-slate-100 to-slate-400 dark:from-slate-300 dark:via-slate-200 dark:to-slate-500 shadow-sm z-10" />
            {/* Rail web & base shadow */}
            <div className="absolute inset-x-0 top-2.5 h-1 bg-linear-to-b from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 z-10" />
          </div>

        </div>
      </div>

      {/* 5. MONITORING ANALYTICS SECTION BELOW THE TRAIN */}
      {activeSelected && (
        <div className="gov-card p-4 sm:p-5 border-l-4 border-l-[#003366] dark:border-l-blue-400 space-y-5 animate-in fade-in duration-200 shadow-sm">
          
          {/* A. Selected Coach Header & Primary Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-[#003366] text-white font-mono font-bold text-sm rounded-xs shadow-xs">
                Coach {activeSelected.coach_no}
              </span>
              <div>
                <h3 className="font-bold text-base text-[#002244] dark:text-blue-300 leading-tight">
                  {activeTemplate?.class_name || activeSelected.coach_type}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTemplate?.description || 'Broad Gauge Passenger Bogie'} &bull; Class Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{activeTemplate?.class_code || 'GEN'}</span>
                </span>
              </div>
            </div>

            {/* Telemetry metadata tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-xs font-mono font-bold text-[10px] uppercase border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>{activeSelected.data_source || 'SIMULATED DATA'}</span>
              </span>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(activeSelected.last_updated || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* B. Four-Column Telemetry & Capacity Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            {/* Occupancy Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Live Occupancy</span>
                <span className={`px-1.5 py-0.2 rounded-2xs text-[9px] font-black uppercase ${
                  activeOcc?.isOverloaded ? 'bg-rose-600 text-white' :
                  (activeOcc?.clampedOccupancy || 0) > 75 ? 'bg-orange-500 text-white' :
                  (activeOcc?.clampedOccupancy || 0) > 40 ? 'bg-amber-500 text-slate-950' :
                  'bg-emerald-600 text-white'
                }`}>
                  {activeOcc?.statusLabel || 'Available'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#002244] dark:text-blue-300">
                {activeOcc?.clampedOccupancy || activeSelected.occupancy_percentage}%
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className={`h-full ${
                    activeOcc?.isOverloaded ? 'bg-rose-600' :
                    (activeOcc?.clampedOccupancy || 0) > 75 ? 'bg-orange-500' :
                    (activeOcc?.clampedOccupancy || 0) > 40 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, activeOcc?.clampedOccupancy || activeSelected.occupancy_percentage)}%` }}
                />
              </div>
            </div>

            {/* Berth Seat Availability */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                Seats &amp; Berths Breakdown
              </span>
              <div className="flex items-baseline gap-1 text-slate-900 dark:text-slate-100">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {activeAvailableSeats}
                </span>
                <span className="text-xs text-slate-500 font-semibold">avail</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">
                  {activeTotalSeats}
                </span>
                <span className="text-[10px] text-slate-400">total</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {activeOccupiedSeats} berths currently occupied
              </div>
            </div>

            {/* Weight Breakdown */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                Gross Bogie Load
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {formatWeight(activeSelected.current_weight_kg)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                <span>Tare: {formatWeight(activeSelected.empty_weight_kg)}</span>
                <span>Max: {formatWeight(activeSelected.max_capacity_kg)}</span>
              </div>
            </div>

            {/* Payload & Overload Safety */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                Payload &amp; Overload Margin
              </span>
              <div className={`text-xl sm:text-2xl font-black font-mono ${
                activeSelected.current_weight_kg > activeSelected.max_capacity_kg
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {activeSelected.current_weight_kg > activeSelected.max_capacity_kg
                  ? `+${formatWeight(activeSelected.current_weight_kg - activeSelected.max_capacity_kg)} OVER`
                  : `${formatWeight(Math.max(0, activeSelected.current_weight_kg - activeSelected.empty_weight_kg))} NET`}
              </div>
              <div className="text-[11px] font-semibold mt-1">
                {activeSelected.current_weight_kg > activeSelected.max_capacity_kg ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3" /> Exceeds Safe Load Rating
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Within Permissible Axle Load
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Plain-Language Status & Action Recommendation Banner */}
          <div className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            activeOcc?.isOverloaded
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : (activeOcc?.clampedOccupancy || 0) > 75
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {activeOcc?.isOverloaded ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (activeOcc?.clampedOccupancy || 0) > 75 ? (
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-bold text-sm block">
                  {activeOcc?.isOverloaded 
                    ? (isMr ? "डबा ओव्हरलोड: वजन सुरक्षित मर्यादेपेक्षा जास्त आहे." : "Overloaded: Weight is above the configured limit.")
                    : (activeOcc?.clampedOccupancy || 0) > 75
                    ? (isMr ? "डब्यात गर्दी जास्त: उभे राहून प्रवास करावा लागू शकतो." : "Crowded: The coach is getting crowded.")
                    : (isMr ? "सुरक्षित आणि जागा उपलब्ध: डब्यात बसायला पुरेशी जागा शिल्लक आहे." : "Normal: The coach is within the configured limit.")}
                </span>
                <span className="text-xs opacity-90 mt-0.5 block">
                  <strong>{isMr ? "मी आता काय करावे? " : "What should I do next? "}</strong>
                  {activeOcc?.isOverloaded
                    ? (isMr ? "कृपया या डब्यात चढू नका; अधिक जागेसाठी शेजारचा मोकळा डबा निवडा." : "Boarding discouraged. Please check adjacent coaches with more space.")
                    : (activeOcc?.clampedOccupancy || 0) > 75
                    ? (isMr ? "डब्यात गर्दी जास्त आहे. आरामासाठी कमी गर्दीचा डबा तपासा." : "Coach is crowded. Consider checking an adjacent coach for available seats.")
                    : (isMr ? "तुम्ही या डब्यात आरामात आणि सुरक्षितपणे चढू शकता." : "Space is available. Safe to board this coach.")}
                </span>
              </div>
            </div>

            {/* Toggle Button for Technical Engineering Charts */}
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              type="button"
              className="px-3 py-1.5 rounded-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition shrink-0 self-start sm:self-auto shadow-xs"
            >
              {showTechnicalDetails 
                ? (isMr ? "तांत्रिक आलेख लपवा" : "Hide Technical Charts") 
                : (isMr ? "अधिक तांत्रिक तपशील व आलेख पहा" : "Show Technical Details & Charts")}
            </button>
          </div>

          {/* C. Interactive Visual Analytics: Weight Trend & Whole-Rake Comparison Charts */}
          {showTechnicalDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 animate-fadeIn">
            
            {/* 1. Selected Coach Weight Trend Area Chart */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Coach {activeSelected.coach_no} Weight Profile (Tonnes over Time)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Axle Telemetry</span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" unit="t" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px', color: '#f8fafc' }}
                      formatter={(val: number) => [`${val} Tonnes`, 'Gross Weight']}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#weightGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Rake-Wide Coach Occupancy Comparison Bar Chart */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Entire Rake Occupancy Distribution (All Coaches)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Click bar to select</span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="coachNo" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 120]} tick={{ fontSize: 10 }} stroke="#94a3b8" unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px', color: '#f8fafc' }}
                      formatter={(val: number) => [`${val}%`, 'Occupancy']}
                    />
                    <Bar 
                      dataKey="occupancy" 
                      radius={[2, 2, 0, 0]}
                      onClick={(data) => {
                        const target = coaches.find(c => c.id === data.id);
                        if (target) handleCoachClick(target);
                      }}
                      cursor="pointer"
                    >
                      {comparisonData.map((entry) => {
                        let fill = '#10b981'; // Green
                        if (entry.isOverloaded || entry.occupancy > 100) fill = '#e11d48'; // Red
                        else if (entry.occupancy > 75) fill = '#f97316'; // Orange
                        else if (entry.occupancy > 40) fill = '#f59e0b'; // Amber
                        return (
                          <Cell 
                            key={`cell-${entry.id}`} 
                            fill={fill} 
                            stroke={entry.isSelected ? '#002244' : 'transparent'} 
                            strokeWidth={entry.isSelected ? 2 : 0} 
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
          )}

          {/* D. AI Crowd Predictions (15m, 30m, 60m Horizon Cards) */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#002244] dark:text-blue-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isMr ? `पुढील गर्दीचा AI अंदाज (डबा ${activeSelected.coach_no})` : `AI Crowd Forecast: What may happen next (Coach ${activeSelected.coach_no})`}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isMr ? "पुढील १५, ३० व ६० मिनिटांतील अंदाजित गर्दी" : "Estimates how full the coach may become in 15, 30, or 60 mins"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* 15-Minute Forecast */}
              <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-sm">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-300">
                  <span>15-Minute Forecast</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-mono">Next Stop</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-blue-950 dark:text-blue-100">
                    {aiForecast15}%
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 flex items-center">
                    {aiForecast15 > currentOccValue ? (
                      <span className="flex items-center text-rose-600"><TrendingUp className="w-3 h-3 mr-0.5" /> +{aiForecast15 - currentOccValue}%</span>
                    ) : (
                      <span className="flex items-center text-emerald-600"><TrendingDown className="w-3 h-3 mr-0.5" /> -{currentOccValue - aiForecast15}%</span>
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-blue-800/80 dark:text-blue-300/80 mt-1">
                  Optimal boarding window. Minor turnover expected.
                </p>
              </div>

              {/* 30-Minute Forecast */}
              <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-sm">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                  <span>30-Minute Forecast</span>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono">Major Junction</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-indigo-950 dark:text-indigo-100">
                    {aiForecast30}%
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 flex items-center">
                    {aiForecast30 > currentOccValue ? (
                      <span className="flex items-center text-rose-600"><TrendingUp className="w-3 h-3 mr-0.5" /> +{aiForecast30 - currentOccValue}%</span>
                    ) : (
                      <span className="flex items-center text-emerald-600"><TrendingDown className="w-3 h-3 mr-0.5" /> -{currentOccValue - aiForecast30}%</span>
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 mt-1">
                  Peak passenger interchange anticipated at upcoming junction.
                </p>
              </div>

              {/* 60-Minute Forecast */}
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  <span>60-Minute Forecast</span>
                  <span className="text-[10px] text-slate-500 font-mono">Terminal Approach</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {aiForecast60}%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-0.5 text-emerald-600" />
                    <span>Gradual deboarding</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                  Gradual deboarding expected to free up 20+ berths.
                </p>
              </div>

            </div>
          </div>

          {/* E. Safety Monitoring & Telemetry Integrity Footer */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xs border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                <strong>Bogie Telemetry Status:</strong> Strain gauge link verified &bull; 100 Hz sampling rate &bull; 0% packet loss &bull; Calibration valid
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="px-2 py-0.5 rounded-2xs font-mono font-bold text-[9px] uppercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                DEMO / RESEARCH PROTOTYPE
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
