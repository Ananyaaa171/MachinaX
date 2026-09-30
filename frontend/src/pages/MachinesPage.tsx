/* ================================================================
   MachinesPage.tsx — Dedicated Industrial Machine Fleet Inventory
   Phase 10.1: Machine Fleet management, search, multi-state filtering,
   health indicators, sensor summaries, and direct digital twin links.
   Uses the centralized FleetContext single source of truth.
   ================================================================ */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../context/FleetContext';
import { useDemoUser } from '../context/DemoUserContext';
import DigitalTwin from '../components/twin/DigitalTwin';
import MachineCard from '../components/machine/MachineCard';

type FilterState = 'ALL' | 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';

export default function MachinesPage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUser();
  const { twinData, loading, metrics, loadDemoFleet, refreshFleet } = useFleet();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterState>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'twins' | 'table'>('cards');

  // Filter & Search logic
  const filteredMachines = useMemo(() => {
    return twinData.filter((item) => {
      const { machine, twin } = item;
      const opState = twin?.operatingState?.toUpperCase() || 'NORMAL';
      const mStatus = machine.status?.toUpperCase() || 'ACTIVE';

      // 1. Text Search (ID or Name or Serial)
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchId = String(machine.id).includes(query);
        const matchName = machine.name.toLowerCase().includes(query);
        const matchSerial = machine.serialNumber.toLowerCase().includes(query);
        const matchType = machine.machineType?.name?.toLowerCase().includes(query) || false;
        if (!matchId && !matchName && !matchSerial && !matchType) return false;
      }

      // 2. Active Tab Filter
      if (activeFilter === 'HEALTHY') return opState === 'NORMAL' && mStatus !== 'MAINTENANCE';
      if (activeFilter === 'WARNING') return (opState === 'WARNING' || opState === 'WATCH') && mStatus !== 'MAINTENANCE';
      if (activeFilter === 'CRITICAL') return opState === 'CRITICAL' && mStatus !== 'MAINTENANCE';
      if (activeFilter === 'MAINTENANCE') return mStatus === 'MAINTENANCE';
      if (activeFilter === 'OFFLINE') return mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED';

      return true;
    });
  }, [twinData, searchQuery, activeFilter]);

  const renderHealthScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    }
    const color =
      score >= 80
        ? 'var(--color-healthy)'
        : score >= 60
        ? 'var(--color-warning)'
        : 'var(--color-critical)';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 45, height: 6, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, score)}%`, height: '100%', background: color }} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
          {score.toFixed(0)}%
        </span>
      </div>
    );
  };

  const isZero = metrics.totalMachines === 0;

  return (
    <div className="machines-page" id="page-machine-fleet">
      {/* Role Context Ribbon */}
      <div
        style={{
          background: 'rgba(77, 157, 224, 0.06)',
          border: '1px solid rgba(77, 157, 224, 0.18)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>👤</span>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentUser.name} ({currentUser.role})
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
              — Operational Focus: <strong>{currentUser.focusArea}</strong>
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.62rem',
            padding: '2px 8px',
            borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.8px',
          }}
        >
          DEMONSTRATION MODE
        </span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">MACHINE FLEET</h1>
          <div className="page-header__subtitle">
            <strong>{metrics.totalMachines}</strong> industrial assets registered across plant bays
          </div>
        </div>

        {/* Search Bar & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* View Mode Toggle (Phase 10.8) */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-inset)', padding: 3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('cards')}
              className={`btn ${viewMode === 'cards' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              title="View fleet as easy-to-scan machine status cards"
              id="btn-view-cards"
            >
              📋 Cards
            </button>
            <button
              onClick={() => setViewMode('twins')}
              className={`btn ${viewMode === 'twins' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              title="View fleet as Three-Phase Induction Motor Digital Twins"
              id="btn-view-twins"
            >
              ⚙ Twins
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`btn ${viewMode === 'table' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              title="View fleet as tabular inventory"
              id="btn-view-table"
            >
              ⊞ Table
            </button>
          </div>

          <div className="topbar__search" style={{ minWidth: 260 }}>
            <span className="topbar__search-icon">🔍</span>
            <input
              type="text"
              className="topbar__search-input"
              placeholder="Search by Machine ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-machine-search"
            />
          </div>
          <button
            className="btn btn--secondary"
            onClick={refreshFleet}
            title="Refresh fleet from backend"
          >
            ↻ Refresh
          </button>
          <button
            className="btn btn--primary"
            onClick={() => navigate('/machines/1')}
            id="btn-quick-open-twin"
          >
            ⚙ View Primary Twin
          </button>
        </div>
      </div>

      {/* ZERO MACHINE FALLBACK */}
      {isZero && !loading && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '32px 24px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⚙</div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            NO MACHINES REGISTERED
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 16px' }}>
            No machine data is currently available. Seed the demonstration fleet to view interactive digital twin models and telemetry.
          </p>
          <button
            className="btn btn--primary"
            onClick={loadDemoFleet}
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            + Load Demonstration Fleet
          </button>
        </div>
      )}

      {/* Filter Tabs — STRICTLY SYNCHRONIZED COUNTS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            { id: 'ALL', label: 'All Machines', count: metrics.totalMachines },
            { id: 'HEALTHY', label: 'Healthy', count: metrics.healthyCount },
            { id: 'WARNING', label: 'Warning', count: metrics.warningCount },
            { id: 'CRITICAL', label: 'Critical', count: metrics.criticalCount },
            { id: 'MAINTENANCE', label: 'Maintenance', count: metrics.maintenanceCount },
            { id: 'OFFLINE', label: 'Offline', count: metrics.offlineCount },
          ] as Array<{ id: FilterState; label: string; count: number }>
        ).map((tab) => (
          <button
            key={tab.id}
            className={`filter-pill ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
            id={`filter-pill-${tab.id.toLowerCase()}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* View Mode: MACHINE CARDS (Phase 10.8 Section 6) */}
      {viewMode === 'cards' ? (
        <div style={{ marginBottom: 24 }}>
          {filteredMachines.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {searchQuery ? `No assets match search term "${searchQuery}"` : 'No machines match the selected filter'}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
              }}
            >
              {filteredMachines.map(({ machine, twin, ml }) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  twin={twin}
                  ml={ml}
                />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'twins' ? (
        <div style={{ marginBottom: 24 }}>
          {filteredMachines.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {searchQuery ? `No assets match search term "${searchQuery}"` : 'No machines match the selected filter'}
              </div>
            </div>
          ) : (
            <div
              className={`fleet-twin-grid ${
                filteredMachines.length <= 2
                  ? 'fleet-twin-grid--few'
                  : filteredMachines.length <= 6
                  ? 'fleet-twin-grid--medium'
                  : 'fleet-twin-grid--many'
              }`}
            >
              {filteredMachines.map(({ machine, twin }) => (
                <DigitalTwin
                  key={machine.id}
                  machine={machine}
                  twin={twin}
                  mode="compact"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Fleet Table Card */
        <div className="machine-table-card">
          <div className="machine-table-wrap">
            <table className="machine-table" aria-label="Machine Fleet Table">
              <thead>
                <tr>
                  <th>Machine ID</th>
                  <th>Asset Name</th>
                  <th>Machine Type</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>DE Vibration</th>
                  <th>Winding Temp</th>
                  <th>Active Fault</th>
                  <th>Digital Twin</th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                      {searchQuery ? `No assets match search term "${searchQuery}"` : 'No machines registered'}
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map(({ machine, twin }) => {
                    const state = twin?.operatingState?.toUpperCase() || 'NORMAL';
                    const isMaint = machine.status === 'MAINTENANCE';
                    const isOffline = machine.status === 'INACTIVE' || machine.status === 'DECOMMISSIONED';

                    let vibText = '—';
                    let tempText = '—';
                    if (twin?.latestSensors) {
                      twin.latestSensors.forEach((s) => {
                        const label = (s.sensorLabel || s.sensorType || '').toLowerCase();
                        if (label.includes('vib')) vibText = `${s.value.toFixed(2)} mm/s`;
                        if (label.includes('temp')) tempText = `${s.value.toFixed(1)} °C`;
                      });
                    }

                    const fault =
                      twin?.currentFaultType && twin.currentFaultType !== 'NONE'
                        ? twin.currentFaultType.replace(/_/g, ' ')
                        : 'None (Healthy)';

                    return (
                      <tr
                        key={machine.id}
                        onClick={() => navigate(`/machines/${machine.id}`)}
                        style={{ cursor: 'pointer' }}
                        title={`Open Digital Twin for ${machine.name}`}
                      >
                        {/* Machine ID */}
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
                            #{machine.id}
                          </span>
                        </td>

                        {/* Asset Name & Location */}
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{machine.name}</div>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            S/N: {machine.serialNumber} • {machine.location}
                          </div>
                        </td>

                        {/* Type */}
                        <td>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            {machine.machineType?.name || '3-Phase Induction Motor'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              background: isMaint
                                ? 'var(--color-maintenance-bg)'
                                : isOffline
                                ? 'rgba(255, 255, 255, 0.05)'
                                : state === 'CRITICAL'
                                ? 'var(--color-critical-bg)'
                                : state === 'WARNING' || state === 'WATCH'
                                ? 'var(--color-warning-bg)'
                                : 'var(--color-healthy-bg)',
                              color: isMaint
                                ? 'var(--color-maintenance)'
                                : isOffline
                                ? 'var(--text-muted)'
                                : state === 'CRITICAL'
                                ? 'var(--color-critical)'
                                : state === 'WARNING' || state === 'WATCH'
                                ? 'var(--color-warning)'
                                : 'var(--color-healthy)',
                              fontSize: '0.68rem',
                            }}
                          >
                            ● {isMaint ? 'MAINTENANCE' : isOffline ? 'OFFLINE' : state}
                          </span>
                        </td>

                        {/* Health */}
                        <td>{renderHealthScore(twin?.healthScore)}</td>

                        {/* Vibration */}
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                            {vibText}
                          </span>
                        </td>

                        {/* Temp */}
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                            {tempText}
                          </span>
                        </td>

                        {/* Fault */}
                        <td>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: fault !== 'None (Healthy)' ? 700 : 500,
                              color: fault !== 'None (Healthy)' ? 'var(--color-critical)' : 'var(--text-muted)',
                            }}
                          >
                            {fault}
                          </span>
                        </td>

                        {/* Action */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="table-action-btn"
                            onClick={() => navigate(`/machines/${machine.id}`)}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(77, 157, 224, 0.12)',
                              border: '1px solid rgba(77, 157, 224, 0.35)',
                              color: 'var(--color-primary)',
                              borderRadius: 4,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View Twin →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
