import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AnimatedBackground from './components/AnimatedBackground';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setUnauthorizedHandler } from './services/api';
import ErrorBoundary from './components/Common/ErrorBoundary';
import MainLayout       from './components/Layout/MainLayout';
import PrivateRoute     from './components/Common/PrivateRoute';
const Organigramme     = React.lazy(() => import('./pages/Organigramme'));

const Login            = React.lazy(() => import('./pages/auth/Login'));
const Register         = React.lazy(() => import('./pages/auth/Register'));
const Dashboard        = React.lazy(() => import('./pages/dashboard/Dashboard'));
const MissionsList     = React.lazy(() => import('./pages/missions/MissionsList'));
const MissionDetail    = React.lazy(() => import('./pages/missions/MissionDetail'));
const NewMissionWizard = React.lazy(() => import('./pages/missions/NewMission/NewMissionWizard'));
const Validations      = React.lazy(() => import('./pages/validations/Validations'));
const Messagerie       = React.lazy(() => import('./pages/messagerie/Messagerie'));
const Notifications    = React.lazy(() => import('./pages/notifications/Notifications'));
const Profil           = React.lazy(() => import('./pages/profil/Profil'));
const Utilisateurs     = React.lazy(() => import('./pages/admin/Utilisateurs'));
const Prestataires     = React.lazy(() => import('./pages/admin/Prestataires'));
const Budgets          = React.lazy(() => import('./pages/admin/Budgets'));
const AuditLogs        = React.lazy(() => import('./pages/admin/AuditLogs'));
const Statistiques     = React.lazy(() => import('./pages/admin/Statistiques'));
const Rapports         = React.lazy(() => import('./pages/rapports/Rapports'));
const Page404          = React.lazy(() => import('./pages/errors/Page404'));
const Page403          = React.lazy(() => import('./pages/errors/Page403'));

/** 401 : déconnexion SPA sans rechargement complet (évite flash blanc). */
function SessionExpiredNav() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, clearSession]);

  return null;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F4F6FA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-at-green/20 border-t-at-green rounded-full animate-spin" />
        <span className="text-at-green font-semibold text-lg tracking-wide">
          AT Réservations
        </span>
      </div>
    </div>
  );

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#F4F6FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-at-green/20 border-t-at-green rounded-full animate-spin" />
          <span className="text-at-green font-semibold text-lg tracking-wide">
            AT Réservations
          </span>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/login"    element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/403"      element={<Page403 />} />

        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/"                    element={<Dashboard />} />
          <Route path="/organigramme"        element={<Organigramme />} />
          <Route path="/missions"            element={<MissionsList />} />
          <Route path="/missions/nouvelle"   element={<NewMissionWizard />} />
          <Route path="/missions/:id"        element={<MissionDetail />} />
          <Route path="/validations"         element={
            <PrivateRoute roles={['validateur', 'admin']}>
              <Validations />
            </PrivateRoute>
          } />
          <Route path="/messagerie"          element={<Messagerie />} />
          <Route path="/notifications"       element={<Notifications />} />
          <Route path="/profil"              element={<Profil />} />
          <Route path="/rapports"            element={
            <PrivateRoute roles={['admin', 'validateur']}>
              <Rapports />
            </PrivateRoute>
          } />
          <Route path="/admin/utilisateurs"  element={
            <PrivateRoute roles={['admin']}><Utilisateurs /></PrivateRoute>
          } />
          <Route path="/admin/prestataires"  element={
            <PrivateRoute roles={['admin']}><Prestataires /></PrivateRoute>
          } />
          <Route path="/admin/budgets"       element={
            <PrivateRoute roles={['admin']}><Budgets /></PrivateRoute>
          } />
          <Route path="/admin/audit-logs"    element={
            <PrivateRoute roles={['admin']}><AuditLogs /></PrivateRoute>
          } />
          <Route path="/admin/statistiques"  element={
            <PrivateRoute roles={['admin']}><Statistiques /></PrivateRoute>
          } />
        </Route>

        <Route path="*" element={<Page404 />} />
      </Routes>
    </React.Suspense>
  );
}

function AnimatedBackgroundGate() {
  const { pathname } = useLocation();
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  if (isAuthRoute) return null;
  return <AnimatedBackground />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedBackgroundGate />
        <SessionExpiredNav />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'IBM Plex Sans', fontSize: '13px' },
          }}
        />
        <ErrorBoundary variant="fullscreen">
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
