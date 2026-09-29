/* ================================================================
   HealthGauge — Visual circular gauge for health score.
   Displays the backend-provided health score, not a calculated one.
   ================================================================ */

import { healthScoreColor, formatNumber } from '../utils/format';
import LoadingState from './LoadingState';

interface Props {
  score: number | null | undefined;
  loading: boolean;
}

export default function HealthGauge({ score, loading }: Props) {
  if (loading) return <LoadingState message="Loading health…" />;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score !== null && score !== undefined ? Math.max(0, Math.min(100, Number(score))) : null;
  const offset =
    normalizedScore !== null
      ? circumference - (normalizedScore / 100) * circumference
      : circumference;
  const color = healthScoreColor(normalizedScore);

  return (
    <div className="card card--elevated" id="health-gauge-card">
      <div className="card__header">
        <span className="card__title">❤ Health Score</span>
      </div>
      <div className="health-gauge">
        <div className="health-gauge__ring">
          <svg className="health-gauge__svg" width="120" height="120" viewBox="0 0 120 120">
            <circle
              className="health-gauge__track"
              cx="60"
              cy="60"
              r={radius}
            />
            <circle
              className="health-gauge__fill"
              cx="60"
              cy="60"
              r={radius}
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="health-gauge__number">
            <span className="health-gauge__score" style={{ color }}>
              {normalizedScore !== null ? formatNumber(normalizedScore, 0) : '—'}
            </span>
            <span className="health-gauge__label">/ 100</span>
          </div>
        </div>
        {normalizedScore === null && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Unavailable
          </span>
        )}
      </div>
    </div>
  );
}
