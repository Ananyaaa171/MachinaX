/* ================================================================
   FleetDigitalTwinView.tsx — Fleet Digital Twin View Grid
   Phase 10.3: Multi-Machine Digital Twin Fleet Visualization.
   CORE REQUIREMENT: 1 MACHINE = 1 DIGITAL TWIN.
   Dynamically generates an independent Three-Phase Induction Motor
   Digital Twin for EVERY machine loaded from the backend dataset.
   Includes state filter tabs with live counts and adaptive grid layout.
   ================================================================ */

import React, { useState, useMemo } from 'react';
import type { MachineTwinData } from '../../context/FleetContext';
import DigitalTwin, { type TwinMode } from '../twin/DigitalTwin';

export type TwinFilterState = 'ALL' | 'NORMAL' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE' | 'OFFLINE';

interface Props {
  twinData: MachineTwinData[];
  loading?: boolean;
  mode?: TwinMode;
  onLoadDemoFleet?: () => Promise<void>;
  onRefresh?: () => void;
}

export default function FleetDigitalTwinView({
  twinData,
  loading = false,
  mode = 'compact',
  onLoadDemoFleet,
  onRefresh,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<TwinFilterState>('ALL');

  // Compute live filter counts from the single source of truth dataset
  const counts = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let critical = 0;
    let maintenance = 0;
    let offline = 0;

    twinData.forEach(({ machine, twin }) => {
      const mStatus = (machine.status || 'ACTIVE').toUpperCase();
      if (mStatus === 'MAINTENANCE') {
        maintenance++;
        return;
      }
      if (mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED') {
        offline++;
        return;
      }
      const opState = (twin?.operatingState || 'NORMAL').toUpperCase();
      if (opState === 'CRITICAL') critical++;
      else if (opState === 'WARNING' || opState === 'WATCH') warning++;
      else normal++;
    });

    return {
      all: twinData.length,
      normal,
      warning,
      critical,
      maintenance,
      offline,
    };
  }, [twinData]);

  // Filter twin data based on active tab
  const filteredTwins = useMemo(() => {
    if (activeFilter === 'ALL') return twinData;

    return twinData.filter(({ machine, twin }) => {
      const mStatus = (machine.status || 'ACTIVE').toUpperCase();
      if (activeFilter === 'MAINTENANCE') return mStatus === 'MAINTENANCE';
      if (activeFilter === 'OFFLINE') return mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED';

      if (mStatus === 'MAINTENANCE' || mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED') {
        return false;
      }

      const opState = (twin?.operatingState || 'NORMAL').toUpperCase();
      if (activeFilter === 'CRITICAL') return opState === 'CRITICAL';
      if (activeFilter === 'WARNING') return opState === 'WARNING' || opState === 'WATCH';
      if (activeFilter === 'NORMAL') return opState === 'NORMAL';
      return true;
    });
  }, [twinData, activeFilter]);

  // Determine grid density class based on machine count (Requirement 6)
  const gridClass =
    filteredTwins.length <= 1
      ? 'fleet-twin-grid--single'
      : filteredTwins.length <= 4
      ? 'fleet-twin-grid--few'
      : 'fleet-twin-grid--multi';

  return (
    <div className="section" id="section-fleet-digital-twins" style={{ marginBottom: 24 }}>
      {/* ================================================================
          1. SECTION HEADER WITH LIVE METRIC BADGES
          ================================================================ */}
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="section-header__left">
          <span className="section-header__icon">🖥️</span>
          <span className="section-header__title">FLEET DIGITAL TWIN VIEW</span>
          <span className="section-header__badge">
            {filteredTwins.length} of {twinData.length} Motor Twins Active
          </span>
        </div>

        {onRefresh && (
          <button
            className="btn btn--secondary"
            onClick={onRefresh}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            title="Refresh Fleet Telemetry"
          >
            ↻ Poll Twins
          </button>
        )}
      </div>

      {/* ================================================================
          2. FILTER TABS (Requirement 16)
          ================================================================ */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <button
          className={`twin-filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
          id="twin-filter-all"
        >
          <span>ALL</span>
          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
            {counts.all}
          </span>
        </button>

        <button
          className={`twin-filter-tab ${activeFilter === 'NORMAL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('NORMAL')}
          id="twin-filter-normal"
        >
          <span style={{ color: 'var(--color-healthy)' }}>●</span>
          <span>NORMAL</span>
          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--color-healthy-bg)', color: 'var(--color-healthy)' }}>
            {counts.normal}
          </span>
        </button>

        <button
          className={`twin-filter-tab ${activeFilter === 'WARNING' ? 'active' : ''}`}
          onClick={() => setActiveFilter('WARNING')}
          id="twin-filter-warning"
        >
          <span style={{ color: 'var(--color-warning)' }}>▲</span>
          <span>WARNING</span>
          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            {counts.warning}
          </span>
        </button>

        <button
          className={`twin-filter-tab ${activeFilter === 'CRITICAL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('CRITICAL')}
          id="twin-filter-critical"
        >
          <span style={{ color: 'var(--color-critical)' }}>✖</span>
          <span>CRITICAL</span>
          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--color-critical-bg)', color: 'var(--color-critical)' }}>
            {counts.critical}
          </span>
        </button>

        <button
          className={`twin-filter-tab ${activeFilter === 'MAINTENANCE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('MAINTENANCE')}
          id="twin-filter-maintenance"
        >
          <span style={{ color: 'var(--color-maintenance)' }}>🔧</span>
          <span>MAINTENANCE</span>
          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--color-maintenance-bg)', color: 'var(--color-maintenance)' }}>
            {counts.maintenance}
          </span>
        </button>

        <button
          className={`twin-filter-tab ${activeFilter === 'OFFLINE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('OFFLINE')}
          id="twin-filter-offline"
        >
          <span style={{ color: 'var(--color-offline)' }}>○</span>
          <span>OFFLINE</span>
          <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--color-offline-bg)', color: 'var(--color-offline)' }}>
            {counts.offline}
          </span>
        </button>
      </div>

      {/* ================================================================
          3. ZERO-MACHINE / EMPTY FILTER STATE (Requirement 17)
          ================================================================ */}
      {twinData.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            textAlign: 'center',
          }}
          id="no-machines-available"
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚙</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            NO MACHINES AVAILABLE
          </h3>
          <p style={{ margin: '0 auto 16px auto', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 440 }}>
            No machines are currently registered in the system. Fleet analytics and Three-Phase Induction Motor Digital Twins are paused.
          </p>
          {onLoadDemoFleet && (
            <button
              className="btn btn--primary"
              onClick={onLoadDemoFleet}
              style={{ fontSize: '0.8rem', padding: '8px 18px' }}
            >
              + Load Demonstration Fleet
            </button>
          )}
        </div>
      ) : filteredTwins.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '30px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🔍</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Motor Twins Matching Filter: {activeFilter}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
            There are currently no machines operating in the {activeFilter} state.
          </div>
          <button
            className="btn btn--secondary"
            onClick={() => setActiveFilter('ALL')}
            style={{ marginTop: 12, fontSize: '0.72rem', padding: '4px 12px' }}
          >
            Show All {twinData.length} Motor Twins
          </button>
        </div>
      ) : (
        /* ================================================================
            4. RESPONSIVE DIGITAL TWIN GRID (Requirement 5 & 6)
            1 MACHINE = 1 DIGITAL TWIN
            ================================================================ */
        <div className={`fleet-twin-grid ${gridClass}`} id="fleet-digital-twin-grid">
          {filteredTwins.map(({ machine, twin }) => (
            <DigitalTwin
              key={machine.id}
              machine={machine}
              twin={twin}
              mode={mode}
              pollingIntervalSeconds={2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
