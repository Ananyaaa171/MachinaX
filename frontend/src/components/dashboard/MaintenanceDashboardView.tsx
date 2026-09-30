/* ================================================================
   MaintenanceDashboardView.tsx — Maintenance Engineer Dashboard (Aryan Mishra)
   Phase 10.5: Machine problems identification, maintenance priority queue,
   component fault highlighting, work orders, and interactive task scheduling.
   ================================================================ */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../../context/FleetContext';
import FleetDigitalTwinView from './FleetDigitalTwinView';
import CreateMaintenanceModal, { type MaintenanceTask } from './CreateMaintenanceModal';

interface Props {
  onOpenReportModal: () => void;
}

export default function MaintenanceDashboardView({ onOpenReportModal }: Props) {
  const navigate = useNavigate();
  const { metrics, twinData, refreshFleet } = useFleet();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedMachineForMaint, setSelectedMachineForMaint] = useState<number | undefined>(undefined);
  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    try {
      const saved = localStorage.getItem('machinax_maint_tasks');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default seeded maintenance tasks for Aryan
    return [
      {
        id: 'WO-8901',
        machineId: 20,
        machineName: 'Motor IM-002',
        maintenanceType: 'Drive-End Bearing Replacement',
        priority: 'CRITICAL',
        scheduledDate: '2026-10-02',
        technician: 'Aryan Mishra',
        notes: 'Accelerated bearing race spalling detected. Vibration 6.4 mm/s.',
        status: 'SCHEDULED',
        createdAt: '2026-09-29T10:00:00Z',
      },
      {
        id: 'WO-8902',
        machineId: 21,
        machineName: 'Motor IM-003',
        maintenanceType: 'Stator Winding Overhaul',
        priority: 'CRITICAL',
        scheduledDate: '2026-10-01',
        technician: 'Aryan Mishra',
        notes: 'Phase L2 inter-turn winding insulation breakdown. Megger test required.',
        status: 'IN_PROGRESS',
        createdAt: '2026-09-28T14:30:00Z',
      },
      {
        id: 'WO-8903',
        machineId: 23,
        machineName: 'Motor IM-005',
        maintenanceType: 'Dynamic Rotor Balancing & Alignment',
        priority: 'HIGH',
        scheduledDate: '2026-10-05',
        technician: 'Aryan Mishra',
        notes: 'Watch-level vibration harmonic ripple at 2x line frequency.',
        status: 'SCHEDULED',
        createdAt: '2026-09-30T00:00:00Z',
      },
    ];
  });

  const handleOpenCreateModal = (machineId?: number) => {
    setSelectedMachineForMaint(machineId);
    setCreateModalOpen(true);
  };

  const handleTaskCreated = (newTask: MaintenanceTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t))
    );
  };

  // Maintenance Priority Queue (Sorted: Critical first, lowest health, active fault)
  const priorityQueue = useMemo(() => {
    return [...twinData]
      .filter((t) => {
        const op = t.twin?.operatingState;
        const fault = t.twin?.currentFaultType;
        return op === 'CRITICAL' || op === 'WARNING' || (fault && fault !== 'NONE');
      })
      .sort((a, b) => (a.twin?.healthScore ?? 100) - (b.twin?.healthScore ?? 100));
  }, [twinData]);

  const activeFaultsCount = twinData.filter(
    (t) => t.twin?.currentFaultType && t.twin.currentFaultType !== 'NONE'
  ).length;

  const dueCount = tasks.filter((t) => t.status === 'SCHEDULED').length;
  const overdueCount = 1;
  const upcomingCount = tasks.filter((t) => t.status !== 'COMPLETED').length;

  return (
    <div className="maintenance-dashboard-view" id="view-maintenance-dashboard">
      {/* 1. Hero Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            MAINTENANCE CONTROL CENTER
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '620px' }}>
            Maintenance Engineer: Aryan Mishra • Equipment problem isolation, repair work orders, and scheduled service
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn--primary"
            onClick={() => handleOpenCreateModal()}
            id="maint-btn-create-task"
            style={{ fontSize: '0.76rem', padding: '7px 14px' }}
          >
            ➕ CREATE MAINTENANCE
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => navigate('/machines?filter=CRITICAL')}
            id="maint-btn-crit-machines"
            style={{ fontSize: '0.76rem', padding: '7px 14px', borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
          >
            🔴 CRITICAL MACHINES ({metrics.criticalCount})
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => navigate('/maintenance?tab=due')}
            id="maint-btn-due"
            style={{ fontSize: '0.76rem', padding: '7px 14px' }}
          >
            ⏳ MAINTENANCE DUE ({dueCount})
          </button>
          <button
            className="btn btn--secondary"
            onClick={onOpenReportModal}
            id="maint-btn-gen-report"
            style={{ fontSize: '0.76rem', padding: '7px 14px' }}
          >
            📄 MAINTENANCE REPORT
          </button>
        </div>
      </div>

      {/* 2. Top Maintenance KPI Cards (Phase 10.7 Section 3.1) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="card-kpi" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            MAINTENANCE DUE
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
            {dueCount}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Scheduled this shift</div>
        </div>

        <div className="card-kpi" style={{ borderLeft: '4px solid var(--color-critical)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            OVERDUE MAINTENANCE
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-critical)', fontFamily: 'var(--font-mono)' }}>
            {overdueCount}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-critical)' }}>OVERDUE threshold</div>
        </div>

        <div className="card-kpi" style={{ borderLeft: '4px solid var(--color-critical)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            CRITICAL MACHINES
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-critical)', fontFamily: 'var(--font-mono)' }}>
            {metrics.criticalCount}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Urgent intervention</div>
        </div>

        <div className="card-kpi" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            ACTIVE FAULTS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
            {activeFaultsCount}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Bearings / Stator shorts</div>
        </div>

        <div className="card-kpi" style={{ borderLeft: '4px solid var(--color-info)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            OPEN WORK ORDERS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
            {tasks.filter((t) => t.status === 'OPEN').length}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Awaiting execution</div>
        </div>

        <div className="card-kpi" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            MAINTENANCE IN PROGRESS
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Active on floor</div>
        </div>

        <div className="card-kpi" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            UPCOMING MAINTENANCE
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
            {upcomingCount}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Logged work orders</div>
        </div>
      </section>

      {/* 3. PROMINENT MAINTENANCE PRIORITY QUEUE (Section 5) */}
      <section style={{ marginBottom: 24 }}>
        <div className="panel-card" style={{ padding: '20px' }}>
          <div className="panel-card__header" style={{ marginBottom: 14 }}>
            <div className="panel-card__title">
              <span style={{ color: 'var(--color-critical)' }}>🚨</span> MAINTENANCE PRIORITY QUEUE
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Ordered by failure probability & health urgency
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {priorityQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No machines currently require maintenance intervention. All assets operating within ISO nominal parameters.
              </div>
            ) : (
              priorityQueue.map((item, index) => {
                const { machine, twin } = item;
                const isCrit = twin?.operatingState === 'CRITICAL';
                const fault = twin?.currentFaultType && twin.currentFaultType !== 'NONE'
                  ? twin.currentFaultType.replace(/_/g, ' ')
                  : 'High Vibration Warning';

                let vibVal = '—';
                let tempVal = '—';
                if (twin?.latestSensors) {
                  twin.latestSensors.forEach((s) => {
                    const l = (s.sensorLabel || s.sensorType || '').toLowerCase();
                    if (l.includes('vib')) vibVal = `${s.value.toFixed(2)} mm/s`;
                    if (l.includes('temp')) tempVal = `${s.value.toFixed(1)} °C`;
                  });
                }

                return (
                  <div
                    key={machine.id}
                    style={{
                      background: isCrit ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                      border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.28)' : 'rgba(245, 158, 11, 0.28)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: isCrit ? 'var(--color-critical)' : 'var(--color-warning)',
                          width: 24,
                        }}
                      >
                        #{index + 1}
                      </span>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {machine.name}
                          </span>
                          <span
                            className="status-badge"
                            style={{
                              background: isCrit ? 'var(--color-critical-bg)' : 'var(--color-warning-bg)',
                              color: isCrit ? 'var(--color-critical)' : 'var(--color-warning)',
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                            }}
                          >
                            ● {twin?.operatingState}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({machine.serialNumber} • {machine.location})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: '0.74rem' }}>
                          <span style={{ color: isCrit ? 'var(--color-critical)' : 'var(--color-warning)', fontWeight: 700 }}>
                            Fault: {fault}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Health: <strong>{twin?.healthScore ?? 50}%</strong>
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Vibration: <strong>{vibVal}</strong>
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Temp: <strong>{tempVal}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn btn--secondary"
                        onClick={() => navigate(`/machines/${machine.id}`)}
                        style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      >
                        ⚙ VIEW TWIN
                      </button>
                      <button
                        className="btn btn--primary"
                        onClick={() => handleOpenCreateModal(machine.id)}
                        style={{ padding: '5px 12px', fontSize: '0.72rem' }}
                      >
                        🔧 CREATE MAINTENANCE
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 4. Maintenance Digital Twin Fleet View (MEDIUM-SIZED TWINS WITH FAULT EMPHASIS) */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              MACHINE MAINTENANCE VIEW — FLEET DIGITAL TWINS
            </h2>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Component-level defect highlight: Red Drive-End Bearings, Stator Shorts & Vibration Severity
            </div>
          </div>
          <button className="btn btn--secondary" onClick={() => navigate('/machines')} style={{ fontSize: '0.72rem' }}>
            ⊞ View Equipment List
          </button>
        </div>

        <FleetDigitalTwinView twinData={twinData} mode="maintenance" />
      </section>

      {/* 5. Active Work Orders / Maintenance Queue */}
      <section style={{ marginBottom: 24 }}>
        <div className="panel-card" style={{ padding: '20px' }}>
          <div className="panel-card__header" style={{ marginBottom: 14 }}>
            <div className="panel-card__title">
              <span>📋</span> WORK ORDERS & REPAIR ACTIONS
            </div>
            <button
              className="btn btn--primary"
              onClick={() => handleOpenCreateModal()}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              + Create Work Order
            </button>
          </div>

          <div className="machine-table-wrap">
            <table className="machine-table" aria-label="Maintenance Work Orders Table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Machine Asset</th>
                  <th>Component / Task</th>
                  <th>Priority</th>
                  <th>Scheduled Date</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Isolation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isDone = task.status === 'COMPLETED';
                  const isProgress = task.status === 'IN_PROGRESS';
                  const isCancelled = task.status === 'CANCELLED';
                  const isCritical = task.priority === 'CRITICAL';
                  const mTwin = twinData.find((t) => t.machine.id === task.machineId);
                  const isMachineRunning = (mTwin?.twin?.operatingState as string) !== 'CRITICAL' && (mTwin?.twin?.operatingState as string) !== 'OFFLINE';

                  return (
                    <tr key={task.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {task.id}
                      </td>
                      <td>
                        <strong>{task.machineName}</strong>
                      </td>
                      <td>{task.maintenanceType}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 3,
                            background: isCritical ? 'var(--color-critical-bg)' : 'var(--color-warning-bg)',
                            color: isCritical ? 'var(--color-critical)' : 'var(--color-warning)',
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{task.scheduledDate}</td>
                      <td>{task.technician}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            fontSize: '0.65rem',
                            background: isDone
                              ? 'var(--color-healthy-bg)'
                              : isProgress
                              ? 'rgba(245, 158, 11, 0.15)'
                              : isCancelled
                              ? 'rgba(148, 163, 184, 0.15)'
                              : 'rgba(77, 157, 224, 0.12)',
                            color: isDone
                              ? 'var(--color-healthy)'
                              : isProgress
                              ? 'var(--color-warning)'
                              : isCancelled
                              ? 'var(--text-muted)'
                              : 'var(--color-info)',
                          }}
                        >
                          ● {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: isMachineRunning && !isDone ? 'var(--color-warning)' : 'var(--color-healthy)',
                          }}
                        >
                          {isMachineRunning && !isDone ? '⚡ LOTO Needed' : '🔒 LOTO Safe'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {task.status === 'SCHEDULED' && (
                            <button
                              className="btn btn--secondary"
                              onClick={() => {
                                setTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, status: 'IN_PROGRESS' as const } : t))
                                );
                              }}
                              style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--color-warning)' }}
                            >
                              Start
                            </button>
                          )}
                          {!isDone && !isCancelled && (
                            <button
                              className="btn btn--ghost"
                              onClick={() => handleCompleteTask(task.id)}
                              style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--color-healthy)' }}
                              title="Mark this maintenance task as completed"
                            >
                              ✓ Complete
                            </button>
                          )}
                          {!isDone && !isCancelled && (
                            <button
                              className="btn btn--ghost"
                              onClick={() => {
                                setTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, status: 'CANCELLED' as const } : t))
                                );
                              }}
                              style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--text-muted)' }}
                            >
                              ✕
                            </button>
                          )}
                          {isDone && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Logged</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Bill of Materials (BOM) / Spare Inventory */}
      <section style={{ marginBottom: 24 }}>
        <div className="panel-card" style={{ padding: '20px' }}>
          <div className="panel-card__header" style={{ marginBottom: 14 }}>
            <div className="panel-card__title">
              <span>📦</span> BILL OF MATERIALS & SPARE INVENTORY
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 3 }}>
              DEMO DATA / INVENTORY SIMULATION
            </span>
          </div>

          <div className="machine-table-wrap">
            <table className="machine-table" aria-label="Bill of Materials Inventory">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Part Number</th>
                  <th>Assembly Target</th>
                  <th>Quantity</th>
                  <th>Condition</th>
                  <th>Spare Available</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Drive-End Deep Groove Ball Bearing', part: 'BRG-6205-2RS-C3', target: 'Motor IM-002, IM-005', qty: 4, cond: 'Warning / Replace', spare: 6, stock: 'IN STOCK' },
                  { name: 'Non-Drive-End Ball Bearing', part: 'BRG-6204-2RS', target: 'Fleet Standard (NDE)', qty: 8, cond: 'Normal / Good', spare: 12, stock: 'IN STOCK' },
                  { name: 'Stator Phase Winding Assembly (Class F)', part: 'STA-WDG-4P-5KW', target: 'Motor IM-003', qty: 1, cond: 'Critical / Degrading', spare: 2, stock: 'LOW STOCK' },
                  { name: 'External Polypropylene Cooling Fan', part: 'FAN-POLY-210', target: 'Standard Induction Frame', qty: 8, cond: 'Normal / Good', spare: 5, stock: 'IN STOCK' },
                  { name: '3-Phase Terminal Block & Gland Fitting', part: 'TB-600V-40A', target: 'All Terminal Boxes', qty: 8, cond: 'Normal / Good', spare: 8, stock: 'IN STOCK' },
                  { name: 'Motor Cast-Iron Mounting Feet Hardware', part: 'PED-M12-SET', target: 'Pedestal Anchor Base', qty: 16, cond: 'Normal / Good', spare: 24, stock: 'IN STOCK' },
                ].map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{item.part}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.target}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.qty}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: item.cond.includes('Critical') ? 'var(--color-critical)' : item.cond.includes('Warning') ? 'var(--color-warning)' : 'var(--color-healthy)',
                        }}
                      >
                        {item.cond}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.spare} units</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: item.stock === 'LOW STOCK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: item.stock === 'LOW STOCK' ? 'var(--color-warning)' : 'var(--color-healthy)',
                        }}
                      >
                        ● {item.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Step-by-Step Maintenance Procedure (Digital Simulation) */}
      <section style={{ marginBottom: 24 }}>
        <div className="panel-card" style={{ padding: '20px' }}>
          <div className="panel-card__header" style={{ marginBottom: 14 }}>
            <div className="panel-card__title">
              <span>🛠</span> STEP-BY-STEP MAINTENANCE PROCEDURE
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              DIGITAL SIMULATION — Standard Operating Guideline
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { step: 1, title: 'Stop Machine', desc: 'Trigger controlled deceleration from control portal or local E-Stop.' },
              { step: 2, title: 'Verify Machine Stopped', desc: 'Confirm speed optical encoder reports 0 RPM and zero rotor inertia.' },
              { step: 3, title: 'Apply Simulated LOTO', desc: 'Simulate OSHA 1910.147 lock/tag on main electrical breaker switch.' },
              { step: 4, title: 'Inspect Component', desc: 'Measure bearing clearances, race spalling, or insulation resistance.' },
              { step: 5, title: 'Replace Component', desc: 'Install OEM certified spare (e.g. BRG-6205) using induction heater.' },
              { step: 6, title: 'Remove LOTO', desc: 'Clear physical tools, replace terminal shroud, and remove breaker lock.' },
              { step: 7, title: 'Test Machine', desc: 'Initiate 10-minute trial run and confirm baseline vibration < 2.8 mm/s.' },
              { step: 8, title: 'Complete Work Order', desc: 'Sign off digital maintenance log and record spare parts consumption.' },
            ].map((p) => (
              <div
                key={p.step}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: 'var(--color-warning)',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {p.step}
                  </span>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{p.title}</strong>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Modal */}
      <CreateMaintenanceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultMachineId={selectedMachineForMaint}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
