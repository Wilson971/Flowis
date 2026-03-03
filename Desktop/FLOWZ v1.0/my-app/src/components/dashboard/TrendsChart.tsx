'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';

interface TrendsChartProps {
  data: { date: string; value: number }[];
  title: string;
  description?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  isLoading?: boolean;
  valueFormatter?: (value: number) => string;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return dateFormatter.format(date);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueFormatter: (value: number) => string;
}

function CustomTooltip({ active, payload, label, valueFormatter }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className={cn(
      'rounded-lg border bg-popover px-3 py-2 shadow-md',
      'text-popover-foreground'
    )}>
      <p className="text-xs text-muted-foreground">{formatDate(label)}</p>
      <p className="text-sm font-semibold">{valueFormatter(payload[0].value)}</p>
    </div>
  );
}

export function TrendsChart({
  data,
  title,
  description,
  color = 'hsl(var(--primary))',
  height = 200,
  showArea = true,
  isLoading = false,
  valueFormatter = (v: number) => v.toLocaleString('fr-FR'),
}: TrendsChartProps) {
  const gradientId = useMemo(() => `trend-gradient-${title.replace(/\s/g, '-')}`, [title]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          {description && <Skeleton className="h-4 w-48" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full rounded-xl" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  const sharedAxisProps = {
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  } as const;

  const chartContent = (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="hsl(var(--border))"
        vertical={false}
      />
      <XAxis
        dataKey="date"
        tickFormatter={formatDate}
        {...sharedAxisProps}
      />
      <YAxis
        tickCount={4}
        tickFormatter={valueFormatter}
        width={48}
        {...sharedAxisProps}
      />
      <Tooltip
        content={<CustomTooltip valueFormatter={valueFormatter} />}
        cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '3 3' }}
      />
    </>
  );

  return (
    <motion.div
      variants={motionTokens.variants.fadeIn}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            {showArea ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                {chartContent}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  animationDuration={800}
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                {chartContent}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
