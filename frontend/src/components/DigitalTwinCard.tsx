/* ================================================================
   DigitalTwinCard — Prominent Digital Twin status section.
   Shows machine name, serial, operating state, and anomaly status.
   ================================================================ */

import type { DigitalTwinStateResponse } from '../types';
import { stateToClass, stateIcon, formatDateTime } from '../utils/format';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface Props {
  data: DigitalTwinStateResponse | null;
  loading: boolean;
  error: Error | null;
}

export default function DigitalTwinCard({ data, loading, error }: Props) {
  if (loading) return <LoadingState message="Loading digital twin…" />;
  if (error) return <ErrorState message="Digital twin data unavailable" />;
  if (!data) return <ErrorState message="No digital twin data" />;

  const stateClass = stateToClass(data.operatingState);
  const icon = stateIcon(data.operatingState);

  return (
    <div className="card card--elevated" id="digital-twin-card">
      <div className="card__header">
        <span className="card__title">⚙ Digital Twin</span>
        <span className={`status-badge status-badge--${stateClass}`}>
          <span aria-hidden="true">{icon}</span>
          {data.operatingState || 'UNKNOWN'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          {data.machineName}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          S/N: <span style={{ fontFamily: 'var(--font-mono)' }}>{data.serialNumber}</span>
        </div>

        {data.anomalyDetected !== null && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Anomaly:</span>
            <span
              className={`status-badge status-badge--${data.anomalyDetected ? 'critical' : 'normal'}`}
            >
              {data.anomalyDetected ? '✕ Detected' : '✓ None'}
            </span>
          </div>
        )}
      </div>

      <div className="card__timestamp">
        Last updated: {formatDateTime(data.lastUpdatedAt)}
      </div>
    </div>
  );
}
