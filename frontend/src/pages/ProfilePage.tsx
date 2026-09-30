/* ================================================================
   ProfilePage.tsx — User Profile & Industrial Session Controls
   Phase 10.6: User identity overview, active session information,
   responsibilities, UI configuration, and explicit Logout / Switch User.
   ================================================================ */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoUser } from '../context/DemoUserContext';
import { useFleet } from '../context/FleetContext';
import { getRoleConfig } from '../config/roleConfig';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, switchUser, logout, loginTime } = useDemoUser();
  const { metrics } = useFleet();
  const roleConfig = getRoleConfig(currentUser.id);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchUser = () => {
    switchUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="profile-page" id="page-user-profile" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Profile Header Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: currentUser.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: `0 0 24px ${currentUser.color}40`,
              border: '3px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {currentUser.initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {currentUser.name.toUpperCase()}
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  background: 'rgba(77, 157, 224, 0.12)',
                  color: 'var(--color-info)',
                  border: '1px solid rgba(77, 157, 224, 0.3)',
                  letterSpacing: '0.8px',
                }}
              >
                {currentUser.id}
              </span>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  background: 'rgba(148, 163, 184, 0.15)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  letterSpacing: '0.8px',
                }}
              >
                DEMO USER
              </span>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: 'var(--color-healthy)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  letterSpacing: '0.8px',
                }}
              >
                ● ACTIVE SESSION
              </span>
            </div>

            <div style={{ fontSize: '0.92rem', color: 'var(--color-primary)', fontWeight: 700, margin: '4px 0 0 0' }}>
              {currentUser.role}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 580, margin: '6px 0 0 0' }}>
              {currentUser.tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn--primary"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            id="btn-profile-to-dashboard"
          >
            Open {roleConfig.homeTitle} →
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleSwitchUser}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            id="btn-profile-switch-user"
          >
            ⇄ Switch User
          </button>
          <button
            className="btn btn--secondary"
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              color: 'var(--color-critical)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
            }}
            id="btn-profile-logout"
          >
            ⎋ Logout
          </button>
        </div>
      </div>

      {/* 2. Operational Responsibilities & Interface Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Card 1: Responsibilities */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div className="panel-card__header" style={{ marginBottom: 16 }}>
            <div className="panel-card__title">
              <span>◈</span> OPERATIONAL RESPONSIBILITIES
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Industrial Scope</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Primary operational question addressed by this role:
            <br />
            <strong style={{ color: 'var(--color-info)' }}>"{roleConfig.primaryQuestion}"</strong>
          </p>

          <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
            {currentUser.responsibilities.map((resp, i) => (
              <li key={i}>{resp}</li>
            ))}
          </ul>
        </div>

        {/* Card 2: Interface Configuration */}
        <div className="panel-card" style={{ padding: '20px' }}>
          <div className="panel-card__header" style={{ marginBottom: 16 }}>
            <div className="panel-card__title">
              <span>◈</span> INTERFACE CONFIGURATION
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Role UI Profile</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dashboard Mode</span>
              <strong style={{ color: 'var(--text-primary)' }}>{roleConfig.dashboardEmphasis} DASHBOARD</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Digital Twin Display</span>
              <strong style={{ color: 'var(--color-primary)' }}>{roleConfig.twinMode.toUpperCase()} VECTOR TWIN</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Machine Dataset</span>
              <strong style={{ color: 'var(--text-primary)' }}>{metrics.totalMachines} Assets (Shared Backend Fleet)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Available Report Types</span>
              <strong style={{ color: 'var(--text-primary)' }}>{roleConfig.allowedReports.length} Role-Specific Dossiers</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Session & Authentication Information Card */}
      <div className="panel-card" style={{ padding: '20px' }}>
        <div className="panel-card__header" style={{ marginBottom: 16 }}>
          <div className="panel-card__title">
            <span>🛡</span> AUTHENTICATION & INDUSTRIAL SESSION
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-healthy)' }}>● Session Active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operator Identifier</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{currentUser.username}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>Assigned ID: {currentUser.id}</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session Started</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-info)', marginTop: 2 }}>{loginTime || 'Current Session'}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>Local Ingestion Context</div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Security Policy</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-healthy)', marginTop: 2 }}>Role-Based Access (RBAC)</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>Requires credentials to change user</div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Switch Demonstration Role & Active Session
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              To access another industrial role, terminate the current session and enter the credentials for that role.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn--secondary"
              onClick={handleSwitchUser}
              id="btn-session-switch-user"
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              ⇄ Switch User (Login)
            </button>
            <button
              className="btn btn--secondary"
              onClick={handleLogout}
              id="btn-session-logout"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                color: 'var(--color-critical)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
              }}
            >
              ⎋ Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
