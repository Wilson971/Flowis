'use client';

import { cn } from '@/lib/utils';
import { getScoreColorConfig } from '@/lib/seo/scoreColors';

interface SeoScoreCircleProps {
    score: number | null | undefined;
    size?: number;
    className?: string;
}

/**
 * Compact SVG circle showing SEO score with colored stroke.
 * Default 24px — designed for product list rows.
 */
export function SeoScoreCircle({ score, size = 24, className }: SeoScoreCircleProps) {
    const strokeWidth = size >= 32 ? 3 : 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const displayScore = Number.isFinite(score) ? score : 0;
    const offset = circumference - (displayScore / 100) * circumference;

    if (score === null || score === undefined) {
        return (
            <div
                className={cn('flex items-center justify-center rounded-full bg-muted text-muted-foreground', className)}
                style={{ width: size, height: size }}
            >
                <span style={{ fontSize: size * 0.35 }}>?</span>
            </div>
        );
    }

    const config = getScoreColorConfig(score);

    return (
        <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={config.primary}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className={cn('font-bold', config.text)}
                    style={{ fontSize: size * 0.35 }}
                >
                    {Math.round(score)}
                </span>
            </div>
        </div>
    );
}
