import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { PassengerDashboard } from './pages/PassengerDashboard';
import { UnifiedDashboard } from './pages/UnifiedDashboard';
import { useAuth } from './context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { UserRole } from './types';

// Route-level code-splitting for heavy operational desks
const StationDisplay = lazy(() => import('./pages/StationDisplay').then(m => ({ default: m.StationDisplay })));
const SensorSimulator = lazy(() => import('./pages/SensorSimulator').then(m => ({ default: m.SensorSimulator })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard').then(m => ({ default: m.StaffDashboard })));
const TrainMonitoringPage = lazy(() => import('./pages/TrainMonitoringPage').then(m => ({ default: m.TrainMonitoringPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const AuthPages = lazy(() => import('./pages/AuthPages').then(m => ({ default: m.AuthPages })));

// Accessible loading fallback spinner
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-6">
    <div className="text-center space-y-2">
      <div className="w-8 h-8 border-3 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Loading railway operations module...</p>
    </div>
  </div>
);

// Protected Route Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowed: boolean;
  requiredRole: string;
}> = ({ children, allowed, requiredRole }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-medium">Verifying authorization credentials...</p>
        </div>
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-6 gov-card border-t-4 border-t-amber-600 text-center space-y-3">
        <div className="w-12 h-12 rounded-sm bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#002244] dark:text-blue-100">
          Role Authorization Required
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Access to this management desk requires <strong>{requiredRole.toUpperCase()}</strong> authority. Your active session is signed in as <strong>{user?.role?.toUpperCase()}</strong>.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 bg-[#003366] hover:bg-[#002244] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 transition"
          >
            <span>Sign In with Authorized Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Return to Public Portal Overview
          </button>
        </div>
      </div>
    </div>
  );
};

// Landing page wrapper to pass navigate
const LandingPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <LandingPage navigate={(route: string) => navigate(`/${route.replace('/', '')}`)} />;
};

// Auth page wrappers
const LoginWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthPages
      mode="login"
      onSuccess={(role: UserRole) => {
        if (role === 'admin') navigate('/admin');
        else if (role === 'staff') navigate('/staff');
        else navigate('/passenger');
      }}
      onNavigate={(route: string) => navigate(`/${route.replace('/', '')}`)}
    />
  );
};

const RegisterWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthPages
      mode="register"
      onSuccess={() => navigate('/passenger')}
      onNavigate={(route: string) => navigate(`/${route.replace('/', '')}`)}
    />
  );
};

const ForgotWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthPages
      mode="forgot"
      onSuccess={() => navigate('/login')}
      onNavigate={(route: string) => navigate(`/${route.replace('/', '')}`)}
    />
  );
};

const ResetPasswordWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthPages
      mode="reset"
      onSuccess={() => navigate('/login')}
      onNavigate={(route: string) => navigate(`/${route.replace('/', '')}`)}
    />
  );
};

export const App: React.FC = () => {
  const { isStaff, isAdmin } = useAuth();

  return (
    <HashRouter>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Full-Screen Station TV Display without Standard Navigation */}
          <Route path="/display" element={<StationDisplay />} />

          {/* Standard Layout Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPageWrapper />} />
            <Route path="passenger" element={<PassengerDashboard />} />
            <Route path="monitoring" element={<TrainMonitoringPage />} />
            <Route path="dashboard" element={<UnifiedDashboard />} />
            <Route path="simulator" element={<SensorSimulator />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="support" element={<FeedbackPage />} />
            <Route path="login" element={<LoginWrapper />} />
            <Route path="register" element={<RegisterWrapper />} />
            <Route path="forgot" element={<ForgotWrapper />} />
            <Route path="forgot-password" element={<ForgotWrapper />} />
            <Route path="reset-password" element={<ResetPasswordWrapper />} />

            {/* Dedicated Admin Dashboard with Multi-Factor Clearance */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowed={isAdmin} requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Staff Route */}
            <Route
              path="staff"
              element={
                <ProtectedRoute allowed={isStaff} requiredRole="staff">
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
};
export default App;
