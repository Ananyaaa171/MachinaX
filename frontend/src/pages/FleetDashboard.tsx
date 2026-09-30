/* ================================================================
   FleetDashboard.tsx — Role-Based Industrial Control Center
   Phase 10.5: Genuinely role-oriented frontend experience.
   One shared fleet backend, four distinct role-tailored dashboards:
   - USR-001 Ananya Sharma: System Overview & Fleet Health
   - USR-002 Aryan Mishra: Maintenance Control Center & Work Orders
   - USR-003 Aditya Gupta: Reliability & Predictive Analytics
   - USR-004 Aditya Maurya: Live Floor Operations & Telemetry Alarms
   ================================================================ */

import React, { useState } from 'react';
import { useFleet, type MachineTwinData } from '../context/FleetContext';
export type { MachineTwinData };
import { useDemoUser } from '../context/DemoUserContext';
import { ROLE_CONFIGS } from '../config/roleConfig';
import AdminDashboardView from '../components/dashboard/AdminDashboardView';
import MaintenanceDashboardView from '../components/dashboard/MaintenanceDashboardView';
import ReliabilityDashboardView from '../components/dashboard/ReliabilityDashboardView';
import OperatorDashboardView from '../components/dashboard/OperatorDashboardView';
import GenerateReportModal from '../components/report/GenerateReportModal';
import RecentReportsSection from '../components/report/RecentReportsSection';

export default function FleetDashboard() {
  const { machines, loading, metrics, loadDemoFleet, refreshFleet } = useFleet();
  const { currentUser } = useDemoUser();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedMachineForReport, setSelectedMachineForReport] = useState<number | 'ALL'>('ALL');

  const config = ROLE_CONFIGS[currentUser.id] || ROLE_CONFIGS['USR-001'];

  const handleOpenReportModal = (machineId: number | 'ALL' = 'ALL') => {
    setSelectedMachineForReport(machineId);
    setReportModalOpen(true);
  };

  // Requirement 18: Role-based loading states
  if (loading && machines.length === 0) {
    return (
      <div className="full-page-loading">
        <div className="loading-spinner" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {config.loadingMessage}
        </div>
      </div>
    );
  }

  // Requirement 17: Role-based empty states
  const isZero = metrics.totalMachines === 0;
  if (isZero) {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '36px 24px',
          textAlign: 'center',
          margin: '32px auto',
          maxWidth: 640,
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚙</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          {config.emptyState.title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px' }}>
          {config.emptyState.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            className="btn btn--primary"
            onClick={loadDemoFleet}
            id="btn-load-demo-fleet"
            style={{ padding: '8px 18px', fontSize: '0.8rem' }}
          >
            + Load Demonstration Fleet
          </button>
          <button
            className="btn btn--secondary"
            onClick={refreshFleet}
            style={{ padding: '8px 18px', fontSize: '0.8rem' }}
          >
            ↻ Refresh Backend
          </button>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard based on current demo user
  const renderRoleDashboard = () => {
    switch (currentUser.id) {
      case 'USR-001':
        return <AdminDashboardView onOpenReportModal={() => handleOpenReportModal('ALL')} />;
      case 'USR-002':
        return <MaintenanceDashboardView onOpenReportModal={() => handleOpenReportModal('ALL')} />;
      case 'USR-003':
        return <ReliabilityDashboardView onOpenReportModal={() => handleOpenReportModal('ALL')} />;
      case 'USR-004':
        return <OperatorDashboardView onOpenReportModal={() => handleOpenReportModal('ALL')} />;
      default:
        return <AdminDashboardView onOpenReportModal={() => handleOpenReportModal('ALL')} />;
    }
  };

  return (
    <>
      {/* Dynamic Role Dashboard */}
      {renderRoleDashboard()}

      {/* Reports History Audit Section */}
      <div style={{ marginTop: 24 }}>
        <RecentReportsSection />
      </div>

      {/* Role-Specific Generate Report Modal */}
      <GenerateReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        defaultMachineId={selectedMachineForReport}
      />
    </>
  );
}
