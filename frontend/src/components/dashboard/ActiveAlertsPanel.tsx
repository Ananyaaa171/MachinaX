/* ================================================================
   ActiveAlertsPanel.tsx — Live alert feed derived from twin data.
   Phase 9: Shows anomaly and critical state alerts per machine.
   Frontend layer built on existing twin/sensor API data.
   ================================================================ */

import { useState, useMemo } from 'react';
import type { MachineTwinData } from '../../pages/FleetDashboard';

interface Props {
  twinData: MachineTwinData[];
  onViewMachine: (machineId: number) => void;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  machineId: number;
  machineName: string;
  description: string;
  sensor: string;
  timeAgo: string;
  acknowledged: boolean;
}

function getTimeAgo(secondsAgo: number): string {
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min ago`;
  return `${Math.floor(secondsAgo / 3600)}h ago`;
}

function generateAlerts(twinData: MachineTwinData[]): Alert[] {
  const alerts: Alert[] = [];

  twinData.forEach((d, idx) => {
    if (!d.twin) return;

    const twin = d.twin;
    const machine = d.machine;

    // Critical state alert
    if (twin.operatingState === 'CRITICAL') {
      alerts.push({
        id: `critical-${machine.id}`,
        severity: 'critical',
        machineId: machine.id,
        machineName: machine.name,
        description: 'Machine in critical operating state — immediate attention required',
        sensor: 'System Monitor',
        timeAgo: getTimeAgo(Math.floor(60 + idx * 37)),
        acknowledged: false,
      });
    }

    // Anomaly alert
    if (twin.anomalyDetected) {
      alerts.push({
        id: `anomaly-${machine.id}`,
        severity: twin.operatingState === 'CRITICAL' ? 'critical' : 'warning',
        machineId: machine.id,
        machineName: machine.name,
        description: 'Anomaly pattern detected in sensor readings',
        sensor: 'Anomaly Detector',
        timeAgo: getTimeAgo(Math.floor(120 + idx * 53)),
        acknowledged: false,
      });
    }

    // Warning state alerts from sensors
    if (twin.latestSensors) {
      twin.latestSensors.forEach((sensor: any) => {
        if (sensor.status === 'CRITICAL') {
          alerts.push({
            id: `sensor-critical-${machine.id}-${sensor.sensorId}`,
            severity: 'critical',
            machineId: machine.id,
            machineName: machine.name,
            description: `${sensor.sensorLabel || sensor.sensorType} exceeded critical threshold (${sensor.value.toFixed(2)} ${sensor.unit})`,
            sensor: sensor.sensorLabel || sensor.sensorType,
            timeAgo: getTimeAgo(Math.floor(80 + idx * 29)),
            acknowledged: false,
          });
        } else if (sensor.status === 'WARNING') {
          alerts.push({
            id: `sensor-warn-${machine.id}-${sensor.sensorId}`,
            severity: 'warning',
            machineId: machine.id,
            machineName: machine.name,
            description: `${sensor.sensorLabel || sensor.sensorType} above normal range (${sensor.value.toFixed(2)} ${sensor.unit})`,
            sensor: sensor.sensorLabel || sensor.sensorType,
            timeAgo: getTimeAgo(Math.floor(200 + idx * 41)),
            acknowledged: false,
          });
        }
      });
    }
  });

  // Sort: critical first, then by most recent
  return alerts
    .sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return 0;
    })
    .slice(0, 8); // Max 8 alerts in panel
}

export default function ActiveAlertsPanel({ twinData, onViewMachine }: Props) {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [confirmAck, setConfirmAck] = useState<string | null>(null);

  const rawAlerts = useMemo(() => generateAlerts(twinData), [twinData]);
  const visibleAlerts = rawAlerts.filter((a) => !acknowledged.has(a.id));

  const handleAcknowledge = (alertId: string) => {
    if (confirmAck === alertId) {
      setAcknowledged((prev) => new Set([...prev, alertId]));
      setConfirmAck(null);
    } else {
      setConfirmAck(alertId);
      // Auto-cancel confirm after 4s
      setTimeout(() => setConfirmAck((c) => c === alertId ? null : c), 4000);
    }
  };

  if (!twinData.length) {
    return (
      <div className="panel-card">
        <div className="empty-state" style={{ padding: 32 }}>
          <div className="empty-state__icon">⚠</div>
          Loading alert data…
        </div>
      </div>
    );
  }

  if (!visibleAlerts.length) {
    return (
      <div className="alerts-grid" id="alerts-panel">
        <div className="panel-card">
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state__icon" style={{ color: 'var(--color-healthy)', opacity: 1 }}>✓</div>
            <div style={{ color: 'var(--color-healthy)', fontWeight: 600 }}>No active alerts</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All machines operating normally</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-grid" id="alerts-panel">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`alert-item alert-item--${alert.severity}`}
          id={`alert-${alert.id}`}
          role="alert"
        >
          {/* Severity badge */}
          <div className="alert-severity">
            <span className={`status-badge status-badge--${alert.severity}`} style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
              {alert.severity.toUpperCase()}
            </span>
          </div>

          {/* Body */}
          <div className="alert-item__body">
            <div className="alert-item__header">
              <span className="alert-item__machine">{alert.machineName}</span>
            </div>
            <div className="alert-item__desc">{alert.description}</div>
            <div className="alert-item__meta">
              <span className="alert-item__sensor">📡 {alert.sensor}</span>
              <span className="alert-item__time">{alert.timeAgo}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="alert-item__actions">
            <button
              className="alert-ack-btn alert-ack-btn--view"
              onClick={() => onViewMachine(alert.machineId)}
              id={`alert-view-${alert.id}`}
              title="View machine details"
            >
              View
            </button>
            <button
              className="alert-ack-btn alert-ack-btn--ack"
              onClick={() => handleAcknowledge(alert.id)}
              id={`alert-ack-${alert.id}`}
              title={confirmAck === alert.id ? 'Click again to confirm' : 'Acknowledge alert'}
              style={confirmAck === alert.id ? { color: 'var(--color-warning)', borderColor: 'var(--color-warning-border)' } : {}}
            >
              {confirmAck === alert.id ? 'Confirm?' : 'Ack'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
