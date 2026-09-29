/* ================================================================
   App.tsx — Root router with industrial shell layout.
   Phase 9: Sidebar + topbar wrapping all pages.
   ================================================================ */

import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import FleetDashboard from './pages/FleetDashboard';
import MachinePage from './pages/MachinePage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Main fleet overview dashboard */}
        <Route path="/dashboard" element={<FleetDashboard />} />
        {/* Machine detail drill-down */}
        <Route path="/dashboard/:machineId" element={<MachinePage />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}
