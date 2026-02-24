import { Skeleton } from "../ui/skeleton";

/**
 * DashboardSkeleton - Premium loading state
 *
 * Matches the actual dashboard bento grid layout:
 * - Header
 * - Row 1: Hero SEO (span 2) + AI Insights
 * - Row 2: Store + Coverage + Blog
 * - Row 3: Actions + Timeline (span 2)
 */
export const DashboardSkeleton = () => {
  return (
    <div className="container mx-auto p-4 max-w-none space-y-4">
      {/* Header Skeleton */}
      <div className="p-4 md:p-6 rounded-xl border border-border/50 bg-card/80">
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

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Row 1: Hero (span 2) + Insights */}
        <div className="md:col-span-2 rounded-xl border border-border/40 bg-card/90 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-[110px] w-[110px] rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/90 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        {/* Row 2: 3 equal cards */}
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <Skeleton className="h-px w-full bg-border/30" />
            <div className="flex justify-between mt-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}

        {/* Row 3: Actions + Timeline (span 2) */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="md:col-span-2 rounded-xl border border-border/40 bg-card/95 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
          <div className="space-y-3 pl-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
