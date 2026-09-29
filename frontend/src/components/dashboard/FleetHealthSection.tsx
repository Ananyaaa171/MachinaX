/* ================================================================
   FleetHealthSection.tsx — Fleet health overview + trend chart.
   Phase 9: Shows overall % health, distribution, and trend.
   Uses recharts for the health trend line chart.
   ================================================================ */

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MachineTwinData } from '../../pages/FleetDashboard';

interface Props {
  twinData: MachineTwinData[];
}

interface TrendPoint {
  time: string;
  health: number;
}

// Simulated health trend — generates plausible history from current state
function generateHealthTrend(currentHealth: number): TrendPoint[] {
  const points: TrendPoint[] = [];
  const now = new Date();
  // Generate 24 points for the last 2 hours (5-min intervals)
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000);
    // Small random walk around current health
    const noise = (Math.random() - 0.5) * 4;
    const trend = i > 12 ? -0.15 * i : 0; // slight dip earlier in time
    const val = Math.max(60, Math.min(100, currentHealth + noise + trend));
    points.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      health: Math.round(val * 10) / 10,
    });
  }
  return points;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip__label">{label}</div>
      <div className="custom-tooltip__value">{payload[0].value?.toFixed(1)}%</div>
    </div>
  );
}

export default function FleetHealthSection({ twinData }: Props) {
  const validTwins = twinData.filter((d) => d.twin !== null);

  // Compute fleet health as average of all machine health scores
  const avgHealth = useMemo(() => {
    if (!validTwins.length) return null;
    const scores = validTwins
      .map((d) => d.twin?.healthScore)
      .filter((s): s is number => s !== null && s !== undefined);
    if (!scores.length) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [validTwins]);

  const healthColor = (h: number | null) => {
    if (h === null) return 'var(--color-offline)';
    if (h >= 80) return 'var(--color-healthy)';
    if (h >= 60) return 'var(--color-warning)';
    return 'var(--color-critical)';
  };

  const healthy = twinData.filter((d) => d.twin?.operatingState === 'NORMAL').length;
  const warning = twinData.filter((d) => ['WATCH', 'WARNING'].includes(d.twin?.operatingState ?? '')).length;
  const critical = twinData.filter((d) => d.twin?.operatingState === 'CRITICAL').length;
  const total = twinData.length || 1;

  // Trend data — simulated from current health
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  useEffect(() => {
    if (avgHealth !== null) {
      setTrendData(generateHealthTrend(avgHealth));
    }
  }, [avgHealth]);

  return (
    <div className="fleet-health-row">
      {/* Left: Health overview */}
      <div className="health-overview-card" id="fleet-health-overview">
        <div
          className="health-overview__percentage"
          style={{ color: healthColor(avgHealth) }}
        >
          {avgHealth !== null ? avgHealth.toFixed(1) + '%' : 'N/A'}
        </div>
        <div className="health-overview__label">Overall Fleet Health</div>

        <div className="health-distribution">
          {/* Healthy */}
          <div className="health-dist-item">
            <div className="health-dist-item__dot" style={{ background: 'var(--color-healthy)' }} />
            <span className="health-dist-item__label">Healthy</span>
            <div className="health-dist-item__bar">
              <div
                className="health-dist-item__fill"
                style={{ width: `${(healthy / total) * 100}%`, background: 'var(--color-healthy)' }}
              />
            </div>
            <span className="health-dist-item__count">{healthy}</span>
          </div>

          {/* Warning */}
          <div className="health-dist-item">
            <div className="health-dist-item__dot" style={{ background: 'var(--color-warning)' }} />
            <span className="health-dist-item__label">Warning</span>
            <div className="health-dist-item__bar">
              <div
                className="health-dist-item__fill"
                style={{ width: `${(warning / total) * 100}%`, background: 'var(--color-warning)' }}
              />
            </div>
            <span className="health-dist-item__count">{warning}</span>
          </div>

          {/* Critical */}
          <div className="health-dist-item">
            <div className="health-dist-item__dot" style={{ background: 'var(--color-critical)' }} />
            <span className="health-dist-item__label">Critical</span>
            <div className="health-dist-item__bar">
              <div
                className="health-dist-item__fill"
                style={{ width: `${(critical / total) * 100}%`, background: 'var(--color-critical)' }}
              />
            </div>
            <span className="health-dist-item__count">{critical}</span>
          </div>

          {/* Offline / no data */}
          {twinData.filter((d) => !d.twin).length > 0 && (
            <div className="health-dist-item">
              <div className="health-dist-item__dot" style={{ background: 'var(--color-offline)' }} />
              <span className="health-dist-item__label">No Data</span>
              <div className="health-dist-item__bar">
                <div
                  className="health-dist-item__fill"
                  style={{
                    width: `${(twinData.filter((d) => !d.twin).length / total) * 100}%`,
                    background: 'var(--color-offline)',
                  }}
                />
              </div>
              <span className="health-dist-item__count">{twinData.filter((d) => !d.twin).length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Health trend chart */}
      <div className="health-trend-card" id="fleet-health-trend">
        <div className="health-trend-card__header">
          <span className="health-trend-card__title">Health Trend (Last 2 hours)</span>
          <span className="health-trend-card__period" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ⚠ Simulated trend — live history not yet available
          </span>
        </div>
        {avgHealth === null ? (
          <div className="empty-state" style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div className="empty-state__icon">📉</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No machine telemetry available to calculate trend.
            </div>
          </div>
        ) : trendData.length < 2 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📉</div>
            Loading trend data…
          </div>
        ) : (
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#4a5568' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#4a5568' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  width={36}
                  domain={[60, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke={healthColor(avgHealth)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
