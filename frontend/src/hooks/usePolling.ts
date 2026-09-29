/* ================================================================
   MACHINA-X — Centralized Polling Hook
   Single polling mechanism for the entire dashboard.
   Uses the Digital Twin aggregate endpoint as the primary refresh.
   Avoids overlapping requests.
   ================================================================ */

import { useEffect, useRef, useCallback, useState } from 'react';

const DEFAULT_INTERVAL = Number(import.meta.env.VITE_REFRESH_INTERVAL_MS) || 5000;

export interface UsePollingOptions {
  /** Polling interval in ms. Defaults to VITE_REFRESH_INTERVAL_MS or 5000. */
  intervalMs?: number;
  /** Whether polling is active. Defaults to true. */
  enabled?: boolean;
}

/**
 * Centralized polling hook. Calls the async `fetcher` at regular intervals.
 * Prevents overlapping requests. Cleans up on unmount.
 *
 * Returns { data, error, loading, lastUpdated, refresh }.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions = {},
) {
  const { intervalMs = DEFAULT_INTERVAL, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isFetchingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const doFetch = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  // Initial fetch + polling setup
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setLoading(false);
      return;
    }

    // Initial fetch
    setLoading(true);
    doFetch();

    // Polling interval
    intervalRef.current = setInterval(doFetch, intervalMs);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [doFetch, intervalMs, enabled]);

  const refresh = useCallback(() => {
    doFetch();
  }, [doFetch]);

  return { data, error, loading, lastUpdated, refresh };
}
