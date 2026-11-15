import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  HelpCircle, 
  Sliders, 
  Tv, 
  Users, 
  LayoutDashboard, 
  ShieldCheck, 
  UserCheck, 
  FileText, 
  Train,
  Settings,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { HowToUseModal } from './HowToUseModal';
import indianRailwaysLogo from '../../assets/indian-railways-logo.png';

interface NavbarProps {
  currentRoute?: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute = '', navigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin, isStaff, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Font size state
  const handleFontSize = (size: 'sm' | 'base' | 'lg') => {
    const root = document.documentElement;
    root.classList.remove('font-size-sm', 'font-size-lg');
    if (size === 'sm') root.classList.add('font-size-sm');
    if (size === 'lg') root.classList.add('font-size-lg');
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to exit and sign out of your active session?')) {
      await logout();
      navigate('/login');
    }
  };

  const navLinks = [
    { id: 'home', label: t.nav.home, path: '/' },
    { id: 'passenger', label: t.nav.passenger, path: '/passenger' },
    { id: 'monitoring', label: t.nav.monitoring, path: '/monitoring' },
    { id: 'dashboard', label: t.nav.dashboard, path: '/dashboard' },
    { id: 'display', label: t.nav.stationDisplay, path: '/display' },
    { id: 'simulator', label: t.nav.simulator, path: '/simulator' },
    { id: 'staff', label: t.nav.staff, path: '/staff', roleReq: 'staff' },
    { id: 'reports', label: t.nav.reports, path: '/reports' },
    { id: 'admin', label: t.nav.admin, path: '/admin', roleReq: 'admin' },
    { id: 'feedback', label: t.nav.feedback, path: '/feedback' },
    { id: 'settings', label: t.nav.settings, path: '/settings' },
    { id: 'help', label: t.nav.help, path: '/help' },
  ];

  const visibleLinks = navLinks.filter(item => {
    if (item.roleReq === 'admin') return isAdmin;
    if (item.roleReq === 'staff') return isStaff;
    return true;
  });

  const isActive = (path: string) => {
    if (path === '/' && (currentRoute === '/' || currentRoute === '')) return true;
    return currentRoute === path || currentRoute.startsWith(path + '/');
  };

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 transition-colors duration-200">
      
      {/* 1. Government-Inspired Accessibility & Utility Top Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:bg-amber-400 focus:text-slate-950 px-2 py-0.5 font-bold">
              Skip to Main Content
            </a>
            <span className="hidden md:inline text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              AI-Powered Crowd Management &amp; Rake Telemetry Platform &bull; Authenticated Multi-Provider API Integration
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            {/* Font size adjustments */}
            <div className="flex items-center gap-1 border-r border-slate-700 pr-2.5">
              <span className="text-slate-400 mr-1 hidden sm:inline">Text Size:</span>
              <button 
                onClick={() => handleFontSize('sm')} 
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono cursor-pointer rounded-xs"
                title="Decrease font size (A-)"
              >
                A-
              </button>
              <button 
                onClick={() => handleFontSize('base')} 
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono cursor-pointer rounded-xs"
                title="Standard font size (A)"
              >
                A
              </button>
              <button 
                onClick={() => handleFontSize('lg')} 
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono cursor-pointer rounded-xs"
                title="Increase font size (A+)"
              >
                A+
              </button>
            </div>

            {/* Language Switch */}
            <div className="flex items-center gap-1 border-r border-slate-700 pr-2.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 cursor-pointer font-medium ${language === 'en' ? 'bg-[#003366] text-amber-300 font-bold' : 'hover:text-white text-slate-300'}`}
              >
                English
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-1.5 py-0.5 cursor-pointer font-medium ${language === 'mr' ? 'bg-[#003366] text-amber-300 font-bold' : 'hover:text-white text-slate-300'}`}
              >
                मराठी
              </button>
            </div>

            {/* Global Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer rounded-xs border border-slate-700 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* 1-Click First-Time User Guide Button */}
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xs cursor-pointer text-[11px] shadow-xs transition"
              title={language === 'mr' ? 'वेबसाइट कशी वापरावी ते शिका (१० पायऱ्या)' : 'Learn how to use this website (10 easy steps)'}
              aria-label="How to Use This Website"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-950" />
              <span>{language === 'mr' ? 'कशी वापरावी?' : 'How to Use'}</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell />
          </div>

        </div>
      </div>

      {/* 2. Official Portal Identity Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Portal Title & Authentic Logo */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-13 h-13 flex items-center justify-center shrink-0">
              <img 
                src={indianRailwaysLogo} 
                alt="Indian Railways - Smart Live Weight Tracker Logo" 
                className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-[#002244] dark:text-blue-100 uppercase font-sans">
                  Smart Live Weight Tracker
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xs">
                  Indian Railways
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-tight mt-0.5">
                Passenger Coach Crowd Monitoring &amp; Load Management System
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                {language === 'mr' ? 'रेल्वे प्रवासी डबा थेट वजन व गर्दी नियंत्रण प्रणाली' : 'Bogie Telemetry & Real-Time Rake Occupancy Framework'}
              </p>
            </div>
          </div>

          {/* User Session Area */}
          <div className="hidden sm:flex items-center gap-2.5 text-xs">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 p-1.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xs">
                <div className="w-7 h-7 bg-[#003366] dark:bg-blue-900 text-white rounded-xs flex items-center justify-center font-bold text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <span className="font-semibold block text-slate-900 dark:text-slate-100 leading-tight">{user?.full_name}</span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">{user?.role}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-bold rounded-xs flex items-center gap-1 cursor-pointer transition"
                  title="Sign Out of Active Session"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit / Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 border border-[#003366] dark:border-blue-400 text-[#003366] dark:text-blue-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs rounded-xs cursor-pointer transition"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-semibold text-xs rounded-xs cursor-pointer transition shadow-xs"
                >
                  {t.nav.register}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xs cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* 3. Main Government Service Portal Navigation Bar (Deep Navy Blue) */}
      <nav className="bg-[#003366] dark:bg-[#002244] text-white border-t border-b border-[#002244] dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center overflow-x-auto divide-x divide-[#002244] dark:divide-slate-800">
            {visibleLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-left ${
                  isActive(item.path)
                    ? 'bg-[#002244] dark:bg-[#00172e] text-amber-300 border-b-2 border-b-amber-400 font-bold'
                    : 'text-slate-100 hover:bg-[#002244] dark:hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#002244] p-4 divide-y divide-[#00172e] text-xs space-y-1">
            {visibleLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-2 font-medium ${
                  isActive(item.path) ? 'text-amber-300 font-bold' : 'text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="pt-3 flex items-center justify-between text-slate-300">
              {isAuthenticated ? (
                <>
                  <div className="text-left">
                    <span className="font-semibold block text-white">{user?.full_name}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{user?.role}</span>
                  </div>
                  <button onClick={handleSignOut} className="px-2 py-1 bg-rose-900 text-rose-200 rounded-xs font-bold flex items-center gap-1">
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="text-amber-300 font-bold">
                    {t.nav.login}
                  </button>
                  <span className="text-slate-500">|</span>
                  <button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} className="text-amber-300 font-bold">
                    {t.nav.register}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* First-Time User Guide Modal */}
      <HowToUseModal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
        navigate={navigate} 
      />

    </header>
  );
};
