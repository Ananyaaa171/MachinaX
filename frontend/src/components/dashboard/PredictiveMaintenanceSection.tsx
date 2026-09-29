/* ================================================================
   PredictiveMaintenanceSection.tsx — Fleet-level maintenance forecast.
   Phase 9: Uses RUL + ML + twin data to show simulated predictions.
   Clearly marked as SIMULATED / DEMONSTRATION values.
   ================================================================ */

import { useMemo } from 'react';
import type { MachineTwinData } from '../../pages/FleetDashboard';

interface Props {
  twinData: MachineTwinData[];
  onViewMachine: (machineId: number) => void;
}

interface PredictiveEntry {
  machineId: number;
  machineName: string;
  serialNumber: string;
  failureProbability: number;
  predictedFault: string;
  estimatedRULDays: number | null;
  risk: 'low' | 'medium' | 'high';
  source: 'api' | 'simulated';
}

function derivePredictions(twinData: MachineTwinData[]): PredictiveEntry[] {
  return twinData
    .map((d) => {
      const { machine, twin, rul, ml } = d;

      // If we have RUL data, use it
      let estimatedRULDays: number | null = null;
      let source: 'api' | 'simulated' = 'simulated';

      if (rul?.estimatedRulHours !== null && rul?.estimatedRulHours !== undefined) {
        estimatedRULDays = Math.round(rul.estimatedRulHours / 24);
        source = 'api';
      } else {
        // Simulate from health score
        const h = twin?.healthScore;
        if (h !== null && h !== undefined) {
          estimatedRULDays = Math.round(h * 0.6 + Math.random() * 10);
        }
      }

      // Failure probability from ML or derived from health
      let failureProbability: number;
      if (ml?.faultProbability !== null && ml?.faultProbability !== undefined) {
        failureProbability = Math.round(ml.faultProbability * 100);
        source = 'api';
      } else {
        const h = twin?.healthScore ?? 80;
        failureProbability = Math.round(Math.max(0, Math.min(95, (100 - h) * 0.9 + Math.random() * 8)));
      }

      // Predicted fault
      let predictedFault = 'Normal Wear';
      if (ml?.faultType && ml.faultType !== 'NONE') {
        predictedFault = ml.faultType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      } else if (twin?.currentFaultType && twin.currentFaultType !== 'NONE') {
        predictedFault = twin.currentFaultType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      } else if (twin?.anomalyDetected) {
        predictedFault = 'Unclassified Anomaly';
      } else {
        // Default simulated faults based on machine type
        const faults = ['Bearing Degradation', 'Overheating', 'Rotor Imbalance', 'Normal Wear', 'Insulation Wear'];
        predictedFault = faults[machine.id % faults.length];
      }

      // Risk level
      let risk: 'low' | 'medium' | 'high';
      if (failureProbability >= 60 || twin?.operatingState === 'CRITICAL') risk = 'high';
      else if (failureProbability >= 30 || ['WATCH', 'WARNING'].includes(twin?.operatingState ?? '')) risk = 'medium';
      else risk = 'low';

      return {
        machineId: machine.id,
        machineName: machine.name,
        serialNumber: machine.serialNumber,
        failureProbability,
        predictedFault,
        estimatedRULDays,
        risk,
        source,
      };
    })
    .filter((e) => e.risk !== 'low' || e.failureProbability > 20) // Only show at-risk machines
    .sort((a, b) => b.failureProbability - a.failureProbability)
    .slice(0, 6);
}

function getFailureColor(pct: number): string {
  if (pct >= 60) return 'var(--color-critical)';
  if (pct >= 30) return 'var(--color-warning)';
  return 'var(--color-healthy)';
}

export default function PredictiveMaintenanceSection({ twinData, onViewMachine }: Props) {
  const predictions = useMemo(() => derivePredictions(twinData), [twinData]);

  if (!predictions.length) {
    return (
      <div className="predictive-table-card" id="predictive-maintenance-table">
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state__icon">✓</div>
          <div style={{ color: 'var(--color-healthy)', fontWeight: 600 }}>Fleet in good health</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            No machines currently require predictive maintenance attention
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="predictive-table-card" id="predictive-maintenance-table">
      <div className="predictive-table-header">
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--text-secondary)',
          }}
        >
          Failure Forecast
        </span>
        <span
          style={{
            fontSize: '0.67rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          ⚠ Values are simulated/estimated — not actual ML outputs unless marked API
        </span>
      </div>

      <div className="machine-table-wrap">
        <table className="machine-table" aria-label="Predictive maintenance table">
          <thead>
            <tr>
              <th>Machine</th>
              <th>Failure Probability</th>
              <th>Predicted Fault</th>
              <th>Est. RUL</th>
              <th>Risk</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((entry) => {
              const color = getFailureColor(entry.failureProbability);
              return (
                <tr
                  key={entry.machineId}
                  id={`pred-row-${entry.machineId}`}
                  onClick={() => onViewMachine(entry.machineId)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Machine */}
                  <td>
                    <div className="machine-name-cell">
                      <span className="machine-name-cell__name">{entry.machineName}</span>
                      <span className="machine-name-cell__id">{entry.serialNumber}</span>
                    </div>
                  </td>

                  {/* Failure probability */}
                  <td>
                    <div className="failure-bar">
                      <div className="failure-bar__track">
                        <div
                          className="failure-bar__fill"
                          style={{ width: `${entry.failureProbability}%`, background: color }}
                        />
                      </div>
                      <span className="failure-bar__pct" style={{ color }}>
                        {entry.failureProbability}%
                      </span>
                    </div>
                  </td>

                  {/* Fault */}
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {entry.predictedFault}
                    </span>
                  </td>

                  {/* RUL */}
                  <td>
                    <span
                      className="sensor-val"
                      style={{ color: entry.estimatedRULDays !== null && entry.estimatedRULDays < 7 ? 'var(--color-critical)' : 'var(--text-primary)' }}
                    >
                      {entry.estimatedRULDays !== null ? `${entry.estimatedRULDays} days` : '—'}
                    </span>
                  </td>

                  {/* Risk */}
                  <td>
                    <span className={`risk-badge risk-badge--${entry.risk}`}>
                      {entry.risk.toUpperCase()}
                    </span>
                  </td>

                  {/* Source indicator */}
                  <td>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: entry.source === 'api' ? 'var(--color-info-bg)' : 'var(--bg-inset)',
                        color: entry.source === 'api' ? 'var(--color-info)' : 'var(--text-muted)',
                        border: `1px solid ${entry.source === 'api' ? 'var(--color-info-border)' : 'var(--border-subtle)'}`,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {entry.source === 'api' ? 'ML API' : 'SIM'}
                    </span>
                  </td>

                  {/* Action */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="table-action-btn"
                      onClick={() => onViewMachine(entry.machineId)}
                      id={`btn-pred-view-${entry.machineId}`}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
