/* ================================================================
   AlertsPage.tsx — Fleet Alarms, Anomaly Feed & Incident History
   Phase 10: Multi-severity alerts management, interactive acknowledgment,
   filtering, and direct asset drill-down.
   ================================================================ */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoDataService, DemoAlertItem } from '../services/demoDataService';
import { useDemoUser } from '../context/DemoUserContext';

type SeverityFilter = 'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'CRITICAL' | 'WARNING';

export default function AlertsPage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUser();

  const [alerts, setAlerts] = useState<DemoAlertItem[]>(() => demoDataService.getAlerts());
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAcknowledge = (id: string) => {
    const success = demoDataService.acknowledgeAlert(id, currentUser.name);
    if (success) {
      setAlerts([...demoDataService.getAlerts()]);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      // 1. Text Search
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchMachine = item.machineName.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchSensor = item.sensor.toLowerCase().includes(query);
        const matchId = item.id.toLowerCase().includes(query);
        if (!matchMachine && !matchDesc && !matchSensor && !matchId) return false;
      }

      // 2. Filter Pills
      if (activeFilter === 'ACTIVE') return item.status === 'ACTIVE';
      if (activeFilter === 'ACKNOWLEDGED') return item.status === 'ACKNOWLEDGED';
      if (activeFilter === 'CRITICAL') return item.severity === 'CRITICAL';
      if (activeFilter === 'WARNING') return item.severity === 'WARNING';

      return true;
    });
  }, [alerts, searchQuery, activeFilter]);

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING' && a.status === 'ACTIVE').length;

  return (
    <div className="alerts-page" id="page-fleet-alerts">
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
                ? 'Fleet incident log, escalation protocols & alarm thresholds'
                : currentUser.focusArea === 'MAINTENANCE'
                ? 'Active maintenance warnings requiring on-site technician sign-off'
                : currentUser.focusArea === 'RELIABILITY'
                ? 'Analyzing recurrent alarm patterns & premature degradation root causes'
                : 'Real-time threshold breaches & emergency trip tracking'}
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
          <h1 className="page-header__title">ACTIVE ALERTS & INCIDENT LOGS</h1>
          <div className="page-header__subtitle">
            {activeCount} active alarms requiring operational attention
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="topbar__search" style={{ minWidth: 260 }}>
            <span className="topbar__search-icon">🔍</span>
            <input
              type="text"
              className="topbar__search-input"
              placeholder="Filter alerts by machine or sensor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-alert-search"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Active Alarms</span>
            <span className="summary-card__icon summary-card__icon--alerts">⚠</span>
          </div>
          <div className="summary-card__number" style={{ color: activeCount > 0 ? 'var(--color-critical)' : 'var(--color-healthy)' }}>
            {activeCount}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Critical Urgency</span>
            <span className="summary-card__icon summary-card__icon--critical">✕</span>
          </div>
          <div className="summary-card__number" style={{ color: criticalCount > 0 ? 'var(--color-critical)' : 'var(--text-secondary)' }}>
            {criticalCount}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Warning Level</span>
            <span className="summary-card__icon summary-card__icon--warning">▲</span>
          </div>
          <div className="summary-card__number" style={{ color: warningCount > 0 ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
            {warningCount}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Resolved / Ack</span>
            <span className="summary-card__icon summary-card__icon--healthy">✓</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-healthy)' }}>
            {alerts.filter((a) => a.status === 'ACKNOWLEDGED').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            { id: 'ALL', label: 'All Alerts', count: alerts.length },
            { id: 'ACTIVE', label: 'Active', count: activeCount },
            { id: 'ACKNOWLEDGED', label: 'Acknowledged', count: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length },
            { id: 'CRITICAL', label: 'Critical Only', count: alerts.filter((a) => a.severity === 'CRITICAL').length },
            { id: 'WARNING', label: 'Warning Only', count: alerts.filter((a) => a.severity === 'WARNING').length },
          ] as Array<{ id: SeverityFilter; label: string; count: number }>
        ).map((tab) => (
          <button
            key={tab.id}
            className={`filter-pill ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
            id={`filter-alert-${tab.id.toLowerCase()}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="machine-table-card">
        <div className="machine-table-wrap">
          <table className="machine-table" aria-label="Alerts Table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert ID</th>
                <th>Target Asset</th>
                <th>Alarm Description</th>
                <th>Sensor Involved</th>
                <th>Recorded Value</th>
                <th>Threshold</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => (
                  <tr key={item.id} id={`row-alert-${item.id}`}>
                    {/* Severity */}
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          background:
                            item.severity === 'CRITICAL'
                              ? 'var(--color-critical-bg)'
                              : item.severity === 'WARNING'
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-info-bg)',
                          color:
                            item.severity === 'CRITICAL'
                              ? 'var(--color-critical)'
                              : item.severity === 'WARNING'
                              ? 'var(--color-warning)'
                              : 'var(--color-info)',
                        }}
                      >
                        {item.severity === 'CRITICAL' ? '✕' : item.severity === 'WARNING' ? '▲' : 'ℹ'}{' '}
                        {item.severity}
                      </span>
                    </td>

                    {/* ID */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.id}
                    </td>

                    {/* Machine */}
                    <td>
                      <span
                        style={{ fontWeight: 700, color: 'var(--color-info)', cursor: 'pointer' }}
                        onClick={() => navigate(`/machines/${item.machineId}`)}
                        title="Open Digital Twin"
                      >
                        {item.machineName}
                      </span>
                    </td>

                    {/* Description */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {item.description}
                      </span>
                    </td>

                    {/* Sensor */}
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.sensor}
                    </td>

                    {/* Recorded Value */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>
                      {item.value}
                    </td>

                    {/* Threshold */}
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {item.threshold}
                    </td>

                    {/* Timestamp */}
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {item.timeAgo}
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: item.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: item.status === 'ACTIVE' ? 'var(--color-critical)' : 'var(--color-healthy)',
                        }}
                      >
                        {item.status}
                        {item.acknowledgedBy ? ` (${item.acknowledgedBy.split(' ')[0]})` : ''}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {item.status === 'ACTIVE' && (
                          <button
                            className="btn btn--secondary"
                            onClick={() => handleAcknowledge(item.id)}
                            style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                            title={`Acknowledge as ${currentUser.name}`}
                          >
                            ✓ Ack
                          </button>
                        )}
                        <button
                          className="table-action-btn"
                          onClick={() => navigate(`/machines/${item.machineId}`)}
                          style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                        >
                          View Twin
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
