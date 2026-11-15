import React, { useState, useEffect } from 'react';
import { 
  Train as TrainIcon, 
  MapPin, 
  Search, 
  Building2, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Radio, 
  Info, 
  ArrowRight, 
  ChevronRight, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  Scale,
  Compass,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { 
  AllIndiaRailwayDirectoryClient, 
  AllIndiaTrainFullDetails, 
  AllIndiaTrainSearchResult,
  AllIndiaTrainSummary,
  AllIndiaStation
} from '../../services/railwayDataService';
import { useTrain } from '../../context/TrainContext';
import { useLanguage } from '../../context/LanguageContext';

interface AllIndiaRailwayExplorerProps {
  initialTrainNumber?: string;
  onSelectTrainForMonitoring?: (trainNumber: string) => void;
}

export const AllIndiaRailwayExplorer: React.FC<AllIndiaRailwayExplorerProps> = ({
  initialTrainNumber = '12101',
  onSelectTrainForMonitoring
}) => {
  const { t, language } = useLanguage();
  const { trains, setSelectedTrainId } = useTrain();

  // Dynamic States from Verified API Directory
  const [statesList, setStatesList] = useState<Array<{ state: string; is_ut: boolean; cities: string[] }>>([]);
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [stationSearchQuery, setStationSearchQuery] = useState<string>('');

  // Dynamic Stations from Live API Directory
  const [apiStations, setApiStations] = useState<AllIndiaStation[]>([]);
  const [searchingStations, setSearchingStations] = useState<boolean>(false);

  // Train Search State
  const [trainQuery, setTrainQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AllIndiaTrainSummary[]>([]);
  const [searchingTrains, setSearchingTrains] = useState<boolean>(false);
  const [totalCatalogSize, setTotalCatalogSize] = useState<number>(11435);

  // Selected Active Train State
  const [activeTrainNumber, setActiveTrainNumber] = useState<string>(initialTrainNumber);
  const [trainDetails, setTrainDetails] = useState<AllIndiaTrainFullDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'route' | 'coaches' | 'stations'>('route');

  // Compute available cities dynamically for selected state from API states list
  const availableCities = React.useMemo(() => {
    if (selectedState === 'All') {
      const allCities = new Set<string>();
      statesList.forEach(s => s.cities.forEach(c => allCities.add(c)));
      return Array.from(allCities).sort();
    }
    const stateObj = statesList.find(s => s.state === selectedState);
    return stateObj ? stateObj.cities : [];
  }, [selectedState, statesList]);

  // Initial load of states and premier trains
  useEffect(() => {
    // 1. Load authentic states and cities
    AllIndiaRailwayDirectoryClient.getStatesAndCities().then(res => {
      if (res && res.success && res.states) {
        setStatesList(res.states);
      }
    });

    // 2. Initial train search & details
    handleSearchTrains('12101');
    loadTrainDetails(activeTrainNumber);
  }, []);

  // Fetch verified stations whenever filters or search query changes
  useEffect(() => {
    let active = true;
    const fetchStations = async () => {
      setSearchingStations(true);
      try {
        const res = await AllIndiaRailwayDirectoryClient.searchStations(
          stationSearchQuery,
          selectedState,
          selectedCity,
          50,
          0
        );
        if (active && res && res.success) {
          setApiStations(res.stations || []);
        }
      } catch {
        if (active) setApiStations([]);
      } finally {
        if (active) setSearchingStations(false);
      }
    };

    const timer = setTimeout(fetchStations, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [stationSearchQuery, selectedState, selectedCity]);

  const handleSearchTrains = async (query: string) => {
    setSearchingTrains(true);
    try {
      const res = await AllIndiaRailwayDirectoryClient.searchTrains(query, 20);
      if (res.success) {
        setSearchResults(res.trains || []);
        if (res.total_catalog_size) {
          setTotalCatalogSize(res.total_catalog_size);
        }
      }
    } catch {
      // Keep previous results on network error
    } finally {
      setSearchingTrains(false);
    }
  };

  const loadTrainDetails = async (trainNo: string) => {
    if (!trainNo) return;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const details = await AllIndiaRailwayDirectoryClient.getFullTrainDetails(trainNo);
      if (details && (details.stops_count > 0 || details.coaches.length > 0 || details.train_name)) {
        setTrainDetails(details);
        setActiveTrainNumber(trainNo);
      } else {
        setDetailsError(`Official timetable & coach composition temporarily unavailable for Train ${trainNo}.`);
      }
    } catch (e: any) {
      setDetailsError(e.message || 'Failed to retrieve train schedule from railway APIs.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectTrain = (num: string) => {
    setActiveTrainNumber(num);
    loadTrainDetails(num);
  };

  const handleMonitorTrain = (num: string) => {
    const existing = trains.find(t => t.number === num);
    if (existing) {
      setSelectedTrainId(existing.id);
      if (onSelectTrainForMonitoring) {
        onSelectTrainForMonitoring(num);
      }
    } else {
      // Pass to custom handler
      if (onSelectTrainForMonitoring) {
        onSelectTrainForMonitoring(num);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: All-India Real Data Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {language === 'mr' ? 'थेट रेल्वे डेटा' : 'Official Railway Directory'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                {language === 'mr' ? 'सर्व २८ राज्ये व ८ केंद्रशासित प्रदेश' : 'All 28 States & 8 Union Territories'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {totalCatalogSize.toLocaleString()} {language === 'mr' ? 'अधिकृत गाड्या (NTES)' : 'NTES Trains'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <TrainIcon className="w-8 h-8 text-blue-400" />
              {language === 'mr' ? 'अखिल भारतीय रेल्वे निर्देशिका व थेट मार्ग शोध' : 'All-India Railway Directory & Route Explorer'}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              {language === 'mr' 
                ? 'अधिकृत RailRadar आणि RailCore API द्वारे भारतातील सर्व गाड्यांची खरी वेळपत्रके, थांबे, फलाट क्रमांक आणि डब्यांची अचूक रचना पहा.'
                : 'Access real schedules, verified station halts, platform assignments, and authentic coach compositions for all Indian trains via RailRadar & RailCore APIs.'}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'mr' ? 'प्रमाणित स्रोत:' : 'Authenticated APIs:'}</span>
              <strong className="text-white">RailRadar (NTES) &amp; RailCore (IRCTC)</strong>
            </div>
            <div className="text-[11px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'mr' ? 'वजन सेन्सर: सिम्युलेटेड टेस्ट बेंच डेटा' : 'Sensor Telemetry: Simulated Test Bench Data'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Filters Bar: State, City & Quick Train Search */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 1. Train Number or Name Search */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-500" />
                {language === 'mr' ? 'गाडी क्रमांक किंवा नाव शोधा' : 'Search Train by Number or Name'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {searchingTrains ? (language === 'mr' ? 'शोधत आहे...' : 'Querying...') : `${searchResults.length} matches`}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={trainQuery}
                onChange={(e) => {
                  setTrainQuery(e.target.value);
                  handleSearchTrains(e.target.value);
                }}
                placeholder={language === 'mr' ? 'उदा. 12101, 11020, Rajdhani, Express...' : 'e.g., 12101, 11020, 12115, Rajdhani, Vande Bharat...'}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {searchingTrains && (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-3" />
              )}
            </div>
          </div>

          {/* 2. State Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'mr' ? 'राज्य / केंद्रशासित प्रदेश' : 'State / Union Territory'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity('All');
              }}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">{language === 'mr' ? 'सर्व राज्ये (All India)' : 'All States (All India)'}</option>
              {statesList.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state} {s.is_ut ? '(UT)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. City Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'mr' ? 'शहर / रेल्वे हब' : 'City / Railway Hub'}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">{language === 'mr' ? 'सर्व शहरे (All Cities)' : 'All Cities'}</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Suggestions Chips for Trains */}
        {searchResults.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-2">
              {language === 'mr' ? 'शोध निकाल (अधिकृत NTES):' : 'Matching NTES Trains:'}
            </span>
            <div className="inline-flex flex-wrap gap-2 mt-1">
              {searchResults.slice(0, 10).map((tr) => (
                <button
                  key={tr.train_number}
                  onClick={() => handleSelectTrain(tr.train_number)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                    activeTrainNumber === tr.train_number
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="font-mono">{tr.train_number}</span>
                  <span className="truncate max-w-[140px]">{tr.train_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('route')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'route'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          {language === 'mr' ? 'वेळपत्रक व मार्ग (Route & Halts)' : 'Train Schedule & Route Halts'}
          {trainDetails && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
              {trainDetails.stops_count} halts
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('coaches')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'coaches'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          {language === 'mr' ? 'डब्यांची रचना (Coach Positions)' : 'Rake Formation & Coach Order'}
          {trainDetails && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-mono">
              {trainDetails.coaches.length || 'Rake'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'stations'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {language === 'mr' ? 'स्थानक सूची (Station Directory)' : 'All-India Station Master'}
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-mono">
            {apiStations.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Route Halts & Live Schedule */}
      {activeTab === 'route' && (
        <div className="bg-white dark:bg-slate-800 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700 p-6 space-y-6">
          {loadingDetails ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-sm font-medium">{language === 'mr' ? 'अधिकृत रेल्वे वेळपत्रक लोड होत आहे...' : 'Loading authentic timetable from RailCore API...'}</p>
            </div>
          ) : trainDetails ? (
            <>
              {/* Selected Train Header */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                      {trainDetails.train_number}
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {trainDetails.train_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                      Real API Data
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>
                      <strong>{language === 'mr' ? 'उगम स्थानक:' : 'Origin:'}</strong> {trainDetails.source_station || 'Origin'}
                    </span>
                    <span>&rarr;</span>
                    <span>
                      <strong>{language === 'mr' ? 'अंतिम स्थानक:' : 'Destination:'}</strong> {trainDetails.destination_station || 'Destination'}
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong>{language === 'mr' ? 'एकूण थांबे:' : 'Total Halts:'}</strong> {trainDetails.stops_count}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleMonitorTrain(trainDetails.train_number)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Scale className="w-4 h-4" />
                    {language === 'mr' ? 'वजन ट्रॅकरमध्ये मॉनिटर करा' : 'Monitor Live Rake Weight'}
                  </button>
                  <button
                    onClick={() => loadTrainDetails(trainDetails.train_number)}
                    className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Refresh Schedule"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Real-time Status Snippet from RailRadar if available */}
              {trainDetails.live_status && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Radio className="w-5 h-5 text-emerald-500 animate-pulse flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                        {language === 'mr' ? 'थेट रेल्वे स्थिती (RailRadar NTES Live):' : 'Real-time Live Status (RailRadar NTES):'} {trainDetails.live_status.status_message}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {language === 'mr' ? 'सध्याचे स्थानक:' : 'Current Station:'} <strong>{trainDetails.live_status.current_station || 'In Transit'}</strong> &bull; {language === 'mr' ? 'विलंब:' : 'Delay:'} {trainDetails.live_status.delay_minutes} min
                        {trainDetails.live_status.speed_kmh ? ` • Speed: ${trainDetails.live_status.speed_kmh} km/h` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Updated: {new Date(trainDetails.live_status.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Provenance and Disclaimer Notification */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <strong>{language === 'mr' ? 'अधिकृत डेटा पडताळणी:' : 'Official Data Provenance:'}</strong> {language === 'mr' ? 'थांबे व फलाट माहिती' : 'Schedule halts & platform numbers'} sourced from <strong>{trainDetails.provenance.schedule_source}</strong>. {language === 'mr' ? 'थेट स्थिती' : 'Live status'} sourced from <strong>{trainDetails.provenance.live_running_source}</strong>.
                  </p>
                  <p className="text-amber-900/80 dark:text-amber-200/80">
                    <strong>[SIMULATED SENSOR DATA]</strong> {language === 'mr' ? 'डब्यांचे वजन व गर्दीचे आकडे केवळ हार्डवेअर चाचणीसाठी सिम्युलेटरद्वारे मोजले जातात.' : 'Physical bogie strain measurements and passenger headcounts are generated in real-time by the hardware test bench simulator and remain strictly isolated from real railway scheduling APIs.'}
                  </p>
                </div>
              </div>

              {/* Detailed Station Halts Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'स्थानक कोड' : 'Station Code'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'स्थानकाचे नाव' : 'Station Name'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'आगमन' : 'Arrival'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'निर्गमन' : 'Departure'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'थांबा' : 'Halt'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'दिवस' : 'Day'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'अंतर (किमी)' : 'Distance'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'फलाट' : 'Platform'}</th>
                      <th className="py-3 px-4">{language === 'mr' ? 'अपेक्षित विलंब' : 'Delay'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {trainDetails.stops.map((st, idx) => (
                      <tr 
                        key={`${st.station_code}-${idx}`}
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono text-slate-400">{st.sequence || idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {st.station_code}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                          {st.station_name}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{st.arrival_time}</td>
                        <td className="py-2.5 px-4 font-mono">{st.departure_time}</td>
                        <td className="py-2.5 px-4 text-slate-500">{st.halt_minutes > 0 ? `${st.halt_minutes}m` : 'Origin/Term'}</td>
                        <td className="py-2.5 px-4 font-mono">{st.day}</td>
                        <td className="py-2.5 px-4 font-mono">{st.distance_km} km</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          PF {st.platform_number || 'TBA'}
                        </td>
                        <td className="py-2.5 px-4">
                          {st.typical_delay_minutes > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-mono">
                              +{st.typical_delay_minutes}m
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                              On Time
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{detailsError || 'Please search and select a train from the list above.'}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Authentic Rake Formation & Coach Position */}
      {activeTab === 'coaches' && (
        <div className="bg-white dark:bg-slate-800 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700 p-6 space-y-6">
          {trainDetails ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-500/10 border border-purple-500/30 p-5 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                      {trainDetails.train_number}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {trainDetails.train_name} — {language === 'mr' ? 'अधिकृत डब्यांची रचना' : 'Official Coach Composition'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'mr' ? 'डब्यांची अचूक मालिका (इंजिनपासून शेवटपर्यंत):' : 'Official rake sequence from Locomotive to Guard Van:'}
                  </p>
                  {trainDetails.rake_formation && (
                    <div className="mt-2 text-xs font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 overflow-x-auto">
                      {trainDetails.rake_formation}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <div><strong>Source:</strong> {trainDetails.provenance.coach_position_source}</div>
                  <div><strong>Total Vehicles:</strong> {trainDetails.coaches.length || '24'}</div>
                </div>
              </div>

              {/* Coach Composition Cards Flow */}
              {trainDetails.coaches.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-blue-600">
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Locomotive End (Front)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      Guard End (Rear) <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {trainDetails.coaches.map((c, idx) => {
                      const isLoco = c.coach_name === 'ENG' || c.coach_type === 'LOCOMOTIVE';
                      const isPantry = c.coach_name === 'PC' || c.coach_type === 'PANTRY';
                      const isAC = c.coach_name.startsWith('A') || c.coach_name.startsWith('B') || c.coach_name.startsWith('H') || c.coach_name.startsWith('M');
                      const isGen = c.coach_name.startsWith('GEN') || c.coach_name === 'GS';

                      return (
                        <div
                          key={`${c.coach_name}-${idx}`}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            isLoco
                              ? 'bg-amber-500/10 border-amber-400 text-amber-800 dark:text-amber-300'
                              : isPantry
                              ? 'bg-orange-500/10 border-orange-400 text-orange-800 dark:text-orange-300'
                              : isAC
                              ? 'bg-blue-500/10 border-blue-400 text-blue-800 dark:text-blue-300'
                              : isGen
                              ? 'bg-emerald-500/10 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-mono text-slate-400">#{c.position_from_engine || idx + 1}</div>
                          <div className="text-base font-bold font-mono my-0.5">{c.coach_name}</div>
                          <div className="text-[11px] font-semibold truncate">{c.class_name || c.class_code}</div>
                          <div className="text-[9px] text-slate-500 mt-1 uppercase">{c.coach_type || 'Coach'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p>{language === 'mr' ? 'डब्यांची माहिती उपलब्ध नाही.' : 'Coach formation details not available for this train.'}</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p>{language === 'mr' ? 'कृपया वरील सूचीमधून गाडी निवडा.' : 'Please select a train to view authentic coach composition.'}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: All-India Station Master Directory */}
      {activeTab === 'stations' && (
        <div className="bg-white dark:bg-slate-800 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                {language === 'mr' ? 'अखिल भारतीय रेल्वे स्थानक निर्देशिका' : 'All-India Railway Station Directory'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'mr' 
                  ? `${selectedState === 'All' ? 'सर्व भारतीय राज्ये' : selectedState} मधील अधिकृत रेल्वे स्थानके (RailRadar व RailCore द्वारे प्रमाणित).`
                  : `Official Indian Railways stations across ${selectedState === 'All' ? 'All India' : selectedState} verified via RailRadar & RailCore APIs.`}
              </p>
            </div>

            <div className="w-full md:w-72">
              <div className="relative">
                <input
                  type="text"
                  value={stationSearchQuery}
                  onChange={(e) => setStationSearchQuery(e.target.value)}
                  placeholder={language === 'mr' ? 'स्थानक शोधा (उदा. NED, SUR, CSMT)...' : 'Filter stations (e.g., NED, SUR, CSMT, NDLS)...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                {searchingStations && (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-2.5" />
                )}
              </div>
            </div>
          </div>

          {/* Stations Grid */}
          {searchingStations && apiStations.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p>{language === 'mr' ? 'अधिकृत स्थानके शोधत आहे...' : 'Querying verified railway station APIs...'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apiStations.map((st) => (
                <div
                  key={st.code}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {st.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {st.name}
                      </h4>
                    </div>
                    {st.is_major && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Major Hub
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 pt-1">
                    <div><strong>City:</strong> {st.city || "Data Not Available"}</div>
                    <div><strong>State:</strong> {st.state || "Data Not Available"}</div>
                    <div><strong>Source:</strong> {st.source || "RailRadar / RailCore API"}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setTrainQuery(st.code);
                        handleSearchTrains(st.code);
                        setActiveTab('route');
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{language === 'mr' ? 'या स्थानकावरून जाणाऱ्या गाड्या' : 'View Trains via Station'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchingStations && apiStations.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {language === 'mr' ? 'कोणताही अधिकृत रेल्वे डेटा उपलब्ध नाही.' : 'No verified railway data available'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'mr' 
                  ? 'कृपया दुसरा स्थानक कोड किंवा शहर निवडून पुन्हा प्रयत्न करा.' 
                  : 'Please try searching with another station code (e.g., NED, SUR, CSMT, PUNE) or city name.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
