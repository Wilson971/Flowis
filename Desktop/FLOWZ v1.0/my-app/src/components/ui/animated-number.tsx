"use client"

import { useEffect, useRef } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * AnimatedNumber Component
 *
 * Counts up from 0 to the target value with a smooth animation.
 * Triggers when scrolled into view. Respects prefers-reduced-motion.
 *
 * @example
 * <AnimatedNumber value={1234} />
 * <AnimatedNumber value={99.5} suffix="%" />
 * <AnimatedNumber value={15000} prefix="$" formatOptions={{ notation: "compact" }} />
 */

interface AnimatedNumberProps {
  /** Target value to animate to */
  value: number;
  /** Additional CSS classes */
  className?: string;
  /** Animation duration in seconds (default 1.5) */
  duration?: number;
  /** Intl.NumberFormat options for formatting */
  formatOptions?: Intl.NumberFormatOptions;
  /** Text before the number */
  prefix?: string;
  /** Text after the number */
  suffix?: string;
  /** Locale for number formatting (default "fr-FR") */
  locale?: string;
}

export const AnimatedNumber = ({
  value,
  className,
  duration = 1.5,
  formatOptions,
  prefix = "",
  suffix = "",
  locale = "fr-FR",
}: AnimatedNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();

  const formatted = useTransform(motionValue, (latest) => {
    if (formatOptions) {
      return new Intl.NumberFormat(locale, formatOptions).format(latest);
    }
    return Math.round(latest).toLocaleString(locale);
  });

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      motionValue.set(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.23, 1, 0.32, 1],
    });

    return controls.stop;
  }, [value, isInView, prefersReducedMotion, duration, motionValue]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{formatted}</motion.span>
      {suffix}
    </span>
  );
};
