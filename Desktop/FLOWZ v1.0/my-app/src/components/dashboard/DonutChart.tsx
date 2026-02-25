"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  glowColor?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

/**
 * DonutChart — Multi-segment SVG donut with glow effects
 *
 * Glassmorphism-ready: each segment has its own color + optional glow.
 * Renders children in the center (typically the hero value).
 */
export function DonutChart({
  segments,
  size = 120,
  strokeWidth = 10,
  className,
  children,
  delay = 0.3,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Build cumulative offsets for each segment
  let accumulated = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((segment) => {
      const fraction = total > 0 ? segment.value / total : 0;
      const length = fraction * circumference;
      const offset = accumulated;
      accumulated += length;

      return {
        ...segment,
        fraction,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset,
      };
    });

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
    >
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
          className="text-muted/10"
        />

        {/* Segments */}
        {arcs.map((arc, i) => (
          <g key={arc.label}>
            {/* Glow layer */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.glowColor || arc.color}
              strokeWidth={strokeWidth + 6}
              strokeLinecap="round"
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              className="opacity-15 blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{
                duration: motionTokens.durations.slowest,
                delay: delay + i * 0.1,
              }}
            />

            {/* Actual segment */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`0 ${circumference}`}
              animate={{
                strokeDasharray: arc.dashArray,
                strokeDashoffset: arc.dashOffset,
              }}
              transition={{
                duration: motionTokens.durations.slowest + 0.4,
                delay: delay + i * 0.08,
                ease: motionTokens.easings.smooth,
              }}
            />
          </g>
        ))}
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
