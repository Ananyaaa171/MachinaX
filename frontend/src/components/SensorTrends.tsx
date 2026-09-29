/* ================================================================
   SensorTrends — Container for all sensor trend charts.
   Dynamically creates charts based on available sensors.
   ================================================================ */

import type { MachineSensorResponse } from '../types';
import SensorTrendChart from './SensorTrendChart';
import EmptyState from './EmptyState';

interface Props {
  machineId: number | null;
  sensors: MachineSensorResponse[];
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#22c55e', '#eab308', '#06b6d4'];

export default function SensorTrends({ machineId, sensors }: Props) {
  if (!machineId || sensors.length === 0) {
    return <EmptyState icon="📈" message="No sensors available for trend charts" />;
  }

  const activeSensors = sensors.filter((s) => s.isActive);

  return (
    <div className="dashboard-grid__row--charts" id="sensor-trends">
      {activeSensors.map((sensor, index) => (
        <SensorTrendChart
          key={sensor.id}
          machineId={machineId}
          sensorId={sensor.id}
          sensorLabel={sensor.label || sensor.sensorType?.name || `Sensor ${sensor.id}`}
          unit={sensor.sensorType?.unit || ''}
          color={CHART_COLORS[index % CHART_COLORS.length]}
        />
      ))}
    </div>
  );
}
