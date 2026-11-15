import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Radio, 
  Camera, 
  FileText, 
  UserCheck, 
  ArrowRight, 
  ShieldAlert, 
  Send, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Upload, 
  X, 
  User, 
  Calendar, 
  Eye,
  Activity,
  Cpu,
  HeartPulse,
  SlidersHorizontal,
  History,
  TrendingUp,
  TrendingDown,
  Scale,
  Zap,
  PhoneCall,
  Plus,
  Trash2,
  Edit,
  Check
} from 'lucide-react';
import { Train, Coach, Notification } from '../../types';
import { formatWeight, calculateCoachOccupancy } from '../../utils/weightCalculations';
import { OfflineStorageService } from '../../services/offlineStorage';

interface StaffAdvancedFeaturesProps {
  trains: Train[];
  assignedTrain?: Train;
  notifications: Notification[];
  userFullName?: string;
}

export const StaffAdvancedFeatures: React.FC<StaffAdvancedFeaturesProps> = ({
  trains,
  assignedTrain,
  notifications,
  userFullName = 'Duty Station Master'
}) => {
  const [activeTab, setActiveTab] = useState<
    'healthcard' | 'anomalies' | 'calibration' | 'inspectionhistory' | 'escalation' | 'dutycheckin' | 'inspection' | 'tasks' | 'shift' | 'photoincident' | 'sensorfault' | 'alerts' | 'handover'
  >('healthcard');

  const currentTrain = assignedTrain || trains[0];
  const passengerCoaches = currentTrain?.coaches.filter(c => c.coach_type !== 'Engine') || [];

  // 1. DIGITAL COACH HEALTH CARD STATE
  const [selectedHealthCoachId, setSelectedHealthCoachId] = useState<string>(passengerCoaches[0]?.id || '');
  const activeHealthCoach = passengerCoaches.find(c => c.id === selectedHealthCoachId) || passengerCoaches[0];

  // 2. AI ABNORMAL WEIGHT DETECTION STATE
  const [anomalyThresholdKg, setAnomalyThresholdKg] = useState<number>(3000);
  const [detectedAnomalies, setDetectedAnomalies] = useState<Array<{
    id: string;
    coachNo: string;
    type: string;
    severity: string;
    source: string;
    timestamp: string;
    status: string;
  }>>([]);

  // 3. SENSOR CALIBRATION MANAGEMENT STATE
  const [calibrations, setCalibrations] = useState<Array<{
    id: string;
    sensorId: string;
    coachNo: string;
    lastCalibrated: string;
    nextDue: string;
    status: string;
    offsetKg: number;
    notes: string;
  }>>([]);

  // 4. COACH INSPECTION HISTORY STATE
  const [inspectionsHistory, setInspectionsHistory] = useState<Array<{
    id: string;
    coachNo: string;
    date: string;
    inspector: string;
    status: string;
    findings: string;
    actionTaken: string;
  }>>([]);

  // CRUD state for inspections
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [newInspCoach, setNewInspCoach] = useState('S1');
  const [newInspInspector, setNewInspInspector] = useState(userFullName);
  const [newInspStatus, setNewInspStatus] = useState('Fit to Run');
  const [newInspFindings, setNewInspFindings] = useState('');
  const [newInspAction, setNewInspAction] = useState('');

  const [editingInspId, setEditingInspId] = useState<string | null>(null);
  const [editInspFindings, setEditInspFindings] = useState('');
  const [editInspStatus, setEditInspStatus] = useState('Fit to Run');
  const [editInspAction, setEditInspAction] = useState('');

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspFindings.trim()) return;

    const newInsp = {
      id: `insp-${Date.now()}`,
      coachNo: newInspCoach,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString().slice(0, 5),
      inspector: newInspInspector || userFullName,
      status: newInspStatus,
      findings: newInspFindings.trim(),
      actionTaken: newInspAction.trim() || 'Checked and certified.'
    };

    setInspectionsHistory(prev => [newInsp, ...prev]);
    OfflineStorageService.addAuditLog('Coach Inspection Logged', { coachNo: newInspCoach, status: newInspStatus });
    setNewInspFindings('');
    setNewInspAction('');
    setShowAddInspectionModal(false);
  };

  const handleSaveEditInspection = (id: string) => {
    setInspectionsHistory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          findings: editInspFindings.trim() || item.findings,
          status: editInspStatus,
          actionTaken: editInspAction.trim() || item.actionTaken
        };
      }
      return item;
    }));
    OfflineStorageService.addAuditLog('Coach Inspection Updated', { id, status: editInspStatus });
    setEditingInspId(null);
  };

  const handleDeleteInspection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this authorized inspection record?')) {
      setInspectionsHistory(prev => prev.filter(i => i.id !== id));
      OfflineStorageService.addAuditLog('Coach Inspection Removed', { id });
    }
  };

  // CRUD state for calibrations
  const [showAddCalModal, setShowAddCalModal] = useState(false);
  const [newCalSensorId, setNewCalSensorId] = useState('SEN-BOGIE-05A');
  const [newCalCoachNo, setNewCalCoachNo] = useState('S1');
  const [newCalOffset, setNewCalOffset] = useState<number>(0);
  const [newCalStatus, setNewCalStatus] = useState<'Valid' | 'Calibration Due' | 'Overdue'>('Valid');
  const [newCalNotes, setNewCalNotes] = useState('');

  const [editingCalId, setEditingCalId] = useState<string | null>(null);
  const [editCalOffset, setEditCalOffset] = useState<number>(0);
  const [editCalStatus, setEditCalStatus] = useState<'Valid' | 'Calibration Due' | 'Overdue'>('Valid');
  const [editCalNotes, setEditCalNotes] = useState('');

  const handleAddCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    const newCal = {
      id: `cal-${Date.now()}`,
      sensorId: newCalSensorId.trim() || `SEN-${newCalCoachNo}-B1`,
      coachNo: newCalCoachNo,
      lastCalibrated: 'Today, ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      nextDue: '90 days from today',
      status: newCalStatus,
      offsetKg: Number(newCalOffset) || 0,
      notes: newCalNotes.trim() || 'Zero-baseline strain bridge balance certified.'
    };

    setCalibrations(prev => [newCal, ...prev]);
    OfflineStorageService.addAuditLog('Sensor Calibration Registered', { sensorId: newCal.sensorId, coachNo: newCalCoachNo });
    setNewCalNotes('');
    setShowAddCalModal(false);
  };

  const handleSaveEditCalibration = (id: string) => {
    setCalibrations(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          offsetKg: Number(editCalOffset),
          status: editCalStatus,
          notes: editCalNotes.trim() || c.notes
        };
      }
      return c;
    }));
    OfflineStorageService.addAuditLog('Sensor Calibration Updated', { id, status: editCalStatus });
    setEditingCalId(null);
  };

  const handleDeleteCalibration = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sensor calibration record?')) {
      setCalibrations(prev => prev.filter(c => c.id !== id));
      OfflineStorageService.addAuditLog('Sensor Calibration Removed', { id });
    }
  };

  // 5. EMERGENCY ESCALATION HUB STATE
  const [escalations, setEscalations] = useState([
    {
      id: 'esc-1',
      title: 'Structural Overload Advisory: Coach GS2 Exceeded 100% Permissible Axle Load',
      supervisor: 'Chief Operating Manager (COM) & Division Commercial Officer',
      reportedAt: '14:22 IST',
      ackStatus: 'Acknowledged',
      resolution: 'RPF escorts regulated doorway access at intermediate halt.',
      status: 'Resolved'
    }
  ]);
  const [newEscalationTitle, setNewEscalationTitle] = useState('');
  const [newEscalationCoach, setNewEscalationCoach] = useState('S4');
  const [escalationSuccess, setEscalationSuccess] = useState(false);

  const handleCreateEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEscalationTitle) return;
    const newEsc = {
      id: `esc-${Date.now()}`,
      title: `Critical Alert (Coach ${newEscalationCoach}): ${newEscalationTitle}`,
      supervisor: 'Division Safety Officer (DSO) & Station Superintendent Desk',
      reportedAt: 'Just now',
      ackStatus: 'Pending',
      resolution: 'Dispatched emergency alert to Platform Master.',
      status: 'Escalated'
    };
    setEscalations(prev => [newEsc, ...prev]);
    setNewEscalationTitle('');
    setEscalationSuccess(true);
    setTimeout(() => setEscalationSuccess(false), 4000);
  };

  const handleAdvanceEscalationStatus = (id: string) => {
    setEscalations(prev => prev.map(esc => {
      if (esc.id === id) {
        let nextStatus = 'Acknowledged';
        let nextAck = 'Acknowledged';
        if (esc.status === 'Acknowledged' || esc.ackStatus === 'Acknowledged') {
          nextStatus = 'Responding';
          nextAck = 'Responding';
        } else if (esc.status === 'Responding' || esc.ackStatus === 'Responding') {
          nextStatus = 'Resolved';
          nextAck = 'Resolved';
        }
        return {
          ...esc,
          status: nextStatus,
          ackStatus: nextAck,
          resolution: nextStatus === 'Resolved' ? 'Incident interdicted and cleared by on-duty staff.' : esc.resolution
        };
      }
      return esc;
    }));
    OfflineStorageService.addAuditLog('Escalation Status Updated', { id });
  };

  const handleDeleteEscalation = (id: string) => {
    if (window.confirm('Delete this escalation entry from active duty log?')) {
      setEscalations(prev => prev.filter(e => e.id !== id));
      OfflineStorageService.addAuditLog('Escalation Removed', { id });
    }
  };

  // 6. STAFF DUTY CHECK-IN & ATTENDANCE STATE
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('14:00:00 IST (Today)');
  const [dutyPost, setDutyPost] = useState('Platform 3 - Station Master Desk (Mumbai CSMT)');
  const [handoverReliever, setHandoverReliever] = useState('Inspector V. M. Kulkarni');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [attendanceHistory] = useState([
    { date: '10 Nov 2026', shift: 'Afternoon (14:00 - 22:00)', in: '14:00', out: 'Active', post: 'Platform 3 Duty Desk' },
    { date: '09 Nov 2026', shift: 'Afternoon (14:00 - 22:00)', in: '13:58', out: '22:05', post: 'Platform 3 Duty Desk' },
    { date: '08 Nov 2026', shift: 'Morning (06:00 - 14:00)', in: '05:55', out: '14:02', post: 'C&W Yard Operations' }
  ]);

  // Existing checklist state
  const [checklistItems, setChecklistItems] = useState([
    { id: 'chk-1', label: 'Bogie Suspension Clearance & Coil Spring Integrity', checked: true, critical: true },
    { id: 'chk-2', label: 'Brake Pipe Pressure (5.0 kg/cm²) & Feed Pipe (6.0 kg/cm²)', checked: true, critical: true },
    { id: 'chk-3', label: 'Emergency Alarm Chain & PEAV Cock Sealing Verified', checked: true, critical: false },
    { id: 'chk-4', label: 'Vestibule Fall Plate & Accordion Bellows Lock Engaged', checked: true, critical: false },
    { id: 'chk-5', label: 'Coach Fire Extinguishers Pressure Gauge in Green Band', checked: true, critical: true },
    { id: 'chk-6', label: 'Underframe Strain Gauge Sensor Cable Harness Secured', checked: false, critical: true },
    { id: 'chk-7', label: 'Axle Box Hot Box / Temperature Reading Normal (< 65°C)', checked: true, critical: true },
    { id: 'chk-8', label: 'First Aid Emergency Kit & Stretcher in Guard Van Present', checked: true, critical: false }
  ]);
  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const completedCount = checklistItems.filter(i => i.checked).length;
  const readinessScore = Math.round((completedCount / checklistItems.length) * 100);

  return (
    <div className="gov-card p-4 sm:p-5 border-t-4 border-t-slate-800 space-y-4">
      
      {/* Sub-tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Station Master &amp; RPF Operations Desk &bull; Digital Field Suite
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#002244] dark:text-blue-300">
            Staff Inspection, Rake Safety &amp; Incident Console
          </h2>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-sm text-xs font-semibold border border-slate-300 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('healthcard')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'healthcard' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>Coach Health Card</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'anomalies' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Weight Anomalies</span>
          </button>

          <button
            onClick={() => setActiveTab('calibration')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'calibration' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Sensors &amp; Calibration</span>
          </button>

          <button
            onClick={() => setActiveTab('inspectionhistory')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'inspectionhistory' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Inspection History</span>
          </button>

          <button
            onClick={() => setActiveTab('escalation')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'escalation' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            <span>Emergency Escalation</span>
          </button>

          <button
            onClick={() => setActiveTab('dutycheckin')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'dutycheckin' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Duty Check-in</span>
          </button>

          <button
            onClick={() => setActiveTab('inspection')}
            className={`px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'inspection' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pre-Trip Checklist</span>
          </button>
        </div>
      </div>

      {/* 1. DIGITAL COACH HEALTH CARD */}
      {activeTab === 'healthcard' && activeHealthCoach && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Digital Coach Health Card &bull; Broad Gauge Bogie Diagnostic Summary
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Aggregated health index combining axle strain gauge telemetry, mechanical clearance, and safety alert status.
                </p>
              </div>
            </div>

            {/* Coach Switcher */}
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-slate-700 dark:text-slate-300">Select Coach:</span>
              <select
                value={selectedHealthCoachId}
                onChange={(e) => setSelectedHealthCoachId(e.target.value)}
                className="px-2.5 py-1 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold font-mono text-xs"
              >
                {passengerCoaches.map(c => (
                  <option key={c.id} value={c.id}>Coach {c.coach_no} ({c.coach_type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Health Card Dashboard */}
          <div className="p-4 rounded-sm border border-slate-200 dark:border-slate-700 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-[#003366] text-white font-mono font-black text-sm rounded-xs">
                  Coach {activeHealthCoach.coach_no}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#002244] dark:text-blue-300">
                    {activeHealthCoach.coach_type} Health Evaluation
                  </h3>
                  <span className="text-[11px] text-slate-500">Train: {currentTrain?.number} {currentTrain?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xs font-mono font-bold text-xs uppercase ${
                  activeHealthCoach.current_weight_kg > activeHealthCoach.max_capacity_kg
                    ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300'
                }`}>
                  Status: {activeHealthCoach.current_weight_kg > activeHealthCoach.max_capacity_kg ? 'EXCEEDED LOAD RATING' : 'FIT FOR RUNNING'}
                </span>
              </div>
            </div>

            {/* 6 Vital Diagnostic Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Weight Status</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {formatWeight(activeHealthCoach.current_weight_kg)}
                </span>
                <span className="text-[10px] text-slate-500">Max: {formatWeight(activeHealthCoach.max_capacity_kg)}</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Sensor Link</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Online
                </span>
                <span className="text-[10px] text-slate-500">Dual Transducer OK</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Inspection</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                  Today, 11:30
                </span>
                <span className="text-[10px] text-emerald-600">Passed Pre-Trip</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Alerts</span>
                <span className={`text-sm font-bold font-mono mt-0.5 block ${
                  activeHealthCoach.current_weight_kg > activeHealthCoach.max_capacity_kg ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {activeHealthCoach.current_weight_kg > activeHealthCoach.max_capacity_kg ? '1 Overload Warning' : '0 Safety Alarms'}
                </span>
                <span className="text-[10px] text-slate-500">Monitored 24/7</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Data Quality</span>
                <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                  99.9%
                </span>
                <span className="text-[10px] text-slate-500">Zero packet drop</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Overall Status</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  EXCELLENT
                </span>
                <span className="text-[10px] text-slate-500">Air brake certified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI ABNORMAL WEIGHT DETECTION */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-sm border border-amber-300 dark:border-amber-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  AI Transducer Transient &amp; Abnormal Weight Anomaly Engine:
                </span>
                <p className="text-amber-900/80 dark:text-amber-300/80 text-[11px]">
                  Monitors sudden weight increases, rapid passenger rushes, or abrupt load drops indicating potential sensor disconnects.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-slate-600 dark:text-slate-400">Trigger Threshold:</span>
              <select
                value={anomalyThresholdKg}
                onChange={(e) => setAnomalyThresholdKg(Number(e.target.value))}
                className="px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
              >
                <option value={2000}>&plusmn;2,000 kg Surge</option>
                <option value={3000}>&plusmn;3,000 kg Surge (Standard)</option>
                <option value={5000}>&plusmn;5,000 kg Severe Surge</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Flagged Weight Rate-of-Change Anomaly Events:
            </span>

            {detectedAnomalies.length > 0 ? (
              detectedAnomalies.map(anom => (
              <div
                key={anom.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    anom.severity === 'High' ? 'text-rose-600' : 'text-amber-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-[#002244] dark:text-blue-300">Coach {anom.coachNo}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{anom.type}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Source: {anom.source} &bull; Recorded: {anom.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                  <span className={`px-2 py-0.5 rounded-2xs font-bold text-[10px] uppercase ${
                    anom.severity === 'High' ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {anom.severity} Severity
                  </span>
                  <span className="px-2 py-0.5 rounded-2xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                    {anom.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-sm text-center text-xs text-slate-500">
              No coach inspection history logged yet. Complete a pre-departure mechanical inspection to register official record.
            </div>
          )}
          </div>
        </div>
      )}

      {/* 3. SENSOR CALIBRATION MANAGEMENT */}
      {activeTab === 'calibration' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-sm border border-blue-200 dark:border-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-blue-950 dark:text-blue-200 block">
                Axle Suspension Strain Transducer Calibration Roster
              </span>
              <p className="text-blue-800/80 dark:text-blue-300/80 text-[11px] mt-0.5">
                Pursuant to Carriage &amp; Wagon (C&amp;W) depot calibration standards. Zero-load baseline verified every 90 days.
              </p>
            </div>
            <button
              onClick={() => setShowAddCalModal(true)}
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xs cursor-pointer flex items-center gap-1 self-start sm:self-auto text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Calibration Event</span>
            </button>
          </div>

          {/* Add Calibration Form */}
          {showAddCalModal && (
            <form onSubmit={handleAddCalibration} className="p-3 bg-slate-50 dark:bg-slate-800/90 rounded-sm border border-slate-300 dark:border-slate-700 text-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">Register New Sensor Calibration</span>
                <button type="button" onClick={() => setShowAddCalModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sensor Transducer ID *</label>
                  <input
                    type="text"
                    value={newCalSensorId}
                    onChange={(e) => setNewCalSensorId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Coach *</label>
                  <select
                    value={newCalCoachNo}
                    onChange={(e) => setNewCalCoachNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    {passengerCoaches.map(c => (
                      <option key={c.id} value={c.coach_no}>Coach {c.coach_no}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Offset Calibration (kg)</label>
                  <input
                    type="number"
                    value={newCalOffset}
                    onChange={(e) => setNewCalOffset(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Certification Status</label>
                  <select
                    value={newCalStatus}
                    onChange={(e) => setNewCalStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="Valid">Valid (Certified)</option>
                    <option value="Calibration Due">Calibration Due</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Calibration Examination Notes</label>
                <input
                  type="text"
                  value={newCalNotes}
                  onChange={(e) => setNewCalNotes(e.target.value)}
                  placeholder="e.g. Verified bridge resistance on static load bench. Drift margin zero."
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCalModal(false)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-bold"
                >
                  Save Calibration Entry
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {calibrations.length > 0 ? (
              calibrations.map(cal => (
              <div
                key={cal.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                {editingCalId === cal.id ? (
                  <div className="space-y-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xs border">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Edit Calibration Record: {cal.sensorId}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Status</label>
                        <select
                          value={editCalStatus}
                          onChange={(e) => setEditCalStatus(e.target.value as any)}
                          className="w-full px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border font-bold"
                        >
                          <option value="Valid">Valid</option>
                          <option value="Calibration Due">Calibration Due</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Offset (kg)</label>
                        <input
                          type="number"
                          value={editCalOffset}
                          onChange={(e) => setEditCalOffset(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Notes</label>
                      <input
                        type="text"
                        value={editCalNotes}
                        onChange={(e) => setEditCalNotes(e.target.value)}
                        className="w-full px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCalId(null)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xs font-bold text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditCalibration(cal.id)}
                        className="px-2.5 py-1 bg-emerald-700 text-white rounded-xs font-bold text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#002244] dark:text-blue-300">{cal.sensorId}</span>
                        <span className="px-2 py-0.2 rounded-2xs bg-slate-100 dark:bg-slate-800 font-bold">Coach {cal.coachNo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-2xs font-mono font-bold text-[10px] uppercase ${
                          cal.status === 'Valid' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-900 animate-pulse'
                        }`}>
                          {cal.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingCalId(cal.id);
                            setEditCalStatus(cal.status as any);
                            setEditCalOffset(cal.offsetKg);
                            setEditCalNotes(cal.notes);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="Edit Calibration Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCalibration(cal.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                          title="Delete Calibration Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      <div>Last Calibrated: <strong>{cal.lastCalibrated}</strong></div>
                      <div>Next Due Date: <strong className={cal.status !== 'Valid' ? 'text-amber-600 font-bold' : ''}>{cal.nextDue}</strong></div>
                      <div>Offset Calibration: <strong>{cal.offsetKg} kg</strong></div>
                      <div>Static Bridge: <strong>350 &Omega; Balanced</strong></div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-1">
                      Notes: {cal.notes}
                    </p>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-sm text-center text-xs text-slate-500">
              No coach inspection history logged yet. Complete a pre-departure mechanical inspection to register official record.
            </div>
          )}
          </div>
        </div>
      )}

      {/* 4. COACH INSPECTION HISTORY */}
      {activeTab === 'inspectionhistory' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-sm border border-purple-200 dark:border-purple-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-purple-950 dark:text-purple-200 block">
                Coach Maintenance &amp; Pre-Departure Mechanical Inspection Logs
              </span>
              <p className="text-purple-800/80 dark:text-purple-300/80 text-[11px] mt-0.5">
                Archived mechanical fitness examinations by authorized Carriage &amp; Wagon supervisory examiners.
              </p>
            </div>
            <button
              onClick={() => setShowAddInspectionModal(true)}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xs cursor-pointer flex items-center gap-1 self-start sm:self-auto text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Inspection</span>
            </button>
          </div>

          {/* Add Inspection Modal/Form */}
          {showAddInspectionModal && (
            <form onSubmit={handleAddInspection} className="p-3 bg-slate-50 dark:bg-slate-800/90 rounded-sm border border-slate-300 dark:border-slate-700 text-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">Record New Mechanical Inspection</span>
                <button type="button" onClick={() => setShowAddInspectionModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coach Number *</label>
                  <select
                    value={newInspCoach}
                    onChange={(e) => setNewInspCoach(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    {passengerCoaches.map(c => (
                      <option key={c.id} value={c.coach_no}>Coach {c.coach_no} ({c.coach_type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Inspector Name / ID *</label>
                  <input
                    type="text"
                    value={newInspInspector}
                    onChange={(e) => setNewInspInspector(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status Verdict *</label>
                  <select
                    value={newInspStatus}
                    onChange={(e) => setNewInspStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="Fit to Run">Fit to Run (Cleared)</option>
                    <option value="Minor Observation">Minor Observation</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Inspection Findings *</label>
                <input
                  type="text"
                  value={newInspFindings}
                  onChange={(e) => setNewInspFindings(e.target.value)}
                  placeholder="e.g. Brake cylinder pressure tested at 3.8 bar. Coil springs intact."
                  required
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Corrective Action Taken</label>
                <input
                  type="text"
                  value={newInspAction}
                  onChange={(e) => setNewInspAction(e.target.value)}
                  placeholder="e.g. Air valve lubricated, certified Fit-to-Run for passenger service."
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInspectionModal(false)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-xs font-bold"
                >
                  Save Inspection Record
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {inspectionsHistory.length > 0 ? (
              inspectionsHistory.map(insp => (
              <div
                key={insp.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
              >
                {editingInspId === insp.id ? (
                  <div className="space-y-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xs border">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Edit Inspection: Coach {insp.coachNo}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Status</label>
                        <select
                          value={editInspStatus}
                          onChange={(e) => setEditInspStatus(e.target.value)}
                          className="w-full px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border font-bold"
                        >
                          <option value="Fit to Run">Fit to Run</option>
                          <option value="Minor Observation">Minor Observation</option>
                          <option value="Needs Attention">Needs Attention</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Action Taken</label>
                        <input
                          type="text"
                          value={editInspAction}
                          onChange={(e) => setEditInspAction(e.target.value)}
                          className="w-full px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Findings</label>
                      <input
                        type="text"
                        value={editInspFindings}
                        onChange={(e) => setEditInspFindings(e.target.value)}
                        className="w-full px-2 py-1 rounded-xs bg-white dark:bg-slate-900 border"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingInspId(null)}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xs font-bold text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditInspection(insp.id)}
                        className="px-2.5 py-1 bg-purple-700 text-white rounded-xs font-bold text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#002244] dark:text-blue-300">Coach {insp.coachNo}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Examined by {insp.inspector}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{insp.date}</span>
                        <button
                          onClick={() => {
                            setEditingInspId(insp.id);
                            setEditInspFindings(insp.findings);
                            setEditInspStatus(insp.status);
                            setEditInspAction(insp.actionTaken);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="Edit Inspection Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInspection(insp.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                          title="Delete Inspection Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Findings:</strong> {insp.findings}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1 text-[11px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Action: {insp.actionTaken}
                      </span>
                      <span className="px-2 py-0.2 rounded-2xs bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px]">
                        {insp.status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-sm text-center text-xs text-slate-500">
              No coach inspection history logged yet. Complete a pre-departure mechanical inspection to register official record.
            </div>
          )}
          </div>
        </div>
      )}

      {/* 5. EMERGENCY ESCALATION HUB */}
      {activeTab === 'escalation' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateEscalation} className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-sm border border-rose-300 dark:border-rose-900 space-y-3 text-xs">
            <span className="font-bold text-rose-950 dark:text-rose-200 block">
              Emergency Safety Incident Escalation to Division Operating Control (DOM / DSO)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Coach</label>
                <select
                  value={newEscalationCoach}
                  onChange={(e) => setNewEscalationCoach(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                >
                  {passengerCoaches.map(c => (
                    <option key={c.id} value={c.coach_no}>Coach {c.coach_no} ({c.coach_type})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Incident Headline</label>
                <input
                  type="text"
                  value={newEscalationTitle}
                  onChange={(e) => setNewEscalationTitle(e.target.value)}
                  placeholder="e.g. Critical axle strain gauge threshold breached (>105% capacity)"
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Dispatches high-priority red alert to Station Superintendent and Division Controllers.
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xs cursor-pointer transition flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Transmit Emergency Escalation</span>
              </button>
            </div>

            {escalationSuccess && (
              <div className="p-2 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-semibold rounded-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Emergency escalation transmitted. Division Safety Officers notified.</span>
              </div>
            )}
          </form>

          {/* Active Escalation History */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Active Escalations &amp; Supervisory Acknowledgments:
            </span>

            {escalations.map(esc => (
              <div
                key={esc.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{esc.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{esc.reportedAt}</span>
                    <button
                      onClick={() => handleDeleteEscalation(esc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete Escalation Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  <strong>Notified Supervisors:</strong> {esc.supervisor}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-1 text-[11px]">
                  <span className="text-slate-500">Resolution: {esc.resolution}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-2xs font-mono font-bold text-[10px] uppercase ${
                      esc.status === 'Resolved' ? 'bg-emerald-100 text-emerald-900' :
                      esc.status === 'Responding' ? 'bg-blue-100 text-blue-900' :
                      esc.status === 'Acknowledged' ? 'bg-amber-100 text-amber-900' :
                      'bg-rose-100 text-rose-900 animate-pulse'
                    }`}>
                      {esc.status}
                    </span>
                    {esc.status !== 'Resolved' && (
                      <button
                        onClick={() => handleAdvanceEscalationStatus(esc.id)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xs text-[10px] font-bold cursor-pointer"
                      >
                        Advance to {esc.status === 'Pending' || esc.status === 'Escalated' ? 'Acknowledged' : esc.status === 'Acknowledged' ? 'Responding' : 'Resolved'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. STAFF DUTY CHECK-IN & ATTENDANCE */}
      {activeTab === 'dutycheckin' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Authorized Field Staff Attendance &amp; Duty Roster Desk
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Staff: <strong>{userFullName}</strong> &bull; Biometric Authentication Verified
              </p>
            </div>

            <button
              onClick={() => setIsCheckedIn(!isCheckedIn)}
              className={`px-3 py-1.5 rounded-xs font-bold text-xs flex items-center gap-1 cursor-pointer transition ${
                isCheckedIn ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isCheckedIn ? 'Checked-In on Duty' : 'Clock-In Duty Shift'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Duty Start Time</span>
              <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">{checkInTime}</span>
              <span className="text-[10px] text-emerald-600 mt-1 block">Active on Shift</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Station Post</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">{dutyPost}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Train: {currentTrain?.number}</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Handover Time</span>
              <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">22:00:00 IST</span>
              <span className="text-[10px] text-blue-600 mt-1 block">Reliever: {handoverReliever}</span>
            </div>
          </div>

          {/* Shift Handover Form */}
          <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-sm border border-teal-200 dark:border-teal-900 text-xs space-y-2">
            <span className="font-bold text-teal-950 dark:text-teal-200 block">
              Official Shift Handover Protocol &amp; Log
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Incoming Relieving Officer</label>
                <input
                  type="text"
                  value={handoverReliever}
                  onChange={(e) => setHandoverReliever(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operational Handover Notes</label>
                <input
                  type="text"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Coach S4 sensor drifting monitored. RPF escort standing by on Platform 3."
                  className="w-full px-2.5 py-1.5 rounded-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-slate-500">
                Transfers active charting and Bogie strain telemetry duty responsibilities.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (handoverNotes.trim()) {
                    setHandoverSuccess(true);
                    OfflineStorageService.addAuditLog('Shift Handover Executed', { reliever: handoverReliever, notes: handoverNotes });
                    setTimeout(() => setHandoverSuccess(false), 4000);
                  }
                }}
                className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-xs font-bold cursor-pointer"
              >
                Record Shift Handover
              </button>
            </div>
            {handoverSuccess && (
              <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Duty handover logged to division operational audit trail!</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Recent Duty Attendance History:
            </span>
            {attendanceHistory.map((att, i) => (
              <div
                key={i}
                className="p-2.5 bg-white dark:bg-slate-900 rounded-xs border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{att.date} &bull; {att.shift}</span>
                  <span className="text-[11px] text-slate-500 block">{att.post}</span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span>In: <strong>{att.in}</strong> &bull; Out: <strong>{att.out}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. PRE-TRIP CHECKLIST */}
      {activeTab === 'inspection' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-sm border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Pre-Departure Rake Mechanical &amp; Telemetry Inspection Protocol
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Target Train: {currentTrain ? `${currentTrain.number} - ${currentTrain.name}` : 'Rake 12123'} &bull; Examiner: {userFullName}
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Readiness Score</span>
              <span className={`text-base font-black ${readinessScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {readinessScore}% ({completedCount}/{checklistItems.length})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {checklistItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-3 rounded-xs border text-xs flex items-center justify-between cursor-pointer transition select-none ${
                  item.checked 
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-slate-100' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded-xs text-[#003366] cursor-pointer"
                  />
                  <span className={`font-semibold ${item.checked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  {item.critical && (
                    <span className="px-1.5 py-0.2 rounded-2xs text-[9px] font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300">
                      Mandatory
                    </span>
                  )}
                  <span className={`text-[10px] font-bold ${item.checked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {item.checked ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">
              Pursuant to RDSO Coach Maintenance Manual CAMTECH/M/11-12/CMM.
            </span>
            <button
              onClick={() => {
                setInspectionSubmitted(true);
                setTimeout(() => setInspectionSubmitted(false), 4000);
              }}
              disabled={completedCount < checklistItems.length}
              className={`px-4 py-1.5 rounded-xs font-bold text-xs flex items-center gap-1 transition ${
                completedCount === checklistItems.length
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Issue Fit-to-Run Certification</span>
            </button>
          </div>

          {inspectionSubmitted && (
            <div className="p-3 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-semibold rounded-xs border border-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold block">Rake Fit-to-Run Clearance Dispatched to Operating Control!</span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Certificate Ref: RDSO-FTR-2026-9812 &bull; Digital Signature: {userFullName}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
