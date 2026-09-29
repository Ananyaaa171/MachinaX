/* ================================================================
   App.tsx — Root router with industrial shell layout & demo context.
   Phase 10: Multi-page router with interactive digital twin & demo roles.
   ================================================================ */

import { Routes, Route, Navigate } from 'react-router-dom';
import { DemoUserProvider } from './context/DemoUserContext';
import AppShell from './components/layout/AppShell';
import FleetDashboard from './pages/FleetDashboard';
import MachinesPage from './pages/MachinesPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import AlertsPage from './pages/AlertsPage';
import MaintenancePage from './pages/MaintenancePage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <DemoUserProvider>
      <AppShell>
        <Routes>
          {/* Page 1: Dashboard */}
          <Route path="/dashboard" element={<FleetDashboard />} />

          {/* Page 2: Machines Fleet */}
          <Route path="/machines" element={<MachinesPage />} />

          {/* Page 3: Machine Digital Twin */}
          <Route path="/machines/:machineId" element={<DigitalTwinPage />} />
          <Route path="/machines/:machineId/twin" element={<DigitalTwinPage />} />

          {/* Page 4: Alerts */}
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Page 5: Maintenance */}
          <Route path="/maintenance" element={<MaintenancePage />} />

          {/* Page 6: Analytics */}
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Legacy route compatibility */}
          <Route path="/dashboard/:machineId" element={<DigitalTwinPage />} />

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </DemoUserProvider>
  );
}
