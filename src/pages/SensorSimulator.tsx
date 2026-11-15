import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Users, 
  AlertTriangle, 
  Play, 
  Pause, 
  Check, 
  Scale, 
  Info,
  Radio,
  Clock,
  PlusCircle,
  Trash2,
  SlidersHorizontal,
  Layers,
  LogOut,
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTrain, SimulationScenarioId } from '../context/TrainContext';
import { calculateCoachOccupancy, formatWeight } from '../utils/weightCalculations';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { SimplePageExplainer } from '../components/common/SimplePageExplainer';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';

export const SensorSimulator: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isMr = language === 'mr';
  const [activeScenarioId, setActiveScenarioId] = useState<SimulationScenarioId | null>(null);
  const {
    simulatedTrain,
    initSimulationScenario,
    clearSimulationScenario,
    updateSimulatedCoachWeight,
    resetSimulatedCoachWeight,
    presetSimulatedRandomCrowd,
    presetSimulatedRushHour,
    presetSimulatedEmptyTrain,
    applySimulationScenario,
    resetDemoSimulation,
    isAutoSimulating,
    toggleAutoSimulate,
    lastUpdated
  } = useTrain();

  const SCENARIOS: { id: SimulationScenarioId; name: string; desc: string; icon: any; badge: string; color: string }[] = [
    { 
      id: 'empty_train', 
      name: isMr ? '१. रिकामी गाडी (०% गर्दी)' : '1. Empty Coach (0% Full)', 
      desc: isMr ? 'प्रवाशांशिवाय केवळ मूळ वजन - कोणतीही गर्दी नाही' : 'No passengers in sample scenario (Tare weight baseline)', 
      icon: RotateCcw, 
      badge: '0% FULL', 
      color: 'border-slate-300 dark:border-slate-700' 
    },
    { 
      id: 'normal_load', 
      name: isMr ? '२. सामान्य गर्दी (४५-६५%)' : '2. Normal Crowd (45-65%)', 
      desc: isMr ? 'प्रवाशांची सामान्य संख्या - बसण्यासाठी पुरेशी जागा उपलब्ध' : 'A normal passenger load (Comfortable, space available)', 
      icon: Users, 
      badge: 'NORMAL', 
      color: 'border-blue-400 dark:border-blue-600' 
    },
    { 
      id: 'peak_hour', 
      name: isMr ? '३. व्यस्त डबा (८८-१०४%)' : '3. Busy Coach (88-104%)', 
      desc: isMr ? 'कामाच्या वेळेतील गर्दी - उभे राहून प्रवास' : 'Many passengers (Standing room only commute)', 
      icon: TrendingUp, 
      badge: 'BUSY', 
      color: 'border-orange-400 dark:border-orange-600' 
    },
    { 
      id: 'festival_rush', 
      name: isMr ? '४. खूप गर्दी / सणासुदीची गर्दी' : '4. Very Crowded (Festival Rush)', 
      desc: isMr ? 'सणासुदीच्या काळातील प्रचंड गर्दी (>११५% ओव्हरलोड)' : 'A very high passenger load (>115% critical surge)', 
      icon: Zap, 
      badge: '>115%', 
      color: 'border-rose-500 dark:border-rose-700' 
    },
    { 
      id: 'weekend_rush', 
      name: isMr ? '५. वीकेंड गर्दी (७२-८८%)' : '5. Weekend Rush (72-88%)', 
      desc: isMr ? 'सुट्टीच्या दिवसांतील मध्यम-जास्त प्रवासी संख्या' : 'Moderate weekend holiday passenger travel', 
      icon: Calendar, 
      badge: 'WEEKEND', 
      color: 'border-amber-400 dark:border-amber-600' 
    },
    { 
      id: 'overloaded_coach', 
      name: isMr ? '६. ओव्हरलोड नमुना (>१२०%)' : '6. Overloaded Example (>120%)', 
      desc: isMr ? 'सुरक्षित मर्यादेपेक्षा जास्त वजनाचे प्रात्यक्षिक' : 'Demonstration of weight above the configured safety limit', 
      icon: AlertTriangle, 
      badge: 'OVERLOAD', 
      color: 'border-red-600 dark:border-red-700' 
    },
    { 
      id: 'uneven_occupancy', 
      name: isMr ? '७. विषम डबा गर्दी' : '7. Uneven Coach Crowd', 
      desc: isMr ? 'पुढील डब्यात ९८% तर मधल्या डब्यात २८% गर्दी' : 'Front coaches packed (98%), middle coaches empty (28%)', 
      icon: SlidersHorizontal, 
      badge: 'UNEVEN', 
      color: 'border-purple-400 dark:border-purple-600' 
    },
    { 
      id: 'sudden_boarding', 
      name: isMr ? '८. अचानक चढलेली गर्दी' : '8. Sudden Boarding (+45)', 
      desc: isMr ? 'मोठ्या जंक्शनवर एकदम ४५ प्रवासी वाढणे' : 'Major junction stepped influx (+45 passengers/coach)', 
      icon: ArrowUpCircle, 
      badge: '+45 PAX', 
      color: 'border-emerald-500 dark:border-emerald-600' 
    },
    { 
      id: 'passenger_departure', 
      name: isMr ? '९. प्रवासी उतरणे (-४०)' : '9. Passengers Leaving (-40)', 
      desc: isMr ? 'स्थानकावर प्रवासी उतरल्यामुळे वजन कमी होणे' : 'Terminal station drop (-40 passengers/coach)', 
      icon: ArrowDownCircle, 
      badge: '-40 PAX', 
      color: 'border-teal-500 dark:border-teal-600' 
    },
    { 
      id: 'journey_progression', 
      name: isMr ? '१०. प्रवासाचा टप्पा' : '10. Journey Progression', 
      desc: isMr ? 'अनेक स्थानकांदरम्यान सतत बदलणारी गर्दी' : 'Multi-stop journey load curve progression', 
      icon: Activity, 
      badge: 'TRANSIT', 
      color: 'border-indigo-500 dark:border-indigo-600' 
    }
  ];

  const handleSelectScenario = (id: SimulationScenarioId) => {
    setActiveScenarioId(id);
    applySimulationScenario(id);
  };

  return (
    <div className="space-y-5 py-4">
      
      {/* Official Government Page Title & Status Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <img 
            src={indianRailwaysLogo} 
            alt="Indian Railways Logo" 
            className="w-12 h-12 object-contain drop-shadow hidden sm:block shrink-0" 
          />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>R&amp;D Testing Facility</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-purple-700 dark:text-purple-400 font-semibold">Software Sensor Simulator</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 uppercase tracking-tight">
              {t.simulator.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
              Software-based bogie strain simulation environment. Adjust dynamic passenger payloads, test overload threshold alarms, and evaluate telemetry behavior without live hardware.
            </p>
          </div>
        </div>

        {/* Sync Indicator & Exit Button */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            <span>Last Synced:</span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs border border-rose-400 transition cursor-pointer"
            title="Exit Simulator to Main Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Prominent Mandatory Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Simple Page Explainer for Beginners & Viva Evaluators */}
      <SimplePageExplainer pageKey="simulator" />

      {/* Simulation Scenario Status & Session Management */}
      <div className="gov-card p-4 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100">
              Simulation Session Controller
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              SIMULATED DATA ONLY
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!simulatedTrain ? (
              <button
                onClick={() => initSimulationScenario('SIM-12001', 'Simulation Express (LHB 12-Rake)')}
                className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Initialize Test Simulation Session</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetDemoSimulation}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-semibold rounded-sm flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Reset simulated train to baseline (SIM-12001) and purge simulated test alerts"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Baseline</span>
                </button>
                <button
                  onClick={clearSimulationScenario}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-semibold rounded-sm flex items-center gap-1.5 transition cursor-pointer"
                  title="End current simulation session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Terminate Session</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {simulatedTrain ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Active Test Rake:</span>{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-mono">#{simulatedTrain.number}</strong> –{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{simulatedTrain.name}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400">({simulatedTrain.coaches.length} Coaches Attached)</span>
              </div>

              {/* Presets and Auto-Simulate Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={presetSimulatedRandomCrowd}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-sm flex items-center gap-1 transition cursor-pointer"
                  title="Generate normal random crowd variance"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{isMr ? "सामान्य गर्दी" : "Normal Crowd"}</span>
                </button>

                <button
                  onClick={presetSimulatedRushHour}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-sm flex items-center gap-1 transition cursor-pointer"
                  title="Inject severe peak rush hour overload (>100%)"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{isMr ? "जास्त गर्दी (Rush)" : "Rush Hour Crowd"}</span>
                </button>

                <button
                  onClick={presetSimulatedEmptyTrain}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-sm flex items-center gap-1 transition cursor-pointer"
                  title="Reset all coaches to empty tare weight"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{isMr ? "रिकामी गाडी (0%)" : "Empty Coach (0%)"}</span>
                </button>

                <button
                  onClick={toggleAutoSimulate}
                  className={`px-3 py-1 text-xs font-semibold rounded-sm border flex items-center gap-1.5 transition cursor-pointer ${
                    isAutoSimulating
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-[#003366] dark:border-blue-500'
                  }`}
                >
                  {isAutoSimulating ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isMr ? "स्वयंचलित चाचणी थांबवा" : "Stop Auto Demo"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{isMr ? "स्वयंचलित चाचणी सुरू करा" : "Start Auto Demo"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 10 Realistic Railway Simulation Scenarios Palette */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isMr ? "१० सराव परिस्थिती (नमुना गर्दी चाचणी)" : "10 Practice Scenarios (Sample Crowd Testing)"}</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-xs bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-mono">
                  SIMULATED DATA ONLY
                </span>
              </div>

              {/* What Happens Callout */}
              <div className="p-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-sm text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-1.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{isMr ? "हे कसे कार्य करते? " : "What happens when you click a scenario? "}</strong>
                  {isMr 
                    ? "कोणतेही बटण दाबताच गाडीच्या डब्यांचे वजन आणि गर्दी आपोआप बदलेल. प्रवासी व कर्मचाऱ्यांच्या स्क्रीनवर याचा परिणाम कसा दिसतो हे तुम्ही लगेच तपासू शकता."
                    : "The coach gross weight and crowd indicators will instantly update across all passenger, staff, and station display screens so you can observe how alarms and recommendations respond in real time."}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {SCENARIOS.map(sc => {
                  const Icon = sc.icon;
                  const isSelected = activeScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectScenario(sc.id)}
                      className={`p-2.5 rounded-sm border text-left transition cursor-pointer flex flex-col justify-between min-h-[92px] ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-400 ring-1 ring-blue-500 shadow-xs' 
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                      title={sc.desc}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          {sc.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {sc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1 line-clamp-2">
                          {sc.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formula banner */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm text-[11px] text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
              <span>
                Standard Formula: Occupancy % = ((Weight<sub>current</sub> &minus; Weight<sub>tare</sub>) / (Weight<sub>gross_max</sub> &minus; Weight<sub>tare</sub>)) &times; 100
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-sans">
                Status updates propagate instantly across all open views
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No simulation session is currently running.
            </p>
            <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400">
              To verify real-time bogie weight telemetry, safety overload alarms, and passenger crowd balancing, initialize an isolated simulation session above.
            </p>
          </div>
        )}
      </div>

      {/* Simulated Coach Sliders Table */}
      {simulatedTrain && (
        <div className="gov-card overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300 flex items-center justify-between">
            <span>Individual Bogie Load Telemetry Sliders ({simulatedTrain.coaches.length} Coaches)</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 normal-case">
              Drag slider or click reset to test load changes
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {simulatedTrain.coaches.map((coach) => {
              const occ = calculateCoachOccupancy(
                coach.current_weight_kg,
                coach.empty_weight_kg,
                coach.max_capacity_kg,
                coach.coach_type
              );

              // Status styles
              let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
              if (occ.status === 'moderate') badgeColor = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
              if (occ.status === 'full') badgeColor = 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800';
              if (occ.status === 'overloaded') badgeColor = 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-700 font-bold';

              const isLoco = coach.coach_type === 'Engine';

              return (
                <div key={coach.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Coach ID & Type */}
                    <div className="w-full md:w-56 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-tabular font-bold tabular-nums text-sm text-[#002244] dark:text-blue-300">
                          {coach.coach_no}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {coach.coach_type}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold font-tabular tabular-nums uppercase rounded-sm border ${badgeColor}`}>
                          {occ.status.toUpperCase()} ({occ.clampedOccupancy}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {isMr ? 'रिकामे वजन' : 'Tare'}: {formatWeight(coach.empty_weight_kg)} | {isMr ? 'कमाल मर्यादा' : 'Max Limit'}: {formatWeight(coach.max_capacity_kg)}
                      </div>
                    </div>

                    {/* Weight Slider */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {isMr ? 'डब्यातील प्रत्यक्ष वजन (स्लायडर सरकवा):' : 'Adjust Coach Weight (Slide or Nudge):'}
                        </span>
                        <span className="font-tabular tabular-nums font-bold text-slate-900 dark:text-slate-100">
                          {formatWeight(coach.current_weight_kg)}
                          {!isLoco && (
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1.5 font-sans">
                              (~{occ.estimatedPassengerCount} {isMr ? 'अंदाजित प्रवासी' : 'passengers (est.)'})
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-tabular tabular-nums">
                          {formatWeight(coach.empty_weight_kg)}
                        </span>
                        <input
                          type="range"
                          min={coach.empty_weight_kg}
                          max={coach.max_capacity_kg * 1.15} // Allow 15% overload testing
                          step={100}
                          value={coach.current_weight_kg}
                          onChange={(e) => updateSimulatedCoachWeight(coach.id, Number(e.target.value))}
                          disabled={isLoco}
                          className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-sm appearance-none cursor-pointer accent-[#003366] dark:accent-blue-500 disabled:opacity-50"
                        />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-tabular tabular-nums">
                          {formatWeight(coach.max_capacity_kg * 1.15)}
                        </span>
                      </div>
                    </div>

                    {/* Manual Nudge & Reset Buttons */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {!isLoco && (
                        <>
                          <button
                            onClick={() => {
                              const newWeight = Math.max(coach.empty_weight_kg, coach.current_weight_kg - 350);
                              updateSimulatedCoachWeight(coach.id, newWeight);
                            }}
                            disabled={coach.current_weight_kg <= coach.empty_weight_kg}
                            className="px-2 py-1 text-[11px] font-semibold rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                            title="Decrement load by 5 passengers (-350 kg)"
                          >
                            -5 Pax
                          </button>
                          <button
                            onClick={() => {
                              const newWeight = Math.min(coach.max_capacity_kg * 1.25, coach.current_weight_kg + 350);
                              updateSimulatedCoachWeight(coach.id, newWeight);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Increment load by 5 passengers (+350 kg)"
                          >
                            +5 Pax
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => resetSimulatedCoachWeight(coach.id)}
                        disabled={isLoco || coach.current_weight_kg === coach.empty_weight_kg}
                        className="px-2.5 py-1 text-xs font-semibold rounded-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                        title={isMr ? "हा डबा मूळ रिकाम्या वजनावर परत आणा" : "Reset this coach to empty tare weight"}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isMr ? "डबा रिकामा करा (Tare)" : "Empty Coach (Tare)"}</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
