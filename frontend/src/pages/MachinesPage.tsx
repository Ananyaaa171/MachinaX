/* ================================================================
   MachinesPage.tsx — Dedicated Industrial Machine Fleet Inventory
   Phase 10: Machine Fleet management, search, multi-state filtering,
   health indicators, sensor summaries, and direct digital twin links.
   ================================================================ */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getDigitalTwin } from '../api/client';
import type { MachineResponse, DigitalTwinStateResponse } from '../types';
import { useDemoUser } from '../context/DemoUserContext';

interface MachineItem {
  machine: MachineResponse;
  twin: DigitalTwinStateResponse | null;
  loading: boolean;
}

type FilterState = 'ALL' | 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';

export default function MachinesPage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUser();

  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterState>('ALL');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const list = await getMachines();
        if (!mounted) return;

        // Initial items with loading twins
        const initial = list.map((m) => ({ machine: m, twin: null, loading: true }));
        setMachines(initial);
        setLoading(false);

        // Fetch digital twins in parallel
        const twinResults = await Promise.allSettled(
          list.map((m) => getDigitalTwin(m.id))
        );

        if (!mounted) return;
        setMachines(
          list.map((m, idx) => ({
            machine: m,
            twin: twinResults[idx].status === 'fulfilled' ? twinResults[idx].value : null,
            loading: false,
          }))
        );
      } catch (err) {
        console.error('Failed to load machines:', err);
        if (mounted) setLoading(false);
      }
    }

    loadData();
    const timer = setInterval(loadData, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Filter & Search logic
  const filteredMachines = useMemo(() => {
    return machines.filter((item) => {
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

      // 2. Filter Pills
      if (activeFilter === 'HEALTHY') return opState === 'NORMAL' && mStatus !== 'MAINTENANCE';
      if (activeFilter === 'WARNING') return opState === 'WATCH' || opState === 'WARNING';
      if (activeFilter === 'CRITICAL') return opState === 'CRITICAL';
      if (activeFilter === 'MAINTENANCE') return mStatus === 'MAINTENANCE';
      if (activeFilter === 'OFFLINE') return mStatus === 'INACTIVE' || mStatus === 'DECOMMISSIONED';

      return true;
    });
  }, [machines, searchQuery, activeFilter]);

  // Sensor helper
  const getSensorVal = (twin: DigitalTwinStateResponse | null, kw: string[], fallback: string) => {
    if (!twin?.latestSensors) return fallback;
    const s = twin.latestSensors.find((x) =>
      kw.some(
        (k) =>
          x.sensorType?.toLowerCase().includes(k) ||
          x.sensorLabel?.toLowerCase().includes(k)
      )
    );
    return s ? `${s.value.toFixed(1)} ${s.unit}` : fallback;
  };

  const getHealthBadge = (twin: DigitalTwinStateResponse | null) => {
    const score = twin?.healthScore ?? 100;
    const color =
      score >= 80
        ? 'var(--color-healthy)'
        : score >= 60
        ? 'var(--color-warning)'
        : 'var(--color-critical)';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 45, height: 6, background: 'var(--bg-inset)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: color }} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
          {score.toFixed(0)}%
        </span>
      </div>
    );
  };

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
              — {currentUser.focusArea === 'OVERVIEW'
                ? 'Full system visibility, machine provisioning & status oversight'
                : currentUser.focusArea === 'MAINTENANCE'
                ? 'Prioritizing work orders, vibration anomalies & bearing wear'
                : currentUser.focusArea === 'RELIABILITY'
                ? 'Analyzing machine health distribution & RUL degradation curves'
                : 'Live plant monitoring, threshold warnings & operating conditions'}
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
            {machines.length} Industrial assets registered in Plant Bay 3
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            className="btn btn--primary"
            onClick={() => navigate('/machines/1')}
            id="btn-quick-open-twin"
          >
            ⚙ View Primary Twin
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            { id: 'ALL', label: 'All Machines', count: machines.length },
            { id: 'HEALTHY', label: 'Healthy', count: machines.filter((m) => m.twin?.operatingState === 'NORMAL').length },
            { id: 'WARNING', label: 'Warning', count: machines.filter((m) => m.twin?.operatingState === 'WATCH' || m.twin?.operatingState === 'WARNING').length },
            { id: 'CRITICAL', label: 'Critical', count: machines.filter((m) => m.twin?.operatingState === 'CRITICAL').length },
            { id: 'MAINTENANCE', label: 'Maintenance', count: machines.filter((m) => m.machine.status === 'MAINTENANCE').length },
            { id: 'OFFLINE', label: 'Offline', count: machines.filter((m) => m.machine.status === 'INACTIVE').length },
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

      {/* Fleet Table Card */}
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
                <th>Temperature</th>
                <th>Vibration</th>
                <th>RPM</th>
                <th>Current</th>
                <th>Risk</th>
                <th>Last Maintenance</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading machine fleet telemetry...
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No machines match the selected filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredMachines.map(({ machine, twin }) => {
                  const state = twin?.operatingState || 'NORMAL';
                  const isMaint = machine.status === 'MAINTENANCE';
                  const riskLevel =
                    twin?.anomalyDetected || state === 'CRITICAL'
                      ? 'HIGH'
                      : state === 'WARNING' || state === 'WATCH'
                      ? 'MEDIUM'
                      : 'LOW';

                  return (
                    <tr
                      key={machine.id}
                      onClick={() => navigate(`/machines/${machine.id}`)}
                      style={{ cursor: 'pointer' }}
                      id={`machine-row-${machine.id}`}
                    >
                      {/* ID */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-info)' }}>
                        #{machine.id}
                      </td>

                      {/* Name */}
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
                              : state === 'CRITICAL'
                              ? 'var(--color-critical-bg)'
                              : state === 'WARNING' || state === 'WATCH'
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-healthy-bg)',
                            color: isMaint
                              ? 'var(--color-maintenance)'
                              : state === 'CRITICAL'
                              ? 'var(--color-critical)'
                              : state === 'WARNING' || state === 'WATCH'
                              ? 'var(--color-warning)'
                              : 'var(--color-healthy)',
                          }}
                        >
                          ● {isMaint ? 'MAINTENANCE' : state}
                        </span>
                      </td>

                      {/* Health */}
                      <td>{getHealthBadge(twin)}</td>

                      {/* Temperature */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {getSensorVal(twin, ['temperature', 'temp'], '55.0 °C')}
                      </td>

                      {/* Vibration */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {getSensorVal(twin, ['vibration', 'vibr'], '1.80 mm/s')}
                      </td>

                      {/* RPM */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {getSensorVal(twin, ['rpm', 'speed'], '2915 RPM')}
                      </td>

                      {/* Current */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {getSensorVal(twin, ['current', 'amp'], '12.4 A')}
                      </td>

                      {/* Risk */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
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
                          }}
                        >
                          {riskLevel}
                        </span>
                      </td>

                      {/* Last Maintenance */}
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        2026-09-20 (Aryan M.)
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="table-action-btn"
                            onClick={() => navigate(`/machines/${machine.id}`)}
                            title="Open Interactive Digital Twin"
                          >
                            View Twin
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
