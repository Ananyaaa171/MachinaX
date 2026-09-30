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

import { getRoleConfig, type NavItemConfig } from '../../config/roleConfig';

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
  const { currentUser, switchUser, logout, users } = useDemoUser();
  const roleConfig = getRoleConfig(currentUser.id);

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
  const isNavActive = (item: NavItemConfig) => {
    if (item.path === '/dashboard') return currentPath === '/dashboard';
    if (item.path === '/machines') return currentPath === '/machines';
    if (item.path.startsWith('/machines/')) return currentPath.startsWith('/machines/') && currentPath !== '/machines';
    if (item.path === '/alerts') return currentPath.startsWith('/alerts');
    if (item.path === '/maintenance') return currentPath.startsWith('/maintenance');
    if (item.path === '/analytics') return currentPath.startsWith('/analytics');
    if (item.path === '/profile') return currentPath === '/profile';
    return currentPath === item.path;
  };

  // Dynamic Page Title tailored to Role
  const getPageTitle = () => {
    if (currentPath === '/dashboard') return roleConfig.homeTitle;
    if (currentPath === '/machines') return currentUser.id === 'USR-004' ? 'EQUIPMENT INVENTORY' : 'MACHINE FLEET';
    if (currentPath.startsWith('/machines/')) return 'DIGITAL TWIN INSPECTION';
    if (currentPath === '/alerts') return currentUser.id === 'USR-002' ? 'FAULT ALERTS' : currentUser.id === 'USR-004' ? 'FLOOR ALARMS' : 'FLEET ALERTS';
    if (currentPath === '/maintenance') return currentUser.id === 'USR-002' ? 'MAINTENANCE CONTROL' : 'MAINTENANCE PLANNER';
    if (currentPath === '/analytics') return 'RELIABILITY & PROGNOSTICS';
    if (currentPath === '/profile') return `${currentUser.name.toUpperCase()} PROFILE`;
    return roleConfig.homeTitle;
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
            <div className="sidebar__nav-label">{currentUser.role.toUpperCase()}</div>
            {roleConfig.navItems.map((item) => {
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
            <span style={{ color: 'var(--color-healthy)' }}>● ACTIVE ({currentUser.id})</span>
            <span>SESSION ▾</span>
          </div>
        </div>
      </aside>

      {/* ================================================================
          MAIN CONTENT AREA
          ================================================================ */}
      <div className="main-area">
        {/* ---- TOPBAR ---- */}
        <header className="topbar" id="app-topbar" style={{ padding: '0 20px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-topbar)' }}>
          <div className="topbar__left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              {getPageTitle()}
            </h1>
          </div>

          <div className="topbar__right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Alerts notification icon */}
            <div
              className="topbar__icon-btn"
              title="Active Fleet Alarms"
              role="button"
              tabIndex={0}
              id="topbar-notifications"
              onClick={() => navigate('/alerts')}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--color-critical)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>⚠</span>
              <span>Alarms (3)</span>
            </div>

            {/* Current User & Role Pill */}
            <div
              className="topbar__profile"
              role="button"
              tabIndex={0}
              id="topbar-profile"
              onClick={() => setShowUserModal(true)}
              title="Click to Switch Demo User or View Profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                cursor: 'pointer',
              }}
            >
              <div
                className="topbar__profile-avatar"
                style={{
                  background: currentUser.color,
                  width: 26,
                  height: 26,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {currentUser.initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                  {currentUser.role}
                </span>
              </div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>▾</span>
            </div>

            {/* Direct Logout / Switch button */}
            <button
              className="btn btn--secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{ fontSize: '0.72rem', padding: '5px 10px' }}
              title="Logout from current user session"
              id="topbar-logout-btn"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ---- PAGE CONTENT ---- */}
        <main className="page-content" id="page-content">
          {children}
        </main>
      </div>

      {/* ================================================================
          USER PROFILE & SESSION MODAL (Phase 10.6)
          ================================================================ */}
      {showUserModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="modal-card"
            style={{
              width: '480px',
              maxWidth: '94vw',
              maxHeight: 'min(88vh, 680px)',
            }}
            onClick={(e) => e.stopPropagation()}
            id="modal-user-session"
          >
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  👤 Active Industrial Session
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Authenticated Operator Identity & Access Governance
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

            <div
              className="modal-body"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* User Profile Card */}
              <div
                style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: currentUser.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {currentUser.initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {currentUser.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: 'rgba(77, 157, 224, 0.15)',
                        color: 'var(--color-info)',
                        border: '1px solid rgba(77, 157, 224, 0.3)',
                      }}
                    >
                      {currentUser.id}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>
                    {currentUser.role}
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {currentUser.tagline}
                  </div>
                </div>
              </div>

              {/* Session Meta */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '0.74rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Session Security:</span>
                  <span style={{ color: 'var(--color-healthy)', fontWeight: 600 }}>● Authenticated Session</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Username:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{currentUser.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Role Dashboard:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{roleConfig.homeTitle}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn--secondary"
                  onClick={() => {
                    setShowUserModal(false);
                    navigate('/profile');
                  }}
                  id="btn-modal-view-profile"
                  style={{ width: '100%', padding: '9px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  👤 View Profile & Interface Scope
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    className="btn btn--secondary"
                    onClick={() => {
                      setShowUserModal(false);
                      switchUser();
                      navigate('/login', { replace: true });
                    }}
                    id="btn-modal-switch-user"
                    style={{ padding: '9px', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    ⇄ Switch User
                  </button>

                  <button
                    className="btn btn--secondary"
                    onClick={() => {
                      setShowUserModal(false);
                      switchUser();
                      navigate('/login', { replace: true });
                    }}
                    id="btn-modal-logout"
                    style={{
                      padding: '9px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--color-critical)',
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                    }}
                  >
                    ⎋ Log Out
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '10px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.2)',
                fontSize: '0.67rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Terminating session returns to /login. Credentials are required to switch users.
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
          onClick={() => setShowSimModal(false)}
        >
          <div
            className="modal-card"
            style={{
              width: '540px',
              maxWidth: '94vw',
              maxHeight: 'min(90vh, 700px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
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

            <div
              className="modal-body"
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
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
