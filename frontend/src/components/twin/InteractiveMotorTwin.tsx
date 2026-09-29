/* ================================================================
   InteractiveMotorTwin.tsx — State-Based SVG Industrial Digital Twin
   Phase 10: Physics-driven vector digital twin visualization
   of a 3-Phase Induction Motor with dynamic shaft rotation,
   fan animation, vibration jitter, fault indicators, and
   interactive sensor inspection hotspots.
   ================================================================ */

import React, { useState } from 'react';
import type { DigitalTwinStateResponse, OperatingState, FaultType } from '../../types';
import SensorDetailModal from './SensorDetailModal';

export interface SensorData {
  id: string;
  name: string;
  location: string;
  value: number;
  unit: string;
  status: string;
  normalRange: string;
  warningRange: string;
  criticalRange: string;
  standard: string;
  description: string;
  icon: string;
}

interface Props {
  twin: DigitalTwinStateResponse | null;
  machineStatus?: string;
  onRefresh?: () => void;
}

type ViewMode = 'STANDARD' | 'THERMAL' | 'VIBRATION';

export default function InteractiveMotorTwin({ twin, machineStatus }: Props) {
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('STANDARD');

  // Determine active state
  const isOffline = machineStatus === 'INACTIVE' || machineStatus === 'DECOMMISSIONED';
  const isMaintenance = machineStatus === 'MAINTENANCE';
  const operatingState: OperatingState = isOffline
    ? 'UNKNOWN'
    : (twin?.operatingState as OperatingState) || 'NORMAL';
  const faultType: FaultType = (twin?.currentFaultType as FaultType) || 'NONE';

  // Extract real sensor readings from twin or fallbacks
  const getSensor = (keywords: string[], defaultVal: number, unit: string) => {
    if (!twin?.latestSensors) return defaultVal;
    const found = twin.latestSensors.find((s) =>
      keywords.some(
        (kw) =>
          s.sensorType?.toLowerCase().includes(kw) ||
          s.sensorLabel?.toLowerCase().includes(kw)
      )
    );
    return found ? found.value : defaultVal;
  };

  const getSensorStatus = (keywords: string[]) => {
    if (!twin?.latestSensors) return 'NORMAL';
    const found = twin.latestSensors.find((s) =>
      keywords.some(
        (kw) =>
          s.sensorType?.toLowerCase().includes(kw) ||
          s.sensorLabel?.toLowerCase().includes(kw)
      )
    );
    return found?.status || 'NORMAL';
  };

  const vibrationVal = getSensor(['vibration', 'vibr', 'accel'], 1.8, 'mm/s');
  const tempVal = getSensor(['temperature', 'temp', 'thermal'], 55.0, '°C');
  const currentVal = getSensor(['current', 'amp', 'load'], 12.4, 'A');
  const rpmVal = getSensor(['rpm', 'speed'], 2915, 'RPM');

  const vibrationStatus = getSensorStatus(['vibration', 'vibr']);
  const tempStatus = getSensorStatus(['temperature', 'temp']);
  const currentStatus = getSensorStatus(['current', 'amp']);
  const rpmStatus = getSensorStatus(['rpm', 'speed']);

  // Sensor hotspot definitions
  const sensorHotspots: Record<string, SensorData> = {
    vibration: {
      id: 'SEN-VIB-01',
      name: 'Drive-End Bearing Accelerometer',
      location: 'Front Bearing Cap (Drive-End)',
      value: vibrationVal,
      unit: 'mm/s',
      status: vibrationStatus,
      normalRange: '0.5 – 2.8 mm/s',
      warningRange: '2.8 – 4.5 mm/s',
      criticalRange: '> 4.5 mm/s',
      standard: 'ISO 10816-3 Class II',
      description: 'Continuous piezoelectric velocity/acceleration transducer detecting bearing micro-spalling and misalignment.',
      icon: '📊',
    },
    temperature: {
      id: 'SEN-TMP-01',
      name: 'Stator Winding RTD (Pt100)',
      location: 'Embedded Stator Slot (Phase U)',
      value: tempVal,
      unit: '°C',
      status: tempStatus,
      normalRange: '40 – 70 °C',
      warningRange: '70 – 85 °C',
      criticalRange: '> 85 °C',
      standard: 'IEC 60034-1 Class F',
      description: 'Resistance temperature detector monitoring winding insulation thermal stress and copper losses.',
      icon: '🌡',
    },
    current: {
      id: 'SEN-CUR-01',
      name: 'Hall-Effect Phase Current CT',
      location: 'Top Terminal Connection Box',
      value: currentVal,
      unit: 'A',
      status: currentStatus,
      normalRange: '10.0 – 16.0 A',
      warningRange: '16.0 – 22.0 A',
      criticalRange: '> 22.0 A',
      standard: 'Rated FLC: 28.0 A',
      description: 'True-RMS phase current transformer detecting stator inter-turn shorts and rotor bar sidebands.',
      icon: '⚡',
    },
    rpm: {
      id: 'SEN-RPM-01',
      name: 'Optical Shaft Speed Tachometer',
      location: 'Drive-End Shaft Output',
      value: rpmVal,
      unit: 'RPM',
      status: rpmStatus,
      normalRange: '2850 – 2950 RPM',
      warningRange: '2700 – 2850 RPM',
      criticalRange: '< 2700 RPM',
      standard: 'Synchronous: 3000 RPM',
      description: 'High-resolution digital optical encoder monitoring rotational velocity and slip frequency.',
      icon: '🔄',
    },
  };

  // Rotation animation speed calculated dynamically from real RPM
  const rotationDuration = isOffline || isMaintenance ? 0 : Math.max(0.4, 3000 / Math.max(rpmVal, 300));

  // Determine shake intensity
  let shakeClass = '';
  if (!isOffline && !isMaintenance) {
    if (operatingState === 'CRITICAL' || faultType === 'BEARING_DEFECT') {
      shakeClass = 'twin-motor--shake-intense';
    } else if (operatingState === 'WATCH' || operatingState === 'WARNING' || faultType === 'BROKEN_ROTOR_BAR') {
      shakeClass = 'twin-motor--shake-subtle';
    }
  }

  // State color badges
  const stateColor =
    isOffline
      ? 'var(--color-offline)'
      : isMaintenance
      ? 'var(--color-maintenance)'
      : operatingState === 'CRITICAL'
      ? 'var(--color-critical)'
      : operatingState === 'WARNING' || operatingState === 'WATCH'
      ? 'var(--color-warning)'
      : 'var(--color-healthy)';

  return (
    <div className="digital-twin-container" id="interactive-digital-twin-view">
      {/* Top Twin Header */}
      <div className="twin-header">
        <div className="twin-header__left">
          <div className="twin-header__title-group">
            <span className="twin-header__badge">DIGITAL TWIN SIMULATION</span>
            <h2 className="twin-header__name">
              {twin?.machineName || '3-Phase Induction Motor'}
              <span className="twin-header__sn">({twin?.serialNumber || 'IM-001'})</span>
            </h2>
          </div>
          <div className="twin-header__state-pill" style={{ borderColor: stateColor }}>
            <span className="twin-header__state-dot" style={{ background: stateColor }} />
            <span style={{ color: stateColor, fontWeight: 700 }}>
              {isOffline
                ? 'OFFLINE'
                : isMaintenance
                ? 'MAINTENANCE'
                : operatingState === 'CRITICAL'
                ? 'CRITICAL FAULT'
                : operatingState === 'WARNING' || operatingState === 'WATCH'
                ? 'WARNING STATE'
                : 'NORMAL RUNNING'}
            </span>
            {faultType !== 'NONE' && (
              <span className="twin-header__fault-tag">
                {faultType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="twin-view-modes">
          <button
            className={`twin-view-mode-btn ${viewMode === 'STANDARD' ? 'active' : ''}`}
            onClick={() => setViewMode('STANDARD')}
            id="btn-view-standard"
          >
            Mechanical View
          </button>
          <button
            className={`twin-view-mode-btn ${viewMode === 'THERMAL' ? 'active' : ''}`}
            onClick={() => setViewMode('THERMAL')}
            id="btn-view-thermal"
          >
            Thermal IR
          </button>
          <button
            className={`twin-view-mode-btn ${viewMode === 'VIBRATION' ? 'active' : ''}`}
            onClick={() => setViewMode('VIBRATION')}
            id="btn-view-vibration"
          >
            Vibration Mode
          </button>
        </div>
      </div>

      {/* Main SVG Visualization Canvas */}
      <div className={`twin-canvas-wrapper ${shakeClass}`}>
        <svg
          viewBox="0 0 860 440"
          className="twin-svg"
          aria-label="Interactive Industrial Induction Motor Digital Twin"
        >
          <defs>
            {/* Gradients for Motor Housing */}
            <linearGradient id="housingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2c3a58" />
              <stop offset="30%" stopColor="#1e2840" />
              <stop offset="70%" stopColor="#131b2e" />
              <stop offset="100%" stopColor="#0b101c" />
            </linearGradient>

            <linearGradient id="finGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3d4e74" />
              <stop offset="50%" stopColor="#25324e" />
              <stop offset="100%" stopColor="#161f33" />
            </linearGradient>

            <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="25%" stopColor="#94a3b8" />
              <stop offset="75%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            <linearGradient id="thermalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff4500" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ff8c00" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <filter id="twinGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="intenseThermal" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Floor & Bedplate Foundation */}
          <rect x="80" y="360" width="700" height="24" rx="4" fill="url(#baseGrad)" stroke="#475569" strokeWidth="1.5" />
          {/* Concrete Mounting Base */}
          <rect x="40" y="384" width="780" height="36" fill="#0f1422" stroke="#1e293b" strokeWidth="2" />
          <line x1="40" y1="400" x2="820" y2="400" stroke="#1e293b" strokeDasharray="6 6" />

          {/* Motor Mounting Feet with Anchor Bolts */}
          <rect x="230" y="330" width="60" height="32" rx="3" fill="#25324e" stroke="#475569" strokeWidth="1.5" />
          <circle cx="260" cy="346" r="6" fill="#64748b" stroke="#000" strokeWidth="1" />
          <rect x="520" y="330" width="60" height="32" rx="3" fill="#25324e" stroke="#475569" strokeWidth="1.5" />
          <circle cx="550" cy="346" r="6" fill="#64748b" stroke="#000" strokeWidth="1" />

          {/* THERMAL IR VIEW AURA (When in Thermal mode or Overheating fault) */}
          {(viewMode === 'THERMAL' || faultType === 'STATOR_SHORT' || tempVal > 75) && (
            <g opacity={viewMode === 'THERMAL' ? '0.85' : '0.45'} filter="url(#intenseThermal)">
              <ellipse cx="400" cy="225" rx="240" ry="140" fill="url(#thermalGrad)" />
              {/* Thermal rising heat waves */}
              <path
                d="M 320,110 Q 330,90 320,70 Q 310,50 320,30"
                fill="none"
                stroke="#ff4500"
                strokeWidth="3"
                opacity="0.7"
                className="twin-heat-wave-1"
              />
              <path
                d="M 400,110 Q 410,85 400,65 Q 390,45 400,25"
                fill="none"
                stroke="#ff7700"
                strokeWidth="3"
                opacity="0.8"
                className="twin-heat-wave-2"
              />
              <path
                d="M 480,110 Q 490,90 480,70 Q 470,50 480,30"
                fill="none"
                stroke="#ffaa00"
                strokeWidth="3"
                opacity="0.7"
                className="twin-heat-wave-3"
              />
            </g>
          )}

          {/* VIBRATION MODAL VIEW WAVES (When in Vibration mode or Bearing fault) */}
          {(viewMode === 'VIBRATION' || faultType === 'BEARING_DEFECT' || vibrationVal > 3.5) && (
            <g opacity="0.9">
              <circle cx="630" cy="235" r="45" fill="none" stroke="#ef4444" strokeWidth="2.5" className="twin-vib-ring-1" />
              <circle cx="630" cy="235" r="65" fill="none" stroke="#f59e0b" strokeWidth="2" className="twin-vib-ring-2" />
              <circle cx="630" cy="235" r="85" fill="none" stroke="#ef4444" strokeWidth="1.5" className="twin-vib-ring-3" />
            </g>
          )}

          {/* ELECTRICAL FAULT SPARKS (When electrical fault detected) */}
          {faultType === 'STATOR_SHORT' && (
            <g className="twin-electrical-sparks">
              <path d="M 380,85 L 390,70 L 385,68 L 400,50" fill="none" stroke="#38bdf8" strokeWidth="2.5" filter="url(#twinGlow)" />
              <path d="M 420,85 L 415,72 L 425,70 L 418,52" fill="none" stroke="#60a5fa" strokeWidth="2.5" filter="url(#twinGlow)" />
            </g>
          )}

          {/* OUTPUT SHAFT (Protruding from Drive-End bearing, right side) */}
          <g>
            {/* Shaft Base */}
            <rect x="670" y="215" width="130" height="40" rx="3" fill="url(#shaftGrad)" stroke="#334155" strokeWidth="1.5" />
            {/* Shaft Keyway */}
            <rect x="710" y="228" width="55" height="8" rx="2" fill="#1e293b" />
            {/* Rotating shaft grooves/lines */}
            <g
              style={{
                transformOrigin: '735px 235px',
                animation: rotationDuration ? `twin-shaft-spin ${rotationDuration}s linear infinite` : 'none',
              }}
            >
              <line x1="680" y1="220" x2="680" y2="250" stroke="#e2e8f0" strokeWidth="2" opacity="0.8" />
              <line x1="720" y1="220" x2="720" y2="250" stroke="#cbd5e1" strokeWidth="2" opacity="0.9" />
              <line x1="760" y1="220" x2="760" y2="250" stroke="#e2e8f0" strokeWidth="2" opacity="0.8" />
              <circle cx="795" cy="235" r="5" fill="#475569" stroke="#94a3b8" />
            </g>
          </g>

          {/* NON-DRIVE-END FAN HOUSING / COWL (Left side) */}
          <g>
            <path
              d="M 170,165 C 130,170 130,300 170,305 L 200,305 L 200,165 Z"
              fill="#182033"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Fan intake grille slots */}
            <rect x="145" y="195" width="8" height="80" rx="4" fill="#0f172a" />
            <rect x="160" y="185" width="8" height="100" rx="4" fill="#0f172a" />

            {/* Internal spinning cooling fan blades */}
            <g
              style={{
                transformOrigin: '170px 235px',
                animation: rotationDuration ? `twin-shaft-spin ${rotationDuration}s linear infinite` : 'none',
              }}
            >
              <circle cx="170" cy="235" r="16" fill="#3b82f6" opacity="0.3" />
              <line x1="170" y1="205" x2="170" y2="265" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
              <line x1="140" y1="235" x2="200" y2="235" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>

          {/* MAIN STATOR HOUSING WITH COOLING FINS */}
          <g>
            {/* Main Body Shell */}
            <rect
              x="200"
              y="145"
              width="430"
              height="180"
              rx="8"
              fill="url(#housingGrad)"
              stroke="#334155"
              strokeWidth="2.5"
            />

            {/* Horizontal Stator Cooling Fins (Ribbed Construction) */}
            {[160, 178, 196, 214, 232, 250, 268, 286, 304].map((y, idx) => (
              <g key={y}>
                <rect
                  x="206"
                  y={y}
                  width="418"
                  height="10"
                  rx="3"
                  fill="url(#finGrad)"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <line x1="210" y1={y + 5} x2="620" y2={y + 5} stroke="#475569" strokeWidth="1" opacity="0.6" />
              </g>
            ))}

            {/* Center Nameplate / Spec Plate */}
            <rect x="360" y="220" width="90" height="42" rx="3" fill="#0b101c" stroke="#475569" strokeWidth="1" />
            <text x="405" y="235" textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="700" letterSpacing="0.8">
              ABB / SIEMENS
            </text>
            <text x="405" y="247" textAnchor="middle" fontSize="7" fill="#94a3b8" fontFamily="monospace">
              15kW • 415V • 50Hz
            </text>
            <text x="405" y="256" textAnchor="middle" fontSize="6.5" fill="#64748b" fontFamily="monospace">
              S/N: {twin?.serialNumber || 'IM-001'}
            </text>
          </g>

          {/* DRIVE-END BEARING HOUSING (Right End Shield) */}
          <g>
            <path
              d="M 630,145 C 665,150 670,175 670,235 C 670,295 665,320 630,325 Z"
              fill="#243048"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Hex Flange Bolts */}
            <circle cx="645" cy="170" r="5" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
            <circle cx="655" cy="200" r="5" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
            <circle cx="655" cy="270" r="5" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
            <circle cx="645" cy="300" r="5" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
            {/* Bearing Inspection Port */}
            <circle cx="648" cy="235" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="648" cy="235" r="7" fill={vibrationStatus === 'CRITICAL' ? '#ef4444' : '#22c55e'} opacity="0.8" />
          </g>

          {/* TOP TERMINAL BOX (Power Connections & Conduit Entry) */}
          <g>
            <rect x="345" y="95" width="130" height="52" rx="4" fill="#1b2438" stroke="#475569" strokeWidth="2" />
            <rect x="355" y="102" width="110" height="38" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            {/* Cable gland on side */}
            <rect x="475" y="112" width="16" height="18" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1" />
            <circle cx="493" cy="121" r="5" fill="#0284c7" />
            {/* Terminal Box Warning Icon */}
            <text x="410" y="126" textAnchor="middle" fontSize="14" fill="#f59e0b">
              ⚡
            </text>
          </g>

          {/* LIFTING EYE-BOLT ON TOP CENTER */}
          <g>
            <circle cx="410" cy="78" r="12" fill="none" stroke="#64748b" strokeWidth="4" />
            <rect x="406" y="88" width="8" height="8" fill="#475569" />
          </g>

          {/* ================================================================
              INTERACTIVE SENSOR HOTSPOTS (Clickable Markers)
              ================================================================ */}

          {/* 1. VIBRATION SENSOR (Drive-End Bearing) */}
          <g
            className="twin-sensor-hotspot"
            transform="translate(635, 140)"
            onClick={() => setSelectedSensor(sensorHotspots.vibration)}
            style={{ cursor: 'pointer' }}
            id="hotspot-vibration"
          >
            <circle cx="0" cy="0" r="14" fill="var(--bg-card)" stroke="#ef4444" strokeWidth="2" />
            <circle
              cx="0"
              cy="0"
              r="7"
              fill={vibrationStatus === 'CRITICAL' ? '#ef4444' : vibrationStatus === 'WARNING' ? '#f59e0b' : '#22c55e'}
              className="twin-pulse-dot"
            />
            <line x1="0" y1="14" x2="0" y2="40" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Label callout */}
            <rect x="-60" y="-38" width="120" height="24" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
            <text x="0" y="-23" textAnchor="middle" fontSize="9" fill="#f87171" fontWeight="700" fontFamily="monospace">
              VIB: {vibrationVal.toFixed(2)} mm/s
            </text>
          </g>

          {/* 2. TEMPERATURE SENSOR (Stator Housing) */}
          <g
            className="twin-sensor-hotspot"
            transform="translate(280, 130)"
            onClick={() => setSelectedSensor(sensorHotspots.temperature)}
            style={{ cursor: 'pointer' }}
            id="hotspot-temperature"
          >
            <circle cx="0" cy="0" r="14" fill="var(--bg-card)" stroke="#f59e0b" strokeWidth="2" />
            <circle
              cx="0"
              cy="0"
              r="7"
              fill={tempStatus === 'CRITICAL' ? '#ef4444' : tempStatus === 'WARNING' ? '#f59e0b' : '#22c55e'}
              className="twin-pulse-dot"
            />
            <line x1="0" y1="14" x2="0" y2="35" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Label callout */}
            <rect x="-60" y="-38" width="120" height="24" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
            <text x="0" y="-23" textAnchor="middle" fontSize="9" fill="#fbbf24" fontWeight="700" fontFamily="monospace">
              TEMP: {tempVal.toFixed(1)} °C
            </text>
          </g>

          {/* 3. CURRENT SENSOR (Terminal Box) */}
          <g
            className="twin-sensor-hotspot"
            transform="translate(485, 75)"
            onClick={() => setSelectedSensor(sensorHotspots.current)}
            style={{ cursor: 'pointer' }}
            id="hotspot-current"
          >
            <circle cx="0" cy="0" r="14" fill="var(--bg-card)" stroke="#38bdf8" strokeWidth="2" />
            <circle
              cx="0"
              cy="0"
              r="7"
              fill={currentStatus === 'CRITICAL' ? '#ef4444' : currentStatus === 'WARNING' ? '#f59e0b' : '#22c55e'}
              className="twin-pulse-dot"
            />
            <line x1="-10" y1="10" x2="-25" y2="25" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Label callout */}
            <rect x="-55" y="-38" width="110" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="-23" textAnchor="middle" fontSize="9" fill="#38bdf8" fontWeight="700" fontFamily="monospace">
              CUR: {currentVal.toFixed(1)} A
            </text>
          </g>

          {/* 4. SPEED (RPM) SENSOR (Shaft Output) */}
          <g
            className="twin-sensor-hotspot"
            transform="translate(740, 290)"
            onClick={() => setSelectedSensor(sensorHotspots.rpm)}
            style={{ cursor: 'pointer' }}
            id="hotspot-rpm"
          >
            <circle cx="0" cy="0" r="14" fill="var(--bg-card)" stroke="#a855f7" strokeWidth="2" />
            <circle
              cx="0"
              cy="0"
              r="7"
              fill={rpmStatus === 'CRITICAL' ? '#ef4444' : rpmStatus === 'WARNING' ? '#f59e0b' : '#22c55e'}
              className="twin-pulse-dot"
            />
            <line x1="0" y1="-14" x2="0" y2="-35" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Label callout */}
            <rect x="-65" y="20" width="130" height="24" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
            <text x="0" y="35" textAnchor="middle" fontSize="9" fill="#c084fc" fontWeight="700" fontFamily="monospace">
              SPEED: {Math.round(rpmVal)} RPM
            </text>
          </g>

          {/* MAINTENANCE MODE OVERLAY BADGE */}
          {isMaintenance && (
            <g transform="translate(370, 185)">
              <rect x="-30" y="-30" width="140" height="60" rx="8" fill="rgba(15, 23, 42, 0.95)" stroke="#8b5cf6" strokeWidth="2" />
              <text x="40" y="-6" textAnchor="middle" fontSize="18">🔧</text>
              <text x="40" y="16" textAnchor="middle" fontSize="10" fill="#a78bfa" fontWeight="800" letterSpacing="1">
                MAINTENANCE MODE
              </text>
            </g>
          )}

          {/* OFFLINE OVERLAY BADGE */}
          {isOffline && (
            <g transform="translate(370, 185)">
              <rect x="-30" y="-30" width="140" height="60" rx="8" fill="rgba(15, 23, 42, 0.95)" stroke="#64748b" strokeWidth="2" />
              <text x="40" y="-6" textAnchor="middle" fontSize="18">⊘</text>
              <text x="40" y="16" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="800" letterSpacing="1">
                MACHINE OFFLINE
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Sensor Hotspot Strip / Legend */}
      <div className="twin-sensor-strip">
        {Object.entries(sensorHotspots).map(([key, sensor]) => (
          <div
            key={key}
            className="twin-sensor-badge"
            onClick={() => setSelectedSensor(sensor)}
            role="button"
            tabIndex={0}
            title={`Click to inspect ${sensor.name} telemetry & thresholds`}
            id={`badge-sensor-${key}`}
          >
            <span className="twin-sensor-badge__icon">{sensor.icon}</span>
            <div className="twin-sensor-badge__info">
              <span className="twin-sensor-badge__label">{sensor.name.split(' ')[0]}</span>
              <span className="twin-sensor-badge__val">
                {sensor.value.toFixed(1)} {sensor.unit}
              </span>
            </div>
            <span
              className="twin-sensor-badge__status"
              style={{
                background:
                  sensor.status === 'CRITICAL'
                    ? 'var(--color-critical-bg)'
                    : sensor.status === 'WARNING'
                    ? 'var(--color-warning-bg)'
                    : 'var(--color-healthy-bg)',
                color:
                  sensor.status === 'CRITICAL'
                    ? 'var(--color-critical)'
                    : sensor.status === 'WARNING'
                    ? 'var(--color-warning)'
                    : 'var(--color-healthy)',
              }}
            >
              {sensor.status}
            </span>
          </div>
        ))}
      </div>

      {/* Sensor Modal */}
      {selectedSensor && (
        <SensorDetailModal sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
      )}
    </div>
  );
}
