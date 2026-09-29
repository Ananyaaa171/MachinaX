/* ================================================================
   MaintenanceCard — Maintenance priority and recommendation.
   Makes clear this is a system recommendation, not a replacement
   for qualified maintenance personnel.
   ================================================================ */

import type { MaintenanceRecommendationResponse } from '../types';
import { priorityClass, formatPriority, formatFaultType, formatDateTime } from '../utils/format';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

interface Props {
  maintenance: MaintenanceRecommendationResponse | null;
  loading: boolean;
  error: Error | null;
}

export default function MaintenanceCard({ maintenance, loading, error }: Props) {
  if (loading) return <LoadingState message="Loading maintenance…" />;
  if (error) return <ErrorState message="Maintenance recommendation unavailable" />;
  if (!maintenance) return <EmptyState icon="🔧" message="No maintenance recommendation yet" />;

  const pClass = priorityClass(maintenance.priority);

  return (
    <div className="card card--elevated" id="maintenance-card">
      <div className="card__header">
        <span className="card__title">🔧 Predictive Maintenance</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Priority */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Maintenance Priority
          </div>
          <span className={`priority-badge priority-badge--${pClass}`}>
            {formatPriority(maintenance.priority)}
          </span>
        </div>

        {/* Related Fault */}
        {maintenance.faultType && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Related Fault
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {formatFaultType(maintenance.faultType)}
            </span>
          </div>
        )}

        {/* Recommendation */}
        {maintenance.recommendation && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              System Recommendation
            </div>
            <div className="recommendation-text">
              {maintenance.recommendation}
            </div>
          </div>
        )}

        <div className="card__timestamp">
          Generated: {formatDateTime(maintenance.generatedAt)}
        </div>
      </div>

      <div className="ai-disclaimer">
        This is an automated system recommendation and does not replace qualified maintenance personnel assessment.
      </div>
    </div>
  );
}
