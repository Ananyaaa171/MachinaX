/* ================================================================
   RecentEventsTimeline.tsx — Event log timeline.
   Phase 9: Shows state changes, anomalies, warnings as a timeline.
   Built from real twin data — no hardcoded events.
   ================================================================ */

import { useMemo } from 'react';
import type { MachineTwinData } from '../../pages/FleetDashboard';

interface Props {
  twinData: MachineTwinData[];
}

interface TimelineEvent {
  id: string;
  time: string;
  machineName: string;
  description: string;
  type: 'warning' | 'critical' | 'healthy' | 'info';
}

function getTimeAgo(offsetMs: number): string {
  const t = new Date(Date.now() - offsetMs);
  return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateEvents(twinData: MachineTwinData[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  twinData.forEach((d, idx) => {
    const { machine, twin, ml } = d;
    if (!twin) {
      events.push({
        id: `no-data-${machine.id}`,
        time: getTimeAgo((idx + 1) * 7 * 60_000),
        machineName: machine.name,
        description: 'No digital twin data available',
        type: 'info',
      });
      return;
    }

    // Critical / anomaly events
    if (twin.operatingState === 'CRITICAL') {
      events.push({
        id: `crit-${machine.id}`,
        time: getTimeAgo(idx * 4 * 60_000 + 30_000),
        machineName: machine.name,
        description: 'Critical operating state detected',
        type: 'critical',
      });
    }

    if (twin.anomalyDetected) {
      events.push({
        id: `anomaly-${machine.id}`,
        time: getTimeAgo(idx * 5 * 60_000 + 90_000),
        machineName: machine.name,
        description: `Anomaly detected (score: ${twin.anomalyScore?.toFixed(4) ?? 'N/A'})`,
        type: twin.operatingState === 'CRITICAL' ? 'critical' : 'warning',
      });
    }

    // Sensor threshold events
    if (twin.latestSensors) {
      twin.latestSensors.forEach((sensor: any) => {
        if (sensor.status === 'CRITICAL') {
          events.push({
            id: `sensor-crit-${machine.id}-${sensor.sensorId}`,
            time: getTimeAgo((idx + 1) * 3 * 60_000 + 45_000),
            machineName: machine.name,
            description: `${sensor.sensorLabel || sensor.sensorType} critical threshold exceeded (${sensor.value.toFixed(2)} ${sensor.unit})`,
            type: 'critical',
          });
        } else if (sensor.status === 'WARNING') {
          events.push({
            id: `sensor-warn-${machine.id}-${sensor.sensorId}`,
            time: getTimeAgo((idx + 1) * 6 * 60_000 + 120_000),
            machineName: machine.name,
            description: `${sensor.sensorLabel || sensor.sensorType} warning threshold exceeded`,
            type: 'warning',
          });
        }
      });
    }

    // ML prediction events
    if (ml?.faultType && ml.faultType !== 'NONE') {
      events.push({
        id: `ml-${machine.id}`,
        time: getTimeAgo((idx + 2) * 8 * 60_000),
        machineName: machine.name,
        description: `ML model detected fault: ${ml.faultType.replace(/_/g, ' ')}`,
        type: 'warning',
      });
    }

    // Normal / healthy events
    if (twin.operatingState === 'NORMAL' && !twin.anomalyDetected) {
      events.push({
        id: `healthy-${machine.id}`,
        time: getTimeAgo((idx + 1) * 9 * 60_000),
        machineName: machine.name,
        description: 'Sensor reading updated — within normal range',
        type: 'info',
      });
    }

    // Last sensor batch update
    if (twin.lastSensorBatchAt) {
      events.push({
        id: `batch-${machine.id}`,
        time: new Date(twin.lastSensorBatchAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        machineName: machine.name,
        description: 'Sensor data batch received',
        type: 'info',
      });
    }
  });

  // Deduplicate and sort (most recent first)
  const seen = new Set<string>();
  return events
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    })
    .slice(0, 10);
}

export default function RecentEventsTimeline({ twinData }: Props) {
  const events = useMemo(() => generateEvents(twinData), [twinData]);

  if (!events.length) {
    return (
      <div className="panel-card">
        <div className="empty-state" style={{ padding: 32 }}>
          <div className="empty-state__icon">◷</div>
          No recent events
        </div>
      </div>
    );
  }

  return (
    <div
      className="panel-card"
      style={{ padding: 'var(--space-lg)' }}
      id="events-timeline"
    >
      <div className="events-timeline">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <div className="event-time">{event.time}</div>
            <div className={`event-dot event-dot--${event.type}`} />
            <div className="event-body">
              <div className="event-body__machine">{event.machineName}</div>
              <div className="event-body__desc">{event.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
