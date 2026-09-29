/* ================================================================
   SensorTrendChart — Historical trend chart for a single sensor.
   Uses the backend sensor trend API via Recharts.
   ================================================================ */

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getSensorTrend } from '../api/client';
import type { SensorTrendPointResponse } from '../types';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface Props {
  machineId: number;
  sensorId: number;
  sensorLabel: string;
  unit: string;
  color?: string;
}

interface ChartPoint {
  time: string;
  value: number;
  fullTime: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip__label">{label}</div>
      <div className="custom-tooltip__value">{payload[0].value?.toFixed(3)}</div>
    </div>
  );
}

export default function SensorTrendChart({
  machineId,
  sensorId,
  sensorLabel,
  unit,
  color = '#3b82f6',
}: Props) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    try {
      const trend: SensorTrendPointResponse[] = await getSensorTrend(machineId, sensorId, 60);
      const sorted = [...trend].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      const points: ChartPoint[] = sorted.map((p) => ({
        time: new Date(p.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: Number(p.value),
        fullTime: new Date(p.timestamp).toLocaleTimeString(),
      }));
      setData(points);
      setError(null);
    } catch {
      setError('Failed to load trend data');
    } finally {
      setLoading(false);
    }
  }, [machineId, sensorId]);

  useEffect(() => {
    setLoading(true);
    fetchTrend();

    // Refresh trend every 30 seconds (less frequent than main poll)
    const interval = setInterval(fetchTrend, 30_000);
    return () => clearInterval(interval);
  }, [fetchTrend]);

  return (
    <div className="card card--elevated" id={`trend-chart-${sensorId}`}>
      <div className="card__header">
        <span className="card__title">📈 {sensorLabel}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {unit} • last 60 readings
        </span>
      </div>

      {loading ? (
        <LoadingState message="Loading trend…" />
      ) : error ? (
        <EmptyState icon="📉" message={error} />
      ) : data.length < 2 ? (
        <EmptyState icon="📉" message="Not enough historical data" />
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#5a6478' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#5a6478' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                width={50}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
