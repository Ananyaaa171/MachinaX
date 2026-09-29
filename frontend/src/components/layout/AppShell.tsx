/* ================================================================
   AppShell.tsx — Industrial sidebar + topbar layout wrapper.
   Phase 10: Multi-Page Navigation & Demo User Switching System.
   ================================================================ */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMachines } from '../../api/client';
import type { MachineResponse } from '../../types';
import { useDemoUser } from '../../context/DemoUserContext';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣', path: '/dashboard' },
  { id: 'machines', label: 'Machines', icon: '⚙', path: '/machines' },
  { id: 'twin', label: 'Live Monitoring', icon: '◉', path: '/machines/1' },
  { id: 'alerts', label: 'Alerts', icon: '⚠', path: '/alerts', badge: 3 },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧', path: '/maintenance' },
  { id: 'analytics', label: 'Analytics', icon: '📈', path: '/analytics' },
];

const PLANT_LINES = [
  { id: 'plant-a-bay3', name: 'Plant A — Bay 3 (Motors)' },
  { id: 'plant-a-line1', name: 'Plant A — Assembly Line 1' },
  { id: 'plant-b-foundry', name: 'Plant B — Casting & Foundry' },
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
  const { currentUser, switchUser, users } = useDemoUser();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [backendOnline, setBackendOnline] = useState(true);
  const [mlOnline, setMlOnline] = useState(true);
  const [simOnline, setSimOnline] = useState(true);
  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);

  const [machines, setMachines] = useState<MachineResponse[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('plant-a-bay3');
  const [showSimModal, setShowSimModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [simActionLoading, setSimActionLoading] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(8);

  const countdownTimerRef = useRef<number | null>(null);
  const uptimeString = '99.98% • 14d 06h';

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    countdownTimerRef.current = window.setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 8 : prev - 1));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Load machines for selector
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

  // Check health
  const checkHealth = useCallback(async () => {
    try {
      const resp = await fetch('/api/v1/machines?size=1');
      setBackendOnline(resp.ok);
    } catch {
      setBackendOnline(false);
    }

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

  // Set sim mode
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
        await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
      }
      await checkHealth();
    } catch (err) {
      console.error('Failed to change mode:', err);
    } finally {
      setSimActionLoading(false);
    }
  };

  // Toggle sim
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
      console.error('Failed to toggle:', err);
    } finally {
      setSimActionLoading(false);
    }
  };

  // Determine active route
  const currentPath = location.pathname;
  const isNavActive = (item: NavItem) => {
    if (item.id === 'dashboard') return currentPath === '/dashboard';
    if (item.id === 'machines') return currentPath === '/machines';
    if (item.id === 'twin') return currentPath.startsWith('/machines/');
    if (item.id === 'alerts') return currentPath === '/alerts';
    if (item.id === 'maintenance') return currentPath === '/maintenance';
    if (item.id === 'analytics') return currentPath === '/analytics';
    return false;
  };

  // Dynamic Page Title
  const getPageTitle = () => {
    if (currentPath === '/dashboard') return 'CONTROL CENTER';
    if (currentPath === '/machines') return 'MACHINE FLEET';
    if (currentPath.startsWith('/machines/')) return 'DIGITAL TWIN INSPECTION';
    if (currentPath === '/alerts') return 'FLEET ALERTS';
    if (currentPath === '/maintenance') return 'MAINTENANCE PLANNER';
    if (currentPath === '/analytics') return 'RELIABILITY ANALYTICS';
    return 'CONTROL CENTER';
  };

  return (
    <div className="app-shell">
      {/* ================================================================
          LEFT SIDEBAR
          ================================================================ */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar__brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="sidebar__logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>⬢</span>
            <div>
              <div className="sidebar__logo">MACHINA-X</div>
              <div className="sidebar__logo-sub">PREDICTIVE MAINTENANCE</div>
            </div>
          </div>
        </div>

        {/* Quick Asset Selector in Sidebar */}
        <div
          className="sidebar__machine-selector"
          style={{
            padding: '10px 14px',
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
              marginBottom: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Target Machine</span>
            <span style={{ color: 'var(--color-healthy)', fontSize: '0.6rem' }}>● LIVE</span>
          </div>
          <select
            className="sidebar__select"
            value={currentPath.startsWith('/machines/') ? currentPath.split('/')[2] : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) navigate(`/machines/${val}`);
              else navigate('/machines');
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '0.74rem',
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

        {/* Navigation Section */}
        <nav className="sidebar__nav">
          <div className="sidebar__nav-section">
            <div className="sidebar__nav-label">INDUSTRIAL OPERATIONS</div>
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item);
              return (
                <div
                  key={item.id}
                  className={`sidebar__nav-item ${active ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  role="button"
                  tabIndex={0}
                  aria-label={item.label}
                  id={`nav-item-${item.id}`}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge ? <span className="sidebar__nav-badge">{item.badge}</span> : null}
                </div>
              );
            })}
          </div>
        </nav>

        {/* System Telemetry Status Indicator */}
        <div
          className="sidebar__sys-status"
          style={{
            padding: '10px 14px',
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
              marginBottom: 5,
            }}
          >
            System Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Spring Boot</span>
              <span style={{ color: backendOnline ? 'var(--color-healthy)' : 'var(--color-critical)', fontWeight: 600 }}>
                ● {backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Telemetry Engine</span>
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

        {/* Demo User Card at Bottom of Sidebar */}
        <div
          className="sidebar__footer"
          onClick={() => setShowUserModal(true)}
          style={{ cursor: 'pointer', transition: 'background var(--transition-fast)' }}
          title="Click to switch Demonstration User"
          id="sidebar-user-card"
        >
          <div className="sidebar__footer-user">
            <div className="sidebar__avatar" style={{ background: currentUser.color }}>
              {currentUser.initials}
            </div>
            <div className="sidebar__footer-info">
              <div className="sidebar__footer-name">{currentUser.name}</div>
              <div className="sidebar__footer-role">{currentUser.role}</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: '0.58rem',
              color: 'var(--color-info)',
              fontWeight: 700,
              letterSpacing: '0.8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>DEMO USER</span>
            <span>SWITCH ⇄</span>
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
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {getPageTitle()}
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

            {/* Plant selector */}
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

            {/* Alerts notification icon */}
            <div
              className="topbar__icon-btn"
              title="Active Fleet Alarms"
              role="button"
              tabIndex={0}
              id="topbar-notifications"
              onClick={() => navigate('/alerts')}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              ⚠
              <span className="topbar__notif-badge">3</span>
            </div>

            {/* DEMO USER Selector Dropdown / Pill */}
            <div
              className="topbar__profile"
              role="button"
              tabIndex={0}
              id="topbar-profile"
              onClick={() => setShowUserModal(true)}
              title="Click to Switch Demo User Role"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                className="topbar__profile-avatar"
                style={{ background: currentUser.color, width: 24, height: 24, fontSize: '0.65rem', fontWeight: 700 }}
              >
                {currentUser.initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                  {currentUser.role}
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-info)' }}>▾</span>
            </div>
          </div>
        </header>

        {/* ---- PAGE CONTENT ---- */}
        <main className="page-content" id="page-content">
          {children}
        </main>
      </div>

      {/* ================================================================
          DEMO USER SWITCHER MODAL
          ================================================================ */}
      {showUserModal && (
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
            zIndex: 1100,
          }}
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="modal-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              width: '560px',
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
                  👤 Switch Demonstration User
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  DEMONSTRATION MODE — Experience the control center from different operational perspectives
                </div>
              </div>
              <button
                className="btn btn--secondary"
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserModal(false);
                    }}
                    style={{
                      background: isCurrent ? 'rgba(77, 157, 224, 0.12)' : 'var(--bg-inset)',
                      border: `1px solid ${isCurrent ? 'var(--color-info)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      transition: 'all var(--transition-fast)',
                    }}
                    id={`switch-user-${u.id.toLowerCase()}`}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: u.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        flexShrink: 0,
                      }}
                    >
                      {u.initials}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {u.name}
                          </span>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            {u.id}
                          </span>
                        </div>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              background: 'var(--color-info)',
                              color: '#fff',
                              padding: '1px 6px',
                              borderRadius: 3,
                            }}
                          >
                            CURRENT
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--color-info)', fontWeight: 600, marginTop: 1 }}>
                        {u.role}
                      </div>

                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {u.tagline}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {u.responsibilities.map((r, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.6rem',
                              background: 'rgba(255,255,255,0.05)',
                              padding: '1px 5px',
                              borderRadius: 2,
                              color: 'var(--text-muted)',
                            }}
                          >
                            • {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            zIndex: 1100,
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
