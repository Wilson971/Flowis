import { useEffect, useState } from 'react';

/**
 * Hook to stabilize loading states and prevent UI flashing
 * Ensures loading state is shown for a minimum duration
 *
 * This prevents jarring UX where:
 * - Loading indicator flashes for 50ms then disappears
 * - User sees a flicker without being able to read content
 *
 * @param isLoading - Current loading state from API/data source
 * @param minDuration - Minimum time to show loading state (in ms)
 * @returns Smoothed loading state that respects minimum duration
 *
 * @example
 * const { data, isLoading } = useQuery(...);
 * const smoothLoading = useMinLoadTime(isLoading, 500);
 *
 * // smoothLoading will be true for at least 500ms even if isLoading becomes false sooner
 */
export const useMinLoadTime = (
  isLoading: boolean,
  minDuration: number = 500
): boolean => {
  const [smoothLoading, setSmoothLoading] = useState(isLoading);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);

  useEffect(() => {
    // When loading starts, record the start time
    if (isLoading && !loadStartTime) {
      setLoadStartTime(Date.now());
      setSmoothLoading(true);
    }

    // When loading finishes
    if (!isLoading && loadStartTime) {
      const elapsed = Date.now() - loadStartTime;
      const remaining = Math.max(0, minDuration - elapsed);

      // If minimum duration hasn't passed, delay setting smoothLoading to false
      if (remaining > 0) {
        const timeout = setTimeout(() => {
          setSmoothLoading(false);
          setLoadStartTime(null);
        }, remaining);

        return () => clearTimeout(timeout);
      } else {
        // Minimum duration already passed, update immediately
        setSmoothLoading(false);
        setLoadStartTime(null);
      }
    }
  }, [isLoading, loadStartTime, minDuration]);

  return smoothLoading;
};
