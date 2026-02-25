import { Skeleton } from "../ui/skeleton";

/**
 * DashboardSkeleton - Loading state matching redesigned layout
 *
 * Grid: 4 cols × 3 rows
 * - Row 1: SEO Hero (span 2) + AI Insights + Action Center
 * - Row 2: Traffic (span 2) + Indexation + Opportunities
 * - Row 3: Coverage + Pipeline + Connection + Activity
 */
export const DashboardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-3 md:p-4 rounded-xl border border-border/50 bg-card/80 shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Bento Grid Skeleton — 4 cols × 3 rows */}
      <div
        className="grid grid-cols-4 gap-2 flex-1 min-h-0"
        style={{ gridTemplateRows: "1.2fr 1fr 1fr" }}
      >
        {/* Row 1: SEO Hero (span 2) */}
        <div className="col-span-2 rounded-xl border border-border/40 bg-card/90 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-[72px] w-[72px] rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-[32px] w-[140px]" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 space-y-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-xl border border-border/40 bg-card/90 p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>

        {/* Action Center */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="space-y-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Row 2: Traffic (span 2) */}
        <div className="col-span-2 rounded-xl border border-border/50 bg-card p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="flex gap-4 mb-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-[60px] w-full mt-auto" />
        </div>

        {/* Indexation */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <Skeleton className="h-5 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-2 w-full rounded-full mb-3" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        </div>

        {/* Opportunities */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-1.5">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>

        {/* Row 3: Coverage */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-[64px] w-[64px] rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-[24px] w-[120px]" />
            </div>
          </div>
        </div>

        {/* Content Pipeline */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <Skeleton className="h-5 w-28 mb-3" />
          <Skeleton className="h-2.5 w-full rounded-full mb-3" />
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Connection */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-border/40 bg-card/95 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="space-y-2 pl-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
