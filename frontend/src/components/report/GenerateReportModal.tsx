/* ================================================================
   GenerateReportModal.tsx — Report Configuration & Generation Modal
   Phase 10.1: Interactive modal allowing operators/engineers to
   configure report type, machine scope, date ranges, and sections.
   Supports smooth state transition: Config -> Generating -> Ready.
   ================================================================ */

import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { useDemoUser } from '../../context/DemoUserContext';
import { reportService } from '../../services/reportService';
import { getRoleConfig } from '../../config/roleConfig';
import type { ReportConfig, ReportType, DateRangeOption, GeneratedReport } from '../../types/report';
import ReportViewerModal from './ReportViewerModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMachineId?: number | 'ALL';
}

type ModalState = 'CONFIG' | 'GENERATING' | 'READY' | 'ERROR';

export default function GenerateReportModal({ isOpen, onClose, defaultMachineId = 'ALL' }: Props) {
  const { machines, twinData, metrics } = useFleet();
  const { currentUser } = useDemoUser();
  const roleConfig = getRoleConfig(currentUser.id);

  const [modalState, setModalState] = useState<ModalState>('CONFIG');
  const [reportType, setReportType] = useState<ReportType>(() => roleConfig.allowedReports[0]?.reportType || 'FLEET_HEALTH');
  const [selectedMachine, setSelectedMachine] = useState<number | 'ALL'>(defaultMachineId);
  const [dateRange, setDateRange] = useState<DateRangeOption>('24h');

  // Section toggles
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeSensors, setIncludeSensors] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includePredictive, setIncludePredictive] = useState(true);
  const [includeMaintenance, setIncludeMaintenance] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);

  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleGenerate = () => {
    setModalState('GENERATING');
    setErrorMessage('');

    // Realistic synthesis delay
    setTimeout(() => {
      try {
        const config: ReportConfig = {
          reportType,
          machineId: selectedMachine,
          dateRange,
          includeOverview,
          includeSensors,
          includeTrends,
          includeAlerts,
          includePredictive,
          includeMaintenance,
          includeRecommendations,
        };

        const report = reportService.generateReport(config, currentUser, twinData, metrics);
        setGeneratedReport(report);
        setModalState('READY');
      } catch (err: any) {
        console.error('Report generation error:', err);
        setErrorMessage(err?.message || 'Unexpected error while synthesizing telemetry.');
        setModalState('ERROR');
      }
    }, 1200);
  };

  const handleDownload = () => {
    if (generatedReport) {
      reportService.downloadReportHtml(generatedReport);
    }
  };

  const handleReset = () => {
    setModalState('CONFIG');
    setGeneratedReport(null);
  };

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: 1050 }}>
        <div
          className="modal-content"
          style={{
            maxWidth: '640px',
            width: '92vw',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
                MACHINA-X PROGNOSTICS
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Generate Maintenance Report
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.3rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', maxHeight: '74vh', overflowY: 'auto' }}>
            {/* STATE: CONFIG */}
            {modalState === 'CONFIG' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* User Context Note */}
                <div
                  style={{
                    background: 'rgba(77, 157, 224, 0.06)',
                    border: '1px solid rgba(77, 157, 224, 0.2)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Report Author: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.name}</strong> ({currentUser.role})
                </div>

                {/* Field 1: Report Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Report Type
                  </label>
                  <select
                    className="sidebar__select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)' }}
                    id="select-report-type"
                  >
                    {roleConfig.allowedReports.map((r) => (
                      <option key={r.id} value={r.reportType}>
                        {r.icon} {r.name} — {r.description.slice(0, 48)}…
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Machine Scope */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Machine Asset Scope
                  </label>
                  <select
                    className="sidebar__select"
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)' }}
                  >
                    <option value="ALL">All Machines (Entire Fleet — {machines.length} Assets)</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.serialNumber}) — {m.location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 3: Date Range */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Date Range
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { id: '24h', label: 'Last 24 Hours' },
                      { id: '7d', label: 'Last 7 Days' },
                      { id: '30d', label: 'Last 30 Days' },
                      { id: 'custom', label: 'Custom Window' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDateRange(opt.id as DateRangeOption)}
                        style={{
                          padding: '8px 6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: dateRange === opt.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: dateRange === opt.id ? 'rgba(77, 157, 224, 0.14)' : 'var(--bg-primary)',
                          color: dateRange === opt.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 4: Include Sections */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Include Report Sections
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeOverview} onChange={(e) => setIncludeOverview(e.target.checked)} />
                      Machine Overview & Status
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeSensors} onChange={(e) => setIncludeSensors(e.target.checked)} />
                      Sensor Telemetry Summary
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeTrends} onChange={(e) => setIncludeTrends(e.target.checked)} />
                      Health & Degradation Trends
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeAlerts} onChange={(e) => setIncludeAlerts(e.target.checked)} />
                      Faults & Active Alerts
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includePredictive} onChange={(e) => setIncludePredictive(e.target.checked)} />
                      Predictive Maintenance & RUL
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeMaintenance} onChange={(e) => setIncludeMaintenance(e.target.checked)} />
                      Maintenance Work Order History
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={includeRecommendations} onChange={(e) => setIncludeRecommendations(e.target.checked)} />
                      Condition Recommendations
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STATE: GENERATING */}
            {modalState === 'GENERATING' && (
              <div style={{ padding: '36px 12px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  GENERATING REPORT...
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Synthesizing real-time sensor streams, ML remaining useful life predictions, and ISO 10816 condition tolerances...
                </div>
                <div style={{ marginTop: 20, width: '100%', background: 'var(--bg-secondary)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--color-primary)',
                      width: '78%',
                      animation: 'pulse 1.2s infinite',
                    }}
                  />
                </div>
              </div>
            )}

            {/* STATE: READY */}
            {modalState === 'READY' && generatedReport && (
              <div style={{ padding: '24px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', color: 'var(--color-healthy)', marginBottom: 8 }}>
                  ✓
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-healthy)', letterSpacing: '0.04em' }}>
                  REPORT READY
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 8, fontWeight: 700 }}>
                  {generatedReport.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Report ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{generatedReport.id}</span> • Scope: {generatedReport.machineName}
                </div>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    margin: '20px 0',
                    textAlign: 'left',
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>Author: <strong>{generatedReport.generatedBy.name}</strong> ({generatedReport.generatedBy.role})</div>
                  <div>Generated on: <strong>{generatedReport.generatedAt}</strong></div>
                  <div>Included Sections: Executive Summary, Machine Matrix, Sensor Telemetry, Recommendations</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button
                    className="btn btn--secondary"
                    onClick={() => setShowViewer(true)}
                    style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                  >
                    👁 VIEW REPORT
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={handleDownload}
                    style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                  >
                    ↓ DOWNLOAD REPORT
                  </button>
                </div>
              </div>
            )}

            {/* STATE: ERROR */}
            {modalState === 'ERROR' && (
              <div style={{ padding: '28px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', color: 'var(--color-critical)', marginBottom: 8 }}>
                  ✕
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-critical)', letterSpacing: '0.04em' }}>
                  REPORT GENERATION FAILED
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  {errorMessage || 'Unable to generate report due to telemetry retrieval timeout.'}
                </div>
                <button
                  className="btn btn--secondary"
                  onClick={handleReset}
                  style={{ marginTop: 20, padding: '8px 18px', fontSize: '0.8rem' }}
                >
                  ↻ Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {modalState === 'CONFIG' && (
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                background: 'var(--bg-secondary)',
              }}
            >
              <button className="btn btn--secondary" onClick={onClose} style={{ fontSize: '0.8rem' }}>
                CANCEL
              </button>
              <button className="btn btn--primary" onClick={handleGenerate} style={{ fontSize: '0.8rem' }}>
                GENERATE REPORT
              </button>
            </div>
          )}

          {modalState === 'READY' && (
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
              }}
            >
              <button className="btn btn--secondary" onClick={handleReset} style={{ fontSize: '0.76rem' }}>
                ← Configure Another Report
              </button>
              <button className="btn btn--secondary" onClick={onClose} style={{ fontSize: '0.76rem' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Document Viewer Modal */}
      {showViewer && generatedReport && (
        <ReportViewerModal
          report={generatedReport}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
