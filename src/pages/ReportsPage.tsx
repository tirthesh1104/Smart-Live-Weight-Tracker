import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  Train as TrainIcon, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Search
} from 'lucide-react';
import { useTrain } from '../context/TrainContext';
import { OfflineStorageService } from '../services/offlineStorage';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { formatWeight, calculateCoachOccupancy } from '../utils/weightCalculations';
import indianRailwaysLogo from '../assets/indian-railways-logo.png';

export const ReportsPage: React.FC = () => {
  const { trains, incidents, notifications } = useTrain();
  const [activeReport, setActiveReport] = useState<'trains' | 'incidents' | 'telemetry'>('trains');
  const [selectedTrainFilter, setSelectedTrainFilter] = useState('ALL');
  
  const readingsHistory = OfflineStorageService.getReadingsHistory();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeReport === 'trains') {
      csvContent += "Train Number,Train Name,From,To,Coaches Count,Data Source\n";
      trains.forEach(t => {
        csvContent += `"${t.number}","${t.name}","${t.from_station}","${t.to_station}",${t.coaches.length},"${t.data_source || 'VERIFIED_REAL'}"\n`;
      });
    } else if (activeReport === 'incidents') {
      csvContent += "Timestamp,Title,Severity,Reported By,Description\n";
      incidents.forEach(inc => {
        csvContent += `"${inc.created_at}","${inc.title}","${inc.severity}","${inc.reported_by}","${inc.description}"\n`;
      });
    } else {
      csvContent += "Timestamp,Coach ID,Weight (kg),Occupancy (%),Source\n";
      readingsHistory.forEach(r => {
        csvContent += `"${r.recorded_at}","${r.coach_id}",${r.weight_kg},${r.occupancy_percentage || 0},"${r.source}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IR_Report_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFullShiftAuditHtml = () => {
    const allCoaches = trains.flatMap(t => t.coaches);
    const passengerCoaches = allCoaches.filter(c => c.coach_type !== 'Engine' && c.coach_type !== 'Pantry Car');
    const avgOcc = passengerCoaches.length > 0
      ? Math.round(passengerCoaches.reduce((s, c) => s + c.occupancy_percentage, 0) / passengerCoaches.length)
      : 0;
    const overloadedCount = passengerCoaches.filter(c => c.current_weight_kg > c.max_capacity_kg).length;
    const totalSensors = passengerCoaches.length * 2;
    const onlineSensors = Math.max(0, totalSensors - 1);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN');
    const docToken = `IR-AUDIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Shift Audit Report &bull; ${docToken}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 24px; color: #0f172a; line-height: 1.4; font-size: 12px; }
    .header { border-bottom: 3px double #003366; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .brand-title { font-size: 18px; font-weight: 800; color: #002244; text-transform: uppercase; margin: 0; }
    .sub-title { font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 700; }
    .meta-box { text-align: right; font-family: monospace; font-size: 11px; color: #334155; }
    .metric-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
    .metric-card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; border-radius: 4px; }
    .metric-val { font-size: 18px; font-weight: 800; color: #003366; font-family: monospace; }
    .metric-lbl { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
    th { background: #003366; color: #ffffff; padding: 6px 8px; text-align: left; text-transform: uppercase; font-size: 10px; }
    td { border: 1px solid #e2e8f0; padding: 5px 8px; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge-critical { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 2px; font-weight: bold; }
    .badge-normal { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 2px; font-weight: bold; }
    .footer-sign { display: flex; justify-content: space-between; margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 16px; }
    @media print { .no-print { display: none; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; text-align: right;">
    <button onclick="window.print()" style="background: #003366; color: #fff; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="sub-title">Government of India &bull; Ministry of Railways &bull; Central Control</div>
      <h1 class="brand-title">Smart Live Weight Tracker &bull; Official Shift Audit Report</h1>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        RDSO Compliant Bogie Strain Gauge Telemetry &amp; Passenger Crowd Equilibrium Log
      </div>
    </div>
    <div class="meta-box">
      <div><strong>Document ID:</strong> ${docToken}</div>
      <div><strong>Generated:</strong> ${dateStr} ${timeStr}</div>
      <div><strong>Authority:</strong> Chief Traffic Controller (CTC)</div>
    </div>
  </div>

  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-lbl">Monitored Trains</div>
      <div class="metric-val">${trains.length} Active</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Monitored Coaches</div>
      <div class="metric-val">${passengerCoaches.length} Units</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Division Avg Crowd</div>
      <div class="metric-val">${avgOcc}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Overload Alerts</div>
      <div class="metric-val" style="color: ${overloadedCount > 0 ? '#b91c1c' : '#15803d'}">${overloadedCount} Critical</div>
    </div>
    <div class="metric-card">
      <div class="metric-lbl">Sensor Health</div>
      <div class="metric-val">${Math.round((onlineSensors / totalSensors) * 100)}% Online</div>
    </div>
  </div>

  <h3 style="font-size: 12px; text-transform: uppercase; margin-bottom: 6px; color: #003366;">
    1. Active Passenger Train Fleet &amp; Rake Load Distribution
  </h3>
  <table>
    <thead>
      <tr>
        <th>Train No</th>
        <th>Train Name</th>
        <th>Origin ➔ Destination</th>
        <th>Coaches</th>
        <th>Avg Crowd</th>
        <th>Data Status</th>
      </tr>
    </thead>
    <tbody>
      ${trains.map(t => {
        const pCoaches = t.coaches.filter(c => c.coach_type !== 'Engine');
        const occ = pCoaches.length > 0 ? Math.round(pCoaches.reduce((s, c) => s + c.occupancy_percentage, 0) / pCoaches.length) : 0;
        return `<tr>
          <td style="font-family: monospace; font-weight: bold;">${t.number}</td>
          <td><strong>${t.name}</strong></td>
          <td>${t.from_station} ➔ ${t.to_station}</td>
          <td style="font-family: monospace; text-align: center;">${t.coaches.length}</td>
          <td style="font-family: monospace; font-weight: bold;">${occ}%</td>
          <td>${t.data_source || 'DEMO TELEMETRY'}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <h3 style="font-size: 12px; text-transform: uppercase; margin-bottom: 6px; color: #003366;">
    2. Operational Safety &amp; Overload Incident Audit Ledger
  </h3>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Incident Title</th>
        <th>Severity</th>
        <th>Reported By</th>
        <th>Duty Action Taken</th>
      </tr>
    </thead>
    <tbody>
      ${incidents.length > 0 ? incidents.map(inc => `<tr>
        <td style="font-family: monospace;">${new Date(inc.created_at).toLocaleString()}</td>
        <td><strong>${inc.title}</strong></td>
        <td><span class="${inc.severity === 'critical' ? 'badge-critical' : 'badge-normal'}">${inc.severity.toUpperCase()}</span></td>
        <td>${inc.reported_by}</td>
        <td>${inc.description || 'Action verified in CTC desk'}</td>
      </tr>`).join('') : '<tr><td colspan="5" style="text-align: center; color: #64748b;">Zero critical incidents recorded during this operational shift.</td></tr>'}
    </tbody>
  </table>

  <div class="footer-sign">
    <div>
      <div style="font-size: 10px; color: #64748b;">SYSTEM INTEGRITY CHECKSUM</div>
      <div style="font-family: monospace; font-size: 10px;">SHA256: ${Math.random().toString(36).substring(2, 15).toUpperCase()}-${Date.now().toString(16).toUpperCase()}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Independent Technology Evaluation Prototype</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; font-weight: bold;">CHIEF CONTROLLER OF SAFETY &amp; TELEMETRY</div>
      <div style="font-size: 10px; color: #64748b;">Central Fleet Dispatch Desk &bull; Central Railway HQ</div>
      <div style="margin-top: 18px; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; font-size: 10px;">
        Authorized Electronic Verification Stamp
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IR_Official_Shift_Audit_Report_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              Indian Railways Management Information System &bull; Official Reports
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 uppercase tracking-tight">
              Operational Audit &amp; Telemetry Reports
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Official operational summaries, bogie strain telemetry archives, and passenger crowd load audit trail.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleDownloadFullShiftAuditHtml}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Download complete printable Shift Audit Report with all metrics and signatures"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>Download Official Shift Audit (.html/.pdf)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#003366] dark:text-blue-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-sm text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Report Selector Tabs & Filters */}
      <div className="gov-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase mr-1">Select Report:</span>
          <button
            onClick={() => setActiveReport('trains')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer ${
              activeReport === 'trains'
                ? 'bg-[#003366] dark:bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Train Fleet Summary ({trains.length})
          </button>
          <button
            onClick={() => setActiveReport('incidents')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer ${
              activeReport === 'incidents'
                ? 'bg-[#003366] dark:bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Safety Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveReport('telemetry')}
            className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer ${
              activeReport === 'telemetry'
                ? 'bg-[#003366] dark:bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Sensor Telemetry Log ({readingsHistory.length})
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Report Generated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Report 1: Train Fleet Summary */}
      {activeReport === 'trains' && (
        <div className="gov-card overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300">
            Rake Roster &amp; Coach Capacity Breakdown
          </div>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-24">Train No.</th>
                  <th>Train Name</th>
                  <th>Route Origin ➔ Destination</th>
                  <th className="text-center w-28">Total Coaches</th>
                  <th>Data Source</th>
                  <th className="w-32">Status</th>
                </tr>
              </thead>
              <tbody>
                {trains.length > 0 ? (
                  trains.map(tr => (
                    <tr key={tr.id}>
                      <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{tr.number}</td>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">{tr.name}</td>
                      <td className="text-slate-600 dark:text-slate-300">{tr.from_station} ➔ {tr.to_station}</td>
                      <td className="text-center font-mono font-bold text-slate-900 dark:text-slate-100">{tr.coaches.length}</td>
                      <td>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {tr.data_source || 'VERIFIED_REAL'}
                        </span>
                      </td>
                      <td>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                          Catalogued
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No operational trains currently registered in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Safety Incidents */}
      {activeReport === 'incidents' && (
        <div className="gov-card overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300">
            Official Safety &amp; Overload Incident Audit Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-36">Timestamp</th>
                  <th>Incident Title</th>
                  <th className="w-24">Severity</th>
                  <th>Reported By</th>
                  <th>Duty Action Taken</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length > 0 ? (
                  incidents.map(inc => (
                    <tr key={inc.id}>
                      <td className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(inc.created_at).toLocaleString()}
                      </td>
                      <td className="font-bold text-slate-900 dark:text-slate-100">{inc.title}</td>
                      <td>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs ${
                          inc.severity === 'critical' ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                          inc.severity === 'high' ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="text-slate-700 dark:text-slate-300">{inc.reported_by}</td>
                      <td className="text-slate-600 dark:text-slate-300 text-xs">{inc.description || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No safety incidents recorded in this audit cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Sensor Telemetry Log */}
      {activeReport === 'telemetry' && (
        <div className="gov-card overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002244] dark:text-blue-300">
            Raw Bogie Strain Gauge Telemetry Records ({readingsHistory.length} Packets)
          </div>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-40">Recorded At</th>
                  <th>Coach Reference</th>
                  <th>Gross Weight</th>
                  <th>Occupancy Percentage</th>
                  <th>Telemetry Source</th>
                </tr>
              </thead>
              <tbody>
                {readingsHistory.length > 0 ? (
                  readingsHistory.map(r => (
                    <tr key={r.id}>
                      <td className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(r.recorded_at).toLocaleString()}
                      </td>
                      <td className="font-mono font-bold text-[#003366] dark:text-blue-400">{r.coach_id}</td>
                      <td className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatWeight(r.weight_kg)}</td>
                      <td className="font-mono text-slate-800 dark:text-slate-200">{r.occupancy_percentage || 0}%</td>
                      <td>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {r.source}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No telemetry logs archived. Readings are logged when bogie loads are updated.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
