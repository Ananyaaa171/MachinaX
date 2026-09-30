/* ================================================================
   SHAPExplanationCard — SHAP feature contribution visualization.
   Uses actual SHAP values from the backend Phase 7 explanation API.
   Does NOT calculate SHAP in the frontend.
   ================================================================ */

import type { ExplanationResponse } from '../types';
import { shapImpactClass } from '../utils/format';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

interface Props {
  explanation: ExplanationResponse | null;
  loading: boolean;
  error: Error | null;
}

export default function SHAPExplanationCard({ explanation, loading, error }: Props) {
  if (loading) return <LoadingState message="Loading explanation…" />;
  if (error) return <ErrorState message="Explanation temporarily unavailable" />;
  if (!explanation) return <EmptyState icon="🔍" message="No explanation available yet" />;

  // Find max absolute SHAP value for scaling bars
  const maxAbsShap = Math.max(
    ...explanation.features.map((f) => Math.abs(Number(f.shapValue))),
    0.001, // Avoid division by zero
  );

  return (
    <div className="card card--elevated" id="shap-explanation-card">
      <div className="card__header">
        <span className="card__title">🔍 Why is this machine flagged? (Key Diagnostic Factors)</span>
        {explanation.modelVersion && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            v{explanation.modelVersion}
          </span>
        )}
      </div>

      {/* SHAP Feature Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {explanation.features.map((feature) => {
          const absValue = Math.abs(Number(feature.shapValue));
          const widthPercent = Math.min((absValue / maxAbsShap) * 100, 100);
          const impactClass = shapImpactClass(feature.impact);

          return (
            <div key={feature.feature} className="shap-bar">
              <span className="shap-bar__label">{feature.feature}</span>
              <div className="shap-bar__track">
                <div
                  className={`shap-bar__fill shap-bar__fill--${impactClass}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="shap-bar__value">
                {Number(feature.shapValue).toFixed(4)}
              </span>
              <span className={`shap-bar__impact shap-bar__impact--${impactClass}`}>
                {feature.impact}
              </span>
            </div>
          );
        })}
      </div>

      {/* Human-readable summary */}
      {explanation.summary && (
        <div className="recommendation-text" style={{ marginTop: '16px' }}>
          {explanation.summary}
        </div>
      )}

      <div className="ai-disclaimer">
        SHAP contribution indicates feature influence on the model prediction, not physical causation.
      </div>
    </div>
  );
}
