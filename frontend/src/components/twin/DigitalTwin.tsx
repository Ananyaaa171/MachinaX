/* ================================================================
   DigitalTwin.tsx — Unified Three-Phase Induction Motor Digital Twin
   Phase 10.3: Central, reusable Digital Twin component.
   Supports:
   - mode="compact" (for Fleet Digital Twin View grid)
   - mode="full" (for dedicated Machine Digital Twin inspection page)
   Each twin independently maps its own machine telemetry and state.
   ================================================================ */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MachineResponse, DigitalTwinStateResponse } from '../../types';
import { evaluateTwinState } from '../../utils/twinStateEngine';
import InductionMotorSvg from './InductionMotorSvg';
import SensorDetailModal, { type SensorData } from './SensorDetailModal';

export type TwinMode = 'compact' | 'fleet' | 'full' | 'operator' | 'maintenance' | 'reliability' | 'admin';

export interface DigitalTwinProps {
  machine: MachineResponse;
  twin?: DigitalTwinStateResponse | null;
  mode?: TwinMode;
  onRefresh?: () => void;
  pollingIntervalSeconds?: number;
}

export default function DigitalTwin({
  machine,
  twin = null,
  mode = 'compact',
  onRefresh,
  pollingIntervalSeconds = 2,
}: DigitalTwinProps) {
  const navigate = useNavigate();
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);

  // Maintenance mode: Exploded component view state
  const [exploded, setExploded] = useState(false);

  // Operator mode: Simulated machine control state
  const [simulatedState, setSimulatedState] = useState<'RUNNING' | 'STOPPED' | 'TRIPPED' | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showTripConfirm, setShowTripConfirm] = useState(false);
  const [operatorAlarmAcked, setOperatorAlarmAcked] = useState(false);

  // Evaluate twin state independently for THIS machine
  const baseState = evaluateTwinState(machine, twin);

  // Apply simulated override if operator triggered simulated action
  const state = React.useMemo(() => {
    if (!simulatedState) return baseState;
    if (simulatedState === 'TRIPPED') {
      return {
        ...baseState,
        operatingState: 'CRITICAL' as const,
        animation: {
          ...baseState.animation,
          shaftSpeedSec: 0,
          fanSpeedSec: 0,
          vibrateLevel: 'NONE' as const,
        },
        colors: {
          ...baseState.colors,
          primary: '#ef4444',
          badgeText: '#ef4444',
          badgeBg: 'rgba(239, 68, 68, 0.15)',
        },
      };
    }
    if (simulatedState === 'STOPPED') {
      return {
        ...baseState,
        operatingState: 'OFFLINE' as const,
        animation: {
          ...baseState.animation,
          shaftSpeedSec: 0,
          fanSpeedSec: 0,
          vibrateLevel: 'NONE' as const,
        },
        colors: {
          ...baseState.colors,
          primary: '#94a3b8',
          badgeText: '#94a3b8',
          badgeBg: 'rgba(148, 163, 184, 0.15)',
        },
      };
    }
    return baseState;
  }, [baseState, simulatedState]);

  const { operatingState, healthScore, riskLevel, faultType, faultLabel, telemetry, colors } = state;

  const isCritical = operatingState === 'CRITICAL' || simulatedState === 'TRIPPED';
  const isWarning = operatingState === 'WARNING';
  const isMaintenance = operatingState === 'MAINTENANCE';

  const cardStateClass = isCritical
    ? 'twin-card--critical'
    : isWarning
    ? 'twin-card--warning'
    : isMaintenance
    ? 'twin-card--maintenance'
    : '';

  return (
    <div
      className={`twin-card ${cardStateClass}`}
      id={`digital-twin-machine-${machine.id}`}
      data-testid="digital-twin-card"
      data-machine-id={machine.id}
      data-state={operatingState}
      style={{
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ================================================================
          1. TWIN CARD HEADER (Requirement 13)
          ================================================================ */}
      <div
        className="twin-card__header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: mode === 'full' ? '14px 20px' : '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem' }}>⚙</span>
            <span
              style={{
                fontSize: mode === 'full' ? '1.05rem' : '0.88rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '0.03em',
              }}
            >
              {machine.name.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 3,
                background: colors.badgeBg,
                color: colors.badgeText,
                textTransform: 'uppercase',
                border: `1px solid ${colors.primary}40`,
                letterSpacing: '0.04em',
              }}
            >
              ● {operatingState}
            </span>
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Three-Phase Induction Motor • S/N: {machine.serialNumber} • Location: {machine.location || 'Bay 3'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Health Score Pill */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Health
            </div>
            <div
              style={{
                fontSize: mode === 'full' ? '1.1rem' : '0.92rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: colors.primary,
              }}
            >
              {healthScore}%
            </div>
          </div>

          {/* Risk Level Badge */}
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 3,
              background:
                riskLevel === 'HIGH'
                  ? 'var(--color-critical-bg)'
                  : riskLevel === 'MEDIUM'
                  ? 'var(--color-warning-bg)'
                  : 'var(--color-healthy-bg)',
              color:
                riskLevel === 'HIGH'
                  ? 'var(--color-critical)'
                  : riskLevel === 'MEDIUM'
                  ? 'var(--color-warning)'
                  : 'var(--color-healthy)',
              border: `1px solid ${
                riskLevel === 'HIGH'
                  ? 'var(--color-critical-border)'
                  : riskLevel === 'MEDIUM'
                  ? 'var(--color-warning-border)'
                  : 'var(--color-healthy-border)'
              }`,
              textTransform: 'uppercase',
            }}
          >
            {riskLevel} RISK
          </div>

          {/* Maintenance Mode: Exploded View Toggle */}
          {mode === 'maintenance' && (
            <button
              className="btn btn--secondary"
              onClick={() => setExploded((prev) => !prev)}
              style={{
                padding: '3px 9px',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: exploded ? 'rgba(6, 182, 212, 0.2)' : undefined,
                borderColor: exploded ? '#06b6d4' : undefined,
                color: exploded ? 'var(--color-primary)' : 'var(--text-secondary)',
              }}
              id={`btn-toggle-exploded-${machine.id}`}
            >
              {exploded ? '⬒ Standard View' : '⬒ Exploded View'}
            </button>
          )}

          {/* Reliability Mode: Condition Badge */}
          {mode === 'reliability' && (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 3,
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                letterSpacing: '0.5px',
              }}
            >
              Condition Visualization
            </span>
          )}

          {/* Operator Mode: Status Tag */}
          {mode === 'operator' && (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 3,
                background: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--color-healthy)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                letterSpacing: '0.5px',
              }}
            >
              ● LIVE STREAM
            </span>
          )}

          {mode === 'full' && onRefresh && (
            <button
              className="btn btn--secondary"
              onClick={onRefresh}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              title="Refresh Telemetry"
            >
              ↻ Refresh
            </button>
          )}

          {mode === 'full' && (
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              ● LIVE • Updates every {pollingIntervalSeconds}s
            </span>
          )}
        </div>
      </div>

      {/* Active Fault Banner (if machine has a diagnosed fault) */}
      {faultType !== 'NONE' && (
        <div
          style={{
            padding: '5px 14px',
            background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            borderBottom: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: isCritical ? 'var(--color-critical)' : 'var(--color-warning)',
            fontWeight: 700,
          }}
        >
          <span>⚠ FAULT DIAGNOSED: {faultLabel}</span>
          <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>ISO 10816 CLASS II</span>
        </div>
      )}

      {/* Simulated Tripped / Stopped Banner */}
      {simulatedState && (
        <div
          style={{
            padding: '5px 14px',
            background: simulatedState === 'TRIPPED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.15)',
            borderBottom: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: simulatedState === 'TRIPPED' ? 'var(--color-critical)' : 'var(--text-secondary)',
          }}
        >
          <span>
            {simulatedState === 'TRIPPED' ? '🛑 SIMULATED TRIPPED STATE — Emergency Isolation Active' : '■ SIMULATED STOPPED STATE'}
          </span>
          <button
            onClick={() => setSimulatedState(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.65rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear Simulation Override
          </button>
        </div>
      )}

      {/* ================================================================
          2. THREE-PHASE INDUCTION MOTOR VECTOR SVG
          ================================================================ */}
      <div style={{ width: '100%', height: mode === 'full' ? '300px' : mode === 'compact' ? '175px' : '205px', background: '#060a14' }}>
        <InductionMotorSvg
          state={state}
          onSelectSensor={setSelectedSensor}
          interactive={true}
          mode={mode}
          exploded={exploded}
        />
      </div>

      {/* ================================================================
          3. REAL SENSOR TELEMETRY STRIP UNDERNEATH (Requirement 9 & 13)
          ================================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
          padding: '8px 12px',
          background: 'rgba(12, 17, 27, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          boxSizing: 'border-box',
        }}
      >
        {/* Temperature */}
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 3,
            background: telemetry.temperature > 75 ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
          }}
          onClick={() =>
            setSelectedSensor({
              id: `TMP-${machine.id}`,
              name: 'Stator Winding RTD (Pt100)',
              location: 'Stator Core Slot',
              value: telemetry.temperature,
              unit: '°C',
              status: telemetry.temperature > 75 ? 'CRITICAL' : telemetry.temperature > 65 ? 'WARNING' : 'NORMAL',
              normalRange: '40 – 65 °C',
              warningRange: '65 – 80 °C',
              criticalRange: '> 80 °C',
              standard: 'IEC 60034-1 Class F',
              description: 'Embedded Pt100 RTD measuring stator winding operating temperature.',
              icon: '🌡',
            })
          }
          title="Click to inspect Temperature"
        >
          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Temp
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: telemetry.temperature > 75 ? '#ef4444' : telemetry.temperature > 65 ? '#f59e0b' : 'var(--text-primary)',
            }}
          >
            {telemetry.temperature}°C
          </span>
        </div>

        {/* Vibration */}
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 3,
            background: telemetry.vibration > 4.5 ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
          }}
          onClick={() =>
            setSelectedSensor({
              id: `VIB-${machine.id}`,
              name: 'Drive-End Bearing Accelerometer',
              location: 'Drive-End Housing',
              value: telemetry.vibration,
              unit: 'mm/s',
              status: telemetry.vibration > 4.5 ? 'CRITICAL' : telemetry.vibration > 2.8 ? 'WARNING' : 'NORMAL',
              normalRange: '0.5 – 2.8 mm/s',
              warningRange: '2.8 – 4.5 mm/s',
              criticalRange: '> 4.5 mm/s',
              standard: 'ISO 10816-3 Class II',
              description: 'Piezoelectric vibration velocity sensor evaluating radial bearing vibration severity.',
              icon: '📊',
            })
          }
          title="Click to inspect Vibration"
        >
          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Vibration
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: telemetry.vibration > 4.5 ? '#ef4444' : telemetry.vibration > 2.8 ? '#f59e0b' : '#06b6d4',
            }}
          >
            {telemetry.vibration} mm/s
          </span>
        </div>

        {/* Current */}
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 3,
            background: telemetry.current > 22 ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
          }}
          onClick={() =>
            setSelectedSensor({
              id: `CUR-${machine.id}`,
              name: 'Three-Phase Stator Current CT',
              location: 'Conduit Terminal Box',
              value: telemetry.current,
              unit: 'A',
              status: telemetry.current > 22 ? 'CRITICAL' : telemetry.current > 18 ? 'WARNING' : 'NORMAL',
              normalRange: '10.0 – 16.0 A',
              warningRange: '16.0 – 22.0 A',
              criticalRange: '> 22.0 A',
              standard: 'Rated FLC: 28.0 A',
              description: 'Current transformer measuring true RMS stator phase current for load & balance.',
              icon: '⚡',
            })
          }
          title="Click to inspect Current"
        >
          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Current
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: telemetry.current > 22 ? '#ef4444' : telemetry.current > 18 ? '#f59e0b' : 'var(--text-primary)',
            }}
          >
            {telemetry.current} A
          </span>
        </div>

        {/* RPM */}
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
          onClick={() =>
            setSelectedSensor({
              id: `RPM-${machine.id}`,
              name: 'Optical Shaft Speed Tachometer',
              location: 'Drive Shaft Output',
              value: telemetry.rpm,
              unit: 'RPM',
              status: 'NORMAL',
              normalRange: '1420 – 1500 RPM',
              warningRange: '1200 – 1420 RPM',
              criticalRange: '< 1200 RPM',
              standard: 'Rated Speed: 1480 RPM',
              description: 'Optical encoder monitoring shaft rotational speed and rotor slip velocity.',
              icon: '🔄',
            })
          }
          title="Click to inspect Speed"
        >
          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Speed
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {telemetry.rpm} RPM
          </span>
        </div>

        {/* Load */}
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
          title="Mechanical Load Ratio"
        >
          <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Load
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: telemetry.load > 90 ? '#ef4444' : telemetry.load > 80 ? '#f59e0b' : 'var(--text-primary)',
            }}
          >
            {telemetry.load}%
          </span>
        </div>
      </div>

      {/* ================================================================
          3.1 OPERATOR MODE: CONTROL INTERFACE & THERMAL/ELECTRICAL TELEMETRY
          ================================================================ */}
      {mode === 'operator' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--border-subtle)', padding: '10px 14px' }}>
          {/* Operator Demo Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CONTROLS (SIMULATED):
              </span>
              <button
                className="btn btn--secondary"
                onClick={() => setSimulatedState('RUNNING')}
                style={{ padding: '3px 8px', fontSize: '0.68rem', color: 'var(--color-healthy)', borderColor: 'rgba(34, 197, 94, 0.3)' }}
                id={`btn-op-start-${machine.id}`}
                title="Simulate machine start"
              >
                ▶ Start
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => setShowStopConfirm(true)}
                style={{ padding: '3px 8px', fontSize: '0.68rem', color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                id={`btn-op-stop-${machine.id}`}
                title="Simulate machine controlled stop"
              >
                ■ Stop
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => setShowTripConfirm(true)}
                style={{ padding: '3px 8px', fontSize: '0.68rem', color: 'var(--color-critical)', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                id={`btn-op-trip-${machine.id}`}
                title="Simulate emergency electrical isolation / trip"
              >
                🛑 Emergency Stop / Isolation
              </button>
            </div>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Demonstration / Simulation Controls</span>
          </div>

          {/* Three-Phase Electrical & Thermal Monitoring Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, fontSize: '0.68rem' }}>
            {/* Electrical Phase Currents */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phase Current (A)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 2, display: 'flex', gap: 6 }}>
                <span style={{ color: '#38bdf8' }}>L1: {telemetry.current.toFixed(1)}</span>
                <span style={{ color: '#f59e0b' }}>L2: {(telemetry.current * 1.02).toFixed(1)}</span>
                <span style={{ color: '#a78bfa' }}>L3: {(telemetry.current * 0.99).toFixed(1)}</span>
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2 }}>Freq: 50.0 Hz • PF: 0.88</div>
            </div>

            {/* Thermal Monitoring Breakdown */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thermal Distribution</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 2, display: 'flex', gap: 6 }}>
                <span style={{ color: telemetry.temperature > 75 ? '#ef4444' : 'var(--text-primary)' }}>W: {telemetry.temperature.toFixed(0)}°C</span>
                <span style={{ color: 'var(--text-secondary)' }}>C: {(telemetry.temperature * 0.92).toFixed(0)}°C</span>
                <span style={{ color: 'var(--text-secondary)' }}>H: {(telemetry.temperature * 0.84).toFixed(0)}°C</span>
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Winding / Core / Housing ({telemetry.temperature > 75 ? 'Critical' : telemetry.temperature > 65 ? 'Warning' : 'Normal'})
              </div>
            </div>
          </div>

          {/* Immediate Operator Alarms Banner */}
          {(isCritical || isWarning) && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: isCritical ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem' }}>
              <div>
                <span style={{ fontWeight: 800, color: isCritical ? 'var(--color-critical)' : 'var(--color-warning)' }}>
                  {isCritical ? '🚨 ALARM: HIGH VIBRATION & THERMAL SPIKE' : '⚠ WARNING: TELEMETRY APPROACHING THRESHOLD'}
                </span>
                <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>
                  {isCritical ? 'Motor Trip / Vibration Exceedance' : 'Check phase balance'}
                </span>
              </div>
              {operatorAlarmAcked ? (
                <span style={{ color: 'var(--color-healthy)', fontWeight: 700 }}>✓ Acknowledged</span>
              ) : (
                <button
                  className="btn btn--secondary"
                  onClick={() => setOperatorAlarmAcked(true)}
                  style={{ padding: '2px 8px', fontSize: '0.65rem', color: '#f59e0b', borderColor: '#f59e0b' }}
                >
                  Acknowledge Alert
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          3.2 MAINTENANCE MODE: LOTO & DETAILED MOTOR COMPONENTS
          ================================================================ */}
      {mode === 'maintenance' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--border-subtle)', padding: '10px 14px' }}>
          {/* Lockout / Tagout Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.68rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>ISOLATION STATUS:</span>
              {operatingState === 'CRITICAL' || isMaintenance || simulatedState === 'TRIPPED' || simulatedState === 'STOPPED' ? (
                <span style={{ color: 'var(--color-healthy)', fontWeight: 800 }}>
                  🔒 LOCKOUT / TAGOUT CONFIRMED • Maintenance Safe to Begin
                </span>
              ) : (
                <span style={{ color: 'var(--color-warning)', fontWeight: 800 }}>
                  ⚡ MACHINE RUNNING — Isolation Required Before Physical Work
                </span>
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Procedure: OSHA 1910.147 (LOTO)</span>
          </div>

          {/* Motor Components Breakdown Table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6, fontSize: '0.64rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '5px 7px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-muted)' }}>DE Bearing</div>
              <div style={{ fontWeight: 700, color: isCritical ? 'var(--color-critical)' : 'var(--text-primary)' }}>BRG-6205-2RS-C3</div>
              <div style={{ color: isCritical ? 'var(--color-critical)' : 'var(--color-healthy)' }}>
                {isCritical ? 'Replacement Due' : 'Operational'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '5px 7px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-muted)' }}>NDE Bearing</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>BRG-6204-2RS</div>
              <div style={{ color: 'var(--color-healthy)' }}>Operational</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '5px 7px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Stator Housing</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>STA-4P-5KW</div>
              <div style={{ color: 'var(--color-healthy)' }}>Finned Cast Iron</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '5px 7px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Cooling Fan</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>FAN-POLY-210</div>
              <div style={{ color: 'var(--color-healthy)' }}>Balanced Polypropylene</div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          3.3 RELIABILITY MODE: PROGNOSTIC DEGRADATION & HOTSPOTS
          ================================================================ */}
      {mode === 'reliability' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--border-subtle)', padding: '8px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6, fontSize: '0.68rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated RUL</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--color-healthy)', marginTop: 2 }}>
                {isCritical ? '4 Days' : isWarning ? '18 Days' : '45 Days'}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Weibull 90% CI</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failure Probability</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--text-primary)', marginTop: 2 }}>
                {isCritical ? '84.2%' : isWarning ? '41.5%' : '6.8%'}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Next 14 Days</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Anomaly Score</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isCritical ? '#ef4444' : 'var(--text-primary)', marginTop: 2 }}>
                {isCritical ? '0.88 (High)' : isWarning ? '0.46 (Moderate)' : '0.12 (Nominal)'}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Autoencoder Reconstruct</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Hotspots</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isCritical ? '#ef4444' : '#f59e0b', marginTop: 2 }}>
                {isCritical ? 'Bearing + Thermal' : isWarning ? 'Vibration Ripple' : 'None Detected'}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Condition Visualizer</div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          3.4 ADMIN MODE: DATA PIPELINE CONNECTIVITY OVERVIEW
          ================================================================ */}
      {mode === 'admin' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid var(--border-subtle)', padding: '8px 14px' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
            DIGITAL TWIN PIPELINE CONNECTION:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ color: 'var(--color-healthy)', fontWeight: 700 }}>MOTOR</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--color-healthy)', fontWeight: 700 }}>CT/RTD SENSORS</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--color-info)', fontWeight: 700 }}>SIMULATED GATEWAY</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--color-healthy)', fontWeight: 700 }}>SPRING BOOT API</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--color-healthy)', fontWeight: 700 }}>JPA DATABASE</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>DIGITAL TWIN (Active)</span>
          </div>
        </div>
      )}

      {/* ================================================================
          4. ACTION FOOTER (Requirement 13)
          ================================================================ */}
      {mode !== 'full' && (
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.01)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            3Φ Phase: <strong style={{ color: '#38bdf8' }}>L1</strong> •{' '}
            <strong style={{ color: state.phases.l2 === 'FAULT' ? '#ef4444' : '#f59e0b' }}>L2</strong> •{' '}
            <strong style={{ color: '#a78bfa' }}>L3</strong>
          </span>

          <button
            className="btn btn--secondary"
            onClick={() => navigate(`/machines/${machine.id}`)}
            style={{
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--color-info)',
              borderColor: 'var(--border-medium)',
            }}
            id={`btn-view-twin-${machine.id}`}
          >
            {mode === 'compact' ? 'VIEW MACHINE →' : 'VIEW FULL TWIN →'}
          </button>
        </div>
      )}

      {/* Stop Confirmation Dialog */}
      {showStopConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Confirm Controlled Stop
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
              Are you sure you want to stop <strong>{machine.name}</strong>?
              <br />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                This is a simulated industrial control action. The digital twin will decelerate to a stopped state.
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn--secondary" onClick={() => setShowStopConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setSimulatedState('STOPPED');
                  setShowStopConfirm(false);
                }}
                style={{ color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                id="btn-confirm-stop"
              >
                Confirm Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Trip Confirmation Dialog */}
      {showTripConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-critical)', marginBottom: 8 }}>
              🛑 Emergency Electrical Isolation
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
              Emergency isolation will place this machine in a simulated <strong>TRIPPED</strong> state.
              <br />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Power supply will be simulated as cut immediately. Are you sure you want to proceed?
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn--secondary" onClick={() => setShowTripConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setSimulatedState('TRIPPED');
                  setShowTripConfirm(false);
                }}
                style={{ background: 'var(--color-critical)', borderColor: 'var(--color-critical)' }}
                id="btn-confirm-trip"
              >
                Confirm Emergency Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sensor Detail Inspection Modal */}
      {selectedSensor && (
        <SensorDetailModal sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
      )}
    </div>
  );
}
