'use client';

import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import { Card } from '@/components/ui/card';
import { TrendIndicator } from './TrendIndicator';
import { SparklineChart } from './SparklineChart';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { current: number; previous: number | null };
  sparklineData?: number[];
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  sparklineData,
  description,
  className,
}: MetricCardProps) {
  return (
    <motion.div {...motionTokens.variants.fadeIn}>
      <Card className={cn('rounded-xl p-4', className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              {Icon && (
                <Icon className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">{title}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              {trend && (
                <TrendIndicator
                  current={trend.current}
                  previous={trend.previous}
                  size="sm"
                />
              )}
            </div>

            {description && (
              <p className="text-[10px] text-muted-foreground">{description}</p>
            )}
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div className="ml-4 h-8 w-16 shrink-0">
              <SparklineChart data={sparklineData} />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
