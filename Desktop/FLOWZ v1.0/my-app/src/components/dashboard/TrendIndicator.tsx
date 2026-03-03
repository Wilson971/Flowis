'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  current: number;
  previous: number | null;
  format?: 'percent' | 'number' | 'score';
  size?: 'sm' | 'md';
}

export function TrendIndicator({
  current,
  previous,
  format = 'percent',
  size = 'md',
}: TrendIndicatorProps) {
  if (previous === null || previous === undefined) {
    return (
      <span className={cn('text-muted-foreground', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
        &mdash;
      </span>
    );
  }

  const diff = current - previous;
  const pctChange = previous !== 0 ? (diff / previous) * 100 : diff > 0 ? 100 : 0;

  const formatValue = () => {
    const abs = Math.abs(format === 'number' ? diff : pctChange);
    const prefix = diff > 0 ? '+' : diff < 0 ? '' : '';
    const sign = diff < 0 ? '-' : prefix;

    switch (format) {
      case 'number':
        return `${sign}${Math.abs(diff)}`;
      case 'score':
        return `${sign}${abs.toFixed(1)} pts`;
      case 'percent':
      default:
        return `${sign}${abs.toFixed(1)}%`;
    }
  };

  const sizeClasses = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'sm' ? 10 : 12;

  if (diff === 0) {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-muted-foreground', sizeClasses)}>
        <Minus size={iconSize} />
        <span>0%</span>
      </span>
    );
  }

  const isPositive = diff > 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium',
        sizeClasses,
        isPositive ? 'text-emerald-500' : 'text-red-500'
      )}
    >
      {isPositive ? <TrendingUp size={iconSize} /> : <TrendingDown size={iconSize} />}
      <span>{formatValue()}</span>
    </span>
  );
}
