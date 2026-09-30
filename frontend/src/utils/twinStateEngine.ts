/* ================================================================
   twinStateEngine.ts — Centralized Digital Twin State Engine
   Phase 10.3: Evaluates machine telemetry & state to produce
   independent, deterministic visual parameters for each Three-Phase
   Induction Motor Digital Twin instance.
   ================================================================ */

import type { MachineResponse, DigitalTwinStateResponse, OperatingState, FaultType } from '../types';

export type TwinOperatingState = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';

export type AffectedMotorComponent =
  | 'BEARING_DE'
  | 'BEARING_NDE'
  | 'STATOR'
  | 'ROTOR'
  | 'TERMINAL'
  | 'SHAFT'
  | 'COOLING_FAN'
  | 'NONE';

export interface TwinTelemetryValues {
  temperature: number; // °C
  vibration: number;   // mm/s
  current: number;     // A
  rpm: number;         // RPM
  load: number;        // %
  pressure: number;    // bar
}

export interface PhaseLineStatus {
  l1: 'NORMAL' | 'WARNING' | 'FAULT';
  l2: 'NORMAL' | 'WARNING' | 'FAULT';
  l3: 'NORMAL' | 'WARNING' | 'FAULT';
}

export interface TwinVisualState {
  operatingState: TwinOperatingState;
  healthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  faultType: FaultType;
  faultLabel: string;
  affectedComponent: AffectedMotorComponent;
  telemetry: TwinTelemetryValues;
  phases: PhaseLineStatus;
  colors: {
    primary: string;
    glow: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  };
  animation: {
    vibrateLevel: 'NONE' | 'MILD' | 'SEVERE';
    shaftSpeedSec: number;
    fanSpeedSec: number;
    electricalFlicker: boolean;
    thermalGlow: boolean;
    bearingFaultDE: boolean;
    bearingFaultNDE: boolean;
    shaftWobble: boolean;
  };
}

/**
 * Evaluates a machine and its digital twin response to produce
 * a complete, decoupled visual state for its Three-Phase Induction Motor Twin.
 */
export function evaluateTwinState(
  machine: MachineResponse,
  twin: DigitalTwinStateResponse | null
): TwinVisualState {
  const mStatus = (machine.status || 'ACTIVE').toUpperCase();
  const isOffline = mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED';
  const isMaintenance = mStatus === 'MAINTENANCE';

  // 1. Operating State
  let operatingState: TwinOperatingState = 'NORMAL';
  if (isOffline) {
    operatingState = 'OFFLINE';
  } else if (isMaintenance) {
    operatingState = 'MAINTENANCE';
  } else {
    const rawState = (twin?.operatingState as OperatingState) || 'NORMAL';
    if (rawState === 'CRITICAL') operatingState = 'CRITICAL';
    else if (rawState === 'WARNING' || rawState === 'WATCH') operatingState = 'WARNING';
    else operatingState = 'NORMAL';
  }

  // 2. Health Score
  const healthScore = isOffline
    ? 0
    : isMaintenance
    ? 85
    : Math.round(twin?.healthScore ?? 100);

  // 3. Risk Level
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    operatingState === 'CRITICAL' || healthScore < 50
      ? 'HIGH'
      : operatingState === 'WARNING' || healthScore < 80
      ? 'MEDIUM'
      : 'LOW';

  // 4. Fault Classification
  const faultType: FaultType = isOffline || isMaintenance
    ? 'NONE'
    : (twin?.currentFaultType as FaultType) || 'NONE';

  let faultLabel = 'Nominal / Healthy';
  if (isOffline) faultLabel = 'Asset Decommissioned / Offline';
  else if (isMaintenance) faultLabel = 'Scheduled Maintenance';
  else if (faultType === 'BEARING_DEFECT') faultLabel = 'Drive-End Bearing Degradation';
  else if (faultType === 'STATOR_SHORT') faultLabel = 'Stator Winding Inter-Turn Short';
  else if (faultType === 'BROKEN_ROTOR_BAR') faultLabel = 'Broken Rotor Bar Harmonic Ripple';
  else if (faultType === 'ECCENTRICITY') faultLabel = 'Dynamic Airgap Eccentricity';
  else if (faultType === 'UNCLASSIFIED' || (operatingState === 'CRITICAL' && faultType === 'NONE')) {
    faultLabel = 'Critical Operational Threshold Exceeded';
  }

  // 5. Sensor Telemetry Extraction
  const getSensor = (keywords: string[], fallback: number): number => {
    if (!twin?.latestSensors || twin.latestSensors.length === 0) return fallback;
    const found = twin.latestSensors.find((s) =>
      keywords.some(
        (kw) =>
          s.sensorType?.toLowerCase().includes(kw) ||
          s.sensorLabel?.toLowerCase().includes(kw)
      )
    );
    return found ? Number(found.value) : fallback;
  };

  // Base values tailored to operating state
  const baseVib = operatingState === 'CRITICAL' ? 6.8 : operatingState === 'WARNING' ? 3.8 : 1.5;
  const baseTemp = operatingState === 'CRITICAL' ? 84.0 : operatingState === 'WARNING' ? 68.0 : 52.0;
  const baseCurr = operatingState === 'CRITICAL' ? 22.5 : operatingState === 'WARNING' ? 17.5 : 13.8;
  const baseRpm = isOffline || isMaintenance ? 0 : machine.ratedSpeedRpm || 1480;

  const vibration = Number(getSensor(['vibr', 'accel'], baseVib).toFixed(2));
  const temperature = Number(getSensor(['temp', 'thermal'], baseTemp).toFixed(1));
  const current = Number(getSensor(['curr', 'amp'], baseCurr).toFixed(1));
  const rpm = Math.round(getSensor(['rpm', 'speed'], baseRpm));
  const load = isOffline ? 0 : Math.min(100, Math.round((current / (machine.ratedCurrentA || 28.0)) * 100));
  const pressure = isOffline ? 0.0 : Number((2.0 + (load / 100) * 0.7).toFixed(1));

  // 6. Affected Component Identification
  let affectedComponent: AffectedMotorComponent = 'NONE';
  if (faultType === 'BEARING_DEFECT') {
    affectedComponent = vibration > 5.5 ? 'BEARING_DE' : 'BEARING_NDE';
  } else if (vibration > 4.5) {
    affectedComponent = 'BEARING_DE';
  } else if (faultType === 'STATOR_SHORT' || temperature > 75) {
    affectedComponent = 'STATOR';
  } else if (faultType === 'BROKEN_ROTOR_BAR') {
    affectedComponent = 'ROTOR';
  } else if (faultType === 'ECCENTRICITY') {
    affectedComponent = 'SHAFT';
  } else if (operatingState === 'CRITICAL') {
    affectedComponent = 'STATOR';
  }

  // 7. Three-Phase Electrical Line Status (L1, L2, L3)
  const phases: PhaseLineStatus = {
    l1: 'NORMAL',
    l2: 'NORMAL',
    l3: 'NORMAL',
  };

  if (isOffline) {
    phases.l1 = 'NORMAL';
    phases.l2 = 'NORMAL';
    phases.l3 = 'NORMAL';
  } else if (faultType === 'STATOR_SHORT') {
    // Inter-turn stator short causes phase imbalance on L2
    phases.l1 = 'NORMAL';
    phases.l2 = 'FAULT';
    phases.l3 = 'WARNING';
  } else if (faultType === 'BROKEN_ROTOR_BAR') {
    phases.l1 = 'WARNING';
    phases.l2 = 'NORMAL';
    phases.l3 = 'WARNING';
  } else if (operatingState === 'CRITICAL') {
    phases.l1 = 'WARNING';
    phases.l2 = 'FAULT';
    phases.l3 = 'WARNING';
  } else if (operatingState === 'WARNING') {
    phases.l1 = 'NORMAL';
    phases.l2 = 'WARNING';
    phases.l3 = 'NORMAL';
  }

  // 8. Visual Colors & Theme Tokens
  const colors = {
    primary:
      operatingState === 'CRITICAL'
        ? '#ef4444'
        : operatingState === 'WARNING'
        ? '#f59e0b'
        : isMaintenance
        ? '#8b5cf6'
        : isOffline
        ? '#64748b'
        : '#06b6d4',
    glow:
      operatingState === 'CRITICAL'
        ? 'rgba(239, 68, 68, 0.4)'
        : operatingState === 'WARNING'
        ? 'rgba(245, 158, 11, 0.28)'
        : isMaintenance
        ? 'rgba(139, 92, 246, 0.25)'
        : isOffline
        ? 'rgba(100, 116, 139, 0.08)'
        : 'rgba(6, 182, 212, 0.18)',
    border:
      operatingState === 'CRITICAL'
        ? 'rgba(239, 68, 68, 0.45)'
        : operatingState === 'WARNING'
        ? 'rgba(245, 158, 11, 0.4)'
        : isMaintenance
        ? 'rgba(139, 92, 246, 0.35)'
        : 'rgba(255, 255, 255, 0.09)',
    badgeBg:
      operatingState === 'CRITICAL'
        ? 'rgba(239, 68, 68, 0.15)'
        : operatingState === 'WARNING'
        ? 'rgba(245, 158, 11, 0.15)'
        : isMaintenance
        ? 'rgba(139, 92, 246, 0.15)'
        : isOffline
        ? 'rgba(107, 114, 128, 0.15)'
        : 'rgba(34, 197, 94, 0.12)',
    badgeText:
      operatingState === 'CRITICAL'
        ? '#ef4444'
        : operatingState === 'WARNING'
        ? '#f59e0b'
        : isMaintenance
        ? '#a78bfa'
        : isOffline
        ? '#94a3b8'
        : '#22c55e',
  };

  // 9. Animation Parameters
  const isStopped = isOffline || isMaintenance || rpm === 0;
  const vibrateLevel = isStopped
    ? 'NONE'
    : operatingState === 'CRITICAL' || vibration > 5.0
    ? 'SEVERE'
    : operatingState === 'WARNING' || vibration > 2.8
    ? 'MILD'
    : 'NONE';

  // Rotation duration in seconds (lower = faster)
  const shaftSpeedSec = isStopped ? 0 : Math.max(0.4, Number((3000 / Math.max(rpm, 600)).toFixed(2)));
  const fanSpeedSec = isStopped ? 0 : shaftSpeedSec * 1.5;

  return {
    operatingState,
    healthScore,
    riskLevel,
    faultType,
    faultLabel,
    affectedComponent,
    telemetry: {
      temperature,
      vibration,
      current,
      rpm,
      load,
      pressure,
    },
    phases,
    colors,
    animation: {
      vibrateLevel,
      shaftSpeedSec,
      fanSpeedSec,
      electricalFlicker: faultType === 'STATOR_SHORT' || faultType === 'BROKEN_ROTOR_BAR',
      thermalGlow: temperature > 75 || faultType === 'STATOR_SHORT',
      bearingFaultDE: affectedComponent === 'BEARING_DE',
      bearingFaultNDE: affectedComponent === 'BEARING_NDE',
      shaftWobble: faultType === 'ECCENTRICITY',
    },
  };
}
