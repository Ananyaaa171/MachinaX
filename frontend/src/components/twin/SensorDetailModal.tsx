/* ================================================================
   SensorDetailModal.tsx — Interactive Sensor Inspection Modal
   Phase 10: Displays real-time sensor limits, ISO guidelines,
   and signal telemetry when clicking on digital twin hotspots.
   ================================================================ */

import React from 'react';

export interface SensorData {
  id: string;
  name: string;
  location: string;
  value: number;
  unit: string;
  status: string;
  normalRange: string;
  warningRange: string;
  criticalRange: string;
  standard: string;
  description: string;
  icon: string;
}

interface Props {
  sensor: SensorData | null;
  onClose: () => void;
}

export default function SensorDetailModal({ sensor, onClose }: Props) {
  if (!sensor) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'NORMAL':
      case 'GOOD':
        return 'var(--color-healthy)';
      case 'WARNING':
      case 'WATCH':
        return 'var(--color-warning)';
      case 'CRITICAL':
        return 'var(--color-critical)';
      default:
        return 'var(--color-info)';
    }
  };

  const statusColor = getStatusColor(sensor.status);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          width: '480px',
          maxWidth: '94vw',
          maxHeight: 'min(90vh, 680px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>{sensor.icon}</span>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {sensor.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Physical Location: {sensor.location}
              </div>
            </div>
          </div>
          <button
            className="btn btn--secondary"
            style={{ padding: '2px 8px', fontSize: '0.8rem' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main Reading Display */}
          <div
            style={{
              background: 'var(--bg-inset)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${statusColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Current Live Reading
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: statusColor, lineHeight: 1.2 }}>
                {sensor.value.toFixed(2)}{' '}
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {sensor.unit}
                </span>
              </div>
            </div>
            <div
              style={{
                background: `${statusColor}15`,
                color: statusColor,
                border: `1px solid ${statusColor}40`,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              ● {sensor.status}
            </div>
          </div>

          {/* Operating Limits / Thresholds */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Operating Threshold Ranges ({sensor.standard || 'ISO Standard'})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ background: 'var(--bg-inset)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-healthy)', fontWeight: 700 }}>NORMAL</div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
                  {sensor.normalRange}
                </div>
              </div>

              <div style={{ background: 'var(--bg-inset)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-warning)', fontWeight: 700 }}>WARNING</div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
                  {sensor.warningRange}
                </div>
              </div>

              <div style={{ background: 'var(--bg-inset)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-critical)', fontWeight: 700 }}>CRITICAL</div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
                  {sensor.criticalRange}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Note */}
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              background: 'rgba(77, 157, 224, 0.05)',
              borderLeft: '3px solid var(--color-info)',
              padding: '8px 12px',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              lineHeight: 1.5,
            }}
          >
            <strong>Diagnostic Insight:</strong> {sensor.description}
          </div>

          {/* Footer action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              className="btn btn--secondary"
              onClick={onClose}
              style={{ fontSize: '0.75rem', padding: '6px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
