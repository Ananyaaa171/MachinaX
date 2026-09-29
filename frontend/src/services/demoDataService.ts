/* ================================================================
   demoDataService.ts — Demonstration Data Layer
   Phase 10: Clearly segregated simulated & demonstration records
   for Alerts, Maintenance Work Orders, and Reliability Analytics.
   ================================================================ */

export interface DemoAlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  machineId: number;
  machineName: string;
  description: string;
  sensor: string;
  value: string;
  threshold: string;
  timeAgo: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED';
  acknowledgedBy?: string;
  source: 'LIVE_EVAL' | 'DEMO_LOG';
}

export interface MaintenanceRecord {
  id: string;
  machineId: number;
  machineName: string;
  type: string;
  dueDate: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'SCHEDULED' | 'OVERDUE' | 'COMPLETED' | 'IN_PROGRESS';
  technician: string;
  notes: string;
  estimatedHours: number;
  completedAt?: string;
  source: 'DEMONSTRATION DATA';
}

// Initial demonstration alerts
let alertsStore: DemoAlertItem[] = [
  {
    id: 'ALT-101',
    severity: 'CRITICAL',
    machineId: 1,
    machineName: 'Motor IM-001',
    description: 'High drive-end bearing vibration exceeded ISO 10816 Class II threshold',
    sensor: 'Drive-End Vibration',
    value: '4.82 mm/s',
    threshold: '> 4.5 mm/s',
    timeAgo: '4 min ago',
    timestamp: '2026-09-29 22:56:10',
    status: 'ACTIVE',
    source: 'LIVE_EVAL',
  },
  {
    id: 'ALT-102',
    severity: 'WARNING',
    machineId: 1,
    machineName: 'Motor IM-001',
    description: 'Elevated stator winding temperature approaching thermal limit',
    sensor: 'Winding Temperature',
    value: '76.4 °C',
    threshold: '> 70.0 °C',
    timeAgo: '18 min ago',
    timestamp: '2026-09-29 22:42:00',
    status: 'ACTIVE',
    source: 'LIVE_EVAL',
  },
  {
    id: 'ALT-103',
    severity: 'WARNING',
    machineId: 2,
    machineName: 'Centrifugal Pump CP-002',
    description: 'Impeller discharge pressure fluctuation detected',
    sensor: 'Discharge Pressure',
    value: '3.1 bar',
    threshold: '< 3.5 bar',
    timeAgo: '1 hour ago',
    timestamp: '2026-09-29 22:00:00',
    status: 'ACTIVE',
    source: 'DEMO_LOG',
  },
  {
    id: 'ALT-104',
    severity: 'INFO',
    machineId: 3,
    machineName: 'Air Compressor AC-001',
    description: 'Routine 2000-hour lubrication advisory reached',
    sensor: 'Operating Hours Counter',
    value: '2004 hrs',
    threshold: '2000 hrs',
    timeAgo: '3 hours ago',
    timestamp: '2026-09-29 20:15:00',
    status: 'ACKNOWLEDGED',
    acknowledgedBy: 'Aryan Mishra',
    source: 'DEMO_LOG',
  },
  {
    id: 'ALT-105',
    severity: 'CRITICAL',
    machineId: 4,
    machineName: 'Exhaust Blower EB-003',
    description: 'Severe dynamic eccentricity detected via airgap sensor',
    sensor: 'Radial Vibration',
    value: '5.10 mm/s',
    threshold: '> 4.5 mm/s',
    timeAgo: '6 hours ago',
    timestamp: '2026-09-29 17:10:00',
    status: 'ACKNOWLEDGED',
    acknowledgedBy: 'Ananya Sharma',
    source: 'DEMO_LOG',
  },
  {
    id: 'ALT-106',
    severity: 'INFO',
    machineId: 1,
    machineName: 'Motor IM-001',
    description: 'Automatic calibration sequence finished successfully',
    sensor: 'Telemetry Streamer',
    value: 'Nominal',
    threshold: 'N/A',
    timeAgo: '12 hours ago',
    timestamp: '2026-09-29 11:00:00',
    status: 'ACKNOWLEDGED',
    acknowledgedBy: 'Aditya Maurya',
    source: 'DEMO_LOG',
  },
];

// Initial demonstration maintenance tasks
let maintenanceStore: MaintenanceRecord[] = [
  {
    id: 'WO-801',
    machineId: 1,
    machineName: 'Motor IM-001',
    type: 'Bearing Inspection & Re-lubrication',
    dueDate: '2026-10-02',
    priority: 'CRITICAL',
    status: 'SCHEDULED',
    technician: 'Aryan Mishra',
    notes: 'Prioritized due to ML isolation forest anomaly & elevated 4.8 mm/s vibration. Inspect drive-end ball races.',
    estimatedHours: 3.5,
    source: 'DEMONSTRATION DATA',
  },
  {
    id: 'WO-802',
    machineId: 2,
    machineName: 'Centrifugal Pump CP-002',
    type: 'Mechanical Seal Flush & Impeller Alignment',
    dueDate: '2026-09-27',
    priority: 'HIGH',
    status: 'OVERDUE',
    technician: 'Aryan Mishra',
    notes: 'Discharge pressure drop suggests seal leakage or cavitation wear. Awaiting spare mechanical seal kit.',
    estimatedHours: 5.0,
    source: 'DEMONSTRATION DATA',
  },
  {
    id: 'WO-803',
    machineId: 3,
    machineName: 'Air Compressor AC-001',
    type: 'Intake Filter Replacement & Oil Change',
    dueDate: '2026-10-08',
    priority: 'MEDIUM',
    status: 'SCHEDULED',
    technician: 'Aryan Mishra',
    notes: 'Standard 2,000-hour scheduled interval. Synthetic compressor lubricant 10W-40 required.',
    estimatedHours: 2.0,
    source: 'DEMONSTRATION DATA',
  },
  {
    id: 'WO-804',
    machineId: 4,
    machineName: 'Exhaust Blower EB-003',
    type: 'Dynamic Laser Shaft Realignment',
    dueDate: '2026-09-28',
    priority: 'HIGH',
    status: 'OVERDUE',
    technician: 'Aryan Mishra',
    notes: 'Radial vibration exceeding limits. Laser optical alignment tool needed to adjust base shims.',
    estimatedHours: 4.0,
    source: 'DEMONSTRATION DATA',
  },
  {
    id: 'WO-799',
    machineId: 1,
    machineName: 'Motor IM-001',
    type: 'Stator Insulation Resistance Test (Megger)',
    dueDate: '2026-09-20',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    technician: 'Aryan Mishra',
    notes: 'Measured > 500 Megohms phase-to-ground at 1000V DC. Insulation is healthy and dry.',
    estimatedHours: 1.5,
    completedAt: '2026-09-20 14:30',
    source: 'DEMONSTRATION DATA',
  },
  {
    id: 'WO-798',
    machineId: 2,
    machineName: 'Centrifugal Pump CP-002',
    type: 'Coupling Elastomer Insert Replacement',
    dueDate: '2026-09-12',
    priority: 'LOW',
    status: 'COMPLETED',
    technician: 'Aryan Mishra',
    notes: 'Replaced worn polyurethane spider insert in jaw coupling. Backlash eliminated.',
    estimatedHours: 2.0,
    completedAt: '2026-09-12 16:15',
    source: 'DEMONSTRATION DATA',
  },
];

export const demoDataService = {
  // Alert APIs
  getAlerts(): DemoAlertItem[] {
    return [...alertsStore];
  },

  acknowledgeAlert(id: string, userName: string): boolean {
    const item = alertsStore.find((a) => a.id === id);
    if (item) {
      item.status = 'ACKNOWLEDGED';
      item.acknowledgedBy = userName;
      return true;
    }
    return false;
  },

  // Maintenance APIs
  getMaintenanceRecords(): MaintenanceRecord[] {
    return [...maintenanceStore];
  },

  createMaintenanceTask(record: Omit<MaintenanceRecord, 'id' | 'source'>): MaintenanceRecord {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `WO-${Math.floor(810 + Math.random() * 90)}`,
      source: 'DEMONSTRATION DATA',
    };
    maintenanceStore = [newRecord, ...maintenanceStore];
    return newRecord;
  },

  completeMaintenanceTask(id: string): boolean {
    const task = maintenanceStore.find((t) => t.id === id);
    if (task) {
      task.status = 'COMPLETED';
      task.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      return true;
    }
    return false;
  },

  // Analytics Demonstration Data
  getAnalyticsData() {
    return {
      fleetHealthTrend: [
        { time: '08:00', health: 94.2, baseline: 95 },
        { time: '10:00', health: 93.8, baseline: 95 },
        { time: '12:00', health: 91.5, baseline: 95 },
        { time: '14:00', health: 90.1, baseline: 95 },
        { time: '16:00', health: 88.6, baseline: 95 },
        { time: '18:00', health: 87.2, baseline: 95 },
        { time: '20:00', health: 85.9, baseline: 95 },
        { time: '22:00', health: 86.4, baseline: 95 },
      ],
      faultDistribution: [
        { name: 'Bearing Degradation', count: 18, color: '#ef4444' },
        { name: 'Stator Winding Short', count: 9, color: '#f59e0b' },
        { name: 'Broken Rotor Bar', count: 6, color: '#8b5cf6' },
        { name: 'Shaft Eccentricity', count: 4, color: '#ec4899' },
        { name: 'Thermal Overload', count: 8, color: '#3b82f6' },
      ],
      machineReliability: [
        { name: 'Motor IM-001', health: 88, mtbfHours: 4200, risk: 'MEDIUM' },
        { name: 'Pump CP-002', health: 74, mtbfHours: 2900, risk: 'HIGH' },
        { name: 'Compressor AC-001', health: 96, mtbfHours: 8100, risk: 'LOW' },
        { name: 'Blower EB-003', health: 62, mtbfHours: 1850, risk: 'CRITICAL' },
      ],
      sensorCorrelation: [
        { step: '1', vibration: 1.8, temperature: 55, current: 12.4, rpm: 2915 },
        { step: '2', vibration: 2.1, temperature: 58, current: 12.8, rpm: 2912 },
        { step: '3', vibration: 2.7, temperature: 62, current: 13.2, rpm: 2908 },
        { step: '4', vibration: 3.4, temperature: 68, current: 14.1, rpm: 2900 },
        { step: '5', vibration: 4.2, temperature: 74, current: 15.6, rpm: 2890 },
        { step: '6', vibration: 4.8, temperature: 77, current: 16.4, rpm: 2882 },
      ],
      failureRiskBreakdown: [
        { name: 'Low Risk', value: 65, color: '#22c55e' },
        { name: 'Medium Watch', value: 22, color: '#f59e0b' },
        { name: 'High / Critical', value: 13, color: '#ef4444' },
      ],
    };
  },
};
