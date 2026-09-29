/* ================================================================
   MachineSelector — Dropdown for selecting the active machine.
   Fetches machines from backend dynamically.
   ================================================================ */

import { useEffect, useState } from 'react';
import { getMachines } from '../api/client';
import type { MachineResponse } from '../types';

interface Props {
  selectedId: number | null;
  onSelect: (machineId: number) => void;
}

export default function MachineSelector({ selectedId, onSelect }: Props) {
  const [machines, setMachines] = useState<MachineResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getMachines()
      .then((data) => {
        if (!mounted) return;
        setMachines(data);
        setError(null);

        // Auto-select the first machine if none selected
        if (!selectedId && data.length > 0) {
          onSelect(data[0].id);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load machines');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []); // Only load once on mount

  return (
    <div className="machine-selector" id="machine-selector">
      <label className="machine-selector__label" htmlFor="machine-select">
        Machine
      </label>
      {loading ? (
        <span className="machine-selector__label">Loading…</span>
      ) : error ? (
        <span className="machine-selector__label" style={{ color: 'var(--color-critical)' }}>
          ⚠ {error}
        </span>
      ) : (
        <select
          id="machine-select"
          className="machine-selector__select"
          value={selectedId ?? ''}
          onChange={(e) => onSelect(Number(e.target.value))}
        >
          {machines.length === 0 && <option value="">No machines available</option>}
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.serialNumber}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
