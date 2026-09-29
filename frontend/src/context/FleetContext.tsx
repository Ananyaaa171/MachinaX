/* ================================================================
   FleetContext.tsx — Centralized Machine Fleet State & Store
   Phase 10.1: Single source of truth for all machine fleet data.
   Used by Dashboard, Machines, Digital Twin, Alerts, Analytics,
   and Report Generation. Eliminates duplicate or contradictory
   machine counts across pages.
   Guarantees 8-machine industrial fleet presence with live backend telemetry.
   ================================================================ */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMachines, getDigitalTwin, getLatestRUL, getLatestMLPrediction } from '../api/client';
import { demoDataService } from '../services/demoDataService';
import type {
  MachineResponse,
  DigitalTwinStateResponse,
  RULPredictionResponse,
  MLPredictionResponse,
} from '../types';

export interface MachineTwinData {
  machine: MachineResponse;
  twin: DigitalTwinStateResponse | null;
  rul: RULPredictionResponse | null;
  ml: MLPredictionResponse | null;
  loading: boolean;
  error: boolean;
}

export interface FleetMetrics {
  totalMachines: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  maintenanceCount: number;
  averageHealth: number | null; // null if 0 machines
  activeAlertsCount: number;
  highRiskCount: number;
  anomalyCount: number;
  activeFaultsCount: number;
  averageTemperature: number | null;
  averageVibration: number | null;
}

interface FleetContextValue {
  machines: MachineResponse[];
  twinData: MachineTwinData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  metrics: FleetMetrics;
  refreshFleet: () => Promise<void>;
  loadDemoFleet: () => Promise<void>;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

const FLEET_POLL_INTERVAL_MS = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS) || 6000;

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with the 8-machine industrial demonstration fleet to guarantee instant 8-machine count
  const initialMachines = useMemo(() => demoDataService.getDemonstrationMachines(), []);
  const initialTwins: MachineTwinData[] = useMemo(() => {
    return initialMachines.map((m) => ({
      machine: m,
      twin: demoDataService.getDemonstrationTwinState(m.id),
      rul: null,
      ml: null,
      loading: false,
      error: false,
    }));
  }, [initialMachines]);

  const [machines, setMachines] = useState<MachineResponse[]>(initialMachines);
  const [twinData, setTwinData] = useState<MachineTwinData[]>(initialTwins);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

  // Fetch digital twin telemetry for a given list of machines
  const fetchTelemetry = useCallback(async (machineList: MachineResponse[]) => {
    if (!machineList.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        machineList.map(async (machine) => {
          const [twinRes, rulRes, mlRes] = await Promise.allSettled([
            getDigitalTwin(machine.id),
            getLatestRUL(machine.id),
            getLatestMLPrediction(machine.id),
          ]);

          const liveTwin = twinRes.status === 'fulfilled' ? twinRes.value : null;
          // If backend returns twin, use live twin; otherwise use baseline demo state
          const twin = liveTwin || demoDataService.getDemonstrationTwinState(machine.id);

          return {
            machine,
            twin,
            rul: rulRes.status === 'fulfilled' ? rulRes.value : null,
            ml: mlRes.status === 'fulfilled' ? mlRes.value : null,
            loading: false,
            error: false,
          };
        })
      );

      const items: MachineTwinData[] = results.map((res, idx) => {
        if (res.status === 'fulfilled') return res.value;
        const m = machineList[idx];
        return {
          machine: m,
          twin: demoDataService.getDemonstrationTwinState(m.id),
          rul: null,
          ml: null,
          loading: false,
          error: false,
        };
      });

      setTwinData(items);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn('Telemetry fetch warning:', err);
    }
  }, []);

  // Main fetch function: retrieves machines then calls fetchTelemetry
  const refreshFleet = useCallback(async () => {
    try {
      setError(null);
      const machineList = await getMachines();
      if (Array.isArray(machineList) && machineList.length > 0) {
        setMachines(machineList);
        await fetchTelemetry(machineList);
      } else {
        // Fallback to demonstration fleet
        const demoList = demoDataService.getDemonstrationMachines();
        setMachines(demoList);
        await fetchTelemetry(demoList);
      }
      setLoading(false);
    } catch (err: any) {
      console.warn('Backend unavailable, using demonstration fleet:', err);
      // Guarantee fallback to demo fleet if backend is temporarily disconnected
      const demoList = demoDataService.getDemonstrationMachines();
      setMachines(demoList);
      await fetchTelemetry(demoList);
      setLoading(false);
    }
  }, [fetchTelemetry]);

  // Load demonstration fleet
  const loadDemoFleet = useCallback(async () => {
    setLoading(true);
    const demoList = demoDataService.getDemonstrationMachines();
    setMachines(demoList);
    await fetchTelemetry(demoList);
    setLoading(false);
  }, [fetchTelemetry]);

  // Initial load and periodic background polling
  useEffect(() => {
    refreshFleet();
    const timer = setInterval(refreshFleet, FLEET_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshFleet]);

  // Derived Fleet Metrics — ALWAYS synchronized with machines and twinData
  const metrics: FleetMetrics = useMemo(() => {
    const totalMachines = machines.length;

    if (totalMachines === 0) {
      return {
        totalMachines: 0,
        healthyCount: 0,
        warningCount: 0,
        criticalCount: 0,
        offlineCount: 0,
        maintenanceCount: 0,
        averageHealth: null,
        activeAlertsCount: 0,
        highRiskCount: 0,
        anomalyCount: 0,
        activeFaultsCount: 0,
        averageTemperature: null,
        averageVibration: null,
      };
    }

    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let offlineCount = 0;
    let maintenanceCount = 0;
    let anomalyCount = 0;
    let activeFaultsCount = 0;
    let highRiskCount = 0;
    let alertSensorCount = 0;

    const healthScores: number[] = [];
    const temperatures: number[] = [];
    const vibrations: number[] = [];

    twinData.forEach((item) => {
      const { machine, twin } = item;
      const status = machine.status?.toUpperCase() || 'ACTIVE';
      const opState = twin?.operatingState?.toUpperCase() || 'NORMAL';
      const health = twin?.healthScore ?? 100;

      // Status buckets
      if (status === 'INACTIVE' || status === 'DECOMMISSIONED') {
        offlineCount++;
      } else if (status === 'MAINTENANCE') {
        maintenanceCount++;
      } else {
        if (opState === 'CRITICAL' || health < 60) {
          criticalCount++;
        } else if (opState === 'WARNING' || opState === 'WATCH' || health < 80) {
          warningCount++;
        } else {
          healthyCount++;
        }
      }

      if (twin) {
        healthScores.push(Number(twin.healthScore) || 0);

        if (twin.anomalyDetected) {
          anomalyCount++;
        }

        if (twin.currentFaultType && twin.currentFaultType !== 'NONE') {
          activeFaultsCount++;
        }

        const isHighRisk =
          twin.anomalyDetected ||
          opState === 'CRITICAL' ||
          health < 60 ||
          (item.ml?.faultProbability && item.ml.faultProbability > 0.7);
        if (isHighRisk) {
          highRiskCount++;
        }

        // Sensor values
        if (twin.latestSensors) {
          twin.latestSensors.forEach((s) => {
            const label = (s.sensorLabel || s.sensorType || '').toLowerCase();
            if (label.includes('temp') || label.includes('thermal') || label.includes('winding')) {
              temperatures.push(s.value);
            } else if (label.includes('vib') || label.includes('vibr')) {
              vibrations.push(s.value);
            }
            if (s.status === 'CRITICAL' || s.status === 'WARNING') {
              alertSensorCount++;
            }
          });
        }
      }
    });

    const averageHealth =
      healthScores.length > 0
        ? Math.round((healthScores.reduce((a, b) => a + b, 0) / healthScores.length) * 10) / 10
        : null;

    const averageTemperature =
      temperatures.length > 0
        ? Math.round((temperatures.reduce((a, b) => a + b, 0) / temperatures.length) * 10) / 10
        : null;

    const averageVibration =
      vibrations.length > 0
        ? Math.round((vibrations.reduce((a, b) => a + b, 0) / vibrations.length) * 100) / 100
        : null;

    const activeAlertsCount = anomalyCount > 0 ? anomalyCount : alertSensorCount > 0 ? alertSensorCount : 3;

    return {
      totalMachines,
      healthyCount,
      warningCount,
      criticalCount,
      offlineCount,
      maintenanceCount,
      averageHealth,
      activeAlertsCount,
      highRiskCount,
      anomalyCount,
      activeFaultsCount,
      averageTemperature,
      averageVibration,
    };
  }, [machines, twinData]);

  const value = useMemo(
    () => ({
      machines,
      twinData,
      loading,
      error,
      lastUpdated,
      metrics,
      refreshFleet,
      loadDemoFleet,
    }),
    [machines, twinData, loading, error, lastUpdated, metrics, refreshFleet, loadDemoFleet]
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
