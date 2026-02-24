"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface SparklineChartProps {
  /** Data points to render */
  data: number[];
  /** SVG width */
  width?: number;
  /** SVG height */
  height?: number;
  /** Stroke color (CSS value) */
  color?: string;
  /** Gradient fill color (CSS value) */
  fillColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the path drawing */
  animated?: boolean;
  /** Animation delay */
  delay?: number;
  /** Unique ID for gradient (must be unique per page) */
  id?: string;
}

/**
 * SparklineChart - Inline SVG trend visualization
 *
 * Lightweight sparkline with draw-in animation and gradient fill.
 * Used in KPI cards for showing metric trends.
 */
export function SparklineChart({
  data,
  width = 120,
  height = 32,
  color = "hsl(var(--primary))",
  fillColor,
  strokeWidth = 1.5,
  className,
  animated = true,
  delay = 0.6,
  id = "sparkline",
}: SparklineChartProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: "", areaPath: "" };
    }

    const padding = 2;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Normalize data points to SVG coordinates
    const points = data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * effectiveWidth,
      y: padding + effectiveHeight - ((val - min) / range) * effectiveHeight,
    }));

    // Build smooth cubic bezier path
    let line = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpx = (curr.x + next.x) / 2;
      line += ` C ${cpx},${curr.y} ${cpx},${next.y} ${next.x},${next.y}`;
    }

    // Area path (closed version for gradient fill)
    const area = `${line} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  const gradientFill = fillColor || color;
  const gradientId = `${id}-gradient`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientFill} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gradientFill} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gradient fill area */}
      <motion.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{
          duration: motionTokens.durations.slow,
          delay: delay + 0.3,
          ease: motionTokens.easings.smooth,
        }}
        style={{ color }}
      />

      {/* Line stroke — color via CSS currentColor to avoid oklab parsing by Framer Motion */}
      <motion.path
        d={linePath}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{
          pathLength: {
            duration: motionTokens.durations.slowest,
            delay,
            ease: motionTokens.easings.smooth,
          },
          opacity: {
            duration: motionTokens.durations.fast,
            delay,
          },
        }}
        style={{ color }}
      />
    </svg>
  );
}

/**
 * Generate synthetic trend data from current + previous values.
 * Useful when only current and M-1 snapshots are available.
 */
export function generateTrendData(
  currentValue: number,
  previousValue: number | null,
  points: number = 7
): number[] {
  const prev = previousValue ?? currentValue * 0.9;
  const data: number[] = [];
  const diff = currentValue - prev;

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    // Smooth curve with slight randomness for natural look
    const base = prev + diff * progress;
    const jitter = (Math.sin(i * 2.1) * 0.05 + Math.cos(i * 1.3) * 0.03) * Math.abs(diff || currentValue * 0.1);
    data.push(Math.max(0, base + jitter));
  }

  return data;
}
