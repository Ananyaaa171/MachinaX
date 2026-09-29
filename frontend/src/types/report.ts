/* ================================================================
   report.ts — Type definitions for Maintenance & Fleet Reporting
   Phase 10.1: Configuration options, generated document structures,
   and recent report records.
   ================================================================ */

export type ReportType =
  | 'FLEET_HEALTH'
  | 'MACHINE_HEALTH'
  | 'PREDICTIVE_MAINTENANCE'
  | 'MAINTENANCE_ACTIVITY'
  | 'ALERT_FAULT';

export type DateRangeOption = '24h' | '7d' | '30d' | 'custom';

export interface ReportConfig {
  reportType: ReportType;
  machineId: number | 'ALL';
  dateRange: DateRangeOption;
  includeOverview: boolean;
  includeSensors: boolean;
  includeTrends: boolean;
  includeAlerts: boolean;
  includePredictive: boolean;
  includeMaintenance: boolean;
  includeRecommendations: boolean;
}

export interface ReportExecutiveSummary {
  totalMachines: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  averageFleetHealth: number | null;
  activeAlerts: number;
  machinesRequiringMaintenance: number;
}

export interface ReportMachineHealthRow {
  id: number;
  name: string;
  type: string;
  health: number;
  state: string;
  risk: string;
  fault: string;
}

export interface ReportSensorSummaryRow {
  machineName: string;
  temperature: string;
  vibration: string;
  current: string;
  rpm: string;
  load: string;
}

export interface ReportFaultAlertSummary {
  criticalAlerts: number;
  warnings: number;
  anomaliesDetected: number;
  activeFaultModes: string[];
}

export interface ReportPredictiveRow {
  machineName: string;
  failureRisk: string;
  rulDays: number | string;
  predictedFault: string;
  recommendedAction: string;
}

export interface ReportMaintenanceRow {
  id: string;
  machineName: string;
  type: string;
  dueDate: string;
  priority: string;
  technician: string;
  status: string;
}

export interface ReportRecommendation {
  machineId: number;
  machineName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  recommendation: string;
  justification: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  machineId: number | 'ALL';
  machineName?: string;
  generatedBy: {
    id: string;
    name: string;
    role: string;
  };
  generatedAt: string;
  dateRange: string;
  executiveSummary?: ReportExecutiveSummary;
  machineHealth?: ReportMachineHealthRow[];
  sensorSummary?: ReportSensorSummaryRow[];
  faultAlerts?: ReportFaultAlertSummary;
  predictive?: ReportPredictiveRow[];
  maintenance?: ReportMaintenanceRow[];
  recommendations?: ReportRecommendation[];
  config: ReportConfig;
}

export interface RecentReportItem {
  id: string;
  title: string;
  type: ReportType;
  machineName: string;
  generatedBy: string;
  generatedByRole: string;
  date: string;
  status: 'Ready' | 'Generating' | 'Failed';
  reportData: GeneratedReport;
}
