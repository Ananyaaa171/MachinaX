/* ================================================================
   AdminDashboardView.tsx — System Administrator Dashboard (Ananya Sharma)
   Simple operational dashboard: machines, users, alerts, activity.
   NO system architecture, NO data pipeline, NO technical infrastructure.
   ================================================================ */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import { useDemoUser } from '../../context/DemoUserContext';

interface Props {
  onOpenReportModal: () => void;
}

export default function AdminDashboardView({ onOpenReportModal }: Props) {
  const navigate = useNavigate();
  const { metrics, twinData } = useFleet();
  const { users } = useDemoUser();

  const [userStatusMap, setUserStatusMap] = React.useState<Record<string, boolean>>({
    'USR-001': true,
    'USR-002': true,
    'USR-003': true,
    'USR-004': true,
  });

  const toggleUserStatus = (userId: string) => {
    setUserStatusMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Compute active machines (healthy + warning count)
  const activeMachines = metrics.healthyCount + metrics.warningCount;
  const alertCount = metrics.criticalCount + (metrics.warningCount > 0 ? 1 : 0);
  const activeUsers = users.filter((u) => userStatusMap[u.id] !== false).length;

  return (
    <div className="admin-dashboard-view" id="view-admin-dashboard">
      {/* ──── HEADER ──── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '0.02em' }}>
          SYSTEM OVERVIEW
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>
          System Administrator: Ananya Sharma
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Manage machines, users, alerts and system activity.
        </p>
      </div>

      {/* ──── 4 KPI CARDS ──── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="metric-card" style={{ padding: '16px 18px', borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL MACHINES
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {metrics.totalMachines}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Registered machines
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 18px', borderLeft: '3px solid var(--color-healthy)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ACTIVE MACHINES
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-healthy)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {activeMachines}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Currently running
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 18px', borderLeft: '3px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ALERTS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: alertCount > 0 ? 'var(--color-warning)' : 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {alertCount}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Need attention
          </div>
        </div>

        <div className="metric-card" style={{ padding: '16px 18px', borderLeft: '3px solid var(--color-info)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            USERS
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-info)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {activeUsers}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Active users
          </div>
        </div>
      </section>

      {/* ──── MACHINE STATUS TABLE ──── */}
      <section className="panel-card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="panel-card__header" style={{ marginBottom: 14 }}>
          <div className="panel-card__title">
            MACHINE STATUS
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Machine</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Health</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Issue</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {twinData.map((t) => {
                const state = t.twin?.operatingState ?? 'NORMAL';
                const health = t.twin?.healthScore ?? 100;
                const fault = t.twin?.currentFaultType;
                const hasFault = fault && fault !== 'NONE';

                let statusColor = 'var(--color-healthy)';
                let statusLabel = 'Running';
                let statusDot = '●';
                if (state === 'CRITICAL') {
                  statusColor = 'var(--color-critical)';
                  statusLabel = 'Critical';
                } else if (state === 'WARNING' || state === 'WATCH') {
                  statusColor = 'var(--color-warning)';
                  statusLabel = 'Warning';
                } else if (state === 'MAINTENANCE') {
                  statusColor = 'var(--color-info)';
                  statusLabel = 'Maintenance';
                } else if (state === 'OFFLINE') {
                  statusColor = 'var(--text-muted)';
                  statusLabel = 'Offline';
                }

                let issueText = 'No issue';
                if (state === 'CRITICAL' && hasFault) {
                  issueText = fault.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                } else if (state === 'WARNING') {
                  issueText = hasFault ? fault.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'High temperature';
                } else if (state === 'MAINTENANCE') {
                  issueText = 'Scheduled service';
                }

                return (
                  <tr key={t.machine.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.machine.name}
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {t.machine.serialNumber}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: statusColor, fontWeight: 700, fontSize: '0.74rem' }}>
                        {statusDot} {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: health < 60 ? 'var(--color-critical)' : health < 80 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                      {state === 'MAINTENANCE' ? '—' : `${health.toFixed(0)}%`}
                    </td>
                    <td style={{ padding: '10px', color: issueText === 'No issue' ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '0.74rem' }}>
                      {issueText}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button
                        className="btn btn--secondary"
                        onClick={() => navigate(`/machines/${t.machine.id}`)}
                        style={{ fontSize: '0.68rem', padding: '4px 10px' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ──── ALERTS & RECENT ACTIVITY (Two columns) ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* ALERTS NEEDING ATTENTION */}
        <section className="panel-card" style={{ padding: 20 }}>
          <div className="panel-card__header" style={{ marginBottom: 14 }}>
            <div className="panel-card__title">
              ALERTS NEEDING ATTENTION
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {twinData
              .filter((t) => t.twin?.operatingState === 'CRITICAL' || t.twin?.operatingState === 'WARNING')
              .map((t) => {
                const isCrit = t.twin?.operatingState === 'CRITICAL';
                const fault = t.twin?.currentFaultType;
                const hasFault = fault && fault !== 'NONE';
                const alertIcon = isCrit ? '🔴' : '⚠';
                let alertMessage = 'Needs attention';
                if (isCrit && hasFault) {
                  alertMessage = fault.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' detected';
                } else if (isCrit) {
                  alertMessage = 'High temperature detected';
                } else {
                  alertMessage = hasFault ? fault.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Elevated readings detected';
                }

                return (
                  <div
                    key={t.machine.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isCrit ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                      border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span>{alertIcon}</span>
                        <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{t.machine.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 24 }}>
                        {alertMessage}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 24, marginTop: 2 }}>
                        {isCrit ? '10 minutes ago' : '25 minutes ago'}
                      </div>
                    </div>
                    <button
                      className="btn btn--secondary"
                      onClick={() => navigate(`/machines/${t.machine.id}`)}
                      style={{ fontSize: '0.68rem', padding: '4px 10px', flexShrink: 0 }}
                    >
                      View
                    </button>
                  </div>
                );
              })}
            {twinData.filter((t) => t.twin?.operatingState === 'CRITICAL' || t.twin?.operatingState === 'WARNING').length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-healthy)', fontSize: '0.78rem' }}>
                ✓ No alerts. All machines operating normally.
              </div>
            )}
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="panel-card" style={{ padding: 20 }}>
          <div className="panel-card__header" style={{ marginBottom: 14 }}>
            <div className="panel-card__title">
              RECENT ACTIVITY
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Ananya Sharma', action: 'Logged in', time: '5 min ago', color: '#6366f1' },
              { name: 'Aryan Mishra', action: 'Completed maintenance on Motor IM-002', time: '12 min ago', color: '#f59e0b' },
              { name: 'Aditya Gupta', action: 'Generated reliability report', time: '28 min ago', color: '#8b5cf6' },
              { name: 'Aditya Maurya', action: 'Acknowledged Motor IM-003 alert', time: '35 min ago', color: '#10b981' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: item.color,
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {item.action}
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ──── USER MANAGEMENT ──── */}
      <section className="panel-card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="panel-card__header" style={{ marginBottom: 14 }}>
          <div className="panel-card__title">
            USERS
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {activeUsers} active users
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActive = userStatusMap[u.id] ?? true;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: u.color,
                            color: '#fff',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {u.initials}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>{u.role}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 3,
                          background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isActive ? 'var(--color-healthy)' : 'var(--color-critical)',
                        }}
                      >
                        ● {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn--secondary"
                          onClick={() => navigate('/profile')}
                          style={{ fontSize: '0.65rem', padding: '3px 8px' }}
                        >
                          View
                        </button>
                        <button
                          className="btn btn--secondary"
                          onClick={() => toggleUserStatus(u.id)}
                          style={{
                            fontSize: '0.65rem',
                            padding: '3px 8px',
                            color: isActive ? 'var(--color-critical)' : 'var(--color-healthy)',
                          }}
                        >
                          {isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ──── QUICK ACTIONS ──── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          className="btn btn--secondary"
          onClick={() => navigate('/machines')}
          style={{
            padding: '14px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          ⚙ View Machines
        </button>
        <button
          className="btn btn--secondary"
          onClick={() => navigate('/profile')}
          style={{
            padding: '14px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          👥 Manage Users
        </button>
        <button
          className="btn btn--secondary"
          onClick={() => navigate('/alerts')}
          style={{
            padding: '14px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          ⚠ View Alerts
        </button>
        <button
          className="btn btn--primary"
          onClick={onOpenReportModal}
          style={{
            padding: '14px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          📄 Generate Report
        </button>
      </section>
    </div>
  );
}
