/* ================================================================
   FleetSummaryCards.tsx — Role-Aware Fleet KPI Strip
   Phase 10.1: Displays contextually emphasized KPI cards based on
   the active demonstration user's operational role.
   All values derived strictly from the centralized FleetContext metrics.
   ================================================================ */

import React from 'react';
import type { FleetMetrics } from '../../context/FleetContext';
import type { DemoUser } from '../../types/user';
import { demoDataService } from '../../services/demoDataService';

interface Props {
  metrics: FleetMetrics;
  currentUser: DemoUser;
  loading: boolean;
}

interface KpiCard {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  icon: string;
  iconClass: 'total' | 'healthy' | 'warning' | 'critical' | 'alerts' | 'maintenance' | 'info';
  numClass: string;
  indicator: string;
}

export default function FleetSummaryCards({ metrics, currentUser, loading }: Props) {
  const isZero = metrics.totalMachines === 0;

  // Retrieve work orders for maintenance engineer role
  const maintenanceTasks = demoDataService.getMaintenanceRecords();
  const maintenanceDueCount = maintenanceTasks.filter((t: any) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS').length;
  const overdueCount = maintenanceTasks.filter((t: any) => t.status === 'OVERDUE').length;

  let cards: KpiCard[] = [];

  switch (currentUser.id) {
    case 'USR-002': {
      // Aryan Mishra — Maintenance Engineer
      cards = [
        {
          id: 'maintenance-due',
          label: 'Maintenance Due',
          value: loading ? '—' : isZero ? '0' : String(maintenanceDueCount),
          sublabel: 'Work orders scheduled',
          icon: '🔧',
          iconClass: 'maintenance',
          numClass: maintenanceDueCount > 0 ? 'warning' : '',
          indicator: 'warning',
        },
        {
          id: 'maintenance-overdue',
          label: 'Overdue Tasks',
          value: loading ? '—' : isZero ? '0' : String(overdueCount),
          sublabel: 'Requires priority action',
          icon: '⏳',
          iconClass: 'critical',
          numClass: overdueCount > 0 ? 'critical' : '',
          indicator: 'critical',
        },
        {
          id: 'critical-machines-maint',
          label: 'Critical Machines',
          value: loading ? '—' : String(metrics.criticalCount),
          sublabel: 'Urgent shutdown / triage',
          icon: '✕',
          iconClass: 'critical',
          numClass: metrics.criticalCount > 0 ? 'critical' : '',
          indicator: 'critical',
        },
        {
          id: 'active-faults',
          label: 'Active Machine Faults',
          value: loading ? '—' : String(metrics.activeFaultsCount),
          sublabel: 'Classified mechanical faults',
          icon: '⚠',
          iconClass: 'warning',
          numClass: metrics.activeFaultsCount > 0 ? 'warning' : '',
          indicator: 'warning',
        },
      ];
      break;
    }

    case 'USR-003': {
      // Aditya Gupta — Reliability Engineer
      cards = [
        {
          id: 'avg-fleet-health',
          label: 'Average Fleet Health',
          value: loading ? '—' : metrics.averageHealth !== null ? `${metrics.averageHealth}%` : 'N/A',
          sublabel: 'Degradation index',
          icon: '❤',
          iconClass: 'healthy',
          numClass: metrics.averageHealth && metrics.averageHealth >= 80 ? 'healthy' : 'warning',
          indicator: 'healthy',
        },
        {
          id: 'high-risk-machines',
          label: 'High Risk Machines',
          value: loading ? '—' : String(metrics.highRiskCount),
          sublabel: 'Risk score > 70%',
          icon: '⚡',
          iconClass: 'critical',
          numClass: metrics.highRiskCount > 0 ? 'critical' : '',
          indicator: 'critical',
        },
        {
          id: 'predicted-failures',
          label: 'Predicted Failures',
          value: loading ? '—' : String(metrics.criticalCount + (metrics.warningCount > 0 ? 1 : 0)),
          sublabel: 'RUL < 14 days',
          icon: '📉',
          iconClass: 'warning',
          numClass: 'warning',
          indicator: 'warning',
        },
        {
          id: 'anomalies-detected',
          label: 'Anomalies Detected',
          value: loading ? '—' : String(metrics.anomalyCount),
          sublabel: 'Statistical outliers',
          icon: '🔍',
          iconClass: 'alerts',
          numClass: metrics.anomalyCount > 0 ? 'critical' : '',
          indicator: 'alerts',
        },
      ];
      break;
    }

    case 'USR-004': {
      // Aditya Maurya — Plant Operator
      cards = [
        {
          id: 'running-machines',
          label: 'Running Normally',
          value: loading ? '—' : String(metrics.healthyCount),
          sublabel: 'Optimal load range',
          icon: '▶',
          iconClass: 'healthy',
          numClass: 'healthy',
          indicator: 'healthy',
        },
        {
          id: 'warning-machines-op',
          label: 'Warning State',
          value: loading ? '—' : String(metrics.warningCount),
          sublabel: 'Elevated telemetry',
          icon: '⚠',
          iconClass: 'warning',
          numClass: metrics.warningCount > 0 ? 'warning' : '',
          indicator: 'warning',
        },
        {
          id: 'critical-machines-op',
          label: 'Critical State',
          value: loading ? '—' : String(metrics.criticalCount),
          sublabel: 'Immediate triage',
          icon: '✕',
          iconClass: 'critical',
          numClass: metrics.criticalCount > 0 ? 'critical' : '',
          indicator: 'critical',
        },
        {
          id: 'offline-machines-op',
          label: 'Offline / Stopped',
          value: loading ? '—' : String(metrics.offlineCount),
          sublabel: 'Decommissioned or idle',
          icon: '⏹',
          iconClass: 'total',
          numClass: '',
          indicator: 'info',
        },
      ];
      break;
    }

    case 'USR-001':
    default: {
      // Ananya Sharma — System Administrator (Full fleet administrative overview)
      cards = [
        {
          id: 'total-machines-admin',
          label: 'Total Machines',
          value: loading ? '—' : String(metrics.totalMachines),
          sublabel: 'Monitored physical assets',
          icon: '⚙',
          iconClass: 'total',
          numClass: '',
          indicator: 'info',
        },
        {
          id: 'healthy-machines-admin',
          label: 'Healthy',
          value: loading ? '—' : String(metrics.healthyCount),
          sublabel: 'State: NORMAL',
          icon: '✓',
          iconClass: 'healthy',
          numClass: 'healthy',
          indicator: 'healthy',
        },
        {
          id: 'warning-machines-admin',
          label: 'Warning',
          value: loading ? '—' : String(metrics.warningCount),
          sublabel: 'State: WATCH / WARNING',
          icon: '⚠',
          iconClass: 'warning',
          numClass: metrics.warningCount > 0 ? 'warning' : '',
          indicator: 'warning',
        },
        {
          id: 'critical-machines-admin',
          label: 'Critical',
          value: loading ? '—' : String(metrics.criticalCount),
          sublabel: 'State: CRITICAL',
          icon: '✕',
          iconClass: 'critical',
          numClass: metrics.criticalCount > 0 ? 'critical' : '',
          indicator: 'critical',
        },
        {
          id: 'active-alerts-admin',
          label: 'Active Alerts',
          value: loading ? '—' : String(metrics.activeAlertsCount),
          sublabel: 'Unresolved alarms',
          icon: '🔔',
          iconClass: 'alerts',
          numClass: metrics.activeAlertsCount > 0 ? 'critical' : '',
          indicator: 'critical',
        },
      ];
      break;
    }
  }

  return (
    <div
      className="fleet-summary"
      id="fleet-summary-cards"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))`,
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      {cards.map((card) => (
        <div key={card.id} className="summary-card" id={`summary-${card.id}`}>
          <div className="summary-card__top">
            <div className={`summary-card__icon summary-card__icon--${card.iconClass}`}>
              {card.icon}
            </div>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              LIVE
            </span>
          </div>

          <div className={`summary-card__number summary-card__number--${card.numClass}`}>
            {card.value}
          </div>

          <div className="summary-card__label">{card.label}</div>
          {card.sublabel && (
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {card.sublabel}
            </div>
          )}

          <div className={`summary-card__indicator summary-card__indicator--${card.indicator}`} />
        </div>
      ))}
    </div>
  );
}
