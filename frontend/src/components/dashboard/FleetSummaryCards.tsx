/* ================================================================
   FleetSummaryCards.tsx — 6-card fleet KPI strip.
   Phase 9: Total, Healthy, Warning, Critical, Alerts, Maintenance.
   Uses live twin data aggregated from all machines.
   ================================================================ */

import type { MachineTwinData } from '../../pages/FleetDashboard';

interface Props {
  twinData: MachineTwinData[];
  machinesLoading: boolean;
}

function countByState(twinData: MachineTwinData[], states: string[]): number {
  return twinData.filter(
    (d) => d.twin && states.includes(d.twin.operatingState?.toUpperCase() ?? '')
  ).length;
}

function countAnomalies(twinData: MachineTwinData[]): number {
  return twinData.filter((d) => d.twin?.anomalyDetected === true).length;
}

function countMachineStatus(twinData: MachineTwinData[], statuses: string[]): number {
  return twinData.filter(
    (d) => statuses.includes(d.machine.status?.toUpperCase() ?? '')
  ).length;
}

export default function FleetSummaryCards({ twinData, machinesLoading }: Props) {
  const total = twinData.length;
  const healthy = countByState(twinData, ['NORMAL']);
  const warning = countByState(twinData, ['WATCH', 'WARNING']);
  const critical = countByState(twinData, ['CRITICAL']);
  const activeAlerts = countAnomalies(twinData);
  const maintenance = countMachineStatus(twinData, ['MAINTENANCE']);

  const cards = [
    {
      id: 'total-machines',
      label: 'Total Machines',
      value: machinesLoading ? '—' : String(total),
      icon: '⚙',
      iconClass: 'total',
      numClass: '',
      indicator: 'info',
      trend: null,
    },
    {
      id: 'healthy-machines',
      label: 'Healthy',
      value: machinesLoading ? '—' : String(healthy),
      icon: '✓',
      iconClass: 'healthy',
      numClass: 'healthy',
      indicator: 'healthy',
      trend: 'up',
    },
    {
      id: 'warning-machines',
      label: 'Warning',
      value: machinesLoading ? '—' : String(warning),
      icon: '⚠',
      iconClass: 'warning',
      numClass: warning > 0 ? 'warning' : '',
      indicator: 'warning',
      trend: warning > 0 ? 'up' : 'neutral',
    },
    {
      id: 'critical-machines',
      label: 'Critical',
      value: machinesLoading ? '—' : String(critical),
      icon: '✕',
      iconClass: 'critical',
      numClass: critical > 0 ? 'critical' : '',
      indicator: 'critical',
      trend: critical > 0 ? 'down' : 'neutral',
    },
    {
      id: 'active-alerts',
      label: 'Active Alerts',
      value: machinesLoading ? '—' : String(activeAlerts),
      icon: '🔔',
      iconClass: 'alerts',
      numClass: activeAlerts > 0 ? 'critical' : '',
      indicator: 'critical',
      trend: activeAlerts > 0 ? 'down' : 'neutral',
    },
    {
      id: 'maintenance-machines',
      label: 'In Maintenance',
      value: machinesLoading ? '—' : String(maintenance),
      icon: '🔧',
      iconClass: 'maintenance',
      numClass: maintenance > 0 ? 'maintenance' : '',
      indicator: 'maintenance',
      trend: 'neutral',
    },
  ];

  return (
    <div className="fleet-summary" id="fleet-summary-cards">
      {cards.map((card) => (
        <div key={card.id} className="summary-card" id={`summary-${card.id}`}>
          <div className="summary-card__top">
            <div className={`summary-card__icon summary-card__icon--${card.iconClass}`}>
              {card.icon}
            </div>
            {card.trend && (
              <span
                className={`summary-card__trend summary-card__trend--${card.trend}`}
              >
                {card.trend === 'up' ? '▲' : card.trend === 'down' ? '▼' : '—'}
              </span>
            )}
          </div>

          <div className={`summary-card__number summary-card__number--${card.numClass}`}>
            {card.value}
          </div>

          <div className="summary-card__label">{card.label}</div>

          <div className={`summary-card__indicator summary-card__indicator--${card.indicator}`} />
        </div>
      ))}
    </div>
  );
}
