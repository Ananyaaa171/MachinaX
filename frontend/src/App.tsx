/* ================================================================
   App.tsx — Root router with industrial shell layout & authentication.
   Phase 10.6: Enforces /login authentication, protected route guards,
   and role-based module authorization with session persistence.
   ================================================================ */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DemoUserProvider, useDemoUser } from './context/DemoUserContext';
import { FleetProvider } from './context/FleetContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import FleetDashboard from './pages/FleetDashboard';
import MachinesPage from './pages/MachinesPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import AlertsPage from './pages/AlertsPage';
import MaintenancePage from './pages/MaintenancePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';

function AppRoutes() {
  const { isAuthenticated } = useDemoUser();

  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Routes enclosed in AppShell & ProtectedRoute */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <FleetDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Page 2: Machines Fleet */}
      <Route
        path="/machines"
        element={
          <ProtectedRoute>
            <AppShell>
              <MachinesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Page 3: Machine Digital Twin */}
      <Route
        path="/machines/:machineId"
        element={
          <ProtectedRoute>
            <AppShell>
              <DigitalTwinPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/machines/:machineId/twin"
        element={
          <ProtectedRoute>
            <AppShell>
              <DigitalTwinPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Page 4: Alerts */}
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AppShell>
              <AlertsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Page 5: Maintenance — Restricted to Admin & Maintenance Engineer */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={['System Administrator', 'Maintenance Engineer']}>
            <AppShell>
              <MaintenancePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Page 6: Analytics — Restricted to Admin & Reliability Engineer */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['System Administrator', 'Reliability Engineer']}>
            <AppShell>
              <AnalyticsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Page 7: User Profile & Session Information */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Legacy and alias compatibility */}
      <Route
        path="/dashboard/:machineId"
        element={
          <ProtectedRoute>
            <AppShell>
              <DigitalTwinPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Root and Catch-All Navigation */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <DemoUserProvider>
      <FleetProvider>
        <AppRoutes />
      </FleetProvider>
    </DemoUserProvider>
  );
}
