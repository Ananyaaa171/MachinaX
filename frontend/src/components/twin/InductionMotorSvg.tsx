/* ================================================================
   InductionMotorSvg.tsx — Three-Phase Induction Motor Vector Visualizer
   Phase 10.3: Industrial vector representation of an AC Three-Phase
   Induction Motor featuring:
   - Three-phase electrical connections (L1, L2, L3)
   - Terminal box with conduit gland & phase status indicators
   - Cylindrical finned stator housing with mounting feet
   - Squirrel-cage rotor core with rotating rotor bars
   - Horizontal drive shaft with output keyway
   - Drive-End (DE) and Non-Drive-End (NDE) bearing assemblies
   - Rear ventilation shroud with rotating cooling fan
   - Interactive physical sensor hotspots
   - State-driven vibration jitter and fault component isolation
   ================================================================ */

import React, { useState } from 'react';
import type { TwinVisualState } from '../../utils/twinStateEngine';
import type { SensorData } from './SensorDetailModal';

interface Props {
  state: TwinVisualState;
  onSelectSensor?: (sensor: SensorData) => void;
  interactive?: boolean;
  mode?: string;
  exploded?: boolean;
}

export default function InductionMotorSvg({
  state,
  onSelectSensor,
  interactive = true,
  mode = 'compact',
  exploded = false,
}: Props) {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const { operatingState, colors, animation, telemetry, phases } = state;
  const isStopped = animation.shaftSpeedSec === 0;

  // Animation classes
  const vibeClass =
    animation.vibrateLevel === 'SEVERE'
      ? 'motor-vibe-severe'
      : animation.vibrateLevel === 'MILD'
      ? 'motor-vibe-mild'
      : '';

  // Hotspots definitions
  const hotspots: Record<string, SensorData> = {
    vibration: {
      id: 'SEN-VIB-01',
      name: 'Drive-End Bearing Accelerometer',
      location: 'Front Drive-End Bearing Housing (DE)',
      value: telemetry.vibration,
      unit: 'mm/s',
      status: telemetry.vibration > 4.5 ? 'CRITICAL' : telemetry.vibration > 2.8 ? 'WARNING' : 'NORMAL',
      normalRange: '0.5 – 2.8 mm/s',
      warningRange: '2.8 – 4.5 mm/s',
      criticalRange: '> 4.5 mm/s',
      standard: 'ISO 10816-3 Class II',
      description: 'Continuous piezoelectric velocity transducer monitoring bearing radial impact & unbalance.',
      icon: '📊',
    },
    temperature: {
      id: 'SEN-TMP-01',
      name: 'Stator Core Thermal Sensor',
      location: 'Embedded Stator Winding (Slot 4)',
      value: telemetry.temperature,
      unit: '°C',
      status: telemetry.temperature > 80 ? 'CRITICAL' : telemetry.temperature > 65 ? 'WARNING' : 'NORMAL',
      normalRange: '40 – 65 °C',
      warningRange: '65 – 80 °C',
      criticalRange: '> 80 °C',
      standard: 'IEC 60034-1 Class F',
      description: 'Platinum RTD measuring internal winding temperature to detect thermal insulation stress.',
      icon: '🌡',
    },
    current: {
      id: 'SEN-CUR-01',
      name: 'Three-Phase Current CT',
      location: 'Top Terminal Connection Box',
      value: telemetry.current,
      unit: 'A',
      status: telemetry.current > 22 ? 'CRITICAL' : telemetry.current > 17 ? 'WARNING' : 'NORMAL',
      normalRange: '10.0 – 16.0 A',
      warningRange: '16.0 – 22.0 A',
      criticalRange: '> 22.0 A',
      standard: 'Rated FLC: 28.0 A (3-Phase)',
      description: 'Hall-effect current transducer detecting phase unbalance and broken rotor bar harmonics.',
      icon: '⚡',
    },
    rpm: {
      id: 'SEN-RPM-01',
      name: 'Shaft Speed Optical Encoder',
      location: 'Drive-End Output Shaft',
      value: telemetry.rpm,
      unit: 'RPM',
      status: telemetry.rpm < 1200 && !isStopped ? 'WARNING' : 'NORMAL',
      normalRange: '1420 – 1500 RPM',
      warningRange: '1200 – 1420 RPM',
      criticalRange: '< 1200 RPM',
      standard: 'Synchronous 1500 RPM (4-Pole)',
      description: 'Optical encoder monitoring rotational speed and rotor slip velocity.',
      icon: '🔄',
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '190px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060a14',
        overflow: 'hidden',
      }}
    >
      <svg
        className="motor-svg"
        viewBox="0 0 540 280"
        style={{ width: '100%', height: '100%', maxHeight: '280px', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Technical Grid Pattern */}
          <pattern id="motorTechGrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(6, 182, 212, 0.04)" strokeWidth="1" />
          </pattern>

          {/* Stator Metallic Gradient */}
          <linearGradient id="statorMetalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0b0f19" />
          </linearGradient>

          {/* Shaft Metallic Gradient */}
          <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Thermal Aura Filter */}
          <radialGradient id="motorThermalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0.8" />
            <stop offset="60%" stopColor={colors.glow} stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Terminal Box Gradient */}
          <linearGradient id="terminalBoxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Rotor Squirrel-Cage Bars Gradient */}
          <linearGradient id="rotorBarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 1. Technical Cartesian Grid */}
        <rect x="0" y="0" width="540" height="280" fill="url(#motorTechGrid)" />

        {/* 2. Operational & Thermal Aura Glow */}
        <circle
          cx="260"
          cy="140"
          r="135"
          fill="url(#motorThermalGlow)"
          style={{
            animation: animation.thermalGlow ? 'motorThermalPulse 1.8s infinite ease-in-out' : 'none',
          }}
        />

        {/* ================================================================
            MOTOR ASSEMBLY GROUP (Applies vibration jitter)
            ================================================================ */}
        <g className={vibeClass} id="motor-assembly-group">
          {/* Base Mounting Feet / Pedestal Brackets (Bottom) */}
          <g id="motor-mounting-feet">
            {/* Left Foot (Non-Drive End) */}
            <path
              d="M 148 195 L 140 216 L 196 216 L 188 195 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <circle cx="168" cy="211" r="2.8" fill="#0b0f19" stroke="#64748b" strokeWidth="1" />

            {/* Right Foot (Drive End) */}
            <path
              d="M 332 195 L 324 216 L 380 216 L 372 195 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <circle cx="352" cy="211" r="2.8" fill="#0b0f19" stroke="#64748b" strokeWidth="1" />

            {/* Mounting Foundation Baseline */}
            <line x1="120" y1="216" x2="400" y2="216" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="6 3" />
          </g>

          {/* Drive Shaft (Passes through center, horizontally) */}
          <g
            id="motor-shaft"
            style={{
              transform: exploded ? 'translateX(28px)' : animation.shaftWobble ? 'translateY(1.5px)' : 'none',
              transition: 'transform 0.4s ease-in-out',
            }}
          >
            {/* Main shaft extension to Drive End (Front) */}
            <rect
              x="105"
              y="132"
              width="335"
              height="16"
              fill="url(#shaftGrad)"
              stroke="#475569"
              strokeWidth="1"
            />
            {/* Machined keyway slot at shaft output */}
            <rect x="400" y="137" width="28" height="6" fill="#1e293b" rx="2" stroke="#64748b" strokeWidth="0.8" />

            {/* Shaft rotation indicators (animated if active) */}
            {!isStopped && (
              <g
                style={{
                  transformOrigin: '425px 140px',
                  animation: `motorShaftSpin ${animation.shaftSpeedSec}s linear infinite`,
                }}
              >
                <circle cx="425" cy="140" r="14" fill="none" stroke="rgba(6, 182, 212, 0.45)" strokeWidth="1.5" strokeDasharray="5 4" />
                <path d="M 425 126 L 428 123 L 425 120 Z" fill="#06b6d4" />
              </g>
            )}
          </g>

          {/* Cooling Fan Shroud & Ventilation Cowl (Non-Drive End, Left) */}
          <g
            id="motor-cooling-fan-shroud"
            transform={exploded ? 'translate(-42, 0)' : undefined}
            style={{ transition: 'transform 0.4s ease-in-out' }}
          >
            {/* Fan Cowl Shroud */}
            <path
              d="M 148 85 L 105 92 Q 95 95 95 140 Q 95 185 105 188 L 148 195 Z"
              fill="#131b2e"
              stroke="#334155"
              strokeWidth="1.8"
            />

            {/* Ventilation Louver Slots */}
            <line x1="106" y1="110" x2="106" y2="170" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="114" y1="102" x2="114" y2="178" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="122" y1="96" x2="122" y2="184" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2.5" strokeLinecap="round" />

            {/* Internal Spinning Cooling Fan Blades */}
            <g
              id="cooling-fan-blades"
              style={{
                transformOrigin: '124px 140px',
                animation: !isStopped ? `motorFanSpin ${animation.fanSpeedSec}s linear infinite` : 'none',
              }}
            >
              <circle cx="124" cy="140" r="7" fill="#06b6d4" />
              {/* Fan Blades */}
              <line x1="124" y1="114" x2="124" y2="166" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
              <line x1="101" y1="127" x2="147" y2="153" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
              <line x1="101" y1="153" x2="147" y2="127" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
            </g>

            {/* Fan Label */}
            <text x="120" y="80" fill="var(--text-muted)" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">
              FAN COWL
            </text>
          </g>

          {/* Rear Bearing Assembly (Non-Drive End, NDE) */}
          <g
            id="bearing-nde"
            transform={exploded ? 'translate(120, 140)' : 'translate(152, 140)'}
            style={{ transition: 'transform 0.4s ease-in-out' }}
          >
            <circle cx="0" cy="0" r="22" fill="#1e293b" stroke={animation.bearingFaultNDE ? '#ef4444' : '#334155'} strokeWidth="2" />
            <circle cx="0" cy="0" r="11" fill="#0b0f19" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            {/* Bearing rolling elements */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const bx = Math.cos(rad) * 16;
              const by = Math.sin(rad) * 16;
              return (
                <circle
                  key={i}
                  cx={bx}
                  cy={by}
                  r="3.5"
                  fill={animation.bearingFaultNDE ? '#ef4444' : '#06b6d4'}
                  opacity="0.9"
                />
              );
            })}
            <text x="0" y="32" fill="var(--text-muted)" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">
              NDE BRG
            </text>
          </g>

          {/* Cylindrical Stator Motor Housing (Main Body) */}
          <g id="motor-stator-body">
            {/* Main Outer Stator Frame */}
            <rect
              x="165"
              y="82"
              width="190"
              height="116"
              rx="6"
              fill="url(#statorMetalGrad)"
              stroke={colors.primary}
              strokeWidth="2.2"
              style={{
                filter: operatingState === 'CRITICAL' ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.45))' : 'none',
              }}
            />

            {/* Horizontal Stator Cooling Fins along Body (Requirement 2 & 4) */}
            {[94, 106, 118, 130, 150, 162, 174, 186].map((fy) => (
              <line
                key={fy}
                x1="168"
                y1={fy}
                x2="352"
                y2={fy}
                stroke={colors.border}
                strokeWidth="2.5"
                opacity="0.5"
              />
            ))}

            {/* Hoisting Eyebolt on Top */}
            <g transform="translate(260, 82)">
              <circle cx="0" cy="-12" r="7" fill="none" stroke="#64748b" strokeWidth="2.5" />
              <rect x="-3" y="-5" width="6" height="6" fill="#475569" />
            </g>

            {/* Internal Stator Winding & Rotor Core (Cutaway Window) */}
            <g
              id="internal-core-rotor"
              transform={exploded ? 'translate(225, 96)' : 'translate(185, 96)'}
              style={{ transition: 'transform 0.4s ease-in-out' }}
            >
              {/* Stator Winding Coils background */}
              <rect
                x="0"
                y="0"
                width="150"
                height="88"
                rx="4"
                fill={animation.thermalGlow ? 'rgba(239, 68, 68, 0.16)' : 'rgba(15, 23, 42, 0.9)'}
                stroke={animation.thermalGlow ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth="1.2"
              />

              {/* Stator Lamination Teeth */}
              {[15, 30, 45, 60, 75, 90, 105, 120, 135].map((x) => (
                <line key={x} x1={x} y1="3" x2={x} y2="85" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
              ))}

              {/* Squirrel-Cage Induction Rotor */}
              <rect
                x="20"
                y="14"
                width="110"
                height="60"
                rx="4"
                fill="rgba(6, 182, 212, 0.14)"
                stroke={colors.primary}
                strokeWidth="1.5"
              />

              {/* Slanted Squirrel-Cage Rotor Bars */}
              {[30, 42, 54, 66, 78, 90, 102, 114].map((rx) => (
                <line
                  key={rx}
                  x1={rx - 4}
                  y1="18"
                  x2={rx + 4}
                  y2="70"
                  stroke={animation.electricalFlicker ? '#60a5fa' : '#38bdf8'}
                  strokeWidth="2"
                  opacity={animation.electricalFlicker ? '0.9' : '0.6'}
                />
              ))}

              {/* Center Core Identification Label */}
              <rect x="42" y="36" width="66" height="16" rx="2" fill="rgba(6, 10, 20, 0.88)" />
              <text x="75" y="48" fill={colors.primary} fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
                ROTOR CORE
              </text>
            </g>
          </g>

          {/* Front Bearing Assembly (Drive End, DE - Critical in Bearing Fault) */}
          <g
            id="bearing-de"
            transform={exploded ? 'translate(415, 140)' : 'translate(368, 140)'}
            style={{ transition: 'transform 0.4s ease-in-out' }}
          >
            {/* Outer Bearing Ring (Turns Red in BEARING_DEFECT) */}
            <circle
              cx="0"
              cy="0"
              r="24"
              fill="#1e293b"
              stroke={animation.bearingFaultDE ? '#ef4444' : '#334155'}
              strokeWidth={animation.bearingFaultDE ? 3.5 : 2}
              style={{
                animation: animation.bearingFaultDE ? 'motorBearingFaultPulse 1.2s infinite ease-in-out' : 'none',
              }}
            />
            <circle cx="0" cy="0" r="12" fill="#0b0f19" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

            {/* 6 Circular Rotating Bearing Elements */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const bx = Math.cos(rad) * 17;
              const by = Math.sin(rad) * 17;
              return (
                <circle
                  key={i}
                  cx={bx}
                  cy={by}
                  r="4"
                  fill={animation.bearingFaultDE ? '#ef4444' : '#06b6d4'}
                  style={{
                    filter: animation.bearingFaultDE ? 'drop-shadow(0 0 4px #ef4444)' : 'none',
                  }}
                />
              );
            })}

            <text x="0" y="34" fill={animation.bearingFaultDE ? '#ef4444' : 'var(--text-muted)'} fontSize="7.5" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
              DE BRG {animation.bearingFaultDE ? '⚠ FAULT' : ''}
            </text>
          </g>

          {/* ================================================================
              THREE-PHASE ELECTRICAL TERMINAL BOX (Requirement 3)
              ================================================================ */}
          <g
            id="three-phase-terminal-box"
            transform={exploded ? 'translate(0, -28)' : undefined}
            style={{ transition: 'transform 0.4s ease-in-out' }}
          >
            {/* Three Phase Input Lines (L1, L2, L3) Entering from Top-Left */}
            {/* Line L1 */}
            <path
              d="M 180 25 L 244 25 L 244 48"
              fill="none"
              stroke={phases.l1 === 'FAULT' ? '#ef4444' : phases.l1 === 'WARNING' ? '#f59e0b' : '#38bdf8'}
              strokeWidth="2.2"
              strokeDasharray={!isStopped ? '5 3' : 'none'}
              style={{ animation: !isStopped ? 'motorPhaseFlow 1s linear infinite' : 'none' }}
            />
            <rect x="180" y="16" width="22" height="13" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <text x="191" y="26" fill="#38bdf8" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
              L1
            </text>

            {/* Line L2 */}
            <path
              d="M 180 40 L 260 40 L 260 48"
              fill="none"
              stroke={phases.l2 === 'FAULT' ? '#ef4444' : phases.l2 === 'WARNING' ? '#f59e0b' : '#38bdf8'}
              strokeWidth="2.2"
              strokeDasharray={!isStopped ? '5 3' : 'none'}
              style={{ animation: !isStopped ? 'motorPhaseFlow 1s linear infinite' : 'none' }}
            />
            <rect x="180" y="33" width="22" height="13" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
            <text x="191" y="43" fill="#f59e0b" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
              L2
            </text>

            {/* Line L3 */}
            <path
              d="M 180 55 L 276 55 L 276 48"
              fill="none"
              stroke={phases.l3 === 'FAULT' ? '#ef4444' : phases.l3 === 'WARNING' ? '#f59e0b' : '#38bdf8'}
              strokeWidth="2.2"
              strokeDasharray={!isStopped ? '5 3' : 'none'}
              style={{ animation: !isStopped ? 'motorPhaseFlow 1s linear infinite' : 'none' }}
            />
            <rect x="180" y="50" width="22" height="13" rx="2" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
            <text x="191" y="60" fill="#a78bfa" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
              L3
            </text>

            {/* Terminal Box Enclosure */}
            <rect
              x="228"
              y="48"
              width="64"
              height="34"
              rx="4"
              fill="url(#terminalBoxGrad)"
              stroke={state.faultType === 'STATOR_SHORT' ? '#ef4444' : '#475569'}
              strokeWidth="2"
            />

            {/* Terminal Box Gland Fitting */}
            <rect x="238" y="44" width="44" height="5" fill="#334155" rx="1" />

            {/* Terminal Phase Connection Terminals inside box */}
            <circle cx="244" cy="62" r="3.5" fill={phases.l1 === 'FAULT' ? '#ef4444' : '#06b6d4'} />
            <circle cx="260" cy="62" r="3.5" fill={phases.l2 === 'FAULT' ? '#ef4444' : phases.l2 === 'WARNING' ? '#f59e0b' : '#06b6d4'} />
            <circle cx="276" cy="62" r="3.5" fill={phases.l3 === 'FAULT' ? '#ef4444' : '#06b6d4'} />

            {/* Electrical Arc Indicator in Stator Short Fault */}
            {animation.electricalFlicker && (
              <path
                d="M 248 72 L 254 66 L 258 74 L 268 64"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                style={{ animation: 'motorElectricalArc 0.15s infinite' }}
              />
            )}

            <text x="260" y="76" fill="var(--text-muted)" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">
              3Φ TERMINAL
            </text>
          </g>

          {/* ================================================================
              PHYSICAL SENSOR HOTSPOTS (Requirement 10)
              ================================================================ */}
          {interactive && (
            <g id="motor-sensor-hotspots">
              {/* 1. Vibration Sensor at DE Bearing */}
              <g
                transform="translate(368, 108)"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectSensor?.(hotspots.vibration)}
                onMouseEnter={() => setHoveredComponent('Drive-End Accelerometer')}
                onMouseLeave={() => setHoveredComponent(null)}
                data-testid="sensor-hotspot-vibration"
              >
                <title>Drive-End Accelerometer</title>
                <circle cx="0" cy="0" r="10" fill="rgba(10, 15, 26, 0.9)" stroke={telemetry.vibration > 4.5 ? '#ef4444' : '#06b6d4'} strokeWidth="1.6" />
                <text x="0" y="3" fill={telemetry.vibration > 4.5 ? '#ef4444' : '#06b6d4'} fontSize="8" fontWeight="800" textAnchor="middle">
                  V
                </text>
              </g>

              {/* 2. Temperature Sensor at Stator Core */}
              <g
                transform="translate(260, 140)"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectSensor?.(hotspots.temperature)}
                onMouseEnter={() => setHoveredComponent('Stator RTD Pt100')}
                onMouseLeave={() => setHoveredComponent(null)}
                data-testid="sensor-hotspot-temperature"
              >
                <title>Stator Winding Temp RTD</title>
                <circle cx="0" cy="0" r="10" fill="rgba(10, 15, 26, 0.9)" stroke={telemetry.temperature > 75 ? '#ef4444' : '#f59e0b'} strokeWidth="1.6" />
                <text x="0" y="3" fill={telemetry.temperature > 75 ? '#ef4444' : '#f59e0b'} fontSize="8" fontWeight="800" textAnchor="middle">
                  T
                </text>
              </g>

              {/* 3. Phase Current CT at Terminal Box */}
              <g
                transform="translate(298, 65)"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectSensor?.(hotspots.current)}
                onMouseEnter={() => setHoveredComponent('3-Phase Current CT')}
                onMouseLeave={() => setHoveredComponent(null)}
                data-testid="sensor-hotspot-current"
              >
                <title>3-Phase Current CT</title>
                <circle cx="0" cy="0" r="9" fill="rgba(10, 15, 26, 0.9)" stroke={telemetry.current > 22 ? '#ef4444' : '#a78bfa'} strokeWidth="1.6" />
                <text x="0" y="3" fill="#a78bfa" fontSize="8" fontWeight="800" textAnchor="middle">
                  I
                </text>
              </g>

              {/* 4. Speed Tachometer at Output Shaft */}
              <g
                transform="translate(425, 116)"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectSensor?.(hotspots.rpm)}
                onMouseEnter={() => setHoveredComponent('Shaft Speed Tachometer')}
                onMouseLeave={() => setHoveredComponent(null)}
                data-testid="sensor-hotspot-rpm"
              >
                <title>Shaft Speed Tachometer</title>
                <circle cx="0" cy="0" r="9" fill="rgba(10, 15, 26, 0.9)" stroke="#38bdf8" strokeWidth="1.6" />
                <text x="0" y="3" fill="#38bdf8" fontSize="7.5" fontWeight="800" textAnchor="middle">
                  RPM
                </text>
              </g>
            </g>
          )}

          {/* Offline / Decommissioned Watermark */}
          {operatingState === 'OFFLINE' && (
            <g transform="translate(260, 140)">
              <rect x="-110" y="-18" width="220" height="36" rx="4" fill="rgba(10, 15, 26, 0.92)" stroke="#64748b" strokeWidth="1.5" />
              <text x="0" y="5" fill="#94a3b8" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
                ○ ASSET OFFLINE
              </text>
            </g>
          )}

          {/* Maintenance Lockout Watermark */}
          {operatingState === 'MAINTENANCE' && (
            <g transform="translate(260, 140)">
              <rect x="-130" y="-18" width="260" height="36" rx="4" fill="rgba(10, 15, 26, 0.92)" stroke="#8b5cf6" strokeWidth="1.5" />
              <text x="0" y="5" fill="#c084fc" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
                🔧 MAINTENANCE LOCKOUT
              </text>
            </g>
          )}

          {/* Exploded View Component Part Labels */}
          {exploded && (
            <g id="exploded-component-labels" fontFamily="JetBrains Mono" fontSize="7" fontWeight="700">
              {/* Fan Cowl */}
              <rect x="70" y="58" width="58" height="15" rx="3" fill="rgba(15,23,42,0.92)" stroke="#38bdf8" strokeWidth="1" />
              <text x="99" y="69" fill="#38bdf8" textAnchor="middle">FAN-620</text>

              {/* NDE Bearing */}
              <rect x="88" y="174" width="62" height="15" rx="3" fill="rgba(15,23,42,0.92)" stroke="#64748b" strokeWidth="1" />
              <text x="119" y="185" fill="#94a3b8" textAnchor="middle">BRG-6204</text>

              {/* Terminal Box */}
              <rect x="230" y="12" width="60" height="15" rx="3" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" strokeWidth="1" />
              <text x="260" y="23" fill="#f59e0b" textAnchor="middle">TB-3P-40A</text>

              {/* Stator Housing */}
              <rect x="230" y="215" width="60" height="15" rx="3" fill="rgba(15,23,42,0.92)" stroke="#06b6d4" strokeWidth="1" />
              <text x="260" y="226" fill="#06b6d4" textAnchor="middle">STATOR-4P</text>

              {/* Rotor Core */}
              <rect x="350" y="58" width="60" height="15" rx="3" fill="rgba(15,23,42,0.92)" stroke="#a78bfa" strokeWidth="1" />
              <text x="380" y="69" fill="#a78bfa" textAnchor="middle">ROTOR-SC</text>

              {/* DE Bearing */}
              <rect x="390" y="174" width="60" height="15" rx="3" fill="rgba(15,23,42,0.92)" stroke={animation.bearingFaultDE ? '#ef4444' : '#38bdf8'} strokeWidth="1" />
              <text x="420" y="185" fill={animation.bearingFaultDE ? '#ef4444' : '#38bdf8'} textAnchor="middle">BRG-6205</text>
            </g>
          )}

          {/* Reliability Mode Condition Hotspots */}
          {mode === 'reliability' && (
            <g id="reliability-condition-hotspots">
              {/* Bearing Hotspot */}
              <g transform="translate(368, 140)">
                <circle cx="0" cy="0" r="28" fill="none" stroke={animation.bearingFaultDE ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.5)'} strokeWidth="1.8" strokeDasharray="4 2" />
                <rect x="18" y="-28" width="95" height="16" rx="3" fill="rgba(15,23,42,0.92)" stroke={animation.bearingFaultDE ? '#ef4444' : '#f59e0b'} strokeWidth="1" />
                <text x="65.5" y="-17" fill={animation.bearingFaultDE ? '#ef4444' : '#f59e0b'} fontSize="6.5" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
                  BEARING HOTSPOT
                </text>
              </g>

              {/* Thermal Hotspot at Stator */}
              <g transform="translate(260, 140)">
                <circle cx="0" cy="0" r="38" fill={telemetry.temperature > 70 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.08)'} stroke={telemetry.temperature > 70 ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.4)'} strokeWidth="1.5" strokeDasharray="4 4" />
                <rect x="-48" y="-55" width="96" height="16" rx="3" fill="rgba(15,23,42,0.92)" stroke={telemetry.temperature > 70 ? '#ef4444' : '#f59e0b'} strokeWidth="1" />
                <text x="0" y="-44" fill={telemetry.temperature > 70 ? '#ef4444' : '#f59e0b'} fontSize="6.5" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
                  THERMAL HOTSPOT
                </text>
              </g>

              {/* Electrical Alert at Terminal Box */}
              {(phases.l2 === 'FAULT' || phases.l2 === 'WARNING' || telemetry.current > 18) && (
                <g transform="translate(260, 48)">
                  <rect x="-56" y="-24" width="112" height="16" rx="3" fill="rgba(15,23,42,0.92)" stroke="#ef4444" strokeWidth="1" />
                  <text x="0" y="-13" fill="#ef4444" fontSize="6.5" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
                    ELECTRICAL IMBALANCE
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </svg>

      {/* Component Hover Tooltip */}
      {hoveredComponent && (
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 8,
            background: 'rgba(10, 15, 26, 0.92)',
            border: '1px solid var(--border-medium)',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: '0.62rem',
            color: 'var(--color-info)',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
          }}
        >
          🔍 {hoveredComponent}
        </div>
      )}
    </div>
  );
}
