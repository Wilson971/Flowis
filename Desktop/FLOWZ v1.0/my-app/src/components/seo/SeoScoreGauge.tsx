'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getScoreColorConfig } from '@/lib/seo/scoreColors';

interface SeoScoreGaugeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    className?: string;
}

export const SeoScoreGauge = ({
    score,
    size = 'md',
    isLoading = false,
    className
}: SeoScoreGaugeProps) => {
    const safeScore = Number.isFinite(score) ? score : 0;
    const sizeConfig = {
        sm: { width: 44, strokeWidth: 3, fontSize: 'text-xs' },
        md: { width: 100, strokeWidth: 8, fontSize: 'text-2xl' },
        lg: { width: 140, strokeWidth: 10, fontSize: 'text-4xl' },
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (safeScore / 100) * circumference;

    const colorConfig = getScoreColorConfig(safeScore);
    const colors = {
        stroke: colorConfig.primary,
        text: colorConfig.text,
    };

    return (
        <div className={cn('relative flex items-center justify-center flex-shrink-0', className)}>
            <svg
                width={config.width}
                height={config.width}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={config.width / 2}
                    cy={config.width / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth={config.strokeWidth}
                />

                {/* Progress circle */}
                <motion.circle
                    cx={config.width / 2}
                    cy={config.width / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={config.strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: isLoading ? circumference : offset }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </svg>

            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isLoading ? (
                    <motion.div
                        className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                ) : (
                    <>
                        <motion.span
                            className={cn('font-bold', config.fontSize, colors.text)}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {Math.round(safeScore)}
                        </motion.span>
                    </>
                )}
            </div>
        </div>
    );
};
