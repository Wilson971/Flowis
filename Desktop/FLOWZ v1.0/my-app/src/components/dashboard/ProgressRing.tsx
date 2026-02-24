"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface ProgressRingProps {
  /** Progress value 0-100 */
  value: number;
  /** Ring size in px */
  size?: number;
  /** Stroke thickness */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Children rendered inside the ring */
  children?: React.ReactNode;
  /** Animation delay */
  delay?: number;
  /** Track color */
  trackClass?: string;
  /** Progress color */
  progressClass?: string;
}

/**
 * ProgressRing - Animated radial progress indicator
 *
 * SVG-based circular progress with smooth fill animation.
 * Renders children in the center (typically the value label).
 */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  delay = 0.3,
  trackClass = "text-muted/20",
  progressClass,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, 100) / 100) * circumference;

  // Auto-determine progress color from value
  const autoProgressClass = progressClass || (
    value >= 80 ? "text-signal-success" :
    value >= 50 ? "text-primary" :
    "text-signal-warning"
  );

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClass}
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={autoProgressClass}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: motionTokens.durations.slowest + motionTokens.durations.slow,
            delay,
            ease: motionTokens.easings.smooth,
          }}
        />

        {/* Glow effect on the progress end */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          className={cn(autoProgressClass, "opacity-20 blur-[2px]")}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: motionTokens.durations.slowest + motionTokens.durations.slow,
            delay,
            ease: motionTokens.easings.smooth,
          }}
        />
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
