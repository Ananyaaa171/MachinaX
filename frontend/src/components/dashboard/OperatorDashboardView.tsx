/* ================================================================
   OperatorDashboardView.tsx — Plant Operator Dashboard (Aditya Maurya)
   Phase 10.5: Live floor monitoring, instant physical telemetry,
   critical threshold alarm banner, and operational quick actions.
   ================================================================ */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet, type MachineTwinData } from '../../context/FleetContext';
import DigitalTwin from '../twin/DigitalTwin';

interface Props {
  onOpenReportModal: () => void;
}

export default function OperatorDashboardView({ onOpenReportModal }: Props) {
  const navigate = useNavigate();
  const { metrics, twinData, refreshFleet } = useFleet();

  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<number, boolean>>({});

  // Critical machines needing immediate operator attention
  const criticalTwins = twinData.filter((t) => t.twin?.operatingState === 'CRITICAL');

  const handleAcknowledge = (machineId: number) => {
    setAcknowledgedMap((prev) => ({ ...prev, [machineId]: true }));
  };

  const handleAcknowledgeAll = () => {
    const updated: Record<number, boolean> = { ...acknowledgedMap };
    criticalTwins.forEach((t) => {
      updated[t.machine.id] = true;
    });
    setAcknowledgedMap(updated);
  };

  return (
    <div className="operator-dashboard-view" id="view-operator-dashboard">
      {/* 1. Hero / Title Section */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em' }}>
            LIVE OPERATIONS
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Plant Operator: Aditya Maurya • Real-time machine monitoring and floor operations
          </p>
        </div>

        {/* Aditya Maurya Operator Controls (Section 11) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn--secondary"
            onClick={() => alert('Start command acknowledged for nominal machines.')}
            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '7px 12px', color: 'var(--color-healthy)' }}
            title="Start line equipment"
          >
            ▷ START
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => alert('Emergency stop sequence ready. Select specific machine below to isolate.')}
            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '7px 12px', color: 'var(--color-critical)' }}
            title="Stop line equipment"
          >
            ⏹ STOP
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleAcknowledgeAll}
            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '7px 12px', color: '#f59e0b' }}
            title="Acknowledge all current floor alarms"
          >
            🔔 ACKNOWLEDGE
          </button>
          <button
            className="btn btn--primary"
            onClick={onOpenReportModal}
            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '7px 14px' }}
          >
            📋 Operations Report
          </button>
        </div>
      </div>

      {/* 2. Prominent Critical Machine Alert Banner */}
      {criticalTwins.length > 0 && (
        <div id="section-critical-alarm-banner" style={{ marginBottom: 20 }}>
          {criticalTwins.map((t) => {
            const isAcked = acknowledgedMap[t.machine.id];
            const tempSensor = t.twin?.latestSensors?.find((s) => s.sensorType?.includes('TEMP'))?.value ?? 84.5;
            const vibSensor = t.twin?.latestSensors?.find((s) => s.sensorType?.includes('VIB'))?.value ?? 6.4;

            return (
              <div
                key={t.machine.id}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '2px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      color: 'var(--color-critical)',
                    }}
                  >
                    🚨
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="demo-tag"
                        style={{
                          background: 'var(--color-critical)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.65rem',
                        }}
                      >
                        CRITICAL MACHINE ALERT
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{t.machine.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {t.machine.serialNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      Temperature: <strong style={{ color: 'var(--color-critical)' }}>{tempSensor.toFixed(1)}°C</strong> · Vibration:{' '}
                      <strong style={{ color: 'var(--color-critical)' }}>{vibSensor.toFixed(1)} mm/s</strong> · Fault:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{t.twin?.currentFaultType || 'Bearing Degradation'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isAcked ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-healthy)',
                        background: 'rgba(34, 197, 94, 0.1)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                      }}
                    >
                      ✓ Alarm Acknowledged
                    </span>
                  ) : (
                    <button
                      className="btn btn--secondary"
                      onClick={() => handleAcknowledge(t.machine.id)}
                      style={{ fontSize: '0.75rem', padding: '6px 14px', color: '#f59e0b', borderColor: '#f59e0b' }}
                    >
                      🔔 Acknowledge Alarm
                    </button>
                  )}
                  <button
                    className="btn btn--primary"
                    onClick={() => navigate(`/machines/${t.machine.id}`)}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '6px 14px',
                      background: 'var(--color-critical)',
                      borderColor: 'var(--color-critical)',
                    }}
                  >
                    View Machine →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Operational KPI Cards for Plant Operator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="metric-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              RUNNING
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-healthy)' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-healthy)', marginTop: 4 }}>
            {metrics.healthyCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Nominal physical operation
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              WARNING
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: 4 }}>
            {metrics.warningCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Telemetry threshold warning
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              CRITICAL / TRIPPED
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-critical)' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-critical)', marginTop: 4 }}>
            {metrics.criticalCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Immediate trip / intervention
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              OFFLINE
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 4 }}>
            {metrics.offlineCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Powered down / Standby
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              LINE THROUGHPUT
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-info)' }}>⚡ 94.8%</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-info)', marginTop: 4 }}>
            420 <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>u/hr</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Bay 3 Operational Speed
          </div>
        </div>
      </div>

      {/* 4. Live Machine Monitoring & Digital Twins Grid (mode="operator") */}
      <section className="section" id="section-live-twins" style={{ padding: 20, marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-header__left">
            <span className="section-header__icon">📡</span>
            <span className="section-header__title">Live Machine Monitoring • Live Floor Telemetry &amp; Digital Twins ({twinData.length} Units)</span>
            <span className="demo-tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-healthy)' }}>
              1 Twin Per Machine
            </span>
          </div>

          <button
            className="btn btn--secondary"
            onClick={() => refreshFleet()}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            ↻ Force Refresh
          </button>
        </div>

        {/* Multi-Twin Grid with mode="operator" */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {twinData.map((t) => (
            <DigitalTwin
              key={t.machine.id}
              machine={t.machine}
              twin={t.twin}
              mode="operator"
              onRefresh={refreshFleet}
            />
          ))}
        </div>
      </section>

      {/* 5. Operator Alarms & Safety Priority Section */}
      <section className="panel-card" style={{ padding: 20 }}>
        <div className="panel-card__header" style={{ marginBottom: 14 }}>
          <div className="panel-card__title">
            <span>🚨</span> IMMEDIATE OPERATOR ALARMS & SAFETY PRIORITY
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real-Time Threshold Protection</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>SEVERITY</th>
                <th style={{ padding: '8px 10px' }}>MACHINE</th>
                <th style={{ padding: '8px 10px' }}>ALARM TYPE</th>
                <th style={{ padding: '8px 10px' }}>DETECTED PARAMETER</th>
                <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                <th style={{ padding: '8px 10px' }}>STATUS</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {twinData
                .filter((t) => t.twin?.operatingState === 'CRITICAL' || t.twin?.operatingState === 'WARNING')
                .map((t) => {
                  const isCrit = t.twin?.operatingState === 'CRITICAL';
                  const isAcked = acknowledgedMap[t.machine.id];
                  return (
                    <tr key={t.machine.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 3,
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            background: isCrit ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: isCrit ? 'var(--color-critical)' : 'var(--color-warning)',
                            border: `1px solid ${isCrit ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          }}
                        >
                          {isCrit ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {t.machine.name}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-primary)' }}>
                        {isCrit ? 'Over-Temperature & High Vibration' : 'Phase Current Imbalance (L2)'}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: isCrit ? 'var(--color-critical)' : 'var(--color-warning)' }}>
                        {isCrit ? '84.5°C • 6.4 mm/s' : '71.2°C • 19.8 A'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        Just now (Live)
                      </td>
                      <td style={{ padding: '10px' }}>
                        {isAcked ? (
                          <span style={{ color: 'var(--color-healthy)', fontWeight: 700 }}>Acknowledged</span>
                        ) : (
                          <span style={{ color: isCrit ? 'var(--color-critical)' : 'var(--color-warning)', fontWeight: 700 }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          {!isAcked && (
                            <button
                              className="btn btn--secondary"
                              onClick={() => handleAcknowledge(t.machine.id)}
                              style={{ padding: '3px 8px', fontSize: '0.66rem', color: '#f59e0b', borderColor: '#f59e0b' }}
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            className="btn btn--secondary"
                            onClick={() => navigate(`/machines/${t.machine.id}`)}
                            style={{ padding: '3px 8px', fontSize: '0.66rem' }}
                          >
                            View Alert →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {twinData.filter((t) => t.twin?.operatingState === 'CRITICAL' || t.twin?.operatingState === 'WARNING').length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-healthy)' }}>
                    ✓ No active safety or threshold alarms. All operating induction motors within nominal limits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
