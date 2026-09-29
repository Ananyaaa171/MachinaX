/* ================================================================
   MaintenancePage.tsx — Maintenance Work Orders & History
   Phase 10: Upcoming, Overdue, and Completed maintenance tasks
   with technician assignment (Aryan Mishra) & interactive actions.
   ================================================================ */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoDataService, MaintenanceRecord } from '../services/demoDataService';
import { useDemoUser } from '../context/DemoUserContext';

type TabType = 'ALL' | 'SCHEDULED' | 'OVERDUE' | 'COMPLETED';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { currentUser } = useDemoUser();

  const [records, setRecords] = useState<MaintenanceRecord[]>(() =>
    demoDataService.getMaintenanceRecords()
  );
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMachine, setNewMachine] = useState('Motor IM-001');
  const [newPriority, setNewPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  const handleComplete = (id: string) => {
    const success = demoDataService.completeMaintenanceTask(id);
    if (success) {
      setRecords([...demoDataService.getMaintenanceRecords()]);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    demoDataService.createMaintenanceTask({
      machineId: 1,
      machineName: newMachine,
      type: newTitle,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      priority: newPriority,
      status: 'SCHEDULED',
      technician: currentUser.name,
      notes: `Work order dispatched by ${currentUser.name} (${currentUser.role}).`,
      estimatedHours: 3.0,
    });

    setRecords([...demoDataService.getMaintenanceRecords()]);
    setShowCreateModal(false);
    setNewTitle('');
  };

  const filteredRecords = useMemo(() => {
    if (activeTab === 'SCHEDULED') return records.filter((r) => r.status === 'SCHEDULED');
    if (activeTab === 'OVERDUE') return records.filter((r) => r.status === 'OVERDUE');
    if (activeTab === 'COMPLETED') return records.filter((r) => r.status === 'COMPLETED');
    return records;
  }, [records, activeTab]);

  const scheduledCount = records.filter((r) => r.status === 'SCHEDULED').length;
  const overdueCount = records.filter((r) => r.status === 'OVERDUE').length;
  const completedCount = records.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="maintenance-page" id="page-maintenance-planner">
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
              — {currentUser.focusArea === 'MAINTENANCE'
                ? 'Lead Field Engineer Mode — Active work order execution, bearing grease replacement & rotor inspection'
                : currentUser.focusArea === 'OVERVIEW'
                ? 'Maintenance schedule oversight, spare parts availability & contractor allocation'
                : currentUser.focusArea === 'RELIABILITY'
                ? 'Reviewing PM task effectiveness vs. mean time between machine failures'
                : 'Operating status tracking during active maintenance isolations'}
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
          DEMONSTRATION DATA
        </span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">MAINTENANCE PLANNER & WORK ORDERS</h1>
          <div className="page-header__subtitle">
            Scheduled predictive work orders, mechanical repairs, and overhaul history
          </div>
        </div>

        <button
          className="btn btn--primary"
          onClick={() => setShowCreateModal(true)}
          id="btn-create-work-order"
        >
          + Create Work Order
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Scheduled Orders</span>
            <span className="summary-card__icon summary-card__icon--maintenance">🔧</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-info)' }}>
            {scheduledCount}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Overdue Tasks</span>
            <span className="summary-card__icon summary-card__icon--critical">⚠</span>
          </div>
          <div className="summary-card__number" style={{ color: overdueCount > 0 ? 'var(--color-critical)' : 'var(--text-secondary)' }}>
            {overdueCount}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Completed Logs</span>
            <span className="summary-card__icon summary-card__icon--healthy">✓</span>
          </div>
          <div className="summary-card__number" style={{ color: 'var(--color-healthy)' }}>
            {completedCount}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__top">
            <span className="summary-card__label">Lead Technician</span>
            <span className="summary-card__icon summary-card__icon--total">👷</span>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            Aryan Mishra
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Plant Bay 3 Maintenance</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(
          [
            { id: 'ALL', label: 'All Orders', count: records.length },
            { id: 'SCHEDULED', label: 'Scheduled', count: scheduledCount },
            { id: 'OVERDUE', label: 'Overdue', count: overdueCount },
            { id: 'COMPLETED', label: 'Completed History', count: completedCount },
          ] as Array<{ id: TabType; label: string; count: number }>
        ).map((tab) => (
          <button
            key={tab.id}
            className={`filter-pill ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-maint-${tab.id.toLowerCase()}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Maintenance Table */}
      <div className="machine-table-card">
        <div className="machine-table-wrap">
          <table className="machine-table" aria-label="Maintenance Table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Target Asset</th>
                <th>Maintenance Procedure</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Assigned Tech</th>
                <th>Est. Hours</th>
                <th>Status</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No work orders found in this category.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} id={`row-maint-${item.id}`}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-info)' }}>
                      {item.id}
                    </td>

                    <td>
                      <span
                        style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                        onClick={() => navigate(`/machines/${item.machineId}`)}
                        title="View Digital Twin"
                      >
                        {item.machineName}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                      {item.type}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: item.status === 'OVERDUE' ? 'var(--color-critical)' : 'var(--text-secondary)' }}>
                      {item.dueDate}
                      {item.status === 'OVERDUE' && ' ⚠'}
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background:
                            item.priority === 'CRITICAL'
                              ? 'var(--color-critical-bg)'
                              : item.priority === 'HIGH'
                              ? 'var(--color-warning-bg)'
                              : 'var(--color-info-bg)',
                          color:
                            item.priority === 'CRITICAL'
                              ? 'var(--color-critical)'
                              : item.priority === 'HIGH'
                              ? 'var(--color-warning)'
                              : 'var(--color-info)',
                        }}
                      >
                        {item.priority}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.technician}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {item.estimatedHours} hrs
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background:
                            item.status === 'COMPLETED'
                              ? 'var(--color-healthy-bg)'
                              : item.status === 'OVERDUE'
                              ? 'var(--color-critical-bg)'
                              : 'var(--color-info-bg)',
                          color:
                            item.status === 'COMPLETED'
                              ? 'var(--color-healthy)'
                              : item.status === 'OVERDUE'
                              ? 'var(--color-critical)'
                              : 'var(--color-info)',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>
                      {item.notes}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {item.status !== 'COMPLETED' && (
                          <button
                            className="btn btn--secondary"
                            onClick={() => handleComplete(item.id)}
                            style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                            title="Sign-off as completed"
                          >
                            ✓ Sign-off
                          </button>
                        )}
                        <button
                          className="table-action-btn"
                          onClick={() => navigate(`/machines/${item.machineId}`)}
                          style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                        >
                          Twin
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

      {/* Create Order Modal */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              width: '460px',
              maxWidth: '92vw',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>+ Dispatch New Work Order</div>
              <button className="btn btn--secondary" onClick={() => setShowCreateModal(false)} style={{ padding: '2px 8px' }}>✕</button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Asset</label>
                <select
                  value={newMachine}
                  onChange={(e) => setNewMachine(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: 4, background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: 4 }}
                >
                  <option value="Motor IM-001">Motor IM-001 (Bay 3)</option>
                  <option value="Centrifugal Pump CP-002">Centrifugal Pump CP-002</option>
                  <option value="Air Compressor AC-001">Air Compressor AC-001</option>
                  <option value="Exhaust Blower EB-003">Exhaust Blower EB-003</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Maintenance Procedure</label>
                <input
                  type="text"
                  placeholder="e.g. Drive-End Bearing Vibration Verification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: 4, background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', marginTop: 4, background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: 4 }}
                >
                  <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                  <option value="HIGH">HIGH (Within 48h)</option>
                  <option value="MEDIUM">MEDIUM (Scheduled Window)</option>
                  <option value="LOW">LOW (Routine Advisory)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Dispatch Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
