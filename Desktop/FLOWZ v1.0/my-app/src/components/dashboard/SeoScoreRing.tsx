"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface SeoScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * SeoScoreRing - Animated circular progress for SEO score
 *
 * SVG circle with spring-animated fill from 0 → score.
 * Color transitions: red (<40), orange (<70), green (≥70).
 */
export function SeoScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  className,
}: SeoScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 20,
    mass: 1,
  });

  const strokeDashoffset = useTransform(
    springValue,
    (v) => circumference - (v / 100) * circumference
  );

  useEffect(() => {
    setMounted(true);
    springValue.set(Math.min(Math.max(score, 0), 100));
  }, [score, springValue]);

  const getColor = (s: number) => {
    if (s < 40) return { stroke: "hsl(var(--destructive))", text: "text-destructive" };
    if (s < 70) return { stroke: "hsl(var(--warning))", text: "text-warning" };
    return { stroke: "hsl(var(--success))", text: "text-success" };
  };

  const { stroke, text } = getColor(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Animated progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: mounted ? strokeDashoffset : circumference }}
        />
      </svg>
      {/* Center value */}
      <span className={cn("absolute text-xs font-bold", text)}>
        {Math.round(score)}
      </span>
    </div>
  );
}
