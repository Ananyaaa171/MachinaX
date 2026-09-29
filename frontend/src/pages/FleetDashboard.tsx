/* ================================================================
   FleetDashboard.tsx — Industrial fleet overview dashboard.
   Phase 9: Fleet summary, health, machine table, alerts,
   predictive maintenance, and events timeline.
   ================================================================ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines } from '../api/client';
import { getDigitalTwin, getLatestMLPrediction, getLatestRUL } from '../api/client';
import type { MachineResponse, DigitalTwinStateResponse, RULPredictionResponse, MLPredictionResponse } from '../types';
import FleetSummaryCards from '../components/dashboard/FleetSummaryCards';
import FleetHealthSection from '../components/dashboard/FleetHealthSection';
import MachineStatusTable from '../components/dashboard/MachineStatusTable';
import ActiveAlertsPanel from '../components/dashboard/ActiveAlertsPanel';
import PredictiveMaintenanceSection from '../components/dashboard/PredictiveMaintenanceSection';
import RecentEventsTimeline from '../components/dashboard/RecentEventsTimeline';

// Refresh interval from env or 8s for fleet overview
const FLEET_REFRESH_MS = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS) || 8000;

export interface MachineTwinData {
  machine: MachineResponse;
  twin: DigitalTwinStateResponse | null;
  rul: RULPredictionResponse | null;
  ml: MLPredictionResponse | null;
  loading: boolean;
  error: boolean;
}

export default function FleetDashboard() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<MachineResponse[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [twinData, setTwinData] = useState<MachineTwinData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Fetch all machines
  const fetchMachines = useCallback(async () => {
    try {
      const data = await getMachines();
      if (!mountedRef.current) return;
      setMachines(data);
      setMachinesLoading(false);
      return data;
    } catch {
      if (!mountedRef.current) return;
      setMachinesLoading(false);
      return [];
    }
  }, []);

  // Fetch twin data for all machines in parallel
  const fetchTwinData = useCallback(async (machineList: MachineResponse[]) => {
    if (!machineList.length || fetchingRef.current) return;
    fetchingRef.current = true;

    // Initialize loading state
    if (twinData.length === 0) {
      setTwinData(machineList.map((m) => ({
        machine: m,
        twin: null,
        rul: null,
        ml: null,
        loading: true,
        error: false,
      })));
    }

    // Fetch twin, RUL, and ML for each machine
    const results = await Promise.allSettled(
      machineList.map(async (machine) => {
        const [twinResult, rulResult, mlResult] = await Promise.allSettled([
          getDigitalTwin(machine.id),
          getLatestRUL(machine.id),
          getLatestMLPrediction(machine.id),
        ]);
        return {
          machine,
          twin: twinResult.status === 'fulfilled' ? twinResult.value : null,
          rul: rulResult.status === 'fulfilled' ? rulResult.value : null,
          ml: mlResult.status === 'fulfilled' ? mlResult.value : null,
          loading: false,
          error: twinResult.status === 'rejected',
        };
      })
    );

    if (!mountedRef.current) {
      fetchingRef.current = false;
      return;
    }

    const data: MachineTwinData[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return { machine: machineList[i], twin: null, rul: null, ml: null, loading: false, error: true };
    });

    setTwinData(data);
    setLastUpdated(new Date());
    fetchingRef.current = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    fetchMachines().then((data) => {
      if (data && data.length > 0) {
        fetchTwinData(data);
      }
    });
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMachines, fetchTwinData]);

  // Polling with auto-recovery if backend was initially offline
  useEffect(() => {
    const poll = async () => {
      let currentMachines = machines;
      if (!currentMachines.length) {
        const fetched = await fetchMachines();
        if (fetched && fetched.length) {
          currentMachines = fetched;
        }
      }
      if (currentMachines.length) {
        await fetchTwinData(currentMachines);
      }
    };

    const interval = setInterval(poll, FLEET_REFRESH_MS);
    return () => clearInterval(interval);
  }, [machines, fetchMachines, fetchTwinData]);

  const handleViewMachine = useCallback(
    (machineId: number) => {
      navigate(`/dashboard/${machineId}`);
    },
    [navigate]
  );

  if (machinesLoading) {
    return (
      <div className="full-page-loading">
        <div className="loading-spinner" />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Loading fleet data…
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Fleet Overview</h1>
          <div className="page-header__subtitle">
            {machines.length} machines monitored
            {lastUpdated && (
              <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--secondary" id="btn-refresh-fleet" onClick={() => fetchTwinData(machines)}>
            ↻ Refresh
          </button>
          <button className="btn btn--primary" id="btn-export-report">
            ↓ Export Report
          </button>
        </div>
      </div>

      {/* Section A: Fleet Summary */}
      <FleetSummaryCards twinData={twinData} machinesLoading={machinesLoading} />

      {/* Section B: Fleet Health */}
      <section className="section" id="section-fleet-health">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">◈</span>
            <span className="section-header__title">Fleet Health</span>
          </div>
        </div>
        <FleetHealthSection twinData={twinData} />
      </section>

      {/* Section C: Machine Status Table */}
      <section className="section" id="section-machine-table">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">⊞</span>
            <span className="section-header__title">Machine Status</span>
            <span className="section-header__badge">{twinData.length} machines</span>
          </div>
        </div>
        <MachineStatusTable
          twinData={twinData}
          onViewMachine={handleViewMachine}
        />
      </section>

      {/* Section D + E: Active Alerts + Predictive Maintenance (2-col) */}
      <div className="two-col-row" id="section-alerts-predictive">
        <section id="section-active-alerts">
          <div className="section-header">
            <div className="section-header__left">
              <span className="section-header__icon">⚠</span>
              <span className="section-header__title">Active Alerts</span>
              <span
                className="section-header__badge"
                style={{ background: 'var(--color-critical-bg)', color: 'var(--color-critical)', borderColor: 'var(--color-critical-border)' }}
              >
                3
              </span>
            </div>
            <span className="section-header__action">View all</span>
          </div>
          <ActiveAlertsPanel twinData={twinData} onViewMachine={handleViewMachine} />
        </section>

        <section id="section-predictive-maintenance">
          <div className="section-header">
            <div className="section-header__left">
              <span className="section-header__icon">🔧</span>
              <span className="section-header__title">Predictive Maintenance</span>
              <span className="demo-tag">Simulated</span>
            </div>
          </div>
          <PredictiveMaintenanceSection twinData={twinData} onViewMachine={handleViewMachine} />
        </section>
      </div>

      {/* Section F: Recent Events */}
      <section className="section" id="section-recent-events">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon">◷</span>
            <span className="section-header__title">Recent Events</span>
          </div>
          <span className="section-header__action">View history</span>
        </div>
        <RecentEventsTimeline twinData={twinData} />
      </section>
    </>
  );
}
