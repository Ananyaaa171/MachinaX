/* ================================================================
   AppShell.tsx — Industrial sidebar + topbar layout wrapper.
   Phase 9: Comprehensive Industrial Control Center Shell.
   ================================================================ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMachines } from '../../api/client';
import type { MachineResponse } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  targetId?: string;
  badge?: number;
  section: 'MAIN' | 'INTELLIGENCE' | 'AUDIT & OPS';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣', section: 'MAIN' },
  { id: 'machines', label: 'Machines', icon: '⚙', targetId: 'section-machine-table', section: 'MAIN' },
  { id: 'monitoring', label: 'Live Monitoring', icon: '◉', targetId: 'section-machine-table', section: 'MAIN' },
  { id: 'anomalies', label: 'Anomaly Detection', icon: '⚠', targetId: 'section-active-alerts', badge: 3, section: 'INTELLIGENCE' },
  { id: 'rul', label: 'Remaining Useful Life', icon: '⏳', targetId: 'section-predictive-maintenance', section: 'INTELLIGENCE' },
  { id: 'maintenance', label: 'Maintenance Planner', icon: '🔧', targetId: 'section-predictive-maintenance', section: 'INTELLIGENCE' },
  { id: 'logs', label: 'System Logs / History', icon: '◷', targetId: 'section-recent-events', section: 'AUDIT & OPS' },
  { id: 'settings', label: 'Settings', icon: '⚙', section: 'AUDIT & OPS' },
];

const SECTIONS: Array<'MAIN' | 'INTELLIGENCE' | 'AUDIT & OPS'> = ['MAIN', 'INTELLIGENCE', 'AUDIT & OPS'];

const PLANT_LINES = [
  { id: 'plant-a-bay3', name: 'Plant A — Bay 3 (Motors)', active: true },
  { id: 'plant-a-line1', name: 'Plant A — Assembly Line 1', active: false },
  { id: 'plant-b-foundry', name: 'Plant B — Casting & Foundry', active: false },
];

interface SimulationStatus {
  currentMode: string;
  isRunning: boolean;
  totalBatchesGenerated?: number;
  totalBatchesTransmitted?: number;
}

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [backendOnline, setBackendOnline] = useState(true);
  const [mlOnline, setMlOnline] = useState(true);
  const [simOnline, setSimOnline] = useState(true);
  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);

  const [machines, setMachines] = useState<MachineResponse[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('plant-a-bay3');
  const [showSimModal, setShowSimModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [simActionLoading, setSimActionLoading] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(8);

  const countdownTimerRef = useRef<number | null>(null);

  // Uptime mock counter: 14 days, 6 hours, 42 mins
  const uptimeString = '99.98% • 14d 06h';

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    countdownTimerRef.current = window.setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 8 : prev - 1));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Load machines for quick selector
  useEffect(() => {
    let mounted = true;
    getMachines()
      .then((data) => {
        if (mounted && Array.isArray(data)) setMachines(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Check backend, simulator and ML service health
  const checkHealth = useCallback(async () => {
    // 1. Backend
    try {
      const resp = await fetch('/api/v1/machines?size=1');
      setBackendOnline(resp.ok);
    } catch {
      setBackendOnline(false);
    }

    // 2. Simulator
    try {
      const simResp = await fetch('/sim-api/api/v1/simulator/status').catch(() =>
        fetch('http://localhost:8001/api/v1/simulator/status')
      );
      if (simResp.ok) {
        const data = await simResp.json();
        setSimStatus({
          currentMode: data.currentMode,
          isRunning: data.isRunning,
          totalBatchesGenerated: data.totalBatchesGenerated,
          totalBatchesTransmitted: data.totalBatchesTransmitted,
        });
        setSimOnline(true);
      } else {
        setSimOnline(false);
      }
    } catch {
      setSimOnline(false);
    }

    // 3. ML Service
    try {
      const mlResp = await fetch('/ml-api/health').catch(() =>
        fetch('http://localhost:8000/health')
      );
      setMlOnline(mlResp.ok);
    } catch {
      setMlOnline(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Navigate & scroll helper
  const handleNavClick = (item: NavItem) => {
    setActiveNav(item.id);

    if (item.id === 'settings') {
      setShowSettingsModal(true);
      return;
    }

    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      if (item.targetId) {
        setTimeout(() => {
          const el = document.getElementById(item.targetId!);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } else if (item.targetId) {
      const el = document.getElementById(item.targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Switch simulation mode
  const handleSetSimMode = async (mode: string) => {
    setSimActionLoading(true);
    try {
      const targetUrl = '/sim-api/api/v1/simulator/mode';
      const fallbackUrl = 'http://localhost:8001/api/v1/simulator/mode';
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
      }

      await checkHealth();
    } catch (err) {
      console.error('Failed to change simulation mode:', err);
    } finally {
      setSimActionLoading(false);
    }
  };

  // Toggle simulation running/paused
  const handleToggleSimulation = async () => {
    if (!simStatus) return;
    setSimActionLoading(true);
    const endpoint = simStatus.isRunning ? 'stop' : 'start';
    try {
      await fetch(`/sim-api/api/v1/simulator/${endpoint}`, { method: 'POST' }).catch(() =>
        fetch(`http://localhost:8001/api/v1/simulator/${endpoint}`, { method: 'POST' })
      );
      await checkHealth();
    } catch (err) {
      console.error('Failed to toggle simulation:', err);
    } finally {
      setSimActionLoading(false);
    }
  };

  const currentMachineId = location.pathname.startsWith('/dashboard/')
    ? location.pathname.split('/')[2]
    : '';

  return (
    <div className="app-shell">
      {/* ================================================================
          LEFT SIDEBAR
          ================================================================ */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar__brand">
          <div className="sidebar__logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>⬢</span>
            <div>
              <div className="sidebar__logo">MACHINA-X</div>
              <div className="sidebar__logo-sub">PREDICTIVE MAINTENANCE</div>
            </div>
          </div>
        </div>

        {/* Quick Machine Selector in Sidebar */}
        <div
          className="sidebar__machine-selector"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-sidebar)',
            background: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-muted)',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Active Machine</span>
            <span style={{ color: 'var(--color-healthy)', fontSize: '0.6rem' }}>● LIVE</span>
          </div>
          <select
            className="sidebar__select"
            value={currentMachineId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) navigate(`/dashboard/${val}`);
              else navigate('/dashboard');
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              cursor: 'pointer',
            }}
            id="sidebar-machine-quick-select"
            aria-label="Quick Machine Selector"
          >
            <option value="">Fleet Overview (All)</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.serialNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar__nav">
          {SECTIONS.map((section) => (
            <div key={section} className="sidebar__nav-section">
              <div className="sidebar__nav-label">{section}</div>
              {NAV_ITEMS.filter((item) => item.section === section).map((item) => (
                <div
                  key={item.id}
                  className={`sidebar__nav-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item)}
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavClick(item)}
                  id={`nav-${item.id}`}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                  {item.badge ? <span className="sidebar__nav-badge">{item.badge}</span> : null}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* System Telemetry Status Indicator */}
        <div
          className="sidebar__sys-status"
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-sidebar)',
            fontSize: '0.68rem',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            System Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Backend API</span>
              <span style={{ color: backendOnline ? 'var(--color-healthy)' : 'var(--color-critical)', fontWeight: 600 }}>
                ● {backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Telemetry Stream</span>
              <span style={{ color: simOnline ? 'var(--color-healthy)' : 'var(--color-warning)', fontWeight: 600 }}>
                ● {simOnline ? (simStatus?.isRunning ? 'Active (2s)' : 'Paused') : 'Inactive'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ML Engine (XGB)</span>
              <span style={{ color: mlOnline ? 'var(--color-healthy)' : 'var(--color-critical)', fontWeight: 600 }}>
                ● {mlOnline ? 'Ready' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Plant Operator Tag & Profile */}
        <div className="sidebar__footer">
          <div className="sidebar__footer-user">
            <div className="sidebar__avatar">AS</div>
            <div className="sidebar__footer-info">
              <div className="sidebar__footer-name">Anjali Sharma</div>
              <div className="sidebar__footer-role">Operator: Plant Bay 3</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================================================================
          MAIN CONTENT AREA
          ================================================================ */}
      <div className="main-area">
        {/* ---- TOPBAR ---- */}
        <header className="topbar" id="app-topbar">
          <div className="topbar__left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.6px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                CONTROL CENTER
              </span>
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: 'rgba(77, 157, 224, 0.12)',
                  color: 'var(--color-info)',
                  border: '1px solid rgba(77, 157, 224, 0.25)',
                  letterSpacing: '0.8px',
                  whiteSpace: 'nowrap',
                }}
              >
                BAY 3
              </span>
            </div>

            {/* Plant / Line selector */}
            <div className="topbar__plant-wrap" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div className="topbar__divider" />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>LINE:</span>
              <select
                className="topbar__plant-select"
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                id="topbar-plant-select"
                aria-label="Select Plant or Line"
              >
                {PLANT_LINES.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Uptime counter */}
            <div
              className="topbar__uptime-wrap"
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="System Uptime: 99.98% (14 days, 6 hours)"
            >
              <div className="topbar__divider" />
              <span style={{ color: 'var(--text-muted)' }}>UPTIME:</span>
              <span style={{ color: 'var(--color-healthy)', fontWeight: 600 }}>99.98%</span>
            </div>
          </div>

          <div className="topbar__right">
            {/* Simulation Control shortcut toggle */}
            <button
              className="btn btn--secondary"
              onClick={() => setShowSimModal(true)}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: simStatus?.currentMode !== 'HEALTHY' ? 'var(--color-warning)' : 'var(--border-medium)',
                color: simStatus?.currentMode !== 'HEALTHY' ? 'var(--color-warning)' : 'var(--text-primary)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              id="topbar-sim-controls-btn"
              title="Open Simulator Telemetry & Fault Injection Controls"
            >
              <span>⚡ SIM</span>
              <span
                style={{
                  fontSize: '0.6rem',
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: simStatus?.currentMode === 'HEALTHY' ? 'var(--color-healthy-bg)' : 'var(--color-warning-bg)',
                  color: simStatus?.currentMode === 'HEALTHY' ? 'var(--color-healthy)' : 'var(--color-warning)',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {simStatus?.currentMode || 'ONLINE'}
              </span>
            </button>

            {/* Quick auto-refresh countdown indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="Auto-refresh countdown"
            >
              <span>↻</span>
              <span>{refreshCountdown}s</span>
            </div>

            <div className="topbar__divider" />

            {/* Live clock */}
            <div className="topbar__live" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <div className="topbar__live-dot" />
              <span className="topbar__live-label">LIVE</span>
              <span style={{ marginLeft: 3, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <div className="topbar__divider" />

            {/* System-wide alert count badge */}
            <div
              className="topbar__icon-btn"
              title="Active Fleet Alarms"
              role="button"
              tabIndex={0}
              id="topbar-notifications"
              onClick={() => handleNavClick(NAV_ITEMS[3])}
              style={{ position: 'relative' }}
            >
              ⚠
              <span className="topbar__notif-badge">3</span>
            </div>

            {/* Settings button */}
            <div
              className="topbar__icon-btn"
              title="Control Center Settings"
              role="button"
              tabIndex={0}
              id="topbar-settings"
              onClick={() => setShowSettingsModal(true)}
            >
              ⚙
            </div>

            {/* Operator Profile */}
            <div className="topbar__profile" role="button" tabIndex={0} id="topbar-profile" title="Operator Profile">
              <div className="topbar__profile-avatar">AS</div>
              <span className="topbar__profile-name">Anjali (Bay 3)</span>
            </div>
          </div>
        </header>

        {/* ---- PAGE CONTENT ---- */}
        <main className="page-content" id="page-content">
          {children}
        </main>
      </div>

      {/* ================================================================
          SIMULATION CONTROL MODAL
          ================================================================ */}
      {showSimModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSimModal(false)}
        >
          <div
            className="modal-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              width: '540px',
              maxWidth: '92vw',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ⚡ Sensor Simulator & Fault Injection
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Dynamic telemetry simulation engine (Port 8001)
                </div>
              </div>
              <button
                className="btn btn--secondary"
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                onClick={() => setShowSimModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Simulator Engine Status */}
              <div
                style={{
                  background: 'var(--bg-inset)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Engine Status
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Mode: <span style={{ color: 'var(--color-info)' }}>{simStatus?.currentMode || 'UNKNOWN'}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Batches generated: {simStatus?.totalBatchesGenerated ?? 0} | Transmitted: {simStatus?.totalBatchesTransmitted ?? 0}
                  </div>
                </div>
                <button
                  className={`btn ${simStatus?.isRunning ? 'btn--secondary' : 'btn--primary'}`}
                  onClick={handleToggleSimulation}
                  disabled={simActionLoading}
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                >
                  {simStatus?.isRunning ? '⏸ Pause Stream' : '▶ Resume Stream'}
                </button>
              </div>

              {/* Fault Injection Modes */}
              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  Fault Injection Profiles
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { id: 'HEALTHY', label: 'Healthy Baseline', desc: 'Standard normal operation (100% health)' },
                    { id: 'BEARING_DEFECT', label: 'Bearing Defect', desc: 'Elevated vibration & high-freq acceleration' },
                    { id: 'BROKEN_ROTOR_BAR', label: 'Broken Rotor Bar', desc: 'Current sidebands & torque ripple' },
                    { id: 'STATOR_SHORT', label: 'Stator Winding Short', desc: 'Phase current imbalance & high winding temp' },
                    { id: 'ECCENTRICITY', label: 'Dynamic Eccentricity', desc: 'Rotational airgap variation & vibration' },
                  ].map((fault) => (
                    <button
                      key={fault.id}
                      className={`btn ${simStatus?.currentMode === fault.id ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => handleSetSimMode(fault.id)}
                      disabled={simActionLoading}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        gridColumn: fault.id === 'ECCENTRICITY' ? 'span 2' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{fault.label}</span>
                        {simStatus?.currentMode === fault.id && (
                          <span style={{ fontSize: '0.62rem', background: '#fff', color: '#000', padding: '1px 5px', borderRadius: 2 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{fault.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 10,
                }}
              >
                Note: Changing modes smoothly transitions the simulated induction motor physics. Telemetry batches are streamed every 2.0 seconds to Spring Boot.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          SETTINGS MODAL
          ================================================================ */}
      {showSettingsModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="modal-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              width: '480px',
              maxWidth: '92vw',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ⚙ Control Center Settings
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Industrial telemetry thresholds & monitoring configurations
                </div>
              </div>
              <button
                className="btn btn--secondary"
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                onClick={() => setShowSettingsModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Telemetry Polling Interval
                </label>
                <select
                  className="sidebar__select"
                  defaultValue="8000"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    marginTop: 4,
                    background: 'var(--bg-inset)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <option value="4000">Fast (4 seconds)</option>
                  <option value="8000">Standard Industrial (8 seconds)</option>
                  <option value="15000">Conservative (15 seconds)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Health Alert Threshold
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <input
                    type="text"
                    defaultValue="70% (Warning) / 40% (Critical)"
                    readOnly
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: 'var(--bg-inset)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ISO 10816 Vibration Alert Standard
                </label>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Class II Medium Machines (15-75 kW Rigid Base): Warning &gt; 2.8 mm/s, Critical &gt; 4.5 mm/s.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  className="btn btn--primary"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ fontSize: '0.75rem', padding: '6px 16px' }}
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
