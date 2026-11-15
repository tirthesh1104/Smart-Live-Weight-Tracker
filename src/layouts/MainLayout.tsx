import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { ChevronRight, Home, Database, AlertCircle } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const sync = useRealtimeSync();
  const navigate = useNavigate();
  const location = useLocation();

  // Generate clean breadcrumbs
  const pathnames = location.pathname.split('/').filter(x => x);

  const getBreadcrumbName = (segment: string) => {
    switch (segment) {
      case 'passenger': return 'Passenger Services';
      case 'monitoring': return 'Train Monitoring';
      case 'dashboard': return 'Master Dashboard';
      case 'display': return 'Station Display';
      case 'simulator': return 'Sensor Simulator';
      case 'staff': return 'Operations Desk';
      case 'reports': return 'Reports';
      case 'admin': return 'Administration';
      case 'profile': return 'User Profile';
      case 'settings': return 'Settings';
      case 'help': return 'Help & Guidelines';
      case 'login': return 'Sign In';
      case 'register': return 'Registration';
      default: return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Navigation Header */}
      <Navbar currentRoute={location.pathname} navigate={(p) => navigate(p)} />

      {/* Official Government Portal Breadcrumb Bar */}
      <div className="bg-slate-200 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 py-1.5 px-4 text-xs text-slate-700 dark:text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5">
            <Link to="/" className="flex items-center gap-1 hover:text-[#003366] dark:hover:text-blue-400 font-medium">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>

            {pathnames.map((segment, index) => {
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;

              return (
                <span key={to} className="flex items-center space-x-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {isLast ? (
                    <span className="font-semibold text-slate-900 dark:text-slate-100" aria-current="page">
                      {getBreadcrumbName(segment)}
                    </span>
                  ) : (
                    <Link to={to} className="hover:text-[#003366] dark:hover:text-blue-400">
                      {getBreadcrumbName(segment)}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Transparent Status Pill */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Application Status: Operational</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {sync.modeLabel}
            </span>
          </div>

        </div>
      </div>

      {/* Page Content */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Outlet />
      </main>

      {/* Official Footer */}
      <Footer />
    </div>
  );
};
