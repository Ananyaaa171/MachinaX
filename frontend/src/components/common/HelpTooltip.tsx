/* ================================================================
   HelpTooltip.tsx — Accessible, friendly industrial micro-help badge.
   Phase 10.8: Provides clear, plain-language explanations for
   industrial metrics (RUL, MTBF, Power Factor, Vibration, etc.)
   ================================================================ */

import React, { useState } from 'react';

interface Props {
  text: string;
  title?: string;
  children?: React.ReactNode;
}

export default function HelpTooltip({ text, title, children }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        cursor: 'help',
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-label={title ? `${title}: ${text}` : text}
    >
      {children ? (
        children
      ) : (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--text-muted)',
            fontSize: '0.62rem',
            fontWeight: 700,
            marginLeft: 5,
            lineHeight: 1,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            userSelect: 'none',
          }}
        >
          ℹ
        </span>
      )}

      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            fontSize: '0.72rem',
            lineHeight: 1.4,
            padding: '7px 11px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            minWidth: 180,
            maxWidth: 260,
            pointerEvents: 'none',
            whiteSpace: 'normal',
            textAlign: 'left',
          }}
        >
          {title && (
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 2 }}>
              {title}
            </div>
          )}
          <div style={{ color: 'var(--text-secondary)' }}>{text}</div>
        </div>
      )}
    </span>
  );
}
