/* ================================================================
   RULCard — Remaining Useful Life prediction display.
   Shows estimated RUL, confidence, and degradation trend.
   Does NOT invent a value if unavailable.
   ================================================================ */

import type { RULPredictionResponse } from '../types';
import { formatNumber, formatDateTime, stateToClass } from '../utils/format';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

interface Props {
  rul: RULPredictionResponse | null;
  loading: boolean;
  error: Error | null;
}

function trendIcon(trend: string | null | undefined): string {
  switch (trend?.toUpperCase()) {
    case 'STABLE':
      return '→';
    case 'DEGRADING':
      return '↘';
    case 'IMPROVING':
      return '↗';
    case 'RAPIDLY_DEGRADING':
      return '↓';
    default:
      return '—';
  }
}

function trendClass(trend: string | null | undefined): string {
  switch (trend?.toUpperCase()) {
    case 'STABLE':
      return 'normal';
    case 'IMPROVING':
      return 'normal';
    case 'DEGRADING':
      return 'warning';
    case 'RAPIDLY_DEGRADING':
      return 'critical';
    default:
      return 'unknown';
  }
}

export default function RULCard({ rul, loading, error }: Props) {
  if (loading) return <LoadingState message="Loading RUL…" />;
  if (error) return <ErrorState message="RUL prediction unavailable" />;
  if (!rul) return <EmptyState icon="⏳" message="RUL unavailable" />;

  const confidenceClass = stateToClass(
    rul.confidence === 'HIGH' ? 'NORMAL' : rul.confidence === 'MEDIUM' ? 'WATCH' : 'WARNING',
  );

  return (
    <div className="card card--elevated" id="rul-card">
      <div className="card__header">
        <span className="card__title">⏳ Remaining Useful Life</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Estimated RUL */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Estimated RUL
          </div>
          <div className="card__value">
            {rul.estimatedRulHours !== null
              ? formatNumber(rul.estimatedRulHours, 0)
              : '—'}
            <span className="card__unit">hours</span>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Confidence
          </div>
          <span className={`status-badge status-badge--${confidenceClass}`}>
            {rul.confidence || 'Unknown'}
          </span>
        </div>

        {/* Degradation Trend */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Degradation Trend
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`status-badge status-badge--${trendClass(rul.degradationTrend)}`}>
              <span aria-hidden="true">{trendIcon(rul.degradationTrend)}</span>
              {rul.degradationTrend?.replace(/_/g, ' ') || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="card__timestamp">
          Predicted at: {formatDateTime(rul.predictionTimestamp)}
        </div>
      </div>

      <div className="ai-disclaimer">
        RUL is a model estimate and should be validated by qualified maintenance personnel.
      </div>
    </div>
  );
}
