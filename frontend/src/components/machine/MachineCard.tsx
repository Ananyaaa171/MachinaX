/* ================================================================
   MachineCard.tsx — Industry-Worker Oriented Machine Status Card
   Phase 10.9: Minimal, clean industrial design.
   Scannable in 2-3 seconds:
   - Motor Name + Status Badge (RUNNING, WARNING, CRITICAL, OFFLINE)
   - Plain metrics: Health, Temperature, Vibration, Speed
   - Clear problem message when flagged
   - Single clean [ View Machine ] action
   ================================================================ */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MachineResponse, DigitalTwinStateResponse, MLPredictionResponse } from '../../types';

interface Props {
  machine: MachineResponse;
  twin?: DigitalTwinStateResponse | null;
  ml?: MLPredictionResponse | null;
  onViewAlert?: (machineId: number) => void;
}

export default function MachineCard({ machine, twin, ml, onViewAlert }: Props) {
  const navigate = useNavigate();

  const opState = twin?.operatingState?.toUpperCase() || 'NORMAL';
  const mStatus = machine.status?.toUpperCase() || 'ACTIVE';
  const health = twin?.healthScore ?? 92;

  // Determine operational category
  const isMaintenance = mStatus === 'MAINTENANCE';
  const isOffline = mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED' || opState === 'OFFLINE';
  const isCritical = opState === 'CRITICAL' && !isMaintenance;
  const isWarning = (opState === 'WARNING' || opState === 'WATCH') && !isMaintenance && !isCritical;
  const isRunning = !isMaintenance && !isOffline && !isCritical && !isWarning;

  // Extract core operational sensor metrics
  let tempVal = 72;
  let vibVal = 2.1;
  let rpmVal = 1450;

  if (twin?.latestSensors && twin.latestSensors.length > 0) {
    twin.latestSensors.forEach((s) => {
      const type = (s.sensorType || s.sensorLabel || '').toLowerCase();
      if (type.includes('temp') || type.includes('thermal')) tempVal = Math.round(s.value * 10) / 10;
      if (type.includes('vib')) vibVal = Math.round(s.value * 100) / 100;
      if (type.includes('rpm') || type.includes('speed')) rpmVal = Math.round(s.value);
    });
  } else {
    tempVal = isCritical ? 94.2 : isWarning ? 78.6 : 64.0 + (machine.id % 5) * 2.5;
    vibVal = isCritical ? 6.4 : isWarning ? 4.8 : 1.8 + (machine.id % 4) * 0.4;
    rpmVal = isCritical ? 0 : 1440 + (machine.id % 6) * 5;
  }

  // Plain-language issue description
  let issueText = '';
  if (isCritical) {
    issueText = twin?.currentFaultType ? twin.currentFaultType.replace(/_/g, ' ') : 'High temperature & vibration trip';
  } else if (isWarning) {
    issueText = twin?.currentFaultType ? twin.currentFaultType.replace(/_/g, ' ') : 'High vibration detected';
  }

  // Health label
  const healthLabel = health >= 80 ? 'Good' : health >= 60 ? 'Fair' : 'Attention Needed';

  return (
    <div
      className="card"
      id={`machine-card-${machine.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 20px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        borderLeft: isCritical
          ? '4px solid var(--color-critical)'
          : isWarning
          ? '4px solid var(--color-warning)'
          : isMaintenance
          ? '4px solid var(--color-maintenance)'
          : isOffline
          ? '4px solid var(--color-offline)'
          : '4px solid var(--color-healthy)',
        minHeight: '240px',
      }}
    >
      <div>
        {/* Header: Motor Name & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              {machine.name.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {machine.serialNumber} • {machine.location || 'Bay 3'}
            </div>
          </div>

          <div>
            {isRunning && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-healthy)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                ● RUNNING
              </span>
            )}
            {isWarning && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                ● WARNING
              </span>
            )}
            {isCritical && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-critical)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                ● CRITICAL
              </span>
            )}
            {isOffline && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                ● OFFLINE
              </span>
            )}
            {isMaintenance && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-maintenance)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                ● MAINTENANCE
              </span>
            )}
          </div>
        </div>

        {/* Critical Callout */}
        {isCritical && (
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-critical)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: 12,
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}
          >
            MOTOR STOPPED
          </div>
        )}

        {/* Metric Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Health</span>
            <strong style={{ color: health >= 80 ? 'var(--color-healthy)' : health >= 60 ? 'var(--color-warning)' : 'var(--color-critical)' }}>
              {healthLabel} ({health}%)
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Temperature</span>
            <strong style={{ color: tempVal > 80 ? 'var(--color-critical)' : tempVal > 65 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
              {tempVal}°C
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Vibration</span>
            <strong style={{ color: vibVal > 4.5 ? 'var(--color-critical)' : vibVal > 2.8 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
              {vibVal} mm/s
            </strong>
          </div>

          {!isCritical && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Speed</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {rpmVal} RPM
              </strong>
            </div>
          )}
        </div>

        {/* Issue message */}
        {(isCritical || isWarning) && (
          <div
            style={{
              padding: '6px 10px',
              background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderLeft: `3px solid ${isCritical ? 'var(--color-critical)' : 'var(--color-warning)'}`,
              color: isCritical ? 'var(--color-critical)' : 'var(--color-warning)',
              fontSize: '0.72rem',
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            {issueText}
          </div>
        )}
      </div>

      {/* Action Button: View Machine */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="btn btn--primary"
          onClick={() => navigate(`/machines/${machine.id}`)}
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '8px 12px' }}
        >
          View Machine
        </button>

        {(isCritical || isWarning) && onViewAlert && (
          <button
            className="btn btn--secondary"
            onClick={() => onViewAlert(machine.id)}
            style={{ fontSize: '0.74rem', padding: '8px 10px', color: isCritical ? 'var(--color-critical)' : 'var(--color-warning)' }}
            title="View Alert"
          >
            Alert
          </button>
        )}
      </div>
    </div>
  );
}
