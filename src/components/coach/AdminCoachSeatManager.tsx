import React, { useState } from 'react';
import { 
  Train, 
  Coach, 
  PassengerSubmission, 
  SeatBerth,
  CoachLayoutTemplate,
  CoachClassCode 
} from '../../types';
import { CoachLayoutService, COACH_LAYOUT_TEMPLATES } from '../../services/coachLayoutService';
import { OfflineStorageService } from '../../services/offlineStorage';
import { CoachSelectionHeader } from './CoachSelectionHeader';
import { CoachVisualLayout } from './CoachVisualLayout';
import { 
  FileSpreadsheet, 
  Printer, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Layers, 
  ShieldCheck, 
  Filter,
  Users,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface AdminCoachSeatManagerProps {
  trains: Train[];
}

export const AdminCoachSeatManager: React.FC<AdminCoachSeatManagerProps> = ({
  trains
}) => {
  const [selectedTrain, setSelectedTrain] = useState<Train>(trains[0] || {} as Train);
  const [selectedCoachId, setSelectedCoachId] = useState<string>(
    trains[0]?.coaches[0]?.id || ''
  );
  const [journeyDate, setJourneyDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'layout' | 'submissions' | 'discrepancies' | 'templates'>('layout');
  
  const [submissions, setSubmissions] = useState<PassengerSubmission[]>(() => {
    return CoachLayoutService.getPassengerSubmissions();
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const activeCoach = selectedTrain?.coaches.find(c => c.id === selectedCoachId) || selectedTrain?.coaches[0];

  const refreshSubmissions = () => {
    setSubmissions(CoachLayoutService.getPassengerSubmissions());
  };

  // Master Comprehensive Seat Dataset Export (Excel / CSV)
  const handleExportAllSeats = () => {
    let csv = "DATASET: INDIAN RAILWAYS COMPREHENSIVE SEAT & BERTH OCCUPANCY MASTER RECORD\n";
    csv += `Export Timestamp: ${new Date().toISOString()} | Authority: Railway Central Administration\n\n`;
    csv += "Train Number,Train Name,Coach No,Class,Seat No,Berth Type,Booking Status,Physical Occupancy,Passenger Name,PNR Number,From,To,Discrepancy\n";

    trains.forEach(t => {
      t.coaches.forEach(c => {
        const seats = CoachLayoutService.getCoachSeats(c, t);
        seats.forEach(s => {
          csv += `"${t.number}","${t.name}","${c.coach_no}","${c.coach_type}",${s.seat_number},"${s.berth_type}","${s.booking_status}","${s.physical_status}","${s.passenger_name_full || 'N/A'}","${s.pnr_full || 'N/A'}","${s.journey_from}","${s.journey_to}","${s.discrepancy_note || 'None'}"\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IR_Master_Seat_Occupancy_Dataset_${journeyDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    OfflineStorageService.addAuditLog('Master Seat Occupancy Exported (CSV)', {
      totalTrains: trains.length,
      timestamp: new Date().toISOString()
    });
  };

  // Discrepancy detector across current coach
  const currentCoachSeats = activeCoach ? CoachLayoutService.getCoachSeats(activeCoach, selectedTrain) : [];
  const discrepancies = currentCoachSeats.filter(
    s => s.discrepancy_note || (s.booking_status === 'Available' && s.physical_status === 'Occupied') || (s.booking_status.includes('Occupied') && s.physical_status === 'Vacant')
  );

  return (
    <div className="space-y-4">
      
      {/* 1. Header Toolbar */}
      <div className="gov-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t-4 border-t-[#003366] dark:border-t-blue-500">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#002244] dark:text-blue-100 uppercase tracking-tight">
              Central Coach, Berth &amp; Passenger Occupancy Command
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#003366] text-white rounded-xs">
              Phase 4 Core
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Network-wide coach layout telemetry, berth allocation auditing, passenger check-ins, and sensor reconciliation.
          </p>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAllSeats}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            title="Download Master Seat-Level Occupancy Dataset (CSV / Excel)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Export Fleet Seat Data</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            title="Print Executive Seat Report"
          >
            <Printer className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Switchers */}
      <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-sm text-xs font-semibold border border-slate-300 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveAdminSubTab('layout')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'layout'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Coach Layout &amp; Seat Explorer
        </button>
        <button
          onClick={() => setActiveAdminSubTab('submissions')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'submissions'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Passenger Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveAdminSubTab('discrepancies')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            activeAdminSubTab === 'discrepancies'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          {discrepancies.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
          <span>Discrepancy Monitor ({discrepancies.length})</span>
        </button>
        <button
          onClick={() => setActiveAdminSubTab('templates')}
          className={`px-3 py-1.5 rounded-xs transition cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'templates'
              ? 'bg-[#003366] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Coach Layout Templates (8 IR Classes)
        </button>
      </div>

      {/* 3. Sub-Tab 1: Visual Layout & Seat Explorer */}
      {activeAdminSubTab === 'layout' && (
        <div className="space-y-4">
          {selectedTrain && (
            <CoachSelectionHeader
              train={selectedTrain}
              trainsList={trains}
              onSelectTrain={(t) => {
                setSelectedTrain(t);
                setSelectedCoachId(t.coaches[0]?.id || '');
              }}
              selectedCoachId={selectedCoachId}
              onSelectCoach={(c) => setSelectedCoachId(c.id)}
              journeyDate={journeyDate}
              onDateChange={setJourneyDate}
            />
          )}

          {activeCoach && selectedTrain && (
            <CoachVisualLayout
              coach={activeCoach}
              train={selectedTrain}
              viewerRole="admin"
            />
          )}
        </div>
      )}

      {/* 4. Sub-Tab 2: Passenger Submissions Review Queue */}
      {activeAdminSubTab === 'submissions' && (
        <div className="space-y-4">
          <div className="gov-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#003366] dark:text-blue-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
                  Passenger Self-Reported Check-in Records ({submissions.length} Total)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Audit passenger voluntary check-ins and staff verification records.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search passenger or PNR..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#003366]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs font-semibold rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#003366]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Train &amp; Route</th>
                    <th className="w-24">Coach / Seat</th>
                    <th className="w-32">PNR Reference</th>
                    <th>Passenger Name</th>
                    <th className="w-32">Status</th>
                    <th>Staff Verification Audit</th>
                    <th className="w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .filter(s => statusFilter === 'ALL' || s.verification_state === statusFilter)
                    .filter(s => 
                      s.passenger_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                      s.pnr_number.includes(searchFilter) ||
                      s.train_number.includes(searchFilter)
                    )
                    .map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <strong className="text-slate-900 dark:text-slate-100 block">
                            #{sub.train_number} {sub.train_name}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            {sub.journey_from} &rarr; {sub.journey_to}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-[#003366] dark:text-blue-300">
                          {sub.coach_no} / #{sub.seat_number}
                        </td>
                        <td className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                          {sub.pnr_number}
                        </td>
                        <td className="font-bold text-slate-900 dark:text-slate-100">
                          {sub.passenger_name}
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            sub.verification_state === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : sub.verification_state === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {sub.verification_state}
                          </span>
                        </td>
                        <td className="text-[11px] text-slate-600 dark:text-slate-400">
                          {sub.staff_notes ? (
                            <span>{sub.staff_notes} <strong className="text-slate-700 dark:text-slate-300">({sub.verified_by || 'Staff'})</strong></span>
                          ) : (
                            <span className="text-slate-400 italic">No notes logged</span>
                          )}
                        </td>
                        <td className="text-right space-x-1.5 whitespace-nowrap">
                          {sub.verification_state !== 'Verified' && (
                            <button
                              onClick={() => {
                                CoachLayoutService.updateSubmissionState(sub.id, 'Verified', 'Admin verified directly.', 'Chief Administrator');
                                refreshSubmissions();
                              }}
                              className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-xs cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {sub.verification_state !== 'Rejected' && (
                            <button
                              onClick={() => {
                                CoachLayoutService.updateSubmissionState(sub.id, 'Rejected', 'Admin rejected record.', 'Chief Administrator');
                                refreshSubmissions();
                              }}
                              className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded-xs cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 3: Discrepancy Monitoring Desk */}
      {activeAdminSubTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="gov-card p-4 border-l-4 border-l-amber-500 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Bogie Load Sensor vs Charting Discrepancy Reconciliation</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Flags discrepancies where piezoelectric load sensors detect weight on seats charted as vacant, or where reserved seats remain physically unoccupied.
            </p>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th className="w-28">Coach / Seat</th>
                    <th>Class</th>
                    <th>Chart Booking Status</th>
                    <th>Physical Sensor Reading</th>
                    <th>Discrepancy Category</th>
                    <th className="w-36 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.length > 0 ? (
                    discrepancies.map((s) => (
                      <tr key={s.id}>
                        <td className="font-mono font-bold text-[#003366] dark:text-blue-300">
                          {s.coach_no} / #{s.seat_number}
                        </td>
                        <td>{s.berth_type}</td>
                        <td>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {s.booking_status}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            s.physical_status === 'Occupied'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {s.physical_status}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                          {s.booking_status === 'Available' && s.physical_status === 'Occupied'
                            ? 'Unreserved Passenger Presence on Vacant Berth'
                            : 'Charted Commuter Absent (No Bogie Strain)'}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => {
                              CoachLayoutService.updateSeatStatus(activeCoach?.id || '', s.seat_number, {
                                physical_status: 'Occupied',
                                discrepancy_note: 'Resolved by Administrator override.'
                              });
                              alert(`Seat #${s.seat_number} reconciled with administrative audit trail.`);
                            }}
                            className="px-2.5 py-1 bg-[#003366] text-white text-[11px] font-bold rounded-xs cursor-pointer hover:bg-[#002244]"
                          >
                            Reconcile
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                        Zero active physical discrepancies detected on Coach {activeCoach?.coach_no}. All charted berths align with piezoelectric strain telemetry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Sub-Tab 4: Coach Layout Templates */}
      {activeAdminSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="gov-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-200">
              Indian Railways Standard Coach Layout Configuration Templates
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Data-driven layout schemas defining compartments, berths per bay, and seating topologies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(COACH_LAYOUT_TEMPLATES).map((tmpl) => (
              <div 
                key={tmpl.class_code} 
                className="gov-card p-4 space-y-2 border-t-2 border-t-[#003366] dark:border-t-blue-500"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-lg text-[#002244] dark:text-blue-200">
                    {tmpl.class_code}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xs border border-slate-300 dark:border-slate-700">
                    {tmpl.total_seats} Seats/Berths
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {tmpl.class_name}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tmpl.description}
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] space-y-0.5 text-slate-500 dark:text-slate-400">
                  <div>Compartment Bays: <strong>{tmpl.bays_count}</strong></div>
                  <div>Seats per Bay: <strong>{tmpl.seats_per_bay}</strong></div>
                  <div>Middle Berth: <strong>{tmpl.has_middle_berth ? 'Yes' : 'No'}</strong></div>
                  <div>Side Berth: <strong>{tmpl.has_side_berth ? 'Yes' : 'No'}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
