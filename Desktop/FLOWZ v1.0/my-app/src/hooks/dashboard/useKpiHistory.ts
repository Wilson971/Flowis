import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { STALE_TIMES } from '@/lib/query-config';

export function useKpiHistory(storeId: string | null, metricName: string, days: number = 30) {
  return useQuery({
    queryKey: ['kpi-history', storeId, metricName, days],
    queryFn: async () => {
      const supabase = createClient();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await supabase
        .from('kpi_snapshots')
        .select('snapshot_date, metric_value')
        .eq('store_id', storeId!)
        .eq('metric_name', metricName)
        .gte('snapshot_date', fromDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      if (error) throw error;
      return data?.map(d => ({ date: d.snapshot_date, value: Number(d.metric_value) })) ?? [];
    },
    enabled: !!storeId && !!metricName,
    staleTime: STALE_TIMES.ARCHIVE,
  });
}
