import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface SeoStats {
    score: number;
    analyzedCount: number;
    criticalCount: number;
    warningCount: number;
    goodCount: number;
}

export function useSeoStats() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['seo-stats'],
        queryFn: async (): Promise<SeoStats> => {
            const { data } = await supabase
                .from('product_seo_analysis')
                .select('overall_score');

            if (!data) return { score: 0, analyzedCount: 0, criticalCount: 0, warningCount: 0, goodCount: 0 };

            const stats = data.reduce((acc, curr) => {
                const score = curr.overall_score || 0;
                if (score < 40) acc.criticalCount++;
                else if (score < 70) acc.warningCount++;
                else acc.goodCount++;
                acc.totalScore += score;
                return acc;
            }, { criticalCount: 0, warningCount: 0, goodCount: 0, totalScore: 0 });

            const analyzedCount = data.length;
            const score = analyzedCount > 0 ? Math.round(stats.totalScore / analyzedCount) : 0;

            return {
                score,
                analyzedCount,
                criticalCount: stats.criticalCount,
                warningCount: stats.warningCount,
                goodCount: stats.goodCount
            };
        }
    });
}
