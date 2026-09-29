/* ================================================================
   MACHINA-X — Centralized API Client
   All backend communication goes through this module.
   No raw fetch calls in UI components.
   ================================================================ */

import type {
  MachineResponse,
  MachineSensorResponse,
  DigitalTwinStateResponse,
  SensorTrendPointResponse,
  MLPredictionResponse,
  ExplanationResponse,
  RULPredictionResponse,
  MaintenanceRecommendationResponse,
  SensorReadingResponse,
  PageResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  return response.json();
}

// ---- Machine APIs ----

export function getMachines(): Promise<MachineResponse[]> {
  return request<MachineResponse[]>('/api/v1/machines');
}

export function getMachine(machineId: number): Promise<MachineResponse> {
  return request<MachineResponse>(`/api/v1/machines/${machineId}`);
}

// ---- Machine Sensor APIs ----

export function getMachineSensors(machineId: number): Promise<MachineSensorResponse[]> {
  return request<MachineSensorResponse[]>(`/api/v1/machines/${machineId}/sensors`);
}

// ---- Digital Twin ----

export function getDigitalTwin(machineId: number): Promise<DigitalTwinStateResponse> {
  return request<DigitalTwinStateResponse>(`/api/v1/machines/${machineId}/digital-twin`);
}

// ---- Sensor Readings ----

export function getSensorReadings(
  machineId: number,
  sensorId?: number,
  page = 0,
  size = 20,
): Promise<PageResponse<SensorReadingResponse>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'recordedAt,desc',
  });
  if (sensorId !== undefined) {
    params.set('sensorId', String(sensorId));
  }
  return request<PageResponse<SensorReadingResponse>>(
    `/api/v1/machines/${machineId}/readings?${params}`,
  );
}

// ---- Sensor Trends ----

export function getSensorTrend(
  machineId: number,
  sensorId: number,
  limit = 60,
): Promise<SensorTrendPointResponse[]> {
  return request<SensorTrendPointResponse[]>(
    `/api/v1/machines/${machineId}/sensors/${sensorId}/trend?limit=${limit}`,
  );
}

// ---- ML Prediction ----

export function getLatestMLPrediction(
  machineId: number,
): Promise<MLPredictionResponse | null> {
  return request<MLPredictionResponse | null>(
    `/api/v1/machines/${machineId}/ml-prediction/latest`,
  );
}

// ---- Explanation ----

export function getLatestExplanation(
  machineId: number,
): Promise<ExplanationResponse | null> {
  return request<ExplanationResponse | null>(
    `/api/v1/machines/${machineId}/explanations/latest`,
  );
}

// ---- RUL ----

export function getLatestRUL(
  machineId: number,
): Promise<RULPredictionResponse | null> {
  return request<RULPredictionResponse | null>(
    `/api/v1/machines/${machineId}/rul/latest`,
  );
}

// ---- Maintenance ----

export function getLatestMaintenance(
  machineId: number,
): Promise<MaintenanceRecommendationResponse | null> {
  return request<MaintenanceRecommendationResponse | null>(
    `/api/v1/machines/${machineId}/maintenance/latest`,
  );
}

export { ApiError };
