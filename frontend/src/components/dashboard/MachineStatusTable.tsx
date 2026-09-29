/* ================================================================
   MachineStatusTable.tsx — Professional machine status data table.
   Phase 10.1: Columns: Machine, State, Health, Temperature,
   Vibration, RPM, Load, Risk, Fault, Action (View Twin).
   Derives all values from real API data where available.
   ================================================================ */

import React, { useState } from 'react';
import type { MachineTwinData } from '../../context/FleetContext';

interface Props {
  twinData: MachineTwinData[];
  onViewMachine: (machineId: number) => void;
  onLoadDemoFleet?: () => void;
}

type FilterType = 'all' | 'healthy' | 'warning' | 'critical';

function getStatusClass(state: string | null | undefined): string {
  switch (state?.toUpperCase()) {
    case 'NORMAL': return 'running';
    case 'WATCH': return 'warning';
    case 'WARNING': return 'warning';
    case 'CRITICAL': return 'critical';
    default: return 'unknown';
  }
}

function getStatusLabel(state: string | null | undefined, machineStatus: string): string {
  if (machineStatus === 'MAINTENANCE') return 'MAINTENANCE';
  if (machineStatus === 'INACTIVE' || machineStatus === 'DECOMMISSIONED') return 'OFFLINE';
  switch (state?.toUpperCase()) {
    case 'NORMAL': return 'RUNNING';
    case 'WATCH': return 'WARNING';
    case 'WARNING': return 'WARNING';
    case 'CRITICAL': return 'CRITICAL';
    default: return 'UNKNOWN';
  }
}

function getHealthColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#4a5568';
  if (score >= 80) return 'var(--color-healthy)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-critical)';
}

function getRisk(score: number | null | undefined, anomaly: boolean | null, opState: string | null | undefined): string {
  if (opState === 'CRITICAL' || anomaly || (score !== null && score !== undefined && score < 60)) return 'high';
  if (opState === 'WARNING' || opState === 'WATCH' || (score !== null && score !== undefined && score < 80)) return 'medium';
  return 'low';
}

function getSensorValue(
  twin: MachineTwinData['twin'],
  typeKeywords: string[]
): { value: number | null; unit: string } {
  if (!twin?.latestSensors) return { value: null, unit: '' };
  const sensor = twin.latestSensors.find((s) =>
    typeKeywords.some((kw) =>
      s.sensorType?.toLowerCase().includes(kw) ||
      s.sensorLabel?.toLowerCase().includes(kw)
    )
  );
  if (!sensor) return { value: null, unit: '' };
  return { value: sensor.value, unit: sensor.unit };
}

export default function MachineStatusTable({ twinData, onViewMachine, onLoadDemoFleet }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = twinData.filter((d) => {
    if (filter === 'all') return true;
    const state = d.twin?.operatingState?.toUpperCase() ?? '';
    if (filter === 'healthy') return state === 'NORMAL';
    if (filter === 'warning') return ['WATCH', 'WARNING'].includes(state);
    if (filter === 'critical') return state === 'CRITICAL';
    return true;
  });

  if (!twinData.length) {
    return (
      <div className="machine-table-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚙</div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          NO MACHINES REGISTERED
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 16px' }}>
          No machine data is currently available in the system.
        </div>
        {onLoadDemoFleet && (
          <button className="btn btn--primary" onClick={onLoadDemoFleet} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            + Load Demonstration Fleet
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="machine-table-card" id="machine-status-table">
      {/* Table header with filters */}
      <div className="machine-table-header">
        <div className="machine-table-filters">
          {(['all', 'healthy', 'warning', 'critical'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? `active active--${f}` : ''}`}
              onClick={() => setFilter(f)}
              id={`filter-${f}`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' ? ` (${twinData.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="machine-table-wrap">
        <table className="machine-table" role="grid" aria-label="Machine status table">
          <thead>
            <tr>
              <th>Machine</th>
              <th>Type</th>
              <th>State</th>
              <th>Health</th>
              <th>Temperature</th>
              <th>Vibration</th>
              <th>RPM</th>
              <th>Load</th>
              <th>Risk</th>
              <th>Fault</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ machine, twin, ml }) => {
              const opState = twin?.operatingState;
              const statusClass = getStatusClass(opState);
              const statusLabel = getStatusLabel(opState, machine.status);
              const health = twin?.healthScore ?? null;
              const healthColor = getHealthColor(health);
              const risk = getRisk(health, twin?.anomalyDetected ?? null, opState);

              // Extract sensor values
              const temp = getSensorValue(twin, ['temperature', 'temp', 'thermal', 'winding']);
              const vibration = getSensorValue(twin, ['vibration', 'vibr', 'vib']);
              const current = getSensorValue(twin, ['current', 'curr', 'amp']);
              const rpm = getSensorValue(twin, ['rpm', 'speed', 'rotor']);

              // Calculate Load percentage
              const ratedA = machine.ratedCurrentA || 28;
              const loadVal = current.value !== null
                ? Math.min(100, Math.round((current.value / ratedA) * 100))
                : null;

              // Fault type display
              const faultLabel =
                twin?.currentFaultType && twin.currentFaultType !== 'NONE'
                  ? twin.currentFaultType.replace(/_/g, ' ')
                  : ml?.faultType && ml.faultType !== 'NONE'
                  ? ml.faultType.replace(/_/g, ' ')
                  : 'NONE';

              return (
                <tr
                  key={machine.id}
                  id={`machine-row-${machine.id}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onViewMachine(machine.id)}
                  title={`Click to view Digital Twin for ${machine.name}`}
                >
                  {/* Machine name & ID */}
                  <td>
                    <div className="machine-name-cell">
                      <span className="machine-name-cell__name">{machine.name}</span>
                      <span className="machine-name-cell__id">
                        {machine.serialNumber} • {machine.location}
                      </span>
                    </div>
                  </td>

                  {/* Machine Type */}
                  <td>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {machine.machineType?.name || '3-Phase Induction Motor'}
                    </span>
                  </td>

                  {/* State */}
                  <td>
                    <span className={`status-badge status-badge--${statusClass}`}>
                      ● {statusLabel}
                    </span>
                  </td>

                  {/* Health */}
                  <td>
                    {health !== null ? (
                      <div className="health-bar-cell">
                        <div className="health-bar-cell__bar">
                          <div
                            className="health-bar-cell__fill"
                            style={{ width: `${Math.min(100, health)}%`, background: healthColor }}
                          />
                        </div>
                        <span className="health-bar-cell__text" style={{ color: healthColor }}>
                          {health.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>

                  {/* Temperature */}
                  <td>
                    <span className="sensor-val" style={{ color: 'var(--text-primary)' }}>
                      {temp.value !== null
                        ? `${temp.value.toFixed(1)} ${temp.unit || '°C'}`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>

                  {/* Vibration */}
                  <td>
                    <span className="sensor-val" style={{ color: 'var(--text-primary)' }}>
                      {vibration.value !== null
                        ? `${vibration.value.toFixed(2)} ${vibration.unit || 'mm/s'}`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>

                  {/* RPM */}
                  <td>
                    <span className="sensor-val" style={{ color: 'var(--text-primary)' }}>
                      {rpm.value !== null
                        ? `${Math.round(rpm.value)} RPM`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>

                  {/* Load */}
                  <td>
                    <span className="sensor-val" style={{ color: 'var(--text-primary)' }}>
                      {loadVal !== null
                        ? `${loadVal}%`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>

                  {/* Risk */}
                  <td>
                    <span className={`risk-badge risk-badge--${risk}`}>
                      {risk.toUpperCase()}
                    </span>
                  </td>

                  {/* Fault */}
                  <td>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: faultLabel !== 'NONE' ? 700 : 500,
                        color: faultLabel !== 'NONE' ? 'var(--color-critical)' : 'var(--text-muted)',
                      }}
                    >
                      {faultLabel}
                    </span>
                  </td>

                  {/* Action */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="table-action-btn"
                      onClick={() => onViewMachine(machine.id)}
                      id={`btn-view-twin-${machine.id}`}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(77, 157, 224, 0.12)',
                        border: '1px solid rgba(77, 157, 224, 0.35)',
                        color: 'var(--color-primary)',
                        borderRadius: 4,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View Twin →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
