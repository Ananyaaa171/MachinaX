/* ================================================================
   MACHINA-X — TypeScript Interfaces
   Matches backend DTO response contracts exactly.
   ================================================================ */

// ---- Enums ----

export type OperatingState = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export type FaultType =
  | 'NONE'
  | 'BROKEN_ROTOR_BAR'
  | 'STATOR_SHORT'
  | 'BEARING_DEFECT'
  | 'ECCENTRICITY'
  | 'UNCLASSIFIED';

export type MachineStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export type ReadingQuality = 'GOOD' | 'SUSPECT' | 'BAD';

export type SensorSource = 'SIMULATED' | 'PHYSICAL' | 'DERIVED';

// ---- Machine ----

export interface MachineTypeResponse {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
}

export interface MachineResponse {
  id: number;
  name: string;
  serialNumber: string;
  location: string;
  machineType: MachineTypeResponse;
  ratedPowerKw: number | null;
  ratedVoltageV: number | null;
  ratedCurrentA: number | null;
  ratedSpeedRpm: number | null;
  installationDate: string | null;
  status: MachineStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- Sensor Type ----

export interface SensorTypeResponse {
  id: number;
  name: string;
  unit: string;
  description: string;
  physicalQuantity: string;
}

// ---- Machine Sensor ----

export interface MachineSensorResponse {
  id: number;
  machineId: number;
  sensorType: SensorTypeResponse;
  label: string;
  normalMin: number | null;
  normalMax: number | null;
  warningMin: number | null;
  warningMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
  isActive: boolean;
}

// ---- Sensor Reading ----

export interface SensorReadingResponse {
  id: number;
  machineSensorId: number;
  sensorLabel: string;
  sensorType: string;
  value: number;
  unit: string;
  quality: ReadingQuality;
  source: SensorSource;
  recordedAt: string;
  ingestedAt: string;
}

// ---- Sensor Trend Point ----

export interface SensorTrendPointResponse {
  id: number;
  sensorId: number;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
}

// ---- Digital Twin ----

export interface LatestSensorValueDto {
  sensorId: number;
  sensorLabel: string;
  sensorType: string;
  value: number;
  unit: string;
  status: string;
  normalMin: number | null;
  normalMax: number | null;
  warningMin: number | null;
  warningMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
  recordedAt: string;
}

export interface RULSummaryDto {
  estimatedHours: number | null;
  confidence: string | null;
  degradationTrend: string | null;
}

export interface MaintenanceSummaryDto {
  priority: string | null;
  recommendation: string | null;
}

export interface ExplanationSummaryDto {
  summary: string | null;
}

export interface DigitalTwinStateResponse {
  machineId: number;
  machineName: string;
  serialNumber: string;
  healthScore: number | null;
  operatingState: OperatingState;
  anomalyDetected: boolean | null;
  anomalyScore: number | null;
  currentFaultType: FaultType | null;
  faultProbability: number | null;
  latestSensors: LatestSensorValueDto[];
  lastSensorBatchAt: string | null;
  lastUpdatedAt: string | null;
  rul: RULSummaryDto | null;
  maintenance: MaintenanceSummaryDto | null;
  explanation: ExplanationSummaryDto | null;
}

// ---- ML Prediction ----

export interface MLPredictionResponse {
  id: number;
  machineId: number;
  anomalyDetected: boolean;
  anomalyScore: number | null;
  faultType: FaultType;
  faultProbability: number | null;
  modelVersion: string | null;
  modelName: string | null;
  inputFeatures: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  processingTimeMs: number | null;
  predictionTimestamp: string;
  createdAt: string;
}

// ---- Explanation ----

export interface FeatureContributionResponse {
  feature: string;
  value: number;
  shapValue: number;
  impact: string;
}

export interface ExplanationResponse {
  machineId: number;
  mlPredictionId: number;
  faultType: string;
  faultProbability: number | null;
  features: FeatureContributionResponse[];
  summary: string | null;
  modelVersion: string | null;
}

// ---- RUL Prediction ----

export interface RULPredictionResponse {
  id: number;
  machineId: number;
  estimatedRulHours: number | null;
  unit: string;
  confidence: string | null;
  degradationTrend: string | null;
  predictionTimestamp: string;
  modelVersion: string | null;
}

// ---- Maintenance Recommendation ----

export interface MaintenanceRecommendationResponse {
  id: number;
  machineId: number;
  priority: string | null;
  faultType: string | null;
  recommendation: string | null;
  generatedAt: string;
  status: string | null;
}

// ---- Paginated response (Spring Boot Page) ----

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
