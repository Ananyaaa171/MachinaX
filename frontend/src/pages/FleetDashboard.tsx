/* ================================================================
   FleetDashboard.tsx — Industrial Fleet Overview Dashboard
   Phase 10.1: Real machine data single source of truth, role-specific
   KPI emphasis, zero-machine empty state fallback, direct twin links,
   and integrated Generate Report suite.
   ================================================================ */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet, type MachineTwinData } from '../context/FleetContext';
export type { MachineTwinData };
import { useDemoUser } from '../context/DemoUserContext';
import FleetSummaryCards from '../components/dashboard/FleetSummaryCards';
import FleetHealthSection from '../components/dashboard/FleetHealthSection';
import MachineStatusTable from '../components/dashboard/MachineStatusTable';
import ActiveAlertsPanel from '../components/dashboard/ActiveAlertsPanel';
import PredictiveMaintenanceSection from '../components/dashboard/PredictiveMaintenanceSection';
import RecentEventsTimeline from '../components/dashboard/RecentEventsTimeline';
import GenerateReportModal from '../components/report/GenerateReportModal';
import RecentReportsSection from '../components/report/RecentReportsSection';

export default function FleetDashboard() {
  const navigate = useNavigate();
  const { machines, twinData, loading, metrics, lastUpdated, refreshFleet, loadDemoFleet } = useFleet();
  const { currentUser } = useDemoUser();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedMachineForReport, setSelectedMachineForReport] = useState<number | 'ALL'>('ALL');

  const handleViewMachine = useCallback(
    (machineId: number) => {
      navigate(`/machines/${machineId}`);
    },
    [navigate]
  );

  const handleOpenReportModal = (machineId: number | 'ALL' = 'ALL') => {
    setSelectedMachineForReport(machineId);
    setReportModalOpen(true);
  };

  if (loading && machines.length === 0) {
    return (
      <div className="full-page-loading">
        <div className="loading-spinner" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Loading fleet telemetry…
        </div>
      </div>
    );
  }

  const isZero = metrics.totalMachines === 0;

  return (
    <>
      {/* Role Context Ribbon */}
      <div
        style={{
          background: 'rgba(77, 157, 224, 0.06)',
          border: '1px solid rgba(77, 157, 224, 0.18)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>👤</span>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentUser.name} • {currentUser.role}
            </span>
            <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>
              Operational Emphasis: <strong>{currentUser.focusArea}</strong>
            </div>
          </div>
        </div>

        <span
          className="demo-tag"
          style={{
            background: 'rgba(77, 157, 224, 0.12)',
            color: 'var(--color-primary)',
            borderColor: 'rgba(77, 157, 224, 0.3)',
            fontSize: '0.65rem',
            padding: '2px 8px',
          }}
        >
          DEMONSTRATION MODE
        </span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Fleet Overview</h1>
          <div className="page-header__subtitle">
            <strong>{metrics.totalMachines}</strong> physical assets monitored
            {lastUpdated && (
              <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                · Telemetry Polling: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="page-header__actions">
          <button
            className="btn btn--secondary"
            id="btn-refresh-fleet"
            onClick={() => refreshFleet()}
            title="Refresh fleet telemetry from backend"
          >
            ↻ Refresh
          </button>
          <button
            className="btn btn--primary"
            id="btn-generate-report"
            onClick={() => handleOpenReportModal('ALL')}
            style={{ fontWeight: 700, letterSpacing: '0.02em' }}
          >
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* ZERO MACHINE FALLBACK (REQUIREMENT 5) */}
      {isZero && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '28px 24px',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⚙</div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            NO MACHINES REGISTERED
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 18px' }}>
            No machine data is currently available in the backend repository. Fleet analytics and telemetry streams are paused.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              className="btn btn--primary"
              onClick={loadDemoFleet}
              id="btn-load-demo-fleet"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              + Load Demonstration Fleet
            </button>
            <button
              className="btn btn--secondary"
              onClick={refreshFleet}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              ↻ Refresh Backend
            </button>
          </div>
        </div>
      )}

      {/* Section A: Role-Aware Fleet Summary KPI Strip */}
      <FleetSummaryCards metrics={metrics} currentUser={currentUser} loading={loading} />

      {/* Section B: Fleet Health Overview */}
      <section className="section" id="section-fleet-health">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">◈</span>
            <span className="section-header__title">Fleet Health</span>
            <span className="section-header__badge">
              {metrics.averageHealth !== null ? `${metrics.averageHealth}% Avg` : 'N/A'}
            </span>
          </div>
        </div>
        <FleetHealthSection twinData={twinData} />
      </section>

      {/* Section C: Machine Status / Fleet Overview (Requirement 2 & 8) */}
      <section className="section" id="section-machine-table">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">⊞</span>
            <span className="section-header__title">Fleet Overview — Machine Status</span>
            <span className="section-header__badge">{metrics.totalMachines} machines</span>
          </div>
          <span
            className="section-header__action"
            onClick={() => navigate('/machines')}
            style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-primary)' }}
          >
            Manage Fleet Inventory →
          </span>
        </div>
        <MachineStatusTable
          twinData={twinData}
          onViewMachine={handleViewMachine}
          onLoadDemoFleet={loadDemoFleet}
        />
      </section>

      {/* Section D + E: Active Alerts + Predictive Maintenance (2-col) */}
      <div className="two-col-row" id="section-alerts-predictive">
        <section id="section-active-alerts">
          <div className="section-header">
            <div className="section-header__left">
              <span className="section-header__icon">⚠</span>
              <span className="section-header__title">Active Alerts</span>
              <span
                className="section-header__badge"
                style={{
                  background: metrics.activeAlertsCount > 0 ? 'var(--color-critical-bg)' : 'rgba(255,255,255,0.06)',
                  color: metrics.activeAlertsCount > 0 ? 'var(--color-critical)' : 'var(--text-muted)',
                  borderColor: metrics.activeAlertsCount > 0 ? 'var(--color-critical-border)' : 'var(--border-color)',
                }}
              >
                {metrics.activeAlertsCount}
              </span>
            </div>
            <span
              className="section-header__action"
              onClick={() => navigate('/alerts')}
              style={{ cursor: 'pointer' }}
            >
              View all
            </span>
          </div>
          <ActiveAlertsPanel twinData={twinData} onViewMachine={handleViewMachine} />
        </section>

        <section id="section-predictive-maintenance">
          <div className="section-header">
            <div className="section-header__left">
              <span className="section-header__icon">🔧</span>
              <span className="section-header__title">Predictive Maintenance</span>
              <span className="demo-tag">ML Prognostics</span>
            </div>
            <span
              className="section-header__action"
              onClick={() => navigate('/analytics')}
              style={{ cursor: 'pointer' }}
            >
              Reliability Analytics →
            </span>
          </div>
          <PredictiveMaintenanceSection twinData={twinData} onViewMachine={handleViewMachine} />
        </section>
      </div>

      {/* Section F: Recent Events */}
      <section className="section" id="section-recent-events">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">◷</span>
            <span className="section-header__title">Recent Events</span>
          </div>
        </div>
        <RecentEventsTimeline twinData={twinData} />
      </section>

      {/* Section G: Recent Reports History (Requirement 15) */}
      <RecentReportsSection />

      {/* Generate Report Modal Component */}
      <GenerateReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        defaultMachineId={selectedMachineForReport}
      />
    </>
  );
}
