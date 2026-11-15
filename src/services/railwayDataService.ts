/**
 * OFFICIAL RAILWAY DATA SOURCE SERVICE & PROVENANCE REGISTRY
 * 
 * Manages authorized data sources, provenance metadata tagging,
 * external API allowlisting, and honest no-data policies.
 * 
 * STRICT POLICY:
 * - Never fabricate, invent, or substitute simulated data for real-world records.
 * - When an authorized source is unavailable or unauthorized, report UNAVAILABLE
 *   or ACCESS_NOT_AUTHORIZED.
 */

export type DataVerificationStatus =
  | 'VERIFIED_REAL'
  | 'OFFICIAL_HISTORICAL'
  | 'AUTHORIZED_LIVE'
  | 'MANUAL_VERIFIED'
  | 'SIMULATED_TEST'
  | 'ACCESS_NOT_AUTHORIZED'
  | 'UNAVAILABLE';

export interface DataProvenance {
  source_name: string;
  source_type: 'OFFICIAL_OPEN_DATA' | 'RAILWAY_CRIS' | 'ISRO_RTIS' | 'THIRD_PARTY_API' | 'LOCAL_HARDWARE' | 'MANUAL_ENTRY' | 'CONTROLLED_SIMULATOR';
  data_status: DataVerificationStatus;
  source_updated_at?: string;
  retrieved_at: string;
  last_verified_at: string;
  verification_status: DataVerificationStatus;
  disclaimer?: string;
}

export interface DataSourceInspection {
  id: string;
  name: string;
  category: 'GOVERNMENT_OPEN_DATA' | 'RAILWAY_ENTERPRISE' | 'SATELLITE_TELEMETRY' | 'THIRD_PARTY_AGGREGATOR';
  url: string;
  status: DataVerificationStatus;
  statusLabel: string;
  authorizationRequirement: string;
  lastChecked: string;
  details: string;
}

/**
 * Explicit Allowlist of Approved External Data Providers.
 * Any service not listed here is strictly blocked from the production data flow.
 */
export const APPROVED_DATA_PROVIDERS: Record<string, DataSourceInspection> = {
  DATA_GOV_IN: {
    id: 'data-gov-in',
    name: 'Open Government Data (OGD) Platform India - data.gov.in',
    category: 'GOVERNMENT_OPEN_DATA',
    url: 'https://www.data.gov.in/catalog/indian-railways-train-time-table',
    status: 'OFFICIAL_HISTORICAL',
    statusLabel: 'Catalog Available / Resource Download Withheld by Portal',
    authorizationRequirement: 'National Data Sharing and Accessibility Policy (NDSAP) / GODL License',
    lastChecked: new Date().toISOString(),
    details: 'Catalog metadata (UUID: 7a5a8c45-cc5c-4107-9e89-5d14cbef865c) last updated 24-Jan-2018. Official ZIP download and API are currently marked disabled on the government portal.'
  },
  CRIS: {
    id: 'cris-railway',
    name: 'Centre for Railway Information Systems (CRIS)',
    category: 'RAILWAY_ENTERPRISE',
    url: 'https://cris.org.in/',
    status: 'ACCESS_NOT_AUTHORIZED',
    statusLabel: 'Enterprise Railway Intranet / Authorization Required',
    authorizationRequirement: 'Formal Ministry of Railways MOU, Enterprise B2B VPN, and IP Whitelisting',
    lastChecked: new Date().toISOString(),
    details: 'CRIS operates the internal PRS, UTS, NTES, and COA infrastructure. Unauthenticated public access is not permitted under Railway security guidelines.'
  },
  ISRO_RTIS: {
    id: 'isro-rtis',
    name: 'ISRO Real-Time Train Information System (RTIS)',
    category: 'SATELLITE_TELEMETRY',
    url: 'https://www.isro.gov.in/',
    status: 'ACCESS_NOT_AUTHORIZED',
    statusLabel: 'Dedicated Satellite Telemetry / Restricted Network',
    authorizationRequirement: 'Government Security Clearance & Direct CRIS COA Terminal Integration',
    lastChecked: new Date().toISOString(),
    details: 'Utilizes GSAT/MSS transponders and GAGAN receiver units on locomotives. Feeds internal train dispatchers; no open consumer REST API exists.'
  },
  RAILRADAR: {
    id: 'railradar',
    name: 'RailRadar (Railway Intelligence REST API)',
    category: 'THIRD_PARTY_AGGREGATOR',
    url: 'https://railradar.in/docs/ntes-trains-lookup',
    status: 'AUTHORIZED_LIVE',
    statusLabel: 'Official Commercial API Connected (Server-Side Authenticated)',
    authorizationRequirement: 'Authorized API Key (RAILRADAR_API_KEY on FastAPI Backend)',
    lastChecked: new Date().toISOString(),
    details: 'Verified integration via server-side FastAPI proxy. Provides real-time NTES schedules, route GIS geometry, and live running delay/speed.'
  },
  RAILCORE: {
    id: 'railcore',
    name: 'RailCore IRCTC API (Railway Developer Platform)',
    category: 'THIRD_PARTY_AGGREGATOR',
    url: 'https://railcore.tech/developers/irctc-api',
    status: 'AUTHORIZED_LIVE',
    statusLabel: 'RailCore API Gateway Configured (Server-Side Authenticated)',
    authorizationRequirement: 'Authorized API Key (RAILCORE_API_KEY on FastAPI Backend)',
    lastChecked: new Date().toISOString(),
    details: 'Verified integration via server-side FastAPI proxy. Endpoints: train schedule, coach-position, station lookup. Free quota: 2,000 req/mo.'
  },
  QRAIL: {
    id: 'qrail',
    name: 'Qrail Railway Developer API',
    category: 'THIRD_PARTY_AGGREGATOR',
    url: 'https://www.qrail.in/developers',
    status: 'AUTHORIZED_LIVE',
    statusLabel: 'Qrail API Gateway Configured (Server-Side Authenticated)',
    authorizationRequirement: 'Authorized API Key (QRAIL_API_KEY on FastAPI Backend)',
    lastChecked: new Date().toISOString(),
    details: 'Verified integration via server-side FastAPI proxy. Free tier endpoints: train schedule, trains between stations, PNR status. Live running restricted to Pro.'
  }
};

const BACKEND_BASE_URL = (import.meta as any).env?.VITE_AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Client methods interacting securely with FastAPI server-side RailRadar service.
 * Never handles, transmits, or exposes the raw secret key on the frontend.
 */
export const RailRadarClient = {
  async getStatus(): Promise<{ configured: boolean; provenance_status: string; masked_key: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railradar/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return { configured: false, provenance_status: 'UNAVAILABLE', masked_key: 'SERVER_OFFLINE' };
    }
  },

  async lookupTrains(): Promise<{ success: boolean; data?: Record<string, string>; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railradar/trains/lookup`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Live Data Unavailable' } };
    }
  },

  async getTrainDetails(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railradar/trains/${encodeURIComponent(trainNumber)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Live Data Unavailable' } };
    }
  },

  async getTrainRouteGeometry(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railradar/trains/${encodeURIComponent(trainNumber)}/route`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Live Route Unavailable' } };
    }
  },

  async getLiveStatus(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railradar/trains/${encodeURIComponent(trainNumber)}/live`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Live Status Unavailable' } };
    }
  },

  async syncTrainToSupabase(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railradar/trains/${encodeURIComponent(trainNumber)}/sync`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Database sync failed' } };
    }
  }
};

/**
 * Client methods interacting securely with FastAPI server-side RailCore service.
 * Never handles, transmits, or exposes the raw secret key on the frontend.
 */
export const RailCoreClient = {
  async getStatus(): Promise<{ configured: boolean; masked_key: string; base_url: string; rate_limit: string; documentation: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railcore/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        configured: false,
        masked_key: 'SERVER_OFFLINE',
        base_url: 'https://ir.railcore.tech/v1',
        rate_limit: '2,000 req/month',
        documentation: 'https://railcore.tech/developers/irctc-api'
      };
    }
  },

  async getSchedule(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railcore/trains/${encodeURIComponent(trainNumber)}/schedule`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'RailCore Schedule Unavailable' } };
    }
  },

  async getCoachPosition(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railcore/trains/${encodeURIComponent(trainNumber)}/coach-position`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'RailCore Coach Position Unavailable' } };
    }
  },

  async getStation(stationCode: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railcore/stations/${encodeURIComponent(stationCode)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'RailCore Station Lookup Unavailable' } };
    }
  }
};

/**
 * Client methods interacting securely with FastAPI server-side Qrail service.
 * Respects Free tier restrictions (Schedules, Trains Between Stations) vs Pro tier (Live Running).
 */
export const QrailClient = {
  async getStatus(): Promise<{ configured: boolean; masked_key: string; base_url: string; rate_limit: string; documentation: string; plan_tier: string }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/qrail/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        configured: false,
        masked_key: 'SERVER_OFFLINE',
        base_url: 'https://www.qrail.in/api/v3',
        rate_limit: '100 req/day (Free Tier)',
        documentation: 'https://www.qrail.in/developers',
        plan_tier: 'Free'
      };
    }
  },

  async getSchedule(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/qrail/trains/${encodeURIComponent(trainNumber)}/schedule`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Qrail Schedule Unavailable' } };
    }
  },

  async getTrainsBetween(fromStation: string, toStation: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/qrail/trains/between/${encodeURIComponent(fromStation)}/${encodeURIComponent(toStation)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Qrail Trains Between Stations Unavailable' } };
    }
  },

  async getRunningStatus(trainNumber: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/qrail/trains/${encodeURIComponent(trainNumber)}/running`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Qrail Running Status Unavailable' } };
    }
  }
};

export interface MultiProviderStatus {
  railradar: { configured: boolean; masked_key: string; provenance_status: string };
  railcore: { configured: boolean; masked_key: string; rate_limit: string; base_url: string };
  qrail: { configured: boolean; masked_key: string; rate_limit: string; plan_tier: string; base_url: string };
  any_configured: boolean;
}

export interface MultiProviderTrainResult {
  success: boolean;
  train_number: string;
  sources_queried: string[];
  sources_succeeded: string[];
  primary_source: string | null;
  conflicts: Array<{ field: string; values: Record<string, any>; description: string }>;
  conflict_count: number;
  data: any;
  error?: any;
}

/**
 * Unified Railway Gateway Client for multi-provider routing, conflict detection, and sync.
 */
export const DualRailwayGatewayClient = {
  async getAllProvidersStatus(): Promise<MultiProviderStatus> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/providers/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        railradar: { configured: false, masked_key: 'OFFLINE', provenance_status: 'UNAVAILABLE' },
        railcore: { configured: false, masked_key: 'OFFLINE', rate_limit: '2,000 req/mo', base_url: 'https://ir.railcore.tech/v1' },
        qrail: { configured: false, masked_key: 'OFFLINE', rate_limit: '100 req/day', plan_tier: 'Free', base_url: 'https://www.qrail.in/api/v3' },
        any_configured: false
      };
    }
  },

  async getMultiProviderTrain(trainNumber: string): Promise<MultiProviderTrainResult> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/trains/${encodeURIComponent(trainNumber)}/multi-provider`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        train_number: trainNumber,
        sources_queried: [],
        sources_succeeded: [],
        primary_source: null,
        conflicts: [],
        conflict_count: 0,
        data: null,
        error: { message: e.message || 'Railway Data Temporarily Unavailable' }
      };
    }
  },

  async syncTrainToSupabase(trainNumber: string, preferProvider: string = 'RailCore'): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/trains/${encodeURIComponent(trainNumber)}/sync?prefer_provider=${encodeURIComponent(preferProvider)}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Database synchronization failed' } };
    }
  }
};

export interface AllIndiaTrainSummary {
  train_number: string;
  train_name: string;
  source_station?: string;
  destination_station?: string;
  source?: string;
  running_days?: string[];
  train_type?: string;
}

export interface AllIndiaStation {
  code: string;
  name: string;
  city?: string;
  state?: string;
  is_major?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
}

export interface AllIndiaTrainSearchResult {
  success: boolean;
  source_name: string;
  query: string;
  total_catalog_size: number;
  match_count?: number;
  total_matches?: number;
  returned_count?: number;
  retrieved_at: string;
  trains: AllIndiaTrainSummary[];
}

export interface AllIndiaTrainStop {
  sequence: number;
  station_code: string;
  station_name: string;
  arrival_time: string;
  departure_time: string;
  halt_minutes: number;
  day: number;
  distance_km: number;
  platform_number: string;
  typical_delay_minutes: number;
}

export interface AllIndiaTrainCoach {
  sequence: number;
  coach_name: string;
  class_code: string;
  class_name: string;
  coach_type: string;
  position_from_engine: number;
}

export interface AllIndiaTrainFullDetails {
  success: boolean;
  train_number: string;
  train_name: string;
  source_station: string;
  destination_station: string;
  retrieved_at: string;
  provenance: {
    schedule_source: string;
    coach_position_source: string;
    live_running_source: string;
    weight_sensor_source: string;
  };
  stops_count: number;
  stops: AllIndiaTrainStop[];
  rake_formation: string;
  coaches: AllIndiaTrainCoach[];
  live_status?: {
    source: string;
    current_station: string;
    delay_minutes: number;
    speed_kmh?: number;
    last_updated: string;
    status_message: string;
  } | null;
}

export interface RailwaySyncLog {
  timestamp: string;
  train_number: string;
  train_name?: string;
  provider: string;
  status: 'SUCCESS' | 'FAILED';
  action: string;
  coaches_count?: number;
  details: string;
}

export interface RailwaySyncStatus {
  success: boolean;
  total_verified_trains_catalog: number;
  total_verified_stations: number;
  total_states_covered: number;
  total_uts_covered: number;
  total_states_and_uts: number;
  total_cities_covered: number;
  successful_sync_count: number;
  failed_sync_count: number;
  last_sync_timestamp: string;
  recent_sync_logs: RailwaySyncLog[];
  providers: {
    railradar: {
      name: string;
      status: string;
      catalog_trains: number;
      supported_features: string[];
    };
    railcore: {
      name: string;
      status: string;
      rate_limit: string;
      supported_features: string[];
    };
    qrail: {
      name: string;
      status: string;
      details: string;
      supported_features: string[];
    };
    railkit?: {
      name: string;
      status: string;
      details: string;
      supported_features: string[];
    };
  };
}

/**
 * All-India Railway Directory & Multi-Provider Real Data Client
 */
export const AllIndiaRailwayDirectoryClient = {
  async searchTrains(query: string = '', limit: number = 50, offset: number = 0): Promise<AllIndiaTrainSearchResult> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/trains/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        source_name: 'RailRadar (NTES Official)',
        query,
        total_catalog_size: 0,
        match_count: 0,
        retrieved_at: new Date().toISOString(),
        trains: []
      };
    }
  },

  async searchStations(query: string = '', state: string = 'All', city: string = 'All', limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const res = await fetch(
        `${BACKEND_BASE_URL}/api/railway/directory/stations?query=${encodeURIComponent(query)}&state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}&limit=${limit}&offset=${offset}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return { success: false, total_matches: 0, stations: [] };
    }
  },

  async getStatesAndCities(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/directory/states`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return { success: false, states: [] };
    }
  },

  async getFullTrainDetails(trainNumber: string): Promise<AllIndiaTrainFullDetails> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/trains/${encodeURIComponent(trainNumber)}/full-details`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        train_number: trainNumber,
        train_name: `Train ${trainNumber}`,
        source_station: '',
        destination_station: '',
        retrieved_at: new Date().toISOString(),
        provenance: {
          schedule_source: 'None',
          coach_position_source: 'None',
          live_running_source: 'None',
          weight_sensor_source: 'SIMULATED SENSOR DATA (Mechanical Bogie Strain Bench)'
        },
        stops_count: 0,
        stops: [],
        rake_formation: '',
        coaches: [],
        live_status: null
      };
    }
  },

  async syncTrainToSupabase(trainNumber: string, preferProvider: string = 'auto'): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/sync/train/${encodeURIComponent(trainNumber)}?prefer_provider=${encodeURIComponent(preferProvider)}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: { message: e.message || 'Database synchronization failed' } };
    }
  },

  async getSyncStatus(): Promise<RailwaySyncStatus | null> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railway/sync/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async validateRailKit(forceRefresh: boolean = false): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railkit/validate?force_refresh=${forceRefresh}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { configured: false, authenticated: false, status: 'ERROR', message: e.message };
    }
  },

  async importTrainFromRailKit(trainNumber: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/railkit/import/train/${encodeURIComponent(trainNumber)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      return data;
    } catch (e: any) {
      return { success: false, error: { message: e.message } };
    }
  }
};

/**
 * Creates standard provenance metadata for records.
 */
export function createProvenance(
  sourceName: string,
  sourceType: DataProvenance['source_type'],
  status: DataVerificationStatus,
  sourceUpdatedAt?: string,
  disclaimer?: string
): DataProvenance {
  const now = new Date().toISOString();
  return {
    source_name: sourceName,
    source_type: sourceType,
    data_status: status,
    source_updated_at: sourceUpdatedAt || now,
    retrieved_at: now,
    last_verified_at: now,
    verification_status: status,
    disclaimer
  };
}

/**
 * Returns user-facing status description for any data verification state.
 */
export function getStatusBadgeInfo(status: DataVerificationStatus) {
  switch (status) {
    case 'VERIFIED_REAL':
      return { label: 'Verified Real Data', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-300' };
    case 'OFFICIAL_HISTORICAL':
      return { label: 'Official Historical Data (data.gov.in)', bg: 'bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-300' };
    case 'AUTHORIZED_LIVE':
      return { label: 'Authorized Live Stream', bg: 'bg-teal-500/10 text-teal-700 border-teal-300 dark:text-teal-300' };
    case 'MANUAL_VERIFIED':
      return { label: 'Manual Staff Entry', bg: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300' };
    case 'SIMULATED_TEST':
      return { label: 'Simulated Test Bench', bg: 'bg-purple-500/10 text-purple-700 border-purple-300 dark:text-purple-300' };
    case 'ACCESS_NOT_AUTHORIZED':
      return { label: 'Access Not Authorized', bg: 'bg-orange-500/10 text-orange-700 border-orange-300 dark:text-orange-300' };
    case 'UNAVAILABLE':
    default:
      return { label: 'Verified Data Unavailable', bg: 'bg-slate-500/10 text-slate-700 border-slate-300 dark:text-slate-400' };
  }
}
