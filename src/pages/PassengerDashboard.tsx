import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  Info, 
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Radio,
  SlidersHorizontal,
  Train as TrainIcon,
  Scale,
  ShieldCheck,
  LayoutGrid,
  Ticket,
  Compass,
  CheckCircle2,
  Table as TableIcon,
  Zap,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTrain } from '../context/TrainContext';
import { useAuth } from '../context/AuthContext';
import { TrainHorizontalView } from '../components/train/TrainHorizontalView';
import { CoachDetailModal } from '../components/train/CoachDetailModal';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { SimplePageExplainer } from '../components/common/SimplePageExplainer';
import { AIClientService } from '../services/aiClient';
import { Coach } from '../types';
import { CoachSelectionHeader } from '../components/coach/CoachSelectionHeader';
import { CoachVisualLayout } from '../components/coach/CoachVisualLayout';
import { PassengerSubmissionForm } from '../components/coach/PassengerSubmissionForm';
import { PassengerAdvancedFeatures } from '../components/passenger/PassengerAdvancedFeatures';
import { LiveRailRadarTracker } from '../components/train/LiveRailRadarTracker';
import { AllIndiaRailwayExplorer } from '../components/train/AllIndiaRailwayExplorer';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';

export const PassengerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { 
    trains, 
    selectedTrainId, 
    setSelectedTrainId, 
    lastUpdated, 
    selectedTrain,
    simulatedTrain 
  } = useTrain();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [autoRefreshCounter, setAutoRefreshCounter] = useState(3);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [viewingSimulated, setViewingSimulated] = useState(false);
  const [activePassengerTab, setActivePassengerTab] = useState<'rake' | 'directory' | 'seats' | 'checkin' | 'services' | 'livetrack'>('rake');
  const [layoutCoachId, setLayoutCoachId] = useState<string>('');
  const [userSubmittedSeat, setUserSubmittedSeat] = useState<number | undefined>(undefined);

  // 3-second auto-refresh countdown indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshCounter((prev) => (prev <= 1 ? 3 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter operational trains
  const filteredTrains = trains.filter((tr) => {
    const matchesSearch = 
      tr.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'All' || tr.from_station.includes(sourceFilter);
    const matchesDest = destFilter === 'All' || tr.to_station.includes(destFilter);
    return matchesSearch && matchesSource && matchesDest;
  });

  const operationalTrain = selectedTrain || filteredTrains[0] || trains[0];
  const currentTrain = viewingSimulated && simulatedTrain ? simulatedTrain : operationalTrain;

  // Best coach recommendation (only if passenger coach exists)
  const recommendation = currentTrain && currentTrain.coaches.length > 0
    ? AIClientService.getBestCoachRecommendation(currentTrain.coaches)
    : null;

  // Station lists for filters
  const allStations = Array.from(new Set(trains.flatMap(tr => [tr.from_station, tr.to_station])));

  // Computed Rake Statistics for Dashboard Summary Cards
  const passengerCoaches = currentTrain?.coaches.filter(c => c.coach_type !== 'Engine' && c.coach_type !== 'Pantry Car') || [];
  const avgOccupancy = passengerCoaches.length > 0 
    ? Math.round(passengerCoaches.reduce((sum, c) => sum + c.occupancy_percentage, 0) / passengerCoaches.length)
    : 0;
  const totalRakeWeightTonnes = currentTrain && currentTrain.coaches.length > 0
    ? (currentTrain.coaches.reduce((sum, c) => sum + (c.current_weight_kg || c.empty_weight_kg), 0) / 1000).toFixed(1)
    : '0';
  const maxRakeCapacityTonnes = currentTrain && currentTrain.coaches.length > 0
    ? (currentTrain.coaches.reduce((sum, c) => sum + c.max_capacity_kg, 0) / 1000).toFixed(1)
    : '0';
  const overloadedCoachesCount = currentTrain?.coaches.filter(c => c.current_weight_kg > c.max_capacity_kg).length || 0;

  const [showCoachMatrix, setShowCoachMatrix] = useState<boolean>(true);

  // Helper: Estimate available seats in a coach based on type and occupancy
  const getEstimatedAvailableSeats = (coach: Coach) => {
    const total = coach.coach_type === 'Sleeper' ? 72 : coach.coach_type === 'AC 3 Tier' ? 64 : coach.coach_type === 'AC 2 Tier' ? 48 : 90;
    const occupied = Math.round((Math.min(100, coach.occupancy_percentage) / 100) * total);
    return Math.max(0, total - occupied);
  };

  // Helper: Determine platform stoppage zone and pillar estimate
  const getPlatformGuide = (coachId: string) => {
    if (!currentTrain || !currentTrain.coaches) return { section: 'Mid-Platform', pillars: 'Pillars 7–12', marathi: 'मध्य फलाट' };
    const idx = currentTrain.coaches.findIndex(c => c.id === coachId);
    const total = currentTrain.coaches.length;
    if (idx === -1) return { section: 'Mid-Platform', pillars: 'Pillars 7–12', marathi: 'मध्य फलाट' };
    if (idx <= Math.floor(total / 3)) {
      return { section: 'Front Section (Engine End)', pillars: 'Pillars 1–6', marathi: 'इंजिनजवळ (Front)' };
    } else if (idx >= Math.floor((total * 2) / 3)) {
      return { section: 'Rear Section (Guard End)', pillars: 'Pillars 13–18', marathi: 'मागील बाजू (Rear)' };
    }
    return { section: 'Middle Section (Center Rake)', pillars: 'Pillars 7–12', marathi: 'मध्य फलाट (Middle)' };
  };

  // Class-wise optimal coach mapping (Sleeper, AC 3 Tier, AC 2 Tier, General)
  const classWiseBest = React.useMemo(() => {
    if (!currentTrain || !currentTrain.coaches) return [];
    const map = new Map<string, Coach>();
    passengerCoaches.forEach(c => {
      const existing = map.get(c.coach_type);
      if (!existing || c.occupancy_percentage < existing.occupancy_percentage) {
        map.set(c.coach_type, c);
      }
    });
    return Array.from(map.entries()).map(([cType, bestC]) => ({
      type: cType,
      coach: bestC
    }));
  }, [currentTrain, passengerCoaches]);

  return (
    <div className="space-y-5 py-4">
      
      {/* Official Government Page Title & Sync Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <img 
            src={indianRailwaysLogo} 
            alt="Indian Railways Official Emblem" 
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md shrink-0" 
          />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Indian Railways Portal Services &bull; Public Information System
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#002244] dark:text-blue-300 mt-0.5">
              {t.passenger.title} (Live Coach Weight &amp; Crowd Enquiry)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Real-time coach load distribution and occupancy assessment for passenger rakes.
            </p>
          </div>
        </div>

        {/* Live sync status banner */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 self-start md:self-auto">
          <RefreshCw className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
          <span>{t.passenger.autoRefresh} ({autoRefreshCounter}s)</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Personalized Passenger Greeting if signed in */}
      {user && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Welcome, </span>
              <strong className="text-[#002244] dark:text-blue-200">{user.full_name}</strong>
              <span className="text-slate-500 font-mono text-[11px] ml-1.5">({user.email})</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-[#003366] dark:text-blue-200 text-[10px] font-bold uppercase rounded-xs">
            Verified Passenger Account
          </span>
        </div>
      )}

      {/* Prominent Mandatory Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Simple Page Explainer for Passengers */}
      <SimplePageExplainer pageKey="passenger" />

      {/* Simulation Session Notice banner (if simulation scenario is active) */}
      {simulatedTrain && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-600 border-r border-t border-b border-amber-200 dark:border-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-amber-900 dark:text-amber-200 font-medium">
              An isolated test simulation session is currently active: <strong>Train #{simulatedTrain.number} - {simulatedTrain.name}</strong> ({simulatedTrain.coaches.length} coaches).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setViewingSimulated(!viewingSimulated)}
              className="px-3 py-1 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold rounded-sm text-xs transition cursor-pointer"
            >
              {viewingSimulated ? 'Switch to Operational Fleet' : 'View Simulated Rake'}
            </button>
            <Link
              to="/simulator"
              className="text-amber-900 dark:text-amber-300 underline font-semibold hover:text-amber-950 dark:hover:text-amber-100"
            >
              Control Simulator
            </Link>
          </div>
        </div>
      )}

      {/* Enquiry Search and Filter Box */}
      <div className="gov-card p-4 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300 flex items-center justify-between">
          <span>Search &amp; Filter Monitored Trains</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal lowercase">
            {filteredTrains.length} train(s) found
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Train No. or Name (e.g. 12101)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
            />
          </div>

          {/* Source Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
            >
              <option value="All">Source Station: All Stations</option>
              {allStations.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Destination Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
            >
              <option value="All">Destination: All Destinations</option>
              {allStations.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Operational Train Selection Buttons */}
        {trains.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 block">
              Registered Operational Services:
            </span>
            <div className="flex flex-wrap gap-2">
              {filteredTrains.map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => {
                    setViewingSimulated(false);
                    setSelectedTrainId(tr.id);
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition flex items-center gap-2 border cursor-pointer ${
                    !viewingSimulated && tr.id === currentTrain?.id
                      ? 'bg-[#003366] dark:bg-blue-600 text-white border-[#003366] dark:border-blue-500'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="font-mono font-bold">{tr.number}</span>
                  <span>{tr.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback & Grievance Prompt */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Have a suggestion, discrepancy report, or need passenger assistance?
          </span>
          <Link
            to="/feedback"
            className="px-2.5 py-1 text-xs font-semibold rounded-sm bg-blue-50 dark:bg-blue-950/60 text-[#003366] dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            <span>Feedback &amp; Support Desk</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {currentTrain ? (
        <div className="gov-card p-5 space-y-5">
          
          {/* Train Title & Route Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-sm bg-[#003366] dark:bg-blue-600 text-white">
                  {currentTrain.number}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#002244] dark:text-slate-100">
                  {currentTrain.name}
                </h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
                  currentTrain.data_source === 'REAL DATA' || currentTrain.data_source === 'VERIFIED_REAL'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : currentTrain.data_source === 'SIMULATED DATA' || currentTrain.data_source === 'SIMULATED_TEST'
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}>
                  DATA SOURCE: {currentTrain.data_source || 'VERIFIED_REAL'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTrain.from_station}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTrain.to_station}</span>
                <span className="text-slate-400 mx-1">&bull;</span>
                <span>Rake Composition: <strong className="text-slate-800 dark:text-slate-200">{currentTrain.coaches.length} Coaches</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Feature Sub-Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-sm border border-slate-300 dark:border-slate-700">
                <button
                  onClick={() => setActivePassengerTab('rake')}
                  className={`px-3 py-1 font-semibold rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activePassengerTab === 'rake'
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Rake Crowd Overview</span>
                </button>
                <button
                  onClick={() => setActivePassengerTab('directory')}
                  className={`px-3 py-1 font-semibold rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activePassengerTab === 'directory'
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All-India Directory &amp; Routes</span>
                </button>
                <button
                  onClick={() => {
                    setActivePassengerTab('seats');
                    if (!layoutCoachId && currentTrain.coaches[0]) {
                      setLayoutCoachId(currentTrain.coaches[0].id);
                    }
                  }}
                  className={`px-3 py-1 font-semibold rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activePassengerTab === 'seats'
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                  <span>Coach &amp; Seat Layout</span>
                </button>
                <button
                  onClick={() => setActivePassengerTab('checkin')}
                  className={`px-3 py-1 font-semibold rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activePassengerTab === 'checkin'
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5 text-blue-400" />
                  <span>On-Board Check-in</span>
                </button>
                <button
                  onClick={() => setActivePassengerTab('services')}
                  className={`px-3 py-1 font-semibold rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activePassengerTab === 'services'
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Travel Companion &amp; Services</span>
                </button>
                <button
                  onClick={() => setActivePassengerTab('livetrack')}
                  className={`px-3 py-1 font-semibold rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activePassengerTab === 'livetrack'
                      ? 'bg-[#003366] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>Live Railway Tracking &amp; Timetable</span>
                </button>
              </div>

              <Link
                to="/display"
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-sm transition"
              >
                Station Platform View
              </Link>
            </div>
          </div>

          {/* View 1: Rake Crowd Overview (Summary Cards, AI Recommendation & Horizontal View) */}
          {activePassengerTab === 'rake' && (
            <div className="space-y-5">
              {/* Dashboard Summary Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Card 1: Average Occupancy */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Rake Crowd Level
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                  avgOccupancy > 75 
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                    : avgOccupancy > 40 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {avgOccupancy > 75 ? 'Packed' : avgOccupancy > 40 ? 'Moderate' : 'Available'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-tabular text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">
                  {avgOccupancy}%
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">avg. crowd</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    avgOccupancy > 75 ? 'bg-rose-600' : avgOccupancy > 40 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(avgOccupancy, 100)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Total Weight Telemetry */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Total Rake Tonnage
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-tabular text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-[#003366] dark:text-blue-300">
                  {totalRakeWeightTonnes}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tonnes</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Max Capacity: <strong className="font-tabular font-bold tabular-nums text-slate-700 dark:text-slate-300">{maxRakeCapacityTonnes} T</strong>
              </span>
            </div>

            {/* Card 3: AI Recommendation Shortcut */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Best Boarding Chance
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-tabular text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">
                    {recommendation ? `Coach ${recommendation.recommendedCoachNo}` : 'N/A'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                {recommendation ? 'Lowest Bogie Suspension Strain' : 'Telemetry evaluating...'}
              </span>
            </div>

            {/* Card 4: Safety / Hazard Status */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Structural Status
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  {overloadedCoachesCount > 0 ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <span className="text-base font-bold text-rose-700 dark:text-rose-400">
                        {overloadedCoachesCount} Overloaded
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        Nominal / Safe
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                RDSO Load Limits Compliant
              </span>
            </div>

          </div>

          {/* AI Smart Boarding Assistant & Platform Guidance Panel */}
          {recommendation && (() => {
            const bestCoachObj = currentTrain.coaches.find(c => c.id === recommendation.recommendedCoachId);
            const estSeats = bestCoachObj ? getEstimatedAvailableSeats(bestCoachObj) : 40;
            const platformInfo = getPlatformGuide(recommendation.recommendedCoachId);

            return (
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/30 border-l-4 border-emerald-600 dark:border-emerald-500 border-r border-t border-b border-emerald-300 dark:border-emerald-800 rounded-sm shadow-xs space-y-3.5">
                
                {/* Header with AI Badge & Travel Advice */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800/70 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-700 dark:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-xs shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI Smart Boarding Assistant</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs hidden sm:inline">&bull;</span>
                    <span className="text-emerald-900 dark:text-emerald-300 font-semibold text-xs">
                      कृत्रिम बुद्धिमत्ता प्रवासी मार्गदर्शन व फलाट स्थान
                    </span>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    Optimal Boarding Choice &bull; सुलभ चढण्याची जागा
                  </span>
                </div>

                {/* Primary Recommendation Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* Left: Coach Number & Crowd Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-sm bg-emerald-700 dark:bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <TrendingDown className="w-5 h-5 text-emerald-200" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Best</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-[#002244] dark:text-white font-mono">
                          Coach {recommendation.recommendedCoachNo}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 font-bold rounded-xs">
                          {bestCoachObj?.coach_type || 'Passenger'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {recommendation.occupancyPercentage}% Occupancy
                        </span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          ~{estSeats} Seats Open
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Platform Stoppage Position */}
                  <div className="p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-sm border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Platform Stoppage &amp; Boarding Point</span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {platformInfo.section}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>Wait near: <strong>{platformInfo.pillars}</strong> ({platformInfo.marathi})</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-center">
                    <button
                      onClick={() => {
                        setLayoutCoachId(recommendation.recommendedCoachId);
                        setActivePassengerTab('seats');
                      }}
                      className="px-3 py-2 rounded-sm font-bold bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>View Seats in Coach {recommendation.recommendedCoachNo}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (bestCoachObj) setSelectedCoach(bestCoachObj);
                      }}
                      className="px-3 py-1.5 rounded-sm font-semibold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inspect Telemetry &amp; Bogie</span>
                    </button>
                  </div>

                </div>

                {/* Class-wise Least Crowded Breakdown */}
                {classWiseBest.length > 1 && (
                  <div className="pt-2.5 border-t border-emerald-200 dark:border-emerald-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Class-wise Best Options (तिकीट वर्गानुसार सर्वोत्तम डबे):
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {classWiseBest.map(({ type, coach }) => (
                        <button
                          key={type}
                          onClick={() => {
                            setLayoutCoachId(coach.id);
                            setActivePassengerTab('seats');
                          }}
                          className="px-2.5 py-1 bg-white/80 dark:bg-slate-900/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 rounded-xs text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                          title={`Click to view seat map for Coach ${coach.coach_no} (${type})`}
                        >
                          <span className="font-bold text-[#003366] dark:text-blue-300">{type}:</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{coach.coach_no}</span>
                          <span className={`text-[10px] px-1 rounded-xs font-bold ${
                            coach.occupancy_percentage <= 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {coach.occupancy_percentage}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* Horizontal Rake Composition Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-[#002244] dark:text-blue-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
                Horizontal Coach Rake Composition (Locomotive First ➔ Brake Van Rear)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Click on any coach to view telemetry breakdown &amp; bogie weights
              </span>
            </div>

            {currentTrain.coaches.length > 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-sm">
                <TrainHorizontalView
                  coaches={currentTrain.coaches}
                  recommendedCoachId={recommendation?.recommendedCoachId}
                  onSelectCoach={(coach) => setSelectedCoach(coach)}
                  selectedCoachId={selectedCoach?.id}
                />
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-sm bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
                No coaches have been registered to this train rake yet.
              </div>
            )}
          </div>

          {/* Coach-by-Coach Live Crowd & Platform Stoppage Directory Table */}
          {passengerCoaches.length > 0 && (
            <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-sm bg-slate-50 dark:bg-slate-800/40 p-3.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                  <span className="font-bold text-[#002244] dark:text-blue-200 uppercase tracking-wider text-[11px]">
                    Coach Crowd &amp; Platform Stoppage Directory (सर्व डब्यांची थेट स्थिती)
                  </span>
                </div>
                <button
                  onClick={() => setShowCoachMatrix(!showCoachMatrix)}
                  className="text-xs font-semibold text-[#003366] dark:text-blue-300 hover:underline cursor-pointer"
                >
                  {showCoachMatrix ? 'Collapse Table ▲' : 'Expand Table ▼'}
                </button>
              </div>

              {showCoachMatrix && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-2 px-3 border border-slate-300 dark:border-slate-700">Coach / डबा</th>
                        <th className="py-2 px-3 border border-slate-300 dark:border-slate-700">Class / वर्ग</th>
                        <th className="py-2 px-3 border border-slate-300 dark:border-slate-700">Live Crowd / गर्दी</th>
                        <th className="py-2 px-3 border border-slate-300 dark:border-slate-700">Est. Vacant Seats</th>
                        <th className="py-2 px-3 border border-slate-300 dark:border-slate-700">Platform Position</th>
                        <th className="py-2 px-3 border border-slate-300 dark:border-slate-700 text-center">Action / कृती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {passengerCoaches.map((c) => {
                        const plat = getPlatformGuide(c.id);
                        const freeSeats = getEstimatedAvailableSeats(c);
                        const isRecommended = recommendation?.recommendedCoachId === c.id;
                        const isOverloaded = c.current_weight_kg > c.max_capacity_kg;

                        return (
                          <tr 
                            key={c.id}
                            className={`hover:bg-slate-100 dark:hover:bg-slate-700/50 transition ${
                              isRecommended ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : ''
                            }`}
                          >
                            <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{c.coach_no}</span>
                                {isRecommended && (
                                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold uppercase rounded-xs">
                                    Best
                                  </span>
                                )}
                                {isOverloaded && (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-bold uppercase rounded-xs">
                                    Overload
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                              {c.coach_type}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${
                                  c.occupancy_percentage > 100 ? 'text-rose-600 font-black' :
                                  c.occupancy_percentage > 75 ? 'text-orange-600' :
                                  c.occupancy_percentage > 40 ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {c.occupancy_percentage}%
                                </span>
                                <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                  <div 
                                    className={`h-full ${
                                      c.occupancy_percentage > 100 ? 'bg-rose-600' :
                                      c.occupancy_percentage > 75 ? 'bg-orange-500' :
                                      c.occupancy_percentage > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(c.occupancy_percentage, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs ${
                                  c.occupancy_percentage > 100 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                  c.occupancy_percentage > 75 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                                  c.occupancy_percentage > 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                  {c.occupancy_percentage > 100 ? 'अतिभार' :
                                   c.occupancy_percentage > 75 ? 'गर्दी' :
                                   c.occupancy_percentage > 40 ? 'मध्यम' : 'मोकळा'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                              ~{freeSeats} जागा
                            </td>
                            <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px]">
                              <span>{plat.pillars}</span>
                              <span className="text-slate-400 text-[10px] ml-1">({plat.marathi})</span>
                            </td>
                            <td className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setLayoutCoachId(c.id);
                                    setActivePassengerTab('seats');
                                  }}
                                  className="px-2 py-0.5 bg-[#003366] hover:bg-blue-800 text-white rounded-xs text-[11px] font-semibold transition cursor-pointer"
                                >
                                  View Seats
                                </button>
                                <button
                                  onClick={() => setSelectedCoach(c)}
                                  className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xs text-[11px] transition cursor-pointer"
                                  title="Inspect coach weights"
                                >
                                  Inspect
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Official Indian Railways Color Coding Scheme Guide */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-2">
              Official Weight &amp; Capacity Classification Standards:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">0% – 40%</span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Space Available (Green)</span>
              </div>
              <div className="p-2 border-l-4 border-amber-600 bg-amber-50 dark:bg-amber-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">41% – 75%</span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Moderate / Normal (Yellow)</span>
              </div>
              <div className="p-2 border-l-4 border-orange-600 bg-orange-50 dark:bg-orange-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-orange-900 dark:text-orange-200 block">76% – 100%</span>
                <span className="text-[11px] text-orange-800 dark:text-orange-300 font-medium">Heavy / Packed (Orange)</span>
              </div>
              <div className="p-2 border-l-4 border-rose-700 bg-rose-50 dark:bg-rose-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-rose-900 dark:text-rose-200 block">&gt; 100% (Critical)</span>
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Overload Alarm (Red)</span>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* View 2: Interactive Coach & Seat Layout */}
          {activePassengerTab === 'seats' && (
            <div className="space-y-4 pt-1">
              <CoachSelectionHeader
                train={currentTrain}
                trainsList={filteredTrains}
                onSelectTrain={(t) => {
                  setSelectedTrainId(t.id);
                  setLayoutCoachId(t.coaches[0]?.id || '');
                }}
                selectedCoachId={layoutCoachId || currentTrain.coaches[0]?.id || ''}
                onSelectCoach={(c) => setLayoutCoachId(c.id)}
              />

              {(() => {
                const activeC = currentTrain.coaches.find(c => c.id === layoutCoachId) || currentTrain.coaches[0];
                return activeC ? (
                  <CoachVisualLayout
                    coach={activeC}
                    train={currentTrain}
                    viewerRole="passenger"
                    userSubmittedSeatNumber={userSubmittedSeat}
                  />
                ) : null;
              })()}
            </div>
          )}

          {/* View 3: Passenger On-Board Check-in Form */}
          {activePassengerTab === 'checkin' && (
            <div className="pt-1">
              <PassengerSubmissionForm
                trains={trains}
                activeTrainId={currentTrain.id}
                onSubmissionSuccess={(sub) => {
                  setUserSubmittedSeat(sub.seat_number);
                  const matchingC = currentTrain.coaches.find(c => c.coach_no === sub.coach_no);
                  if (matchingC) setLayoutCoachId(matchingC.id);
                }}
              />
            </div>
          )}

          {/* View 4: Passenger Companion Suite (Finder, Journey PNR, Favourites, Alerts, Feedback, Lost & Found, Accessibility) */}
          {activePassengerTab === 'services' && (
            <div className="pt-1">
              <PassengerAdvancedFeatures
                trains={trains}
                selectedTrain={currentTrain}
                onSelectTrain={(id) => setSelectedTrainId(id)}
                onSelectCoach={(c) => {
                  setLayoutCoachId(c.id);
                  setActivePassengerTab('seats');
                }}
              />
            </div>
          )}

          {/* View 5: Official RailRadar NTES Live Tracking & Route Progression */}
          {activePassengerTab === 'livetrack' && (
            <div className="pt-1">
              <LiveRailRadarTracker
                trainNumber={currentTrain.number}
                trainName={currentTrain.name}
              />
            </div>
          )}

          {/* View 6: All-India Railway Directory & Route Explorer (28 States, 8 UTs, 11,410 NTES Trains) */}
          {activePassengerTab === 'directory' && (
            <div className="pt-1">
              <AllIndiaRailwayExplorer
                initialTrainNumber={currentTrain?.number || '12101'}
                onSelectTrainForMonitoring={(num) => {
                  const match = trains.find(t => t.number === num);
                  if (match) {
                    setSelectedTrainId(match.id);
                  }
                  setActivePassengerTab('rake');
                }}
              />
            </div>
          )}

        </div>
      ) : (
        /* Empty State Display when 0 operational trains exist and no simulation is loaded */
        <div className="gov-card p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <TrainIcon className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-[#002244] dark:text-blue-100">
              No Operational Train Services Active in Database
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Real railway operational data is not currently connected. Physical sensors have not been integrated; live telemetries require CRIS / Railway Board authorization.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/simulator"
              className="px-4 py-2 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-sm flex items-center gap-2 transition"
            >
              <Radio className="w-4 h-4" />
              <span>Launch Isolated Simulation Scenario</span>
            </Link>
            <Link
              to="/monitoring"
              className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-sm flex items-center gap-2 transition"
            >
              <span>View Train Monitoring Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Coach Detail Modal */}
      {selectedCoach && currentTrain && (
        <CoachDetailModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
          trainName={currentTrain.name}
          trainNumber={currentTrain.number}
        />
      )}

    </div>
  );
};
