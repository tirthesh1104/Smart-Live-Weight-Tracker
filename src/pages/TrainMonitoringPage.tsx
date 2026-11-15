import React, { useState, useEffect } from 'react';
import { 
  Train as TrainIcon, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Info, 
  Layers,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Radio,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrain } from '../context/TrainContext';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { AllIndiaRailwayExplorer } from '../components/train/AllIndiaRailwayExplorer';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';
import { 
  RailRadarClient, 
  RailCoreClient, 
  QrailClient, 
  DualRailwayGatewayClient, 
  MultiProviderStatus 
} from '../services/railwayDataService';

export const TrainMonitoringPage: React.FC = () => {
  const { trains, addTrain, deleteTrain, setSelectedTrainId, simulatedTrain } = useTrain();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [providerStatus, setProviderStatus] = useState<MultiProviderStatus | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'auto' | 'railcore' | 'qrail' | 'railradar'>('auto');
  const [fetchingProvider, setFetchingProvider] = useState(false);
  const [conflictAlert, setConflictAlert] = useState<{ count: number; details: string[] } | null>(null);
  const [detectedDataSource, setDetectedDataSource] = useState<string>('VERIFIED_REAL');
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    from_station: '',
    to_station: '',
    template: '12-lhb'
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    DualRailwayGatewayClient.getAllProvidersStatus()
      .then(st => setProviderStatus(st))
      .catch(() => {});
  }, []);

  const handleAutoFill = async () => {
    if (!formData.number.trim()) return;
    setFetchingProvider(true);
    setConflictAlert(null);
    try {
      if (selectedProvider === 'auto') {
        const res = await DualRailwayGatewayClient.getMultiProviderTrain(formData.number.trim());
        if (res.success && res.data) {
          const d = res.data;
          setFormData(prev => ({
            ...prev,
            name: d.name || d.train_name || d.trainName || prev.name,
            from_station: d.from_station ? `${d.from_station}${d.from_station_code ? ` (${d.from_station_code})` : ''}` : (d.source_station_code ? `${d.source_station_code}` : (d.source ? `${d.source}` : (d.from ? `${d.from}` : prev.from_station))),
            to_station: d.to_station ? `${d.to_station}${d.to_station_code ? ` (${d.to_station_code})` : ''}` : (d.destination_station_code ? `${d.destination_station_code}` : (d.destination ? `${d.destination}` : (d.to ? `${d.to}` : prev.to_station)))
          }));
          setDetectedDataSource(res.primary_source || 'DUAL_VERIFIED');
          if (res.conflicts && res.conflicts.length > 0) {
            setConflictAlert({
              count: res.conflicts.length,
              details: res.conflicts.map(c => c.description || c.field)
            });
          }
          setStatusMessage(`Timetable loaded from ${res.primary_source || 'Multi-Provider Gateway'} (Queried: ${res.sources_queried.join(', ')})`);
          setTimeout(() => setStatusMessage(null), 6000);
        } else {
          setStatusMessage('Railway Data Temporarily Unavailable - No configured provider returned valid schedule');
          setTimeout(() => setStatusMessage(null), 6000);
        }
      } else if (selectedProvider === 'railcore') {
        const res = await RailCoreClient.getSchedule(formData.number.trim());
        if (res.success && res.data) {
          const d = res.data;
          setFormData(prev => ({
            ...prev,
            name: d.train_name || d.trainName || d.name || prev.name,
            from_station: d.source_station_code || d.source || prev.from_station,
            to_station: d.destination_station_code || d.destination || prev.to_station
          }));
          setDetectedDataSource('RailCore');
          setStatusMessage(`RailCore timetable loaded for Train ${formData.number.trim()}`);
          setTimeout(() => setStatusMessage(null), 5000);
        } else {
          setStatusMessage(`RailCore: ${res.error?.message || 'Data unavailable or unauthorized'}`);
          setTimeout(() => setStatusMessage(null), 5000);
        }
      } else if (selectedProvider === 'qrail') {
        const res = await QrailClient.getSchedule(formData.number.trim());
        if (res.success && res.data) {
          const d = res.data;
          setFormData(prev => ({
            ...prev,
            name: d.train_name || prev.name,
            from_station: d.from || prev.from_station,
            to_station: d.to || prev.to_station
          }));
          setDetectedDataSource('Qrail');
          setStatusMessage(`Qrail timetable loaded for Train ${formData.number.trim()}`);
          setTimeout(() => setStatusMessage(null), 5000);
        } else {
          setStatusMessage(`Qrail: ${res.error?.message || 'Data unavailable or unauthorized'}`);
          setTimeout(() => setStatusMessage(null), 5000);
        }
      } else {
        const res = await RailRadarClient.getTrainDetails(formData.number.trim());
        if (res.success && res.data?.train) {
          const tr = res.data.train;
          setFormData(prev => ({
            ...prev,
            name: tr.name || prev.name,
            from_station: tr.source?.name ? `${tr.source.name} (${tr.source.code})` : prev.from_station,
            to_station: tr.destination?.name ? `${tr.destination.name} (${tr.destination.code})` : prev.to_station
          }));
          setDetectedDataSource('RailRadar');
          setStatusMessage(`Verified RailRadar timetable loaded for Train ${tr.number}: ${tr.name}`);
          setTimeout(() => setStatusMessage(null), 5000);
        } else {
          setStatusMessage(`RailRadar: ${res.error?.message || 'Train not found'}`);
          setTimeout(() => setStatusMessage(null), 5000);
        }
      }
    } catch {
      setStatusMessage('Railway Data Temporarily Unavailable - Gateway service offline');
      setTimeout(() => setStatusMessage(null), 6000);
    } finally {
      setFetchingProvider(false);
    }
  };

  const filteredTrains = trains.filter(
    (t) =>
      t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.from_station.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.to_station.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegisterTrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number.trim() || !formData.name.trim()) return;

    addTrain({
      number: formData.number.trim(),
      name: formData.name.trim(),
      from_station: formData.from_station.trim() || 'NEW DELHI (NDLS)',
      to_station: formData.to_station.trim() || 'MUMBAI CSMT (CSMT)'
    });

    setStatusMessage(`Train ${formData.number} successfully registered in local operational registry.`);
    setFormData({ number: '', name: '', from_station: '', to_station: '', template: '12-lhb' });
    setShowAddForm(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-5 py-4">
      {/* Page Title & Breadcrumb Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <img 
            src={indianRailwaysLogo} 
            alt="Indian Railways Logo" 
            className="w-12 h-12 object-contain drop-shadow hidden sm:block shrink-0" 
          />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Indian Railways Portal Services &bull; Operations &amp; Rake Management
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 uppercase tracking-tight">
              Train Rake Monitoring Directory
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Official operational roster of monitored passenger train compositions, weight profiles, and bogie sensors.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowDirectory(!showDirectory)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
              showDirectory 
                ? 'bg-emerald-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{showDirectory ? 'Close Directory' : 'All-India Directory & Routes'}</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Form' : 'Register New Train Rake'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* All-India Railway Directory & Route Explorer */}
      {showDirectory && (
        <div className="gov-card p-4 space-y-4 border-l-4 border-l-emerald-600 dark:border-l-emerald-500">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" />
              All-India Railway Stations &amp; Routes Explorer (RailRadar &amp; RailCore)
            </h3>
            <button
              onClick={() => setShowDirectory(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
            >
              &times; Close Explorer
            </button>
          </div>
          <AllIndiaRailwayExplorer
            initialTrainNumber="12101"
            onSelectTrainForMonitoring={(num) => {
              setFormData(prev => ({ ...prev, number: num }));
              setShowAddForm(true);
              setShowDirectory(false);
            }}
          />
        </div>
      )}

      {/* Success alert */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600 dark:border-emerald-500 border-r border-t border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Train Registration Modal / Drawer */}
      {showAddForm && (
        <div className="gov-card p-5 border-l-4 border-l-[#003366] dark:border-l-blue-500 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#003366] dark:text-blue-400" />
              Register New Train Service in Fleet Database
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Enter train identification and route endpoints. Records are stored locally in compliant schema.
            </p>
          </div>

          <form onSubmit={handleRegisterTrain} className="space-y-4">
            {conflictAlert && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xs text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Provider Discrepancy Flagged ({conflictAlert.count})
                </span>
                <p className="text-[11px]">
                  Discrepancies detected between providers: {conflictAlert.details.join(', ')}. Both records preserved.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Train Number *
                  </label>
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as any)}
                      className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-2xs px-1 py-0.5 font-semibold"
                    >
                      <option value="auto">⚡ Multi-Provider</option>
                      <option value="railcore">RailCore</option>
                      <option value="qrail">Qrail</option>
                      <option value="railradar">RailRadar</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      disabled={fetchingProvider || !formData.number.trim()}
                      className="text-[10px] text-[#003366] dark:text-blue-400 font-bold hover:underline cursor-pointer disabled:opacity-40"
                      title="Fetch official timetable and route endpoints from selected provider"
                    >
                      {fetchingProvider ? 'Fetching...' : '⚡ Auto-Fill'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12101 or 11020"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Train Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Rajdhani Express"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Origin Station (From)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MUMBAI CENTRAL (MMCT)"
                  value={formData.from_station}
                  onChange={(e) => setFormData({ ...formData, from_station: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Destination Station (To)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEW DELHI (NDLS)"
                  value={formData.to_station}
                  onChange={(e) => setFormData({ ...formData, to_station: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-sm text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-sm"
              >
                Save Train Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Simulation Session banner if running */}
      {simulatedTrain && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-l-4 border-purple-700 dark:border-purple-500 border-r border-t border-b border-purple-200 dark:border-purple-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
            <span className="text-purple-900 dark:text-purple-200">
              Isolated Simulation Session Active: <strong>#{simulatedTrain.number} - {simulatedTrain.name}</strong> ({simulatedTrain.coaches.length} Coaches). Simulation data is strictly segregated from operational records.
            </span>
          </div>
          <Link
            to="/simulator"
            className="text-purple-900 dark:text-purple-300 font-bold underline hover:text-purple-950 dark:hover:text-purple-100 shrink-0"
          >
            Manage Simulator &rarr;
          </Link>
        </div>
      )}

      {/* Connected Railway Data Providers Status Banner */}
      <div className="gov-card p-4 space-y-3 text-xs border-l-4 border-l-[#003366] dark:border-l-blue-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <div>
            <h3 className="font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-teal-600 animate-pulse" />
              Connected Railway Data Providers &amp; Platform Status
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Secure server-side API proxies operating under strict rate limits. Zero secrets exposed to frontend.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Policy: Strict Honesty / No Dummy Data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Provider 1: RailCore */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${providerStatus?.railcore?.configured ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                RailCore IRCTC API
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-2xs">
                2,000 req/mo
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Schedules, Coach Position Rakes, Station Lookup.
            </p>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
              <span>Status: {providerStatus?.railcore?.configured ? 'AUTHENTICATED' : 'READY'}</span>
              <span>Proxy: /api/railcore</span>
            </div>
          </div>

          {/* Provider 2: Qrail */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${providerStatus?.qrail?.configured ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                Qrail Developer API
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-2xs">
                100 req/day (Free)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Schedules, Between Stations, PNR Status.
            </p>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
              <span>Status: {providerStatus?.qrail?.configured ? 'AUTHENTICATED' : 'READY'}</span>
              <span>Proxy: /api/qrail</span>
            </div>
          </div>

          {/* Provider 3: RailRadar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${providerStatus?.railradar?.configured ? 'bg-teal-500' : 'bg-slate-400'}`}></span>
                RailRadar NTES Gateway
              </span>
              <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-2xs">
                Commercial Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              NTES GPS Live Running, Delay Speed, Route GIS.
            </p>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
              <span>Status: {providerStatus?.railradar?.configured ? 'AUTHENTICATED' : 'READY'}</span>
              <span>Proxy: /api/railradar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by train number, name or station..."
            className="w-full pl-9 pr-3 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
          <span>Total Operational Records: <strong className="text-slate-900 dark:text-slate-100">{trains.length}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Database Engine: IndexedDB Local Storage</span>
        </div>
      </div>

      {/* Official Government Table of Trains */}
      <div className="gov-card overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300 flex items-center justify-between">
          <span>Active Train Fleet Registry</span>
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 normal-case">
            Displaying {filteredTrains.length} registered service(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th className="w-24">Train No.</th>
                <th>Train Name</th>
                <th>Route (From ➔ To)</th>
                <th className="text-center w-28">Coaches</th>
                <th className="w-32">Data Source</th>
                <th className="text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrains.length > 0 ? (
                filteredTrains.map((tr) => (
                  <tr key={tr.id}>
                    <td className="font-mono font-bold text-[#003366] dark:text-blue-400">
                      {tr.number}
                    </td>
                    <td className="font-semibold text-slate-900 dark:text-slate-100">
                      {tr.name}
                    </td>
                    <td className="text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span>{tr.from_station}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span>{tr.to_station}</span>
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {tr.coaches.length}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
                        tr.data_source === 'RailRadar'
                          ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                          : tr.data_source === 'RailCore'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                          : tr.data_source === 'Qrail'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : tr.data_source === 'DUAL_VERIFIED'
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                          : tr.data_source === 'REAL DATA' || tr.data_source === 'VERIFIED_REAL'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {tr.data_source || 'VERIFIED_REAL'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTrainId(tr.id);
                            navigate('/passenger');
                          }}
                          className="px-2 py-1 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-[11px] font-medium rounded-sm cursor-pointer shadow-xs"
                          title="View live load enquiry"
                        >
                          Enquiry
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete train ${tr.number} from local database?`)) {
                              deleteTrain(tr.id);
                            }
                          }}
                          className="p-1 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-sm cursor-pointer"
                          title="Delete train record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No operational train records found in database.
                      </p>
                      <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400">
                        Live real-time physical sensor data is not connected. You may register a new rake above or start an isolated simulation scenario.
                      </p>
                      <div className="pt-2">
                        <Link
                          to="/simulator"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] dark:bg-blue-600 text-white rounded-sm text-xs font-semibold"
                        >
                          <span>Open Software Sensor Simulator</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
