import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import MyIdeas from './pages/dashboards/MyIdeas';
import SuperadminDashboard from './pages/dashboards/SuperadminDashboard';
import OrgAdminDashboard from './pages/dashboards/OrgAdminDashboard';
import TeamIdeas from './pages/dashboards/TeamIdeas';
import ProjectsPage from './pages/dashboards/ProjectsPage';
import UserManagement from './pages/dashboards/UserManagement';
import TemplateAccess from './pages/dashboards/TemplateAccess';
import TemplateConfig from './pages/dashboards/TemplateConfig';
import CommunityHub from './pages/dashboards/CommunityHub';

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
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* General Dashboard routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardDirector />} />
              <Route path="my-ideas" element={<ProtectedRoute allowedRoles={['Employee', 'Org Admin', 'Superadmin', 'Central Team']}><MyIdeas /></ProtectedRoute>} />
              <Route path="team-ideas" element={<ProtectedRoute allowedRoles={['Org Admin']}><TeamIdeas /></ProtectedRoute>} />
              <Route path="projects" element={<ProtectedRoute allowedRoles={['Employee', 'Org Admin', 'Superadmin', 'Central Team']}><ProjectsPage /></ProtectedRoute>} />
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
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
