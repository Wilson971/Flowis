"use client";

import { cn } from "@/lib/utils";

interface StoreSeoRadialProps {
  score: number;
  size?: "sm" | "lg";
  className?: string;
}

export function StoreSeoRadial({
  score,
  size = "sm",
  className,
}: StoreSeoRadialProps) {
  const isSm = size === "sm";

  const svgSize = isSm ? 64 : 120;
  const radius = isSm ? 26 : 48;
  const strokeWidth = isSm ? 5 : 8;
  const center = svgSize / 2;

  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const dashoffset = circumference - (clampedScore / 100) * circumference;

  const colorClass =
    clampedScore >= 70
      ? "stroke-success text-success"
      : clampedScore >= 40
        ? "stroke-warning text-warning"
        : "stroke-destructive text-destructive";

  const scoreTextClass = isSm ? "text-lg" : "text-3xl";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        fill="none"
        aria-label={`SEO score: ${clampedScore} out of 100`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-muted"
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className={cn(colorClass, "transition-all duration-700 -rotate-90")}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
      </svg>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-bold tabular-nums leading-none",
            scoreTextClass,
            colorClass.split(" ")[1] // take only the text-* class
          )}
        >
          {clampedScore}
        </span>
        {!isSm && (
          <span className="text-xs text-muted-foreground leading-none mt-0.5">
            /100
          </span>
        )}
      </div>
    </div>
  );
}
