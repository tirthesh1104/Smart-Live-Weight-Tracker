import React, { useState } from 'react';
import { 
  Users, 
  Tv, 
  Sliders, 
  Activity, 
  ArrowRight, 
  FileText, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Cpu, 
  ShieldCheck, 
  Database, 
  BookOpen, 
  ChevronRight,
  TrendingDown,
  Layers,
  Train as TrainIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTrain } from '../context/TrainContext';
import { TrainHorizontalView } from '../components/train/TrainHorizontalView';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { RailwayImage } from '../components/common/RailwayImage';
import { Coach } from '../types';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';
import heroRailwayStation from '../assets/hero-railway-station.jpg';

interface LandingPageProps {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { t, language } = useLanguage();
  const { trains, notifications, simulatedTrain } = useTrain();

  // Strictly display verified trains from persistent storage. No unverified mock rakes.
  const displayCoaches = trains.length > 0 && trains[0].coaches && trains[0].coaches.length > 0
    ? trains[0].coaches
    : [];

  const totalTrains = trains.length;
  const totalCoaches = trains.reduce((acc, t) => acc + t.coaches.length, 0);

  return (
    <div className="space-y-8 py-2">
      
      {/* SECTION A — MAIN RAILWAY HERO SECTION */}
      <div className="relative card-modern overflow-hidden bg-white dark:bg-slate-900">
        
        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Left Text & Actions Column (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              {/* Badge & Official Category Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase rounded-xs bg-[#003366] text-white tracking-wider">
                  Railway Technology Prototype
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Ref: GIGW 3.0 Usability Standards
                </span>
              </div>

              {/* Main Project Title & Subtitle with Official Branding */}
              <div className="flex items-start gap-4">
                <img 
                  src={indianRailwaysLogo} 
                  alt="Indian Railways Logo" 
                  className="w-14 h-14 object-contain shrink-0 drop-shadow-sm hidden sm:block" 
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight uppercase font-sans">
                    Smart Live Weight Tracker
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    Railway Passenger Coach Crowd Monitoring &amp; Load Management System
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    {language === 'mr' ? 'रेल्वे प्रवासी डबा थेट वजन व गर्दी नियंत्रण प्रणाली' : 'Bogie Suspension Strain Differential Telemetry Framework'}
                  </p>
                </div>
              </div>

              {/* Clear Project Explanation */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                An engineering software prototype that evaluates passenger coach occupancy using bogie suspension weight measurements. The system helps passengers identify less-crowded coaches prior to boarding and alerts railway operational personnel to structural overload conditions.
              </p>
            </div>

            {/* Quick Action Navigation Links */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => navigate('/passenger')}
                  className="btn-modern-primary text-xs"
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>Passenger Coach Enquiry</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>

                <button
                  onClick={() => navigate('/monitoring')}
                  className="btn-modern-secondary text-xs"
                >
                  <Activity className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                  <span>Train Fleet Monitoring</span>
                </button>

                <button
                  onClick={() => navigate('/display')}
                  className="btn-modern-secondary text-xs"
                >
                  <Tv className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Station TV Display</span>
                </button>

                <a
                  href="#how-it-works"
                  className="text-xs font-semibold text-[#003366] dark:text-blue-400 hover:underline px-2 py-1 transition-colors"
                >
                  Explore How It Works &darr;
                </a>
              </div>

              {/* Independent Prototype Disclosure */}
              <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border-l-4 border-amber-600 rounded-xs text-[11px] text-amber-900 dark:text-amber-200">
                <strong>Independent Prototype Notice:</strong> Real railway operational data is not currently connected. Physical sensors have not been integrated; live telemetries require CRIS / Railway Board approval.
              </div>
            </div>

          </div>

          {/* Right Column: Authentic Railway Photograph (5 cols) */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
            <RailwayImage
              src={heroRailwayStation}
              alt="Indian Railways Passenger Train at Station Platform - Platform 3 Santragachi Express"
              className="w-full h-full min-h-[260px] object-cover"
              fallbackText="Indian Railways Passenger Train & Station Platform Berth Infrastructure"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 text-white text-[11px]">
              <span className="font-semibold block text-amber-300">Indian Railway Station Platform Operations</span>
              <span className="text-slate-300 text-[10px]">Real-time passenger flow &amp; coach berth crowd balancing</span>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION B — THE PROBLEM WE ARE SOLVING */}
      <div className="gov-card p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Operational Challenges &amp; Passenger Safety
          </div>
          <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300 mt-0.5">
            The Problem: Platform Congestion &amp; Uneven Coach Loading
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="w-8 h-8 rounded-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              01
            </div>
            <strong className="block text-slate-900 dark:text-slate-100 font-bold">
              Passenger Crowd Uncertainty
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Commuters waiting on platforms lack pre-arrival visibility into which coach has available seating or standing capacity, causing platform bottlenecking.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="w-8 h-8 rounded-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold">
              02
            </div>
            <strong className="block text-slate-900 dark:text-slate-100 font-bold">
              Uneven Boarding Density
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Commuters often rush toward center coaches near foot-overbridges while end coaches remain under-utilized, delaying train departure turnarounds.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="w-8 h-8 rounded-xs bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold">
              03
            </div>
            <strong className="block text-slate-900 dark:text-slate-100 font-bold">
              Lack of Weight Visibility
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Station operational teams and Railway Protection Force (RPF) personnel lack continuous real-time telemetry indicating individual bogie load distribution.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="w-8 h-8 rounded-xs bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold">
              04
            </div>
            <strong className="block text-slate-900 dark:text-slate-100 font-bold">
              Structural Overload Risks
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Excessive passenger overcrowding beyond maximum gross capacity poses mechanical strain on bogie suspension springs, secondary dampeners, and wheel bearings.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION C — HOW OUR SYSTEM WORKS */}
      <div id="how-it-works" className="gov-card p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Technical Methodology &amp; Process Pipeline
          </div>
          <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300 mt-0.5">
            How The System Works: 4-Stage Operational Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t-3 border-t-[#003366] dark:border-t-blue-500 border-x border-b border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#003366] dark:text-blue-400">STAGE 01</span>
              <Scale className="w-4 h-4 text-slate-400" />
            </div>
            <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              Bogie Load Measurement
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Piezoelectric strain gauge sensors mounted on bogie secondary suspensions measure vertical deflection under rolling stock gross payload.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t-3 border-t-[#003366] dark:border-t-blue-500 border-x border-b border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#003366] dark:text-blue-400">STAGE 02</span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              Passenger Payload Estimation
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The algorithm subtracts calibrated empty tare weight from current gross weight: <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1">Payload = W_gross - W_tare</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t-3 border-t-[#003366] dark:border-t-blue-500 border-x border-b border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#003366] dark:text-blue-400">STAGE 03</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              Occupancy Calculation
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Estimated passenger payload is compared with rated design capacity: <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1">Occ % = (Payload / Rated) * 100</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t-3 border-t-[#003366] dark:border-t-blue-500 border-x border-b border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#003366] dark:text-blue-400">STAGE 04</span>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>
            <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              Monitoring &amp; Safety Alerts
            </strong>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-time load levels display on station platform TV boards and immediately trigger overload warnings to Station Masters when exceeding 100%.
            </p>
          </div>

        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xs text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span>* Physical strain gauges are not currently installed on rolling stock. All telemetry is generated in this prototype via software simulation.</span>
          <span className="font-mono font-bold text-[#003366] dark:text-blue-400">Hardware Integration: Planned</span>
        </div>
      </div>

      {/* SECTION D — RAILWAY COACH RAKE VISUALIZATION (BOOKING-STYLE COACH SELECTION) */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Live Horizontal Rake Composition Display
            </div>
            <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300 mt-0.5">
              Railway Train Rake Layout &amp; Coach Occupancy
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any coach below to inspect telemetry details:
            </span>
          </div>
        </div>

        {/* Horizontal Coach View */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xs">
          {displayCoaches.length > 0 ? (
            <TrainHorizontalView
              coaches={displayCoaches}
              recommendedCoachId={displayCoaches.find(c => c.occupancy_percentage < 50 && c.coach_type !== 'Engine')?.id}
              onSelectCoach={() => {}}
            />
          ) : (
            <div className="py-6 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-semibold">Verified Railway Rake Data Currently Unavailable</p>
              <p className="text-xs mt-1">Connect to authorized Railway telemetry or manage rakes from the Admin Console.</p>
            </div>
          )}
        </div>

        {/* SECTION E — OCCUPANCY CLASSIFICATION LEGEND */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Occupancy Classification &amp; Weight Safety Thresholds:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700 text-emerald-900 dark:text-emerald-300">
              <span className="font-bold block">0% – 40%</span>
              <span className="text-[11px] font-medium">Available (Green) &bull; Ample Space</span>
            </div>
            <div className="p-2 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700 text-amber-900 dark:text-amber-300">
              <span className="font-bold block">41% – 75%</span>
              <span className="text-[11px] font-medium">Moderate (Yellow) &bull; Normal Load</span>
            </div>
            <div className="p-2 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700 text-orange-900 dark:text-orange-300">
              <span className="font-bold block">76% – 100%</span>
              <span className="text-[11px] font-medium">Full / Heavy (Orange) &bull; Dense Crowd</span>
            </div>
            <div className="p-2 border-l-4 border-rose-600 bg-rose-50 dark:bg-rose-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700 text-rose-900 dark:text-rose-300">
              <span className="font-bold block">&gt; 100% (Critical)</span>
              <span className="text-[11px] font-bold">Overload Alarm (Red) &bull; Safety Limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION F — MAIN PORTAL SERVICES */}
      <div className="gov-card p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Public &amp; Operational Functional Modules
          </div>
          <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300 mt-0.5">
            Portal Services &amp; Operational Desks
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          {/* Service 1 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#003366] dark:text-blue-400 font-bold text-sm">
                <Users className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                <h3>Passenger Coach Enquiry</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Live search by Train Number or Name. Displays coach load distribution, best coach recommendations, and status guides.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button
                onClick={() => navigate('/passenger')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xs flex items-center justify-center gap-1 transition"
              >
                <span>Open Passenger Enquiry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Service 2 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#003366] dark:text-blue-400 font-bold text-sm">
                <Activity className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                <h3>Train Fleet Monitoring</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Directory of monitored train rakes, routes, and coach rosters. Allows registering new trains and configuring coach tare weights.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button
                onClick={() => navigate('/monitoring')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xs flex items-center justify-center gap-1 transition"
              >
                <span>Open Train Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Service 3 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#003366] dark:text-blue-400 font-bold text-sm">
                <Tv className="w-4 h-4 text-emerald-600" />
                <h3>Station Platform TV Display</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                High-contrast electronic LED platform board display optimized for TV wall mounts at railway station platforms.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button
                onClick={() => navigate('/display')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xs flex items-center justify-center gap-1 transition"
              >
                <span>Launch Platform Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Service 4 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#003366] dark:text-blue-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h3>Station Master &amp; RPF Operations Desk</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Operations console for Station Masters and RPF duty staff to verify overload alarms and log safety incidents into the duty audit ledger.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button
                onClick={() => navigate('/staff')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xs flex items-center justify-center gap-1 transition"
              >
                <span>Access Staff Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Service 5 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#003366] dark:text-blue-400 font-bold text-sm">
                <FileText className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                <h3>Operational Reports &amp; CSV Export</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Export train rosters, safety incident archives, and raw strain gauge telemetry packets into CSV format or printable audit sheets.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button
                onClick={() => navigate('/reports')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xs flex items-center justify-center gap-1 transition"
              >
                <span>View Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Service 6 */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#003366] dark:text-blue-400 font-bold text-sm">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3>Software Bogie Sensor Simulator</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Isolated engineering test sandbox to simulate passenger crowd influx, trigger rush-hour surges, and test overload alarm thresholds.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <button
                onClick={() => navigate('/simulator')}
                className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white font-semibold rounded-xs flex items-center justify-center gap-1 transition"
              >
                <span>Launch Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION G — OPERATIONAL OVERVIEW & DATA STATUS */}
      <div className="card-modern p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Real Database Records &bull; Transparency Reporting
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Operational Inventory Status
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registered Trains</span>
            <span className="text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100 mt-1 block">{totalTrains}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Fleet Services</span>
          </div>

          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registered Coaches</span>
            <span className="text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100 mt-1 block">{totalCoaches}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Total Rolling Stock</span>
          </div>

          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Active Alerts</span>
            <span className="text-2xl font-bold font-tabular tabular-nums text-rose-700 dark:text-rose-400 mt-1 block">{notifications.length}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Overload Warnings</span>
          </div>

          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Database Engine</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-2">Local Storage Mode</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Supabase Ready</span>
          </div>

          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Physical Sensors</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mt-2">Unconnected</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Software Simulator</span>
          </div>

        </div>
      </div>

      {/* SECTION H — TECHNICAL ARCHITECTURE */}
      <div className="gov-card p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            System Implementation Stack &bull; Production Architecture
          </div>
          <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300 mt-0.5">
            Technical Architecture &amp; System Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-xs">
              Frontend Client
            </span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">React 18 + Vite + TypeScript</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Tailwind CSS, Lucide React icons, and Recharts analytics. Includes dual-theme Light/Dark Mode, accessible font scaling, and bilingual English/मराठी localization.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xs">
              Database &amp; Auth
            </span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Supabase Integration Readiness</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Configured for Supabase PostgreSQL, Row Level Security (RLS) policies, and Realtime pub/sub replication, with full offline Local Storage fallback.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-xs">
              AI Analytics Engine
            </span>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">FastAPI + Machine Learning</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Provides 15, 30, and 60-minute crowd prediction horizons, anomaly overload detection, and deterministic natural language telemetry analysis.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION I — BENEFITS AND INTENDED USERS */}
      <div className="gov-card p-6 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Stakeholder Value Proposition
          </div>
          <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300 mt-0.5">
            Benefits for Passengers &amp; Railway Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="p-3.5 border-l-3 border-[#003366] bg-slate-50 dark:bg-slate-800/60 border-r border-t border-b border-slate-200 dark:border-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">For Railway Commuters</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              View real-time coach crowd distribution prior to train arrival. Identify optimal boarding berths and avoid dangerously packed coaches.
            </p>
          </div>

          <div className="p-3.5 border-l-3 border-amber-600 bg-slate-50 dark:bg-slate-800/60 border-r border-t border-b border-slate-200 dark:border-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">For Station Masters</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive immediate automated notifications when any coach exceeds structural safe limits. Direct platform announcements to disperse crowd.
            </p>
          </div>

          <div className="p-3.5 border-l-3 border-purple-600 bg-slate-50 dark:bg-slate-800/60 border-r border-t border-b border-slate-200 dark:border-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">For RPF Personnel</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Deploy crowd management personnel precisely to platforms and coach positions flagged as high-density or overloaded during peak rush hours.
            </p>
          </div>

          <div className="p-3.5 border-l-3 border-emerald-600 bg-slate-50 dark:bg-slate-800/60 border-r border-t border-b border-slate-200 dark:border-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">For Rolling Stock Engineers</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Audit long-term strain telemetry archives to identify rakes subjected to frequent chronic overload, aiding preventive maintenance cycles.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION J — FINAL SERVICE NAVIGATION & LEGAL NOTICE */}
      <div className="gov-card p-6 bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-300 dark:border-slate-700 text-center space-y-4">
        
        <div className="max-w-xl mx-auto space-y-1.5">
          <h2 className="text-lg font-bold text-[#002244] dark:text-blue-300">
            Access Smart Live Weight Tracker Portal Services
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Choose a functional service module below to explore live coach load tracking, platform displays, or the software simulator.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            onClick={() => navigate('/passenger')}
            className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-xs flex items-center gap-1.5 transition"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Passenger Enquiry</span>
          </button>

          <button
            onClick={() => navigate('/monitoring')}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xs flex items-center gap-1.5 transition"
          >
            <Activity className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            <span>Train Monitoring</span>
          </button>

          <button
            onClick={() => navigate('/display')}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xs flex items-center gap-1.5 transition"
          >
            <Tv className="w-4 h-4 text-emerald-600" />
            <span>Station Platform TV</span>
          </button>

          <button
            onClick={() => navigate('/help')}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xs flex items-center gap-1.5 transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>User Guidelines</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 max-w-2xl mx-auto">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Independent Prototype Disclosure:</strong> This website is an independent software prototype demonstrating weight-based coach occupancy tracking. It does not represent an official Indian Railways or Government of India website and physical sensors are not currently connected.
          </p>
        </div>

      </div>

    </div>
  );
};
