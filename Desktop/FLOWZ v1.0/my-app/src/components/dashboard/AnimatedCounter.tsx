"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface AnimatedCounterProps {
  /** Target value to animate to */
  value: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Number format */
  format?: "integer" | "decimal" | "percent" | "compact";
  /** Locale for number formatting */
  locale?: string;
  /** CSS classes */
  className?: string;
  /** Text before number */
  prefix?: string;
  /** Text after number */
  suffix?: string;
}

/**
 * AnimatedCounter - Premium number roll-up animation
 *
 * Animates a number from 0 to target with spring physics.
 * Used across all KPI cards for premium metric display.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  delay = 0.3,
  format = "integer",
  locale = "fr-FR",
  className,
  prefix,
  suffix,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const previousValue = useRef(0);

  const formatNumber = useCallback(
    (n: number): string => {
      switch (format) {
        case "decimal":
          return n.toLocaleString(locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
        case "percent":
          return n.toLocaleString(locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          });
        case "compact":
          if (n >= 1000) {
            return `${(n / 1000).toLocaleString(locale, {
              maximumFractionDigits: 1,
            })}k`;
          }
          return Math.round(n).toLocaleString(locale);
        default:
          return Math.round(n).toLocaleString(locale);
      }
    },
    [format, locale]
  );

  useEffect(() => {
    if (!ref.current) return;

    const controls = animate(previousValue.current, value, {
      duration,
      delay,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (latest) => {
        if (!ref.current) return;
        const formatted = formatNumber(latest);
        const display = `${prefix || ""}${formatted}${format === "percent" ? "%" : ""}${suffix || ""}`;
        ref.current.textContent = display;
      },
    });

    previousValue.current = value;

    return () => controls.stop();
  }, [value, duration, delay, format, prefix, suffix, formatNumber]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums font-bold", className)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.durations.normal,
        delay,
        ease: motionTokens.easings.smooth,
      }}
    >
      {prefix || ""}0{format === "percent" ? "%" : ""}{suffix || ""}
    </motion.span>
  );
}
