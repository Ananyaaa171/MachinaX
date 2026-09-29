/* ================================================================
   SensorCards — Dynamic sensor value cards from backend.
   Does NOT hardcode exactly four sensors.
   ================================================================ */

import type { LatestSensorValueDto } from '../types';
import { formatNumber, formatTimestamp, sensorStatusClass } from '../utils/format';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface Props {
  sensors: LatestSensorValueDto[] | undefined;
  loading: boolean;
}

export default function SensorCards({ sensors, loading }: Props) {
  if (loading) return <LoadingState message="Loading sensor data…" />;
  if (!sensors || sensors.length === 0) {
    return <EmptyState icon="📡" message="No sensor data available yet" />;
  }

  return (
    <div className="dashboard-grid__row--sensors" id="sensor-cards">
      {sensors.map((sensor) => {
        const statusClass = sensorStatusClass(sensor.status);
        return (
          <div
            key={sensor.sensorId}
            className={`card card--elevated sensor-card sensor-card--${statusClass}`}
            id={`sensor-card-${sensor.sensorId}`}
          >
            <div className="card__title">{sensor.sensorLabel || sensor.sensorType}</div>
            <div className="card__value" style={{ marginTop: '8px' }}>
              {formatNumber(sensor.value)}
              <span className="card__unit">{sensor.unit}</span>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={`status-badge status-badge--${statusClass}`}>
                {sensor.status || 'UNKNOWN'}
              </span>
            </div>
            <div className="card__timestamp">
              {formatTimestamp(sensor.recordedAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
