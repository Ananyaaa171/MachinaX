/* ================================================================
   CreateMaintenanceModal.tsx — Industrial Work Order Creation Modal
   Phase 10.5: Allows Maintenance Engineers (Aryan Mishra) to create,
   schedule, and assign preventive maintenance work orders for
   specific machines in the fleet.
   ================================================================ */

import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { useDemoUser } from '../../context/DemoUserContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMachineId?: number;
  onTaskCreated?: (task: MaintenanceTask) => void;
}

export interface MaintenanceTask {
  id: string;
  machineId: number;
  machineName: string;
  maintenanceType: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledDate: string;
  technician: string;
  notes: string;
  status: 'OPEN' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export default function CreateMaintenanceModal({
  isOpen,
  onClose,
  defaultMachineId,
  onTaskCreated,
}: Props) {
  const { machines } = useFleet();
  const { currentUser } = useDemoUser();

  const [machineId, setMachineId] = useState<number>(() => {
    if (defaultMachineId) return defaultMachineId;
    return machines[0]?.id || 1;
  });

  const [maintenanceType, setMaintenanceType] = useState('Drive-End Bearing Replacement');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [technician, setTechnician] = useState(currentUser.name || 'Aryan Mishra');
  const [notes, setNotes] = useState(
    'Vibration spectral signature indicates outer raceway micro-pitting. Schedule lockout/tagout (LOTO) procedure and replace with SKF 6309 bearing.'
  );
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMachine = machines.find((m) => m.id === Number(machineId));
    const newTask: MaintenanceTask = {
      id: `WO-${Date.now().toString(36).toUpperCase()}`,
      machineId: Number(machineId),
      machineName: targetMachine?.name || `Motor IM-${String(machineId).padStart(3, '0')}`,
      maintenanceType,
      priority,
      scheduledDate,
      technician,
      notes,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for demo persistence
    try {
      const existing = JSON.parse(localStorage.getItem('machinax_maint_tasks') || '[]');
      localStorage.setItem('machinax_maint_tasks', JSON.stringify([newTask, ...existing]));
    } catch {
      // ignore
    }

    setSubmitted(true);
    onTaskCreated?.(newTask);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1060 }} onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '92vw',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(245, 158, 11, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>🔧</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                CREATE MAINTENANCE WORK ORDER
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Assigned Role: <strong>{currentUser.name}</strong> ({currentUser.role})
              </div>
            </div>
          </div>
          <button className="btn btn--secondary" onClick={onClose} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>
            ✕
          </button>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-healthy)', margin: '0 0 6px 0' }}>
              WORK ORDER SCHEDULED
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Maintenance task for <strong>{maintenanceType}</strong> has been logged to the engineering queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Machine Asset */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase' }}>
                Target Machine Asset
              </label>
              <select
                className="sidebar__select"
                value={machineId}
                onChange={(e) => setMachineId(Number(e.target.value))}
                style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-primary)' }}
                id="select-maint-machine"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} — {m.name} ({m.serialNumber}) • {m.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Maintenance Type & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase' }}>
                  Maintenance Type
                </label>
                <select
                  className="sidebar__select"
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-primary)' }}
                  id="select-maint-type"
                >
                  <option value="Drive-End Bearing Replacement">Drive-End Bearing Replacement</option>
                  <option value="Stator Winding Overhaul">Stator Winding Overhaul</option>
                  <option value="Rotor Dynamic Balancing">Rotor Dynamic Balancing</option>
                  <option value="Shaft Realignment & Coupling">Shaft Realignment & Coupling</option>
                  <option value="Lubrication & Oil Flushing">Lubrication & Oil Flushing</option>
                  <option value="Cooling Fan & Shroud Cleansing">Cooling Fan & Shroud Cleansing</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase' }}>
                  Priority Level
                </label>
                <select
                  className="sidebar__select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-primary)' }}
                  id="select-maint-priority"
                >
                  <option value="CRITICAL">Critical (Immediate)</option>
                  <option value="HIGH">High (Within 48h)</option>
                  <option value="MEDIUM">Medium (Scheduled)</option>
                  <option value="LOW">Low (Routine)</option>
                </select>
              </div>
            </div>

            {/* Scheduled Date & Technician */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase' }}>
                  Scheduled Date
                </label>
                <input
                  type="date"
                  className="topbar__search-input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-primary)' }}
                  id="input-maint-date"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase' }}>
                  Assigned Technician
                </label>
                <input
                  type="text"
                  className="topbar__search-input"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-primary)' }}
                  id="input-maint-tech"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase' }}>
                Operational & Technical Notes
              </label>
              <textarea
                className="topbar__search-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-primary)', resize: 'vertical', fontSize: '0.74rem' }}
                id="textarea-maint-notes"
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn--secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" id="btn-submit-maint-task">
                🔧 Create Task
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
