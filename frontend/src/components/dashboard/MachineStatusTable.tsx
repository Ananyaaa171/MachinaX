/* ================================================================
   MachineStatusTable.tsx — Professional machine status data table.
   Phase 9: Columns: Machine, Status, Health, Temp, Vibration,
   Load, Anomaly, Risk, Last Maintenance, Action.
   Derives all values from real API data where available.
   ================================================================ */

import { useState } from 'react';
import type { MachineTwinData } from '../../pages/FleetDashboard';
import { formatDateTime } from '../../utils/format';

interface Props {
  twinData: MachineTwinData[];
  onViewMachine: (machineId: number) => void;
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

function getRisk(score: number | null | undefined, anomaly: boolean | null): string {
  if (anomaly) return 'high';
  if (score === null || score === undefined) return 'medium';
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  return 'high';
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

export default function MachineStatusTable({ twinData, onViewMachine }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirming, setConfirming] = useState<number | null>(null);

  const filtered = twinData.filter((d) => {
    if (filter === 'all') return true;
    const state = d.twin?.operatingState?.toUpperCase() ?? '';
    if (filter === 'healthy') return state === 'NORMAL';
    if (filter === 'warning') return ['WATCH', 'WARNING'].includes(state);
    if (filter === 'critical') return state === 'CRITICAL';
    return true;
  });

  const handleView = (id: number) => {
    onViewMachine(id);
  };

  if (!twinData.length) {
    return (
      <div className="machine-table-card">
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state__icon">⚙</div>
          <div>No machines found. Check backend connection.</div>
        </div>
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
              <th>Status</th>
              <th>Health</th>
              <th>Temperature</th>
              <th>Vibration</th>
              <th>Load</th>
              <th>Anomaly</th>
              <th>Risk</th>
              <th>Last Maintenance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ machine, twin }) => {
              const statusClass = getStatusClass(twin?.operatingState);
              const statusLabel = getStatusLabel(twin?.operatingState, machine.status);
              const health = twin?.healthScore ?? null;
              const healthColor = getHealthColor(health);
              const risk = getRisk(health, twin?.anomalyDetected ?? null);
              const anomaly = twin?.anomalyDetected;

              // Extract sensor values
              const temp = getSensorValue(twin, ['temperature', 'temp', 'thermal']);
              const vibration = getSensorValue(twin, ['vibration', 'vibr', 'vib', 'acceleration']);
              const load = getSensorValue(twin, ['load', 'current', 'power', 'torque']);

              return (
                <tr
                  key={machine.id}
                  id={`machine-row-${machine.id}`}
                  onClick={() => handleView(machine.id)}
                  title={`View ${machine.name} details`}
                >
                  {/* Machine name */}
                  <td>
                    <div className="machine-name-cell">
                      <span className="machine-name-cell__name">{machine.name}</span>
                      <span className="machine-name-cell__id">{machine.serialNumber}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`status-badge status-badge--${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>

                  {/* Health */}
                  <td>
                    {health !== null ? (
                      <div className="health-bar-cell">
                        <div className="health-bar-cell__bar">
                          <div
                            className="health-bar-cell__fill"
                            style={{ width: `${health}%`, background: healthColor }}
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

                  {/* Load / Current */}
                  <td>
                    <span className="sensor-val" style={{ color: 'var(--text-primary)' }}>
                      {load.value !== null
                        ? `${load.value.toFixed(1)} ${load.unit || 'A'}`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>

                  {/* Anomaly */}
                  <td>
                    {anomaly !== null && anomaly !== undefined ? (
                      <span
                        className={`status-badge status-badge--${anomaly ? 'critical' : 'running'}`}
                        style={{ fontSize: '0.62rem' }}
                      >
                        {anomaly ? '✕ Detected' : '✓ Normal'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>

                  {/* Risk */}
                  <td>
                    <span className={`risk-badge risk-badge--${risk}`}>
                      {risk.toUpperCase()}
                    </span>
                  </td>

                  {/* Last Maintenance */}
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {machine.installationDate
                        ? formatDateTime(machine.installationDate)
                        : '—'}
                    </span>
                  </td>

                  {/* Action */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="table-action-btn"
                      onClick={() => handleView(machine.id)}
                      id={`btn-view-${machine.id}`}
                      title={`View details for ${machine.name}`}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state__icon">⊘</div>
            No machines match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
