import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Clock, 
  AlertTriangle, 
  TrendingDown,
  Info, 
  Radio, 
  Train as TrainIcon, 
  LogOut,
  Play,
  Pause,
  Languages,
  QrCode,
  MapPin,
  Megaphone,
  Layers,
  LayoutGrid, 
  Columns,
  Sparkles,
  WifiOff,
  Volume2,
  VolumeX,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrain } from '../context/TrainContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateCoachOccupancy } from '../utils/weightCalculations';
import { AIClientService, CrowdBalancingResult } from '../services/aiClient';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { StationDisplayCoachSeatView } from '../components/coach/StationDisplayCoachSeatView';
import { TrainHorizontalView } from '../components/train/TrainHorizontalView';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';
import { Coach } from '../types';

export const StationDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { trains, selectedTrain, selectedTrainId, setSelectedTrainId, lastUpdated, simulatedTrain } = useTrain();
  const { t } = useLanguage();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<'visual_rake' | 'seats' | 'composition' | 'heatmap'>('visual_rake');
  
  // Advanced Station Display states
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Platform 03');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [bilingualMode, setBilingualMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeSelectedCoach, setActiveSelectedCoach] = useState<Coach | null>(null);
  const [balanceAdvisory, setBalanceAdvisory] = useState<CrowdBalancingResult | null>(null);

  // Real-time wall clock & network status
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine active display train
  const operationalTrains = trains.length > 0 ? trains : (simulatedTrain ? [simulatedTrain] : []);
  const currentTrain = selectedTrain || operationalTrains[0] || simulatedTrain;

  // Web Speech API Voice Announcement Synthesizer
  const speakAnnouncement = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice announcement error:', e);
    }
  };

  // Auto-rotation cycle (12 seconds per train)
  useEffect(() => {
    if (!autoRotate || operationalTrains.length <= 1) return;

    const intervalMs = 12000;
    const stepMs = 100;
    let elapsed = 0;

    const rotTimer = setInterval(() => {
      elapsed += stepMs;
      setRotationProgress(Math.min(100, (elapsed / intervalMs) * 100));

      if (elapsed >= intervalMs) {
        elapsed = 0;
        setRotationProgress(0);
        const currentIndex = operationalTrains.findIndex(tr => tr.id === currentTrain?.id);
        const nextIndex = (currentIndex + 1) % operationalTrains.length;
        setSelectedTrainId(operationalTrains[nextIndex].id);

        if (voiceEnabled && operationalTrains[nextIndex]) {
          speakAnnouncement(`Train ${operationalTrains[nextIndex].number}, ${operationalTrains[nextIndex].name}, on Platform 3. Live coach weight monitoring active.`);
        }
      }
    }, stepMs);

    return () => clearInterval(rotTimer);
  }, [autoRotate, operationalTrains, currentTrain, setSelectedTrainId, voiceEnabled]);

  // Fetch real-time platform crowd balancing advisory
  useEffect(() => {
    if (!currentTrain || !currentTrain.coaches || currentTrain.coaches.length === 0) return;
    let isMounted = true;
    AIClientService.getBalanceAdvisory(currentTrain.id, currentTrain.number, 3, currentTrain.coaches)
      .then(res => {
        if (isMounted) setBalanceAdvisory(res);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [currentTrain, lastUpdated]);

  const recommendation = currentTrain && currentTrain.coaches.length > 0
    ? AIClientService.getBestCoachRecommendation(currentTrain.coaches)
    : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Marathi translation helpers for station display
  const getBilingualText = (en: string, mr: string) => {
    return bilingualMode ? `${en} / ${mr}` : en;
  };

  const hasCriticalOverload = currentTrain?.coaches.some(c => c.current_weight_kg > c.max_capacity_kg);

  return (
    <div className={`space-y-4 py-3 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      
      {/* 1. PLATFORM DISPLAY HEADER BAR */}
      <div className="bg-[#002244] text-white border-2 border-amber-500 rounded-sm p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src={indianRailwaysLogo} 
            alt="Indian Railways Emblem" 
            className="w-12 h-12 object-contain drop-shadow-md rounded-full bg-white/10 p-0.5 border border-amber-500/50 shrink-0" 
          />
          <div>
            <h1 className="text-base sm:text-xl font-bold uppercase text-amber-400 flex items-center gap-2">
              <Tv className="w-5 h-5 text-amber-400" />
              <span>{getBilingualText('Platform Coach Guidance Display Board', 'प्लॅटफॉर्म डबा मार्गदर्शन फलक')}</span>
            </h1>
            <p className="text-xs text-slate-300 font-mono">
              {selectedPlatform} &bull; Telemetry Synchronized &bull; Refresh Rate: 3.0s
            </p>
          </div>
        </div>

        {/* Controls, Clock, and Toggles */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap text-xs">
          
          {/* Multiple Display Platform Selector */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-2.5 py-1.5 rounded-sm bg-slate-900 text-amber-400 font-mono font-bold text-xs border border-slate-700 focus:outline-none"
            title="Switch Station Display Output Screen"
          >
            <option value="Platform 01">Platform 01 Display</option>
            <option value="Platform 02">Platform 02 Display</option>
            <option value="Platform 03">Platform 03 Display (Main)</option>
            <option value="Platform 04">Platform 04 Display</option>
            <option value="Concourse TV">Main Concourse TV</option>
          </select>

          {/* Train Selector */}
          {operationalTrains.length > 0 && (
            <select
              value={currentTrain?.id}
              onChange={(e) => setSelectedTrainId(e.target.value)}
              className="px-2.5 py-1.5 rounded-sm bg-slate-900 text-amber-400 font-mono font-bold text-xs border border-slate-700 focus:outline-none"
            >
              {operationalTrains.map(tr => (
                <option key={tr.id} value={tr.id}>{tr.number} - {tr.name}</option>
              ))}
            </select>
          )}

          {/* Auto Rotation Progress & Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded-sm border flex items-center gap-1 font-bold transition cursor-pointer ${
              autoRotate ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={autoRotate ? 'Pause Automatic Train Cycling' : 'Resume Automatic Train Cycling'}
          >
            {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span className="hidden sm:inline">Auto-Cycle</span>
          </button>

          {/* Voice Announcement Toggle */}
          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (next) {
                speakAnnouncement(`Voice announcements enabled for ${selectedPlatform}.`);
              }
            }}
            className={`px-2 py-1 rounded-sm border flex items-center gap-1 font-bold transition cursor-pointer ${
              voiceEnabled ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={voiceEnabled ? 'Disable Voice Announcements' : 'Enable Voice Announcements (TTS)'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          {/* Bilingual Toggle */}
          <button
            onClick={() => setBilingualMode(!bilingualMode)}
            className={`px-2 py-1 rounded-sm border flex items-center gap-1 font-bold transition cursor-pointer ${
              bilingualMode ? 'bg-[#003366] text-amber-300 border-blue-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Toggle Bilingual English / Marathi Display"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>मराठी/EN</span>
          </button>

          {/* QR Code Button for Waiting Passengers */}
          <button
            onClick={() => setShowQrModal(true)}
            className="px-2 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold flex items-center gap-1 cursor-pointer transition"
            title="Scan QR Code to open Live Weight Tracker on your phone"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile QR</span>
          </button>

          {/* Clock Display */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-slate-900 border border-slate-700 text-amber-400 font-tabular tabular-nums text-sm font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          {/* Display Mode Toggles */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-0.5 rounded-sm font-bold">
            <button
              onClick={() => setDisplayMode('visual_rake')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                displayMode === 'visual_rake' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              <TrainIcon className="w-3.5 h-3.5" />
              <span>Rake</span>
            </button>
            <button
              onClick={() => setDisplayMode('heatmap')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                displayMode === 'heatmap' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={() => setDisplayMode('seats')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                displayMode === 'seats' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Berths</span>
            </button>
            <button
              onClick={() => setDisplayMode('composition')}
              className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
                displayMode === 'composition' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Button */}
          <button
            onClick={() => {
              if (isFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              navigate('/dashboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs border border-rose-400 transition cursor-pointer"
            title="Exit Station Display to Main Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Auto-Rotation Progress Bar */}
      {autoRotate && (
        <div className="w-full h-1 bg-slate-800 overflow-hidden rounded-full -mt-2">
          <div 
            className="h-full bg-amber-500 transition-all duration-100 ease-linear"
            style={{ width: `${rotationProgress}%` }}
          />
        </div>
      )}

      {/* Critical Overload Emergency Warning Banner */}
      {hasCriticalOverload && (
        <div className="p-3 bg-rose-950 text-white border-2 border-rose-500 rounded-sm flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold font-mono text-sm uppercase text-rose-200 block">
                {getBilingualText('PUBLIC SAFETY WARNING: COACH OVERLOAD DETECTED', 'सार्वजनिक सुरक्षा इशारा: डब्यात अतिरिक्त गर्दी')}
              </span>
              <p className="text-xs text-rose-300">
                Certain coaches on {currentTrain?.number} exceed safe structural capacity. Please do not board crowded coaches. Board rear coaches.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-600 text-white font-mono font-bold text-xs rounded-xs shrink-0">
            RPF ESCORT NOTIFIED
          </span>
        </div>
      )}

      {/* Offline Display Notice if Network Lost */}
      {!isOnline && (
        <div className="p-2.5 bg-amber-950 text-amber-200 border border-amber-600 rounded-sm text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span><strong>Offline Operating Mode:</strong> Displaying cached rake telemetry. Local sensor fallback active.</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold">CACHED TELEMETRY</span>
        </div>
      )}

      {/* Mandatory Prototype Notice */}
      <DisclaimerBanner />

      {/* Train Info Banner */}
      {currentTrain && (
        <div className="bg-[#002244] text-white border border-slate-700 rounded-sm p-4 space-y-3 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold font-tabular tabular-nums text-amber-400 tracking-tight">
                {currentTrain.number}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
                  {currentTrain.name}
                </h2>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  {currentTrain.from_station} &rarr; {currentTrain.to_station}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-center self-start md:self-auto">
              <div className="px-3.5 py-1.5 rounded-xs bg-slate-900 border border-amber-500/60 text-amber-400">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{selectedPlatform}</span>
                <span className="text-xl font-black font-mono">BERTHED</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xs bg-emerald-950 border border-emerald-600 text-emerald-300">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Status</span>
                <span className="text-xs font-bold uppercase font-mono">ON PLATFORM</span>
              </div>
            </div>
          </div>

          {/* AI Best Space Recommendation for Waiting Commuters */}
          {recommendation && (
            <div className="p-2.5 rounded-xs bg-emerald-950/70 border border-emerald-600 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-emerald-200">
                  <strong>{getBilingualText('Optimal Boarding Recommendation', 'उत्तम डबा शिफारस')}:</strong> Move to Coach <strong>{recommendation.recommendedCoachNo}</strong> ({recommendation.coachType}) &bull; Recorded crowd is only {recommendation.occupancyPercentage}%!
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-2xs font-mono font-bold text-[10px] bg-emerald-700 text-white uppercase shrink-0">
                RECOMMENDED SPACE
              </span>
            </div>
          )}

          {/* Dynamic Platform Crowd Balancing & Passenger Migration Advisory */}
          {balanceAdvisory && balanceAdvisory.advisories.some(a => a.target_migration_coach) && (
            <div className="p-2.5 rounded-xs bg-amber-950/80 border-2 border-amber-500 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>{getBilingualText('Platform Crowd Balancing Advisory', 'प्लॅटफॉर्म गर्दी समतोल सूचना')}:</strong>{' '}
                  {balanceAdvisory.advisories
                    .filter(a => a.target_migration_coach)
                    .map(a => `Coach ${a.coach_no} congested (${a.current_occupancy}%) -> Board Coach ${a.target_migration_coach}`)
                    .join(' • ')}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-2xs font-mono font-bold text-[10px] bg-amber-500 text-slate-950 uppercase shrink-0 self-start sm:self-auto">
                MIGRATE TO VACANT COACHES
              </span>
            </div>
          )}

          {/* Platform Pillar Guidance Markers */}
          <div className="p-2.5 bg-slate-900 rounded-xs border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>{getBilingualText('Platform Pillar Alignment Guidance', 'प्लॅटफॉर्म खांब स्थिती मार्गदर्शन')}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
              {currentTrain.coaches.filter(c => c.coach_type !== 'Engine').map((c, idx) => (
                <div 
                  key={c.id} 
                  className="px-2.5 py-1 rounded-2xs bg-slate-800 border border-slate-700 shrink-0 text-center font-mono cursor-pointer hover:border-amber-400 transition"
                  onClick={() => setActiveSelectedCoach(c)}
                >
                  <span className="font-bold text-amber-300 block">{c.coach_no}</span>
                  <span className="text-[10px] text-slate-400 block">Pillar {idx * 3 + 2}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 1: Full Realistic Railway Rake Visualization with Side-View WAP-7 Locomotive */}
      {displayMode === 'visual_rake' && currentTrain && (
        <div className="space-y-4">
          <TrainHorizontalView
            coaches={currentTrain.coaches}
            recommendedCoachId={recommendation?.recommendedCoachId}
            selectedCoachId={activeSelectedCoach?.id}
            onSelectCoach={(coach) => setActiveSelectedCoach(coach)}
          />
        </div>
      )}

      {/* Mode 2: Berth Matrix View */}
      {displayMode === 'seats' && currentTrain && (
        <StationDisplayCoachSeatView train={currentTrain} />
      )}

      {/* Mode 3: Traditional Railway Grid Block Composition */}
      {displayMode === 'composition' && currentTrain && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {currentTrain.coaches.map((coach) => {
            const isEngine = coach.coach_type === 'Engine';
            const occ = calculateCoachOccupancy(
              coach.current_weight_kg,
              coach.empty_weight_kg,
              coach.max_capacity_kg,
              coach.coach_type
            );

            if (isEngine) {
              return (
                <div key={coach.id} className="p-3 rounded-sm bg-slate-900 border-2 border-slate-700 flex flex-col justify-between text-center min-h-[130px]">
                  <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">WAP-7</div>
                  <div className="text-2xl my-auto text-slate-200 font-mono font-bold">LOCO</div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">ENGINE</div>
                </div>
              );
            }

            return (
              <div
                key={coach.id}
                className={`p-3 rounded-sm border-2 flex flex-col justify-between min-h-[130px] transition ${
                  occ.isOverloaded ? 'bg-rose-950 border-rose-500 text-white animate-pulse' :
                  occ.clampedOccupancy > 75 ? 'bg-orange-950/60 border-orange-500 text-orange-200' :
                  occ.clampedOccupancy > 40 ? 'bg-amber-950/60 border-amber-500 text-amber-200' :
                  'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                }`}
              >
                <div className="flex items-start justify-between border-b border-white/10 pb-1">
                  <span className="font-mono font-black text-base text-white">{coach.coach_no}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-300">{coach.coach_type}</span>
                </div>

                <div className="my-auto text-center">
                  <span className="text-3xl font-black font-mono text-white">{occ.clampedOccupancy}%</span>
                  <span className="text-[9px] uppercase font-bold block text-slate-300 mt-0.5">{occ.statusLabel}</span>
                </div>

                <div className="text-[10px] font-mono text-slate-300 pt-1 border-t border-white/10 flex justify-between">
                  <span>Gross:</span>
                  <span className="font-bold">{Math.round(coach.current_weight_kg / 1000)}t</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 4: Large Station Coach Crowd Heatmap Mode */}
      {displayMode === 'heatmap' && currentTrain && (
        <div className="p-4 bg-slate-900 rounded-sm border-2 border-amber-500 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold font-mono text-amber-400 uppercase text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{getBilingualText('Coach Occupancy Heatmap Matrix', 'डबा गर्दी उष्णता नकाशा')}</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              Low: &lt;40% (Green) &bull; Moderate: 41-75% (Yellow) &bull; High: 76-100% (Orange) &bull; Overload: &gt;100% (Red)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {currentTrain.coaches.filter(c => c.coach_type !== 'Engine').map(c => {
              const occ = calculateCoachOccupancy(c.current_weight_kg, c.empty_weight_kg, c.max_capacity_kg, c.coach_type);
              let heatColor = 'bg-emerald-600 text-white';
              if (occ.isOverloaded || occ.clampedOccupancy > 100) heatColor = 'bg-rose-600 text-white animate-pulse';
              else if (occ.clampedOccupancy > 75) heatColor = 'bg-orange-500 text-white';
              else if (occ.clampedOccupancy > 40) heatColor = 'bg-amber-500 text-slate-950 font-black';

              return (
                <div key={c.id} className="p-3 bg-slate-800 rounded-sm border border-slate-700 text-center space-y-1">
                  <span className="font-mono font-bold text-sm text-slate-200 block">{c.coach_no}</span>
                  <div className={`p-2 rounded-xs font-mono text-xl font-black ${heatColor}`}>
                    {occ.clampedOccupancy}%
                  </div>
                  <span className="text-[10px] text-slate-400 block">{c.coach_type}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emergency Announcements Ticker Bar Across Bottom */}
      <div className="bg-rose-950 text-rose-100 border border-rose-700 rounded-sm p-2 flex items-center gap-3 overflow-hidden text-xs shadow-md">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-600 text-white font-mono font-black uppercase rounded-2xs text-[10px] shrink-0 animate-pulse">
          <Megaphone className="w-3.5 h-3.5" />
          <span>ANNOUNCEMENT</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee font-semibold tracking-wide">
            {balanceAdvisory && balanceAdvisory.advisories.some(a => a.target_migration_coach)
              ? `⚡ ${balanceAdvisory.ledDisplayTicker} ⚡`
              : getBilingualText(
                  'PASSENGERS TO NOTE: Please mind the gap between the platform and train footboard. Avoid rushing into overloaded coaches; rear coaches offer ample seating. Live bogie load telemetry is synchronized in real time.',
                  'प्रवाशांनी नोंद घ्यावी: कृपया प्लॅटफॉर्म आणि डब्याच्या पायरीमधील अंतराची काळजी घ्या. जास्त गर्दीच्या डब्यात चढणे टाळा; पाठीमागील डब्यांमध्ये पुरेशी जागा उपलब्ध आहे.'
                )}
          </div>
        </div>
      </div>

      {/* Mobile QR Code Modal for Commuters */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="gov-card max-w-sm w-full p-6 text-center space-y-4 border-2 border-amber-500 bg-slate-900 text-white">
            <h3 className="font-bold text-lg text-amber-400">
              Scan for Real-Time Crowd Telemetry
            </h3>
            <p className="text-xs text-slate-300">
              Scan this QR code with any smartphone camera to view live coach weights, seat layouts, and AI crowd forecasts on your phone.
            </p>

            {/* High-Contrast SVG QR Code Representation */}
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-sm flex items-center justify-center shadow-lg">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
                <rect width="160" height="160" fill="#ffffff" />
                <rect x="10" y="10" width="40" height="40" fill="#002244" rx="4" />
                <rect x="18" y="18" width="24" height="24" fill="#ffffff" />
                <rect x="24" y="24" width="12" height="12" fill="#002244" />
                <rect x="110" y="10" width="40" height="40" fill="#002244" rx="4" />
                <rect x="118" y="18" width="24" height="24" fill="#ffffff" />
                <rect x="124" y="24" width="12" height="12" fill="#002244" />
                <rect x="10" y="110" width="40" height="40" fill="#002244" rx="4" />
                <rect x="18" y="118" width="24" height="24" fill="#ffffff" />
                <rect x="24" y="124" width="12" height="12" fill="#002244" />
                <rect x="60" y="15" width="10" height="10" fill="#002244" />
                <rect x="80" y="15" width="10" height="10" fill="#002244" />
                <rect x="60" y="35" width="15" height="10" fill="#002244" />
                <rect x="85" y="35" width="10" height="15" fill="#002244" />
                <rect x="20" y="65" width="10" height="15" fill="#002244" />
                <rect x="40" y="65" width="15" height="10" fill="#002244" />
                <rect x="65" y="65" width="30" height="30" fill="#002244" rx="2" />
                <circle cx="80" cy="80" r="8" fill="#ffffff" />
                <rect x="110" y="65" width="15" height="10" fill="#002244" />
                <rect x="135" y="65" width="15" height="15" fill="#002244" />
                <rect x="60" y="110" width="10" height="20" fill="#002244" />
                <rect x="80" y="115" width="15" height="10" fill="#002244" />
                <rect x="110" y="110" width="15" height="10" fill="#002244" />
                <rect x="130" y="110" width="15" height="25" fill="#002244" />
                <rect x="110" y="130" width="15" height="15" fill="#002244" />
              </svg>
            </div>

            <div className="font-mono text-xs text-amber-300">
              URL: {window.location.origin}/passenger
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xs cursor-pointer hover:bg-amber-400 transition"
            >
              Close QR Window
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
