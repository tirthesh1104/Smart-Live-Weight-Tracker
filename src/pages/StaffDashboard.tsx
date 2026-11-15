import React, { useState } from 'react';
import { 
  UserCheck, 
  AlertTriangle, 
  Train as TrainIcon, 
  Scale, 
  Send, 
  FileText, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Radio, 
  ArrowRight, 
  LogOut,
  ClipboardCheck,
  LayoutGrid,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrain } from '../context/TrainContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatWeight, calculateCoachOccupancy } from '../utils/weightCalculations';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';
import { StaffCoachSeatManager } from '../components/coach/StaffCoachSeatManager';
import { StaffAdvancedFeatures } from '../components/staff/StaffAdvancedFeatures';
import { StaffMyTasksManager } from '../components/staff/StaffMyTasksManager';
import { ListTodo } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to exit your Staff Desk session and sign out?')) {
      await signOut();
      navigate('/login');
    }
  };
  const { 
    trains, 
    selectedTrain, 
    selectedTrainId, 
    setSelectedTrainId, 
    notifications, 
    incidents, 
    addIncidentReport,
    simulatedTrain,
    lastUpdated
  } = useTrain();

  // Incident reporting form states
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentCoachId, setIncidentCoachId] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [activeStaffTab, setActiveStaffTab] = useState<'tasks' | 'charting' | 'telemetry' | 'operations'>('tasks');

  const assignedTrain = selectedTrain || trains[0] || simulatedTrain;
  const coachAlerts = notifications.filter(n => n.train_id === assignedTrain?.id);

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle || !assignedTrain) return;

    addIncidentReport({
      train_id: assignedTrain.id,
      coach_id: incidentCoachId || undefined,
      reported_by: `${user?.full_name || 'Duty Staff'} (Station Master Desk)`,
      severity: incidentSeverity,
      title: incidentTitle,
      description: incidentDesc
    });

    setReportSubmitted(true);
    setIncidentTitle('');
    setIncidentDesc('');
    setTimeout(() => setReportSubmitted(false), 4000);
  };

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
              Indian Railways Operations &bull; Station Master &amp; RPF Operations Desk
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 uppercase tracking-tight">
              {t.staff.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Live bogie strain telemetry monitoring, structural overload thresholds, and official safety incident logging.
            </p>
          </div>
        </div>

        {/* Assigned Train Switcher & Dedicated Exit Button */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {trains.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Assigned Train:</span>
              <select
                value={assignedTrain?.id}
                onChange={(e) => setSelectedTrainId(e.target.value)}
                className="px-2.5 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
              >
                {trains.map((tr) => (
                  <option key={tr.id} value={tr.id}>{tr.number} - {tr.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => navigate('/feedback')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-[#003366] dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-semibold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            title="Submit Staff Operational Issue or Grievance"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            <span>Staff Support</span>
          </button>

          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            title="Exit Staff Desk and Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Desk</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Overload Alert Notification Banner for Staff */}
      {coachAlerts.some(n => n.severity === 'overload') && (
        <div className="p-3.5 bg-rose-50 border-l-4 border-rose-700 border-r border-t border-b border-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block font-bold text-sm text-rose-900">
              URGENT RPF / SAFETY DISPATCH: Structural Overload Flagged on Platform
            </strong>
            <p className="text-rose-800 mt-0.5">
              One or more coaches exceed structural maximum safe gross payload. Restrict platform foot-overbridge access and divert incoming commuters to vacant coaches.
            </p>
          </div>
        </div>
      )}

      {/* Staff Operational View Mode Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-sm text-xs font-semibold border border-slate-300 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveStaffTab('tasks')}
          className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeStaffTab === 'tasks'
              ? 'bg-[#003366] text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5 text-amber-300" />
          <span>My Assigned Tasks</span>
        </button>
        <button
          onClick={() => setActiveStaffTab('charting')}
          className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeStaffTab === 'charting'
              ? 'bg-[#003366] text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>Coach &amp; Berth Charting Desk</span>
        </button>
        <button
          onClick={() => setActiveStaffTab('telemetry')}
          className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeStaffTab === 'telemetry'
              ? 'bg-[#003366] text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Bogie Overload Telemetry &amp; Incidents</span>
        </button>
        <button
          onClick={() => setActiveStaffTab('operations')}
          className={`px-3.5 py-1.5 rounded-xs transition cursor-pointer flex items-center gap-1.5 ${
            activeStaffTab === 'operations'
              ? 'bg-[#003366] text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>Inspection &amp; Field Operations</span>
        </button>
      </div>

      {activeStaffTab === 'tasks' && (
        <StaffMyTasksManager currentUser={user} />
      )}

      {activeStaffTab === 'charting' && (
        <StaffCoachSeatManager
          trains={trains}
          staffName={user?.full_name || 'Station Superintendent'}
        />
      )}

      {activeStaffTab === 'telemetry' && (
        <>
          {/* Main Grid: Live Monitoring Table + Incident Reporting */}
          {assignedTrain ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left 2 Cols: Coach-wise Live Monitoring Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="gov-card overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-100 flex items-center justify-between">
                <span>
                  {t.staff.liveMonitoring} &bull; #{assignedTrain.number} {assignedTrain.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase">
                  {assignedTrain.data_source || 'SIMULATED DATA'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th className="w-20">Coach</th>
                      <th className="w-20">Class</th>
                      <th>Gross Wt</th>
                      <th>Tare Wt</th>
                      <th>Occupancy</th>
                      <th>Status Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTrain.coaches.map((c) => {
                      const occ = calculateCoachOccupancy(
                        c.current_weight_kg,
                        c.empty_weight_kg,
                        c.max_capacity_kg,
                        c.coach_type
                      );
                      return (
                        <tr key={c.id}>
                          <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{c.coach_no}</td>
                          <td className="text-slate-600 dark:text-slate-300 font-medium">{c.coach_type}</td>
                          <td className="font-tabular font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatWeight(c.current_weight_kg)}</td>
                          <td className="font-tabular text-slate-500 dark:text-slate-400 tabular-nums">{formatWeight(c.empty_weight_kg)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-tabular font-bold tabular-nums text-xs">{occ.clampedOccupancy}%</span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-xs overflow-hidden">
                                <div
                                  className={`h-full ${
                                    occ.isOverloaded ? 'bg-rose-700' :
                                    occ.clampedOccupancy > 75 ? 'bg-orange-500' :
                                    occ.clampedOccupancy > 40 ? 'bg-amber-500' :
                                    'bg-emerald-600'
                                  }`}
                                  style={{ width: `${Math.min(100, occ.clampedOccupancy)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold border ${
                              occ.isOverloaded ? 'bg-rose-50 text-rose-800 border-rose-300' :
                              occ.clampedOccupancy > 75 ? 'bg-orange-50 text-orange-800 border-orange-300' :
                              occ.clampedOccupancy > 40 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                              'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}>
                              {occ.statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Col: Incident Reporting Form */}
          <div className="space-y-4">
            <div className="gov-card p-4 space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="text-xs font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#003366] dark:text-blue-400" />
                  Log Operational Safety Incident
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Records are saved to official duty audit ledger.
                </p>
              </div>

              {reportSubmitted && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Incident successfully logged to railway safety audit trail.</span>
                </div>
              )}

              <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Incident Title *
                  </label>
                  <input
                    type="text"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="e.g. Platform crowd surge at Coach S2"
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Specific Coach (Optional)
                  </label>
                  <select
                    value={incidentCoachId}
                    onChange={(e) => setIncidentCoachId(e.target.value)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  >
                    <option value="">Whole Train / Entire Platform</option>
                    {assignedTrain.coaches.map(c => (
                      <option key={c.id} value={c.id}>Coach {c.coach_no} ({c.coach_type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Severity Level
                  </label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as any)}
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400 font-semibold"
                  >
                    <option value="low">Low (Advisory Notice)</option>
                    <option value="medium">Medium (Moderate Influx)</option>
                    <option value="high">High (Heavy Rush)</option>
                    <option value="critical">Critical (Structural Overload / Stampede Risk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Action Taken / Duty Notes
                  </label>
                  <textarea
                    rows={3}
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    placeholder="Detail action taken (e.g. RPF deployed, passengers redirected to rear rake)..."
                    className="w-full p-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#003366] dark:focus:border-blue-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 font-bold bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Incident to Log</span>
                </button>
              </form>
            </div>

            {/* Recent Incident Reports Log */}
            <div className="gov-card p-4 space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#002244] dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                Duty Incident Audit Ledger ({incidents.length})
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {incidents.length > 0 ? (
                  incidents.slice(0, 5).map((inc) => (
                    <div key={inc.id} className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{inc.title}</span>
                        <span className={`px-1.5 py-0.2 text-[10px] font-bold uppercase rounded-xs ${
                          inc.severity === 'critical' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300' :
                          inc.severity === 'high' ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{inc.description}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {new Date(inc.created_at).toLocaleTimeString()} &bull; {inc.reported_by}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No safety incidents logged in current shift.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="gov-card p-8 text-center space-y-3">
          <TrainIcon className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
          <h3 className="text-base font-bold text-[#002244] dark:text-blue-100">
            No Operational Train Assigned to Current Duty Desk
          </h3>
          <p className="max-w-md mx-auto text-xs text-slate-600 dark:text-slate-300">
            Real railway physical sensors have not been integrated. To simulate duty desk operations and test overload incident filing, launch an isolated simulation scenario.
          </p>
          <div className="pt-2">
            <Link
              to="/simulator"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-sm text-xs font-semibold"
            >
              <Radio className="w-4 h-4" />
              <span>Launch Test Simulation</span>
            </Link>
          </div>
        </div>
      )}
    </>
  )}

      {activeStaffTab === 'operations' && (
        <StaffAdvancedFeatures
          trains={trains}
          assignedTrain={assignedTrain}
          notifications={notifications}
          userFullName={user?.full_name || 'Duty Station Master'}
        />
      )}

    </div>
  );
};
