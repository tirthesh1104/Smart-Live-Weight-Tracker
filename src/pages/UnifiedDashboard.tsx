import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Tv, 
  Sliders, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  Scale, 
  Sparkles, 
  Train as TrainIcon,
  LogOut
} from 'lucide-react';
import { useTrain } from '../context/TrainContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TrainHorizontalView } from '../components/train/TrainHorizontalView';
import { AIClientService } from '../services/aiClient';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { useNavigate, Link } from 'react-router-dom';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';

export const UnifiedDashboard: React.FC = () => {
  const { trains, selectedTrain, setSelectedTrainId, simulatedTrain } = useTrain();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of the portal?')) {
      await signOut();
      navigate('/login');
    }
  };

  const currentTrain = selectedTrain || trains[0] || simulatedTrain;
  const recommendation = currentTrain && currentTrain.coaches.length > 0
    ? AIClientService.getBestCoachRecommendation(currentTrain.coaches)
    : null;

  const totalCoaches = trains.reduce((acc, t) => acc + t.coaches.length, 0);
  const overloadedCount = trains.flatMap(t => t.coaches).filter(c => c.current_weight_kg > c.max_capacity_kg).length;

  return (
    <div className="space-y-5 py-4">
      
      {/* Official Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <img 
            src={indianRailwaysLogo} 
            alt="Indian Railways Logo" 
            className="w-12 h-12 object-contain drop-shadow hidden sm:block shrink-0" 
          />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Indian Railways Operations &bull; Central Unified Command
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 uppercase tracking-tight">
              Operational Overview &amp; Service Navigation Hub
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Active operator: <strong className="text-slate-900 dark:text-slate-100">{user?.full_name || 'Guest User'}</strong> &bull; Role: <strong className="text-slate-900 dark:text-slate-100">{user?.role?.toUpperCase() || 'COMMUTER'}</strong>.
            </p>
          </div>
        </div>

        {/* Quick Portal Jump Buttons & Exit Button */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Link
            to="/passenger"
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-sm transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            <span>Passenger Enquiry</span>
          </Link>
          <Link
            to="/display"
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-sm transition flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Station TV</span>
          </Link>
          <Link
            to="/simulator"
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-sm transition flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
            <span>Simulator</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold rounded-sm flex items-center gap-1 cursor-pointer transition shadow-sm"
            title="Sign out of active session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Official KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-modern p-3.5">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registered Fleet</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-slate-900 dark:text-slate-100">{trains.length} Trains</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{totalCoaches} Passenger Coaches</span>
        </div>

        <div className="card-modern p-3.5">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Data Telemetry</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-[#003366] dark:text-blue-400">Local Mode</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Physical Sensors Unconnected</span>
        </div>

        <div className="card-modern p-3.5">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Overloaded Hazards</span>
          <span className="text-xl sm:text-2xl font-bold font-tabular tabular-nums text-rose-700 dark:text-rose-400">{overloadedCount}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Critical Alarms Flagged</span>
        </div>

        <div className="card-modern p-3.5">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Active Authority</span>
          <span className="text-xl sm:text-2xl font-bold capitalize text-slate-900 dark:text-slate-100">{user?.role || 'Guest'}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Role Authorization Level</span>
        </div>
      </div>

      {/* Active Train Live View */}
      {currentTrain ? (
        <div className="gov-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-sm bg-[#003366] dark:bg-blue-600 text-white">
                  {currentTrain.number}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#002244] dark:text-slate-100">
                  {currentTrain.name}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {currentTrain.data_source || 'SIMULATED DATA'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Route: {currentTrain.from_station} ➔ {currentTrain.to_station} &bull; {currentTrain.coaches.length} Coaches
              </p>
            </div>

            {trains.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Select Rake:</span>
                <select
                  value={currentTrain.id}
                  onChange={(e) => setSelectedTrainId(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                >
                  {trains.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.number} - {tr.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* AI Recommendation Banner */}
          {recommendation && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-700 dark:border-emerald-500 border-r border-t border-b border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-emerald-950 dark:text-emerald-200 font-medium">
                  AI Recommendation: Coach {recommendation.recommendedCoachNo} ({recommendation.coachType}) has lowest occupancy at {recommendation.occupancyPercentage}%.
                </span>
              </div>
              <Link
                to="/passenger"
                className="text-emerald-800 dark:text-emerald-300 font-bold hover:underline shrink-0"
              >
                Inspect &rarr;
              </Link>
            </div>
          )}

          {/* Horizontal Coach View */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm">
            <TrainHorizontalView
              coaches={currentTrain.coaches}
              recommendedCoachId={recommendation?.recommendedCoachId}
              onSelectCoach={() => navigate('/passenger')}
            />
          </div>
        </div>
      ) : (
        <div className="gov-card p-6 text-center space-y-2">
          <TrainIcon className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-[#002244] dark:text-blue-300">
            No Monitored Trains Available in Registry
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Operational database starts clean. You can register trains in the Train Monitoring directory or launch an isolated scenario in the Simulator.
          </p>
          <div className="pt-1 flex items-center justify-center gap-2 text-xs">
            <Link
              to="/simulator"
              className="px-3 py-1.5 bg-[#003366] dark:bg-blue-600 text-white font-semibold rounded-sm"
            >
              Start Simulator
            </Link>
            <Link
              to="/monitoring"
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-sm"
            >
              Train Directory
            </Link>
          </div>
        </div>
      )}

      {/* Role Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Operations Hub */}
        <div className="gov-card p-4 space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Station Operations Services
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Monitor coach weights, receive structural overload warnings, and log station safety incidents.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <Link
              to="/staff"
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-sm font-semibold flex items-center gap-1 shadow-sm transition"
            >
              <span>Staff Desk</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/display"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white rounded-sm font-semibold flex items-center gap-1 shadow-sm transition"
            >
              <span>Station Platform Board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Administration Hub */}
        <div className="gov-card p-4 space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            Chief Traffic Controller Command
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Manage train compositions, adjust tare weights, inspect audit trails, and run AI analytics.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <Link
              to="/admin"
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-sm font-semibold flex items-center gap-1 shadow-sm transition"
            >
              <span>CTC Administration</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/settings"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white rounded-sm font-semibold flex items-center gap-1 shadow-sm transition"
            >
              <span>Settings</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
