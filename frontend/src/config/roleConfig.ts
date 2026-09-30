/* ================================================================
   roleConfig.ts — Role-Specific Industrial UI Configuration
   Simplified role configuration: clean navigation, simple labels,
   no technical infrastructure terminology.
   ================================================================ */

import type { UserRole } from '../types/user';

export type TwinDisplayMode = 'compact' | 'fleet' | 'full' | 'operator' | 'maintenance' | 'reliability' | 'admin';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface QuickActionConfig {
  id: string;
  label: string;
  icon: string;
  actionType: 'navigate' | 'modal' | 'filter';
  payload: string;
  variant?: 'primary' | 'secondary' | 'warning' | 'critical';
}

export interface RoleReportConfig {
  id: string;
  name: string;
  description: string;
  reportType: 'FLEET_HEALTH' | 'MACHINE_HEALTH' | 'PREDICTIVE_MAINTENANCE' | 'MAINTENANCE_ACTIVITY' | 'ALERT_FAULT';
  icon: string;
}

export interface RoleUIConfig {
  roleId: string;
  roleName: UserRole;
  homeTitle: string;
  homeSubtitle: string;
  heroStatusLabel: string;
  primaryQuestion: string;
  twinMode: TwinDisplayMode;
  navItems: NavItemConfig[];
  quickActions: QuickActionConfig[];
  allowedReports: RoleReportConfig[];
  emptyState: {
    title: string;
    description: string;
  };
  loadingMessage: string;
  dashboardEmphasis: 'SYSTEM' | 'MAINTENANCE' | 'RELIABILITY' | 'OPERATIONS';
}

export const ROLE_CONFIGS: Record<string, RoleUIConfig> = {
  'USR-001': {
    roleId: 'USR-001',
    roleName: 'System Administrator',
    homeTitle: 'SYSTEM OVERVIEW',
    homeSubtitle: 'Manage machines, users, alerts and system activity.',
    heroStatusLabel: 'SYSTEM OVERVIEW',
    primaryQuestion: 'What is the current status of the machines and users?',
    twinMode: 'admin',
    navItems: [
      { id: 'dashboard', label: 'Dashboard', icon: '▣', path: '/dashboard' },
      { id: 'machines', label: 'Machines', icon: '⚙', path: '/machines' },
      { id: 'users', label: 'Users', icon: '👥', path: '/profile' },
      { id: 'alerts', label: 'Alerts', icon: '⚠', path: '/alerts', badge: 2 },
      { id: 'reports', label: 'Reports', icon: '📄', path: '/analytics' },
      { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
    ],
    quickActions: [
      { id: 'view-machines', label: 'View Machines', icon: '⚙', actionType: 'navigate', payload: '/machines', variant: 'primary' },
      { id: 'manage-users', label: 'Manage Users', icon: '👥', actionType: 'navigate', payload: '/profile', variant: 'secondary' },
      { id: 'view-alerts', label: 'View Alerts', icon: '⚠', actionType: 'navigate', payload: '/alerts', variant: 'warning' },
      { id: 'generate-report', label: 'Generate Report', icon: '📄', actionType: 'modal', payload: 'report-modal', variant: 'secondary' },
    ],
    allowedReports: [
      {
        id: 'machine-status-report',
        name: 'Machine Status',
        description: 'Current status and health of all registered machines.',
        reportType: 'FLEET_HEALTH',
        icon: '⚙',
      },
      {
        id: 'fleet-health-report',
        name: 'Fleet Health',
        description: 'Overall health summary across all machines.',
        reportType: 'FLEET_HEALTH',
        icon: '📊',
      },
      {
        id: 'alerts-report',
        name: 'Alerts',
        description: 'Summary of recent alerts and issues needing attention.',
        reportType: 'ALERT_FAULT',
        icon: '⚠',
      },
      {
        id: 'maintenance-activity-report',
        name: 'Maintenance Activity',
        description: 'Recent maintenance actions and scheduled services.',
        reportType: 'MAINTENANCE_ACTIVITY',
        icon: '🔧',
      },
      {
        id: 'system-activity-report',
        name: 'System Activity',
        description: 'Recent user actions and system events.',
        reportType: 'ALERT_FAULT',
        icon: '📜',
      },
    ],
    emptyState: {
      title: 'NO MACHINES REGISTERED',
      description: 'No machines are currently registered. Load the demonstration fleet to get started.',
    },
    loadingMessage: 'Loading machines and system status...',
    dashboardEmphasis: 'SYSTEM',
  },

  'USR-002': {
    roleId: 'USR-002',
    roleName: 'Maintenance Engineer',
    homeTitle: 'MAINTENANCE',
    homeSubtitle: 'Machines needing attention, work orders, and service scheduling.',
    heroStatusLabel: 'MAINTENANCE',
    primaryQuestion: 'Which machine needs maintenance and what should I do?',
    twinMode: 'maintenance',
    navItems: [
      { id: 'dashboard', label: 'Dashboard', icon: '▣', path: '/dashboard' },
      { id: 'machines', label: 'Machines', icon: '⚙', path: '/machines' },
      { id: 'maintenance', label: 'Work Orders', icon: '🔧', path: '/maintenance' },
      { id: 'alerts', label: 'Alerts', icon: '⚠', path: '/alerts', badge: 3 },
      { id: 'reports', label: 'Reports', icon: '📄', path: '/analytics' },
      { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
    ],
    quickActions: [
      { id: 'create-maint', label: 'Create Work Order', icon: '➕', actionType: 'modal', payload: 'create-maintenance', variant: 'primary' },
      { id: 'crit-machines', label: 'Critical Machines', icon: '🔴', actionType: 'navigate', payload: '/machines?filter=CRITICAL', variant: 'critical' },
      { id: 'maint-due', label: 'Maintenance Due', icon: '⏳', actionType: 'navigate', payload: '/maintenance?tab=due', variant: 'warning' },
      { id: 'view-faults', label: 'View Faults', icon: '🔍', actionType: 'navigate', payload: '/alerts?tab=faults', variant: 'secondary' },
    ],
    allowedReports: [
      {
        id: 'maintenance-report',
        name: 'Maintenance Report',
        description: 'Active, scheduled, and completed work orders.',
        reportType: 'MAINTENANCE_ACTIVITY',
        icon: '🔧',
      },
      {
        id: 'machine-fault-report',
        name: 'Fault Report',
        description: 'Machine faults and component issues requiring attention.',
        reportType: 'ALERT_FAULT',
        icon: '🔍',
      },
      {
        id: 'maintenance-history',
        name: 'Service History',
        description: 'Historical repair and maintenance records.',
        reportType: 'MAINTENANCE_ACTIVITY',
        icon: '📜',
      },
    ],
    emptyState: {
      title: 'NO MACHINES AVAILABLE',
      description: 'No machines are currently available for maintenance.',
    },
    loadingMessage: 'Loading machines and maintenance data...',
    dashboardEmphasis: 'MAINTENANCE',
  },

  'USR-003': {
    roleId: 'USR-003',
    roleName: 'Reliability Engineer',
    homeTitle: 'RELIABILITY',
    homeSubtitle: 'Machine health, failure risk, remaining life, and condition trends.',
    heroStatusLabel: 'RELIABILITY',
    primaryQuestion: 'What is degrading, why, and what is likely to fail?',
    twinMode: 'reliability',
    navItems: [
      { id: 'dashboard', label: 'Dashboard', icon: '▣', path: '/dashboard' },
      { id: 'machines', label: 'Machines', icon: '⚙', path: '/machines' },
      { id: 'analytics', label: 'Analytics', icon: '📈', path: '/analytics' },
      { id: 'alerts', label: 'Alerts', icon: '⚠', path: '/alerts' },
      { id: 'reports', label: 'Reports', icon: '📄', path: '/analytics' },
      { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
    ],
    quickActions: [
      { id: 'analyze-risk', label: 'Analyze Risk', icon: '📈', actionType: 'navigate', payload: '/analytics', variant: 'primary' },
      { id: 'view-anomalies', label: 'View Anomalies', icon: '⚡', actionType: 'navigate', payload: '/alerts?tab=anomalies', variant: 'warning' },
      { id: 'compare-machines', label: 'Compare Machines', icon: '⚖', actionType: 'navigate', payload: '/machines', variant: 'secondary' },
      { id: 'gen-reliability-report', label: 'Reliability Report', icon: '📄', actionType: 'modal', payload: 'report-modal', variant: 'secondary' },
    ],
    allowedReports: [
      {
        id: 'reliability-report',
        name: 'Reliability Report',
        description: 'Overall equipment health and degradation trends.',
        reportType: 'FLEET_HEALTH',
        icon: '📈',
      },
      {
        id: 'predictive-maint',
        name: 'Predictive Maintenance Report',
        description: 'Remaining useful life forecasts and failure probabilities.',
        reportType: 'PREDICTIVE_MAINTENANCE',
        icon: '⏳',
      },
      {
        id: 'machine-health-trend',
        name: 'Machine Health Trend',
        description: 'Long-term health trajectory and condition monitoring.',
        reportType: 'FLEET_HEALTH',
        icon: '📉',
      },
    ],
    emptyState: {
      title: 'NO MACHINE DATA',
      description: 'Machine data is required to calculate reliability metrics.',
    },
    loadingMessage: 'Loading reliability data...',
    dashboardEmphasis: 'RELIABILITY',
  },

  'USR-004': {
    roleId: 'USR-004',
    roleName: 'Plant Operator',
    homeTitle: 'LIVE OPERATIONS',
    homeSubtitle: 'Real-time machine status, sensor readings, and floor alerts.',
    heroStatusLabel: 'LIVE OPERATIONS',
    primaryQuestion: 'What is happening on the plant floor right now?',
    twinMode: 'operator',
    navItems: [
      { id: 'dashboard', label: 'Dashboard', icon: '◉', path: '/dashboard' },
      { id: 'machines', label: 'Machines', icon: '⚙', path: '/machines' },
      { id: 'alerts', label: 'Alerts', icon: '⚠', path: '/alerts', badge: 3 },
      { id: 'reports', label: 'Reports', icon: '📄', path: '/analytics' },
      { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
    ],
    quickActions: [
      { id: 'live-monitoring', label: 'Live Monitoring', icon: '◉', actionType: 'navigate', payload: '/machines/1', variant: 'primary' },
      { id: 'critical-alerts', label: 'Critical Alerts', icon: '🚨', actionType: 'navigate', payload: '/alerts?severity=CRITICAL', variant: 'critical' },
      { id: 'view-machines', label: 'View Machines', icon: '⊞', actionType: 'navigate', payload: '/machines', variant: 'secondary' },
      { id: 'ack-alert', label: 'Acknowledge Alarm', icon: '✓', actionType: 'navigate', payload: '/alerts', variant: 'warning' },
    ],
    allowedReports: [
      {
        id: 'daily-operations',
        name: 'Daily Operations',
        description: 'Machine loads, temperatures, and operating conditions.',
        reportType: 'FLEET_HEALTH',
        icon: '🏭',
      },
      {
        id: 'machine-status',
        name: 'Machine Status',
        description: 'Current sensor readings for all machines.',
        reportType: 'MACHINE_HEALTH',
        icon: '⚡',
      },
      {
        id: 'alarm-summary',
        name: 'Alarm Summary',
        description: 'Recent alarms, threshold violations, and acknowledgements.',
        reportType: 'ALERT_FAULT',
        icon: '⚠',
      },
    ],
    emptyState: {
      title: 'NO LIVE MACHINES',
      description: 'No machines are currently reporting sensor data.',
    },
    loadingMessage: 'Connecting to live machines...',
    dashboardEmphasis: 'OPERATIONS',
  },
};

export function getRoleConfig(userId: string): RoleUIConfig {
  return ROLE_CONFIGS[userId] || ROLE_CONFIGS['USR-001'];
}
