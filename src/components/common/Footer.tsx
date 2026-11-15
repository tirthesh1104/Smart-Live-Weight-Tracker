import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import indianRailwaysLogo from '../../assets/indian-railways-logo.png';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t-4 border-t-[#003366] transition-colors duration-200">
      
      {/* Upper Footer Links & Disclaimers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3 text-white font-black text-sm tracking-wide">
              <img 
                src={indianRailwaysLogo} 
                alt="Indian Railways - Smart Live Weight Tracker Logo" 
                className="w-9 h-9 object-contain drop-shadow"
              />
              <span className="uppercase tracking-wider font-extrabold text-base">Smart Live Weight Tracker</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              {t.appSubtitle}. Software prototype evaluating bogie suspension strain gauge load measurements to compute coach passenger crowd distribution and flag structural overload hazards.
            </p>
            <div className="p-2.5 bg-slate-800/90 border-l-3 border-amber-500 text-[11px] text-amber-300">
              <strong className="block text-white mb-0.5">Notice of Independent Engineering Prototype:</strong>
              This application is an independent technology prototype. Real railway operational data is not currently connected. Physical sensors have not been integrated; live operational telemetries require CRIS / Railway Board approval.
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-700">
              Portal Services
            </h3>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#/passenger" className="hover:text-amber-300 transition-colors">Passenger Coach Enquiry</a></li>
              <li><a href="#/monitoring" className="hover:text-amber-300 transition-colors">Train Fleet Monitoring</a></li>
              <li><a href="#/display" className="hover:text-amber-300 transition-colors">Station Platform Display</a></li>
              <li><a href="#/simulator" className="hover:text-amber-300 transition-colors">Sensor Simulator (Testing)</a></li>
              <li><a href="#/reports" className="hover:text-amber-300 transition-colors">Operational Reports</a></li>
              <li><a href="#/help" className="hover:text-amber-300 transition-colors">Technical Specifications</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-700">
              Operational Status
            </h3>
            <div className="space-y-2 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500 block">Database Mode:</span>
                <span className="text-slate-200 font-medium">Local Storage / Supabase Ready</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hardware Sensors:</span>
                <span className="text-slate-200 font-medium">Software Simulated (Unconnected)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Accessibility Standard:</span>
                <span className="text-slate-200 font-medium">WCAG 2.1 AA / Public Service Usability</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Legal Band */}
      <div className="bg-slate-950 py-3 border-t border-slate-800 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Smart Live Weight Tracker &bull; Independent Software Prototype.</p>
          <p className="text-slate-400">
            For operational enquiries and technical specifications, refer to the <a href="#/help" className="underline hover:text-amber-300">User Guidelines</a>.
          </p>
        </div>
      </div>

    </footer>
  );
};
