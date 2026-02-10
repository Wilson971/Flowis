import { cn } from '@/lib/utils';
import { getScoreBgColor } from '@/lib/seo/scoreColors';

interface SeoHealthIndicatorProps {
    score: number;
    className?: string;
}

export const SeoHealthIndicator = ({ score, className }: SeoHealthIndicatorProps) => {
    const colorClass = getScoreBgColor(score);

    return (
        <div className={cn("flex items-center gap-1.5", className)} title={`${score}/100`}>
            <div className={cn("h-2 w-2 rounded-full", colorClass)} />
            {/* <span className="text-[10px] text-muted-foreground font-medium">{score}</span> */}
        </div>
    );
};
