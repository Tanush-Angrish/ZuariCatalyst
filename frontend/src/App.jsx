import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

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

// Route director
const DashboardDirector = () => {
  const { user } = useAuth();

  if (user?.role === 'Superadmin') return <SuperadminDashboard />;
  if (user?.role === 'Org Admin') return <OrgAdminDashboard />;
  if (user?.role === 'Employee') return <EmployeeDashboard />;

  return <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardDirector />} />
            <Route path="team" element={
              <ProtectedRoute allowedRoles={['Org Admin']}>
                <TeamIdeas />
              </ProtectedRoute>
            } />
            <Route path="my-ideas" element={
              <ProtectedRoute allowedRoles={['Employee']}>
                <MyIdeas />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['Superadmin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="template-access" element={
              <ProtectedRoute allowedRoles={['Superadmin']}>
                <TemplateAccess />
              </ProtectedRoute>
            } />
            <Route path="template-config" element={
              <ProtectedRoute allowedRoles={['Superadmin']}>
                <TemplateConfig />
              </ProtectedRoute>
            } />
            <Route path="community" element={<CommunityHub />} />
            <Route path="projects" element={<ProjectsPage />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
