/* ================================================================
   MACHINA-X — Dashboard Data Hook
   Aggregates all data fetching for the selected machine.
   Uses the Digital Twin endpoint as the primary polled source.
   ML, explanation, RUL, and maintenance are fetched independently.
   ================================================================ */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getDigitalTwin,
  getLatestMLPrediction,
  getLatestExplanation,
  getLatestRUL,
  getLatestMaintenance,
  getMachineSensors,
} from '../api/client';
import type {
  DigitalTwinStateResponse,
  MLPredictionResponse,
  ExplanationResponse,
  RULPredictionResponse,
  MaintenanceRecommendationResponse,
  MachineSensorResponse,
} from '../types';

const REFRESH_INTERVAL = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS) || 5000;

export interface DashboardData {
  digitalTwin: DigitalTwinStateResponse | null;
  mlPrediction: MLPredictionResponse | null;
  explanation: ExplanationResponse | null;
  rul: RULPredictionResponse | null;
  maintenance: MaintenanceRecommendationResponse | null;
  sensors: MachineSensorResponse[];
}

export interface DashboardErrors {
  digitalTwin: Error | null;
  mlPrediction: Error | null;
  explanation: Error | null;
  rul: Error | null;
  maintenance: Error | null;
  sensors: Error | null;
}

export interface UseDashboardResult {
  data: DashboardData;
  errors: DashboardErrors;
  loading: boolean;
  lastUpdated: Date | null;
  backendOnline: boolean;
  refresh: () => void;
}

export function useDashboard(machineId: number | null): UseDashboardResult {
  const [data, setData] = useState<DashboardData>({
    digitalTwin: null,
    mlPrediction: null,
    explanation: null,
    rul: null,
    maintenance: null,
    sensors: [],
  });

  const [errors, setErrors] = useState<DashboardErrors>({
    digitalTwin: null,
    mlPrediction: null,
    explanation: null,
    rul: null,
    maintenance: null,
    sensors: null,
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);

  const isFetchingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    if (!machineId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    const newErrors: DashboardErrors = {
      digitalTwin: null,
      mlPrediction: null,
      explanation: null,
      rul: null,
      maintenance: null,
      sensors: null,
    };

    let anySuccess = false;

    // Fetch all in parallel — failures are isolated per section
    const [
      twinResult,
      mlResult,
      explResult,
      rulResult,
      maintResult,
      sensorsResult,
    ] = await Promise.allSettled([
      getDigitalTwin(machineId),
      getLatestMLPrediction(machineId),
      getLatestExplanation(machineId),
      getLatestRUL(machineId),
      getLatestMaintenance(machineId),
      getMachineSensors(machineId),
    ]);

    if (!mountedRef.current) {
      isFetchingRef.current = false;
      return;
    }

    // Process Digital Twin
    if (twinResult.status === 'fulfilled') {
      setData((prev) => ({ ...prev, digitalTwin: twinResult.value }));
      anySuccess = true;
    } else {
      newErrors.digitalTwin = twinResult.reason;
    }

    // Process ML Prediction
    if (mlResult.status === 'fulfilled') {
      setData((prev) => ({ ...prev, mlPrediction: mlResult.value }));
      anySuccess = true;
    } else {
      newErrors.mlPrediction = mlResult.reason;
    }

    // Process Explanation
    if (explResult.status === 'fulfilled') {
      setData((prev) => ({ ...prev, explanation: explResult.value }));
      anySuccess = true;
    } else {
      newErrors.explanation = explResult.reason;
    }

    // Process RUL
    if (rulResult.status === 'fulfilled') {
      setData((prev) => ({ ...prev, rul: rulResult.value }));
      anySuccess = true;
    } else {
      newErrors.rul = rulResult.reason;
    }

    // Process Maintenance
    if (maintResult.status === 'fulfilled') {
      setData((prev) => ({ ...prev, maintenance: maintResult.value }));
      anySuccess = true;
    } else {
      newErrors.maintenance = maintResult.reason;
    }

    // Process Sensors
    if (sensorsResult.status === 'fulfilled') {
      setData((prev) => ({ ...prev, sensors: sensorsResult.value }));
      anySuccess = true;
    } else {
      newErrors.sensors = sensorsResult.reason;
    }

    setErrors(newErrors);
    setBackendOnline(anySuccess);
    if (anySuccess) {
      setLastUpdated(new Date());
    }
    setLoading(false);
    isFetchingRef.current = false;
  }, [machineId]);

  useEffect(() => {
    mountedRef.current = true;

    // Reset state when machine changes
    setData({
      digitalTwin: null,
      mlPrediction: null,
      explanation: null,
      rul: null,
      maintenance: null,
      sensors: [],
    });
    setErrors({
      digitalTwin: null,
      mlPrediction: null,
      explanation: null,
      rul: null,
      maintenance: null,
      sensors: null,
    });
    setLoading(true);
    setLastUpdated(null);

    if (!machineId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchAll();

    // Polling
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [machineId, fetchAll]);

  return {
    data,
    errors,
    loading,
    lastUpdated,
    backendOnline,
    refresh: fetchAll,
  };
}
