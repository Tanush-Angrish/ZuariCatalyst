import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { TourProvider } from './context/TourContext';

// Eager imports — loaded immediately (entry point + layout shell)
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Lazy imports — each page downloads only when first navigated to
const EmployeeDashboard   = lazy(() => import('./pages/dashboards/EmployeeDashboard'));
const MyIdeas             = lazy(() => import('./pages/dashboards/MyIdeas'));
const SuperadminDashboard = lazy(() => import('./pages/dashboards/SuperadminDashboard'));
const OrgAdminDashboard   = lazy(() => import('./pages/dashboards/OrgAdminDashboard'));
const TeamIdeas           = lazy(() => import('./pages/dashboards/TeamIdeas'));
const ProjectsPage        = lazy(() => import('./pages/dashboards/ProjectsPage'));
const UserManagement      = lazy(() => import('./pages/dashboards/UserManagement'));
const TemplateAccess      = lazy(() => import('./pages/dashboards/TemplateAccess'));
const TemplateConfig      = lazy(() => import('./pages/dashboards/TemplateConfig'));
const CommunityHub        = lazy(() => import('./pages/dashboards/CommunityHub'));
const Leaderboard         = lazy(() => import('./pages/dashboards/Leaderboard'));
const ProfilePage         = lazy(() => import('./pages/dashboards/ProfilePage'));

// Minimal loading fallback — shown while a page chunk is downloading
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-brand-blue/20 border-t-brand-blue animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}


// Protect Routes based on roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route director — maps role to default landing component
const DashboardDirector = () => {
  const { user } = useAuth();

  if (user?.role === 'Superadmin') return <SuperadminDashboard />;
  if (user?.role === 'Central Team') return <SuperadminDashboard />;
  if (user?.role === 'Org Admin') return <OrgAdminDashboard />;
  if (user?.role === 'Employee') return <EmployeeDashboard />;

  return <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <TourProvider>
        <NotificationProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />

                {/* General Dashboard routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardDirector />} />
                  <Route path="my-ideas" element={<ProtectedRoute allowedRoles={['Employee', 'Org Admin', 'Superadmin', 'Central Team']}><MyIdeas /></ProtectedRoute>} />
                  <Route path="team-ideas" element={<ProtectedRoute allowedRoles={['Org Admin']}><TeamIdeas /></ProtectedRoute>} />
                  <Route path="projects" element={<ProtectedRoute allowedRoles={['Employee', 'Org Admin', 'Superadmin', 'Central Team']}><ProjectsPage /></ProtectedRoute>} />
                  <Route path="leaderboard" element={<ProtectedRoute allowedRoles={['Employee', 'Org Admin', 'Superadmin', 'Central Team']}><Leaderboard /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                </Route>

                {/* Central Team / Hub routes */}
                <Route path="/community-hub" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<CommunityHub />} />
                </Route>

                {/* Global Settings */}
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['Superadmin', 'Central Team']}><DashboardLayout /></ProtectedRoute>}>
                  <Route path="users" element={<UserManagement />} />
                  <Route path="templates" element={<TemplateConfig />} />
                  <Route path="access" element={<TemplateAccess />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
      </TourProvider>
    </AuthProvider>
  );
}

export default App;
