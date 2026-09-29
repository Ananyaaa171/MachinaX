/* ================================================================
   MACHINA-X — Utility Helpers
   Formatting, status mapping, and display helpers.
   ================================================================ */

import type { OperatingState, FaultType } from '../types';

/**
 * Format an ISO timestamp to a readable local time string.
 */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Format an ISO timestamp to date + time.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Map operating state to CSS modifier class.
 */
export function stateToClass(state: OperatingState | string | null | undefined): string {
  switch (state?.toUpperCase()) {
    case 'NORMAL':
      return 'normal';
    case 'WATCH':
      return 'watch';
    case 'WARNING':
      return 'warning';
    case 'CRITICAL':
      return 'critical';
    default:
      return 'unknown';
  }
}

/**
 * Map operating state to an emoji/icon character.
 */
export function stateIcon(state: OperatingState | string | null | undefined): string {
  switch (state?.toUpperCase()) {
    case 'NORMAL':
      return '✓';
    case 'WATCH':
      return '◉';
    case 'WARNING':
      return '⚠';
    case 'CRITICAL':
      return '✕';
    default:
      return '?';
  }
}

/**
 * Map sensor status string to CSS modifier.
 */
export function sensorStatusClass(status: string | null | undefined): string {
  switch (status?.toUpperCase()) {
    case 'NORMAL':
      return 'normal';
    case 'WATCH':
      return 'watch';
    case 'WARNING':
      return 'warning';
    case 'CRITICAL':
      return 'critical';
    default:
      return 'unknown';
  }
}

/**
 * Format a fault type enum value to human-readable text.
 */
export function formatFaultType(fault: FaultType | string | null | undefined): string {
  if (!fault || fault === 'NONE') return 'None';
  return fault
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a number to a fixed number of decimal places.
 */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(decimals);
}

/**
 * Format a probability (0-1) as a percentage.
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${(Number(value) * 100).toFixed(1)}%`;
}

/**
 * Get health score color based on value.
 */
export function healthScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#6b7280';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

/**
 * Map maintenance priority to CSS modifier.
 */
export function priorityClass(priority: string | null | undefined): string {
  if (!priority) return '';
  const p = priority.toUpperCase();
  if (p.includes('P1') || p.includes('IMMEDIATE')) return 'p1';
  if (p.includes('P2') || p.includes('SCHEDULE')) return 'p2';
  if (p.includes('P3') || p.includes('MONITOR')) return 'p3';
  return '';
}

/**
 * Format priority for display.
 */
export function formatPriority(priority: string | null | undefined): string {
  if (!priority) return 'Unknown';
  const p = priority.toUpperCase();
  if (p.includes('P1') || p.includes('IMMEDIATE')) return 'P1 — Immediate';
  if (p.includes('P2') || p.includes('SCHEDULE')) return 'P2 — Schedule';
  if (p.includes('P3') || p.includes('MONITOR')) return 'P3 — Monitor';
  return priority;
}

/**
 * Map SHAP impact level to CSS modifier.
 */
export function shapImpactClass(impact: string | null | undefined): string {
  switch (impact?.toLowerCase()) {
    case 'high':
      return 'high';
    case 'moderate':
    case 'medium':
      return 'moderate';
    default:
      return 'low';
  }
}
