/* ================================================================
   MLInsightsCard — AI/ML anomaly detection and fault classification.
   Displays the latest ML prediction from Phase 6.
   ================================================================ */

import type { MLPredictionResponse } from '../types';
import { formatFaultType, formatPercent, formatNumber, formatDateTime } from '../utils/format';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

interface Props {
  prediction: MLPredictionResponse | null;
  loading: boolean;
  error: Error | null;
}

export default function MLInsightsCard({ prediction, loading, error }: Props) {
  if (loading) return <LoadingState message="Loading AI prediction…" />;
  if (error) return <ErrorState message="AI prediction temporarily unavailable" />;
  if (!prediction) return <EmptyState icon="🤖" message="No prediction available yet" />;

  const anomalyClass = prediction.anomalyDetected ? 'critical' : 'normal';

  return (
    <div className="card card--elevated" id="ml-insights-card">
      <div className="card__header">
        <span className="card__title">🤖 Condition Analysis & Failure Risk</span>
        {prediction.modelVersion && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            v{prediction.modelVersion}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Anomaly Detection */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Unusual Behaviour (Anomaly Detection)
          </div>
          <span className={`status-badge status-badge--${anomalyClass}`}>
            {prediction.anomalyDetected ? '✕ Anomaly Detected' : '✓ No Anomaly'}
          </span>
          {prediction.anomalyScore !== null && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Unusual Behaviour Score: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {formatNumber(prediction.anomalyScore, 4)}
              </span>
            </div>
          )}
        </div>

        {/* Fault Classification */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Fault Classification
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {formatFaultType(prediction.faultType)}
          </div>
          {prediction.faultProbability !== null && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Model Confidence: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {formatPercent(prediction.faultProbability)}
              </span>
            </div>
          )}
        </div>

        <div className="card__timestamp">
          Prediction at: {formatDateTime(prediction.predictionTimestamp)}
        </div>
      </div>

      <div className="ai-disclaimer">
        Model prediction — does not represent a definitive diagnosis.
      </div>
    </div>
  );
}
