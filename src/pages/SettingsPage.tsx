import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Languages, 
  Moon, 
  Sun, 
  RotateCcw, 
  Cpu, 
  Radio, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useTrain } from '../context/TrainContext';
import { isSupabaseConfigured, testSupabaseConnection, SupabaseConnectionTestResult } from '../services/supabaseClient';
import { OfflineStorageService } from '../services/offlineStorage';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAutoSimulating, toggleAutoSimulate } = useTrain();

  const [resetMessage, setResetMessage] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<SupabaseConnectionTestResult | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await testSupabaseConnection();
      setConnectionTestResult(res);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local operational records, telemetry logs, and simulation sessions to a clean baseline state?')) {
      OfflineStorageService.resetAllToCleanState();
      setResetMessage(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="space-y-5 py-4 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Indian Railways Portal Services &bull; System Administration
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
          System Settings &amp; Telemetry Configuration
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Database connectivity status, language preferences, accessibility visual contrast, and data reset.
        </p>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {resetMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200 text-xs">
          Local operational dataset reset to clean initial baseline. Reloading portal...
        </div>
      )}

      {/* 1. Database Connection Status */}
      <div className="gov-card p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase text-[#002244] dark:text-blue-300">
            <Database className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            Database Synchronization Mode
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
            isSupabaseConfigured 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          }`}>
            {isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Local Demo Mode (Persistent Storage)'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {isSupabaseConfigured
            ? 'The system is connected to an active Supabase PostgreSQL cluster with Row Level Security (RLS) policies and real-time subscription channels.'
            : 'Currently running in Local Demo Mode using persistent browser storage. Supabase cloud credentials are not configured in environment variables. All local fleet registrations, simulation test runs, and duty incident reports are stored locally in the browser.'}
        </p>

        {/* Connection Diagnostics */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Database Connection Verification
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Run active diagnostic check against cloud endpoint.
            </span>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>{testingConnection ? 'Testing...' : 'Test Database Connection'}</span>
          </button>
        </div>

        {connectionTestResult && (
          <div className={`p-3 rounded-sm border text-xs space-y-1 ${
            connectionTestResult.connected
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
          }`}>
            <div className="font-bold">
              {connectionTestResult.connected ? '✓ Cloud Database Connected' : '⚠ Local Storage Fallback Active'}
            </div>
            <p className="text-[11px]">{connectionTestResult.message}</p>
          </div>
        )}

        {/* Environment Variable Diagnostics */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            Supabase Vite Environment Configuration:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm">
              <span className="text-slate-500 dark:text-slate-400 block">VITE_SUPABASE_URL</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {import.meta.env.VITE_SUPABASE_URL ? 'CONFIGURED' : 'NOT CONFIGURED (Empty / Missing)'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-sm">
              <span className="text-slate-500 dark:text-slate-400 block">VITE_SUPABASE_PUBLISHABLE_KEY</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) ? 'CONFIGURED' : 'NOT CONFIGURED (Empty / Missing)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Language & Localization */}
      <div className="gov-card p-5 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 font-bold text-xs uppercase text-[#002244] dark:text-blue-300">
          <Languages className="w-4 h-4 text-[#003366] dark:text-blue-400" />
          Portal Language Selection (भाषा)
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Select portal language in compliance with GIGW 3.0 bilingual service portal requirements:
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-sm text-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`p-3 rounded-sm border text-center transition font-semibold cursor-pointer ${
              language === 'en'
                ? 'bg-[#003366] dark:bg-blue-600 text-white border-[#003366] dark:border-blue-500'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <span className="block text-sm">English</span>
            <span className="text-[11px] opacity-80">Default Official</span>
          </button>

          <button
            onClick={() => setLanguage('mr')}
            className={`p-3 rounded-sm border text-center transition font-semibold cursor-pointer ${
              language === 'mr'
                ? 'bg-[#003366] dark:bg-blue-600 text-white border-[#003366] dark:border-blue-500'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <span className="block text-sm">मराठी</span>
            <span className="text-[11px] opacity-80">प्रादेशिक भाषा</span>
          </button>
        </div>
      </div>

      {/* 3. System Reset */}
      <div className="gov-card p-5 space-y-3 border-l-4 border-l-rose-700">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 font-bold text-xs uppercase text-rose-900 dark:text-rose-300">
          <RotateCcw className="w-4 h-4 text-rose-700 dark:text-rose-400" />
          Reset Local Database to Clean State
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Clear all locally cached train fleet records, simulation test sessions, telemetry history packets, and incident logs. The portal will return to an empty operational state.
        </p>

        <div className="pt-1">
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Records</span>
          </button>
        </div>
      </div>

    </div>
  );
};
