import { useEffect, useState } from 'react';

/**
 * Hook for animating number counters
 * Smoothly animates from 0 to target value with easing
 *
 * @param target - Target number to count to
 * @param options - Animation options
 * @returns Animated value as string (with suffix if provided)
 *
 * @example
 * const count = useCounterAnimation(1240, { duration: 1500, decimals: 0 });
 * const percent = useCounterAnimation(74, { duration: 1500, suffix: '%' });
 */
export const useCounterAnimation = (
  target: number,
  options: {
    duration?: number;
    decimals?: number;
    suffix?: string;
    prefix?: string;
  } = {}
): string => {
  const {
    duration = 1500,
    decimals = 0,
    suffix = '',
    prefix = '',
  } = options;

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Reset to 0 when target changes
    setCurrent(0);

    const startTime = Date.now();
    const startValue = 0;
    const diff = target - startValue;

    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easedProgress = easeOutCubic(progress);
      const newValue = startValue + diff * easedProgress;

      setCurrent(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at target
        setCurrent(target);
      }
    };

    animate();

    // Cleanup on unmount or target change
    return () => {
      setCurrent(target);
    };
  }, [target, duration]);

  // Format the number
  const formattedValue = current.toFixed(decimals);

  return `${prefix}${formattedValue}${suffix}`;
};
