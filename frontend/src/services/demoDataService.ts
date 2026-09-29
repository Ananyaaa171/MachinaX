import type { MachineResponse, DigitalTwinStateResponse } from '../types';

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

  // Demonstration Fleet Single-Source-of-Truth Fallback (8 Machines: 5 Healthy, 2 Warning, 1 Critical)
  getDemonstrationMachines(): MachineResponse[] {
    return [
      {
        id: 1,
        name: 'Motor IM-001',
        serialNumber: 'IM-001',
        location: 'Plant A - Bay 3',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'ABB', category: 'Electric Motor' },
        ratedPowerKw: 15.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 28.0,
        ratedSpeedRpm: 2900.0,
        installationDate: '2026-01-15',
        status: 'ACTIVE',
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 20,
        name: 'Motor IM-002',
        serialNumber: 'IM-002',
        location: 'Plant A - Bay 4',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'Siemens', category: 'Electric Motor' },
        ratedPowerKw: 15.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 28.0,
        ratedSpeedRpm: 2900.0,
        installationDate: '2026-01-20',
        status: 'ACTIVE',
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
      },
      {
        id: 21,
        name: 'Motor IM-003',
        serialNumber: 'IM-003',
        location: 'Plant B - Line 1',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'WEG', category: 'Electric Motor' },
        ratedPowerKw: 22.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 40.0,
        ratedSpeedRpm: 2950.0,
        installationDate: '2025-11-10',
        status: 'ACTIVE',
        createdAt: '2025-11-10T00:00:00Z',
        updatedAt: '2025-11-10T00:00:00Z',
      },
      {
        id: 22,
        name: 'Motor IM-004',
        serialNumber: 'IM-004',
        location: 'Plant B - Line 2',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'ABB', category: 'Electric Motor' },
        ratedPowerKw: 22.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 40.0,
        ratedSpeedRpm: 2950.0,
        installationDate: '2025-11-12',
        status: 'ACTIVE',
        createdAt: '2025-11-12T00:00:00Z',
        updatedAt: '2025-11-12T00:00:00Z',
      },
      {
        id: 23,
        name: 'Motor IM-005',
        serialNumber: 'IM-005',
        location: 'Plant C - Compressor 1',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'Schneider', category: 'Electric Motor' },
        ratedPowerKw: 30.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 54.0,
        ratedSpeedRpm: 1480.0,
        installationDate: '2025-08-05',
        status: 'ACTIVE',
        createdAt: '2025-08-05T00:00:00Z',
        updatedAt: '2025-08-05T00:00:00Z',
      },
      {
        id: 24,
        name: 'Motor IM-006',
        serialNumber: 'IM-006',
        location: 'Plant C - Compressor 2',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'Siemens', category: 'Electric Motor' },
        ratedPowerKw: 30.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 54.0,
        ratedSpeedRpm: 1480.0,
        installationDate: '2025-08-08',
        status: 'ACTIVE',
        createdAt: '2025-08-08T00:00:00Z',
        updatedAt: '2025-08-08T00:00:00Z',
      },
      {
        id: 25,
        name: 'Motor IM-007',
        serialNumber: 'IM-007',
        location: 'Plant D - Pump Station',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'WEG', category: 'Electric Motor' },
        ratedPowerKw: 11.0,
        ratedVoltageV: 415.0,
        ratedCurrentA: 21.0,
        ratedSpeedRpm: 1450.0,
        installationDate: '2026-02-01',
        status: 'ACTIVE',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 26,
        name: 'Motor IM-008',
        serialNumber: 'IM-008',
        location: 'Plant D - Auxiliary Feed',
        machineType: { id: 1, name: 'THREE_PHASE_INDUCTION_MOTOR', manufacturer: 'ABB', category: 'Electric Motor' },
        ratedPowerKw: 7.5,
        ratedVoltageV: 415.0,
        ratedCurrentA: 15.0,
        ratedSpeedRpm: 1450.0,
        installationDate: '2026-02-15',
        status: 'ACTIVE',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-02-15T00:00:00Z',
      },
    ];
  },

  getDemonstrationTwinState(machineId: number): DigitalTwinStateResponse {
    const defaultState: DigitalTwinStateResponse = {
      machineId,
      machineName: `Motor IM-00${machineId}`,
      serialNumber: `IM-00${machineId}`,
      healthScore: 95.0,
      operatingState: 'NORMAL',
      anomalyDetected: false,
      anomalyScore: 0.04,
      currentFaultType: 'NONE',
      faultProbability: 0.03,
      latestSensors: [
        { sensorId: 1, sensorLabel: 'Drive-End Bearing Vibration', sensorType: 'VIBRATION', value: 1.2, unit: 'mm/s', status: 'NORMAL', normalMin: 0.5, normalMax: 2.8, warningMin: 2.8, warningMax: 4.5, criticalMin: 4.5, criticalMax: 8.0, recordedAt: new Date().toISOString() },
        { sensorId: 2, sensorLabel: 'Stator Phase Current RMS', sensorType: 'CURRENT', value: 24.5, unit: 'A', status: 'NORMAL', normalMin: 10, normalMax: 45, warningMin: 45, warningMax: 60, criticalMin: 60, criticalMax: 90, recordedAt: new Date().toISOString() },
        { sensorId: 3, sensorLabel: 'Winding Temperature', sensorType: 'TEMPERATURE', value: 52.0, unit: '°C', status: 'NORMAL', normalMin: 40, normalMax: 75, warningMin: 75, warningMax: 90, criticalMin: 90, criticalMax: 120, recordedAt: new Date().toISOString() },
        { sensorId: 4, sensorLabel: 'Rotor Speed', sensorType: 'RPM', value: 2920.0, unit: 'rpm', status: 'NORMAL', normalMin: 1400, normalMax: 3000, warningMin: 1200, warningMax: 1400, criticalMin: 1000, criticalMax: 1200, recordedAt: new Date().toISOString() },
      ],
      lastSensorBatchAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      rul: { estimatedHours: 2400.0, confidence: 'HIGH', degradationTrend: 'STABLE' },
      maintenance: { priority: 'P4_LOW', recommendation: 'Routine continuous monitoring. Baseline normal.' },
      explanation: null,
    };

    if (machineId === 20) {
      // IM-002: Warning — Bearing Degradation
      return {
        ...defaultState,
        healthScore: 76.0,
        operatingState: 'WARNING',
        anomalyDetected: true,
        anomalyScore: 0.24,
        currentFaultType: 'BEARING_DEFECT',
        faultProbability: 0.82,
        latestSensors: [
          { sensorId: 24, sensorLabel: 'Drive-End Bearing Vibration', sensorType: 'VIBRATION', value: 4.90, unit: 'mm/s', status: 'WARNING', normalMin: 0.5, normalMax: 2.8, warningMin: 2.8, warningMax: 4.5, criticalMin: 4.5, criticalMax: 8.0, recordedAt: new Date().toISOString() },
          { sensorId: 31, sensorLabel: 'Stator Phase Current RMS', sensorType: 'CURRENT', value: 32.0, unit: 'A', status: 'NORMAL', normalMin: 10, normalMax: 45, warningMin: 45, warningMax: 60, criticalMin: 60, criticalMax: 90, recordedAt: new Date().toISOString() },
          { sensorId: 38, sensorLabel: 'Winding Temperature', sensorType: 'TEMPERATURE', value: 72.0, unit: '°C', status: 'NORMAL', normalMin: 40, normalMax: 75, warningMin: 75, warningMax: 90, criticalMin: 90, criticalMax: 120, recordedAt: new Date().toISOString() },
          { sensorId: 45, sensorLabel: 'Rotor Speed', sensorType: 'RPM', value: 2880.0, unit: 'rpm', status: 'NORMAL', normalMin: 1400, normalMax: 3000, warningMin: 1200, warningMax: 1400, criticalMin: 1000, criticalMax: 1200, recordedAt: new Date().toISOString() },
        ],
        rul: { estimatedHours: 312.0, confidence: 'MEDIUM', degradationTrend: 'DEGRADING' },
        maintenance: { priority: 'P2_MEDIUM', recommendation: 'Bearing lubrication & vibration re-alignment scheduled within 72h.' },
      };
    }

    if (machineId === 21) {
      // IM-003: Critical — Stator Short / Overheating
      return {
        ...defaultState,
        healthScore: 42.0,
        operatingState: 'CRITICAL',
        anomalyDetected: true,
        anomalyScore: 0.58,
        currentFaultType: 'STATOR_SHORT',
        faultProbability: 0.94,
        latestSensors: [
          { sensorId: 25, sensorLabel: 'Drive-End Bearing Vibration', sensorType: 'VIBRATION', value: 7.20, unit: 'mm/s', status: 'CRITICAL', normalMin: 0.5, normalMax: 2.8, warningMin: 2.8, warningMax: 4.5, criticalMin: 4.5, criticalMax: 8.0, recordedAt: new Date().toISOString() },
          { sensorId: 32, sensorLabel: 'Stator Phase Current RMS', sensorType: 'CURRENT', value: 43.0, unit: 'A', status: 'NORMAL', normalMin: 10, normalMax: 45, warningMin: 45, warningMax: 60, criticalMin: 60, criticalMax: 90, recordedAt: new Date().toISOString() },
          { sensorId: 39, sensorLabel: 'Winding Temperature', sensorType: 'TEMPERATURE', value: 98.0, unit: '°C', status: 'CRITICAL', normalMin: 40, normalMax: 75, warningMin: 75, warningMax: 90, criticalMin: 90, criticalMax: 120, recordedAt: new Date().toISOString() },
          { sensorId: 46, sensorLabel: 'Rotor Speed', sensorType: 'RPM', value: 2620.0, unit: 'rpm', status: 'NORMAL', normalMin: 1400, normalMax: 3000, warningMin: 1200, warningMax: 1400, criticalMin: 1000, criticalMax: 1200, recordedAt: new Date().toISOString() },
        ],
        rul: { estimatedHours: 48.0, confidence: 'HIGH', degradationTrend: 'DEGRADING' },
        maintenance: { priority: 'P1_CRITICAL', recommendation: 'Urgent isolation: stator thermal overload inspection required immediately.' },
      };
    }

    if (machineId === 24) {
      // IM-006: Warning — Thermal Stress
      return {
        ...defaultState,
        healthScore: 68.0,
        operatingState: 'WARNING',
        anomalyDetected: true,
        anomalyScore: 0.32,
        currentFaultType: 'UNCLASSIFIED',
        faultProbability: 0.78,
        latestSensors: [
          { sensorId: 28, sensorLabel: 'Drive-End Bearing Vibration', sensorType: 'VIBRATION', value: 3.80, unit: 'mm/s', status: 'WARNING', normalMin: 0.5, normalMax: 2.8, warningMin: 2.8, warningMax: 4.5, criticalMin: 4.5, criticalMax: 8.0, recordedAt: new Date().toISOString() },
          { sensorId: 35, sensorLabel: 'Stator Phase Current RMS', sensorType: 'CURRENT', value: 50.0, unit: 'A', status: 'WARNING', normalMin: 10, normalMax: 45, warningMin: 45, warningMax: 60, criticalMin: 60, criticalMax: 90, recordedAt: new Date().toISOString() },
          { sensorId: 42, sensorLabel: 'Winding Temperature', sensorType: 'TEMPERATURE', value: 88.0, unit: '°C', status: 'WARNING', normalMin: 40, normalMax: 75, warningMin: 75, warningMax: 90, criticalMin: 90, criticalMax: 120, recordedAt: new Date().toISOString() },
          { sensorId: 49, sensorLabel: 'Rotor Speed', sensorType: 'RPM', value: 1465.0, unit: 'rpm', status: 'NORMAL', normalMin: 1400, normalMax: 3000, warningMin: 1200, warningMax: 1400, criticalMin: 1000, criticalMax: 1200, recordedAt: new Date().toISOString() },
        ],
        rul: { estimatedHours: 180.0, confidence: 'MEDIUM', degradationTrend: 'DEGRADING' },
        maintenance: { priority: 'P2_MEDIUM', recommendation: 'Cooling duct cleanout and thermal load distribution inspection.' },
      };
    }

    return defaultState;
  },
};
