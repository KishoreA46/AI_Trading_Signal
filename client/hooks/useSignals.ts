import { useState, useEffect, useCallback } from 'react';

import { signalsAPI, Signal } from '@/lib/api';

interface UseSignalsOptions {
  pollInterval?: number;
  enabled?: boolean;
}

export function useSignals({
  pollInterval = 30000,
  enabled = true,
}: UseSignalsOptions = {}) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const [realData, mockData] = await Promise.all([
        signalsAPI.getLatest('1h'),
        signalsAPI.getMock()
      ]);

      const combined = [...(realData as Signal[]), ...(mockData as Signal[])];
      setSignals(combined.filter((s: Signal) => s.type !== 'FLAT'));
    } catch (err) {
      console.error('[v0] Error fetching signals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Poll for signals on interval
  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately
    fetchSignals();

    // Set up polling
    const interval = setInterval(fetchSignals, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchSignals]);

  return {
    signals,
    loading,
    error,
    refetch: fetchSignals,
  };
}
