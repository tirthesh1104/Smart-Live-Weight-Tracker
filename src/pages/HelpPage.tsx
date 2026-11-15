import React from 'react';
import { 
  HelpCircle, 
  Info, 
  Scale, 
  Radio, 
  ShieldAlert, 
  CheckCircle, 
  BookOpen, 
  ExternalLink,
  Layers,
  Cpu
} from 'lucide-react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';

export const HelpPage: React.FC = () => {
  return (
    <div className="space-y-5 py-4">
      
      {/* Page Header */}
      <div className="border-b border-slate-300 dark:border-slate-700 pb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Indian Railways Portal Services &bull; Documentation &amp; User Manual
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
          Portal User Guide &amp; Technical Specifications
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Operational instructions, telemetry calculation formulas, compliance standards, and accessibility declaration.
        </p>
      </div>

      {/* Prominent Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Section 1: System Purpose & Architecture */}
      <div className="gov-card p-5 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            1. System Overview &amp; Operational Purpose
          </h2>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          The <strong>Smart Live Weight Tracker</strong> is an engineering prototype designed to address platform crowd management, train coach load balancing, and commuter safety across passenger train rakes. By monitoring weight changes across individual coach bogies, the system computes real-time crowd distribution, warns railway safety personnel against structural overload, and directs boarding passengers to less-crowded coaches.
        </p>
      </div>

      {/* Section 2: Clarification of Telemetry Data Sources */}
      <div className="gov-card p-5 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            2. Telemetry Classification &amp; Data Source Taxonomy
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xs">
              REAL DATA
            </span>
            <h3 className="font-bold text-[#002244] dark:text-blue-300">Physical Sensor Telemetry</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Live bogie strain gauge telemetry streamed from physical load cells installed on rolling stock. <em>Currently pending formal integration with CRIS / Railway Board databases.</em>
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-xs">
              SIMULATED DATA
            </span>
            <h3 className="font-bold text-[#002244] dark:text-blue-300">Software Sensor Simulator</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Generated in real time via the isolated Software Bogie Simulator for engineering validation, load testing, and edge-case overload verification.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-sm space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-xs">
              MANUAL ENTRY
            </span>
            <h3 className="font-bold text-[#002244] dark:text-blue-300">Station Supervisor Manual Registry</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Locally registered train rakes and coaches created by station superintendents or administrators for operational tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Weight and Occupancy Formulas */}
      <div className="gov-card p-5 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            3. Weight &amp; Capacity Evaluation Mathematics
          </h2>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Coach occupancy percentage is computed using the official passenger payload formula:
        </p>
        <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-[#002244] dark:text-blue-300 rounded-sm text-center">
          Occupancy % = ((Weight<sub>current</sub> &minus; Weight<sub>tare</sub>) / (Weight<sub>gross_max</sub> &minus; Weight<sub>tare</sub>)) &times; 100
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2 border-l-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block">0% – 40%</span>
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300">Space Available</span>
          </div>
          <div className="p-2 border-l-4 border-amber-600 bg-amber-50 dark:bg-amber-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">41% – 75%</span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300">Moderate Load</span>
          </div>
          <div className="p-2 border-l-4 border-orange-600 bg-orange-50 dark:bg-orange-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-orange-900 dark:text-orange-200 block">76% – 100%</span>
            <span className="text-[11px] text-orange-800 dark:text-orange-300">Full / Heavy</span>
          </div>
          <div className="p-2 border-l-4 border-rose-700 bg-rose-50 dark:bg-rose-950/40 border-r border-t border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-rose-900 dark:text-rose-200 block">&gt; 100%</span>
            <span className="text-[11px] text-rose-800 dark:text-rose-300">Critical Overload</span>
          </div>
        </div>
      </div>

      {/* Section 4: GIGW 3.0 Accessibility Statement */}
      <div className="gov-card p-5 space-y-3">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="text-sm font-bold text-[#002244] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            4. Accessibility &amp; Standards Compliance (GIGW 3.0)
          </h2>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          This portal has been developed in accordance with the <strong>Guidelines for Indian Government Websites (GIGW 3.0)</strong> and WCAG 2.1 AA recommendations:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <li><strong>Keyboard Navigation:</strong> All interactive elements, buttons, and form inputs are navigable using standard keyboard TAB and ENTER controls.</li>
          <li><strong>Skip to Main Content:</strong> Direct anchor mechanism at the top of every screen to bypass repetitive navigation links.</li>
          <li><strong>Adjustable Font Scaling:</strong> Triple font-size switcher (A-, A, A+) provided in top bar.</li>
          <li><strong>Bilingual Support:</strong> Complete portal localization available in English and Marathi (मराठी).</li>
          <li><strong>Color Contrast Ratios:</strong> Text elements maintain a minimum 4.5:1 contrast ratio against background surfaces in both Light and Dark themes.</li>
        </ul>
      </div>

    </div>
  );
};
