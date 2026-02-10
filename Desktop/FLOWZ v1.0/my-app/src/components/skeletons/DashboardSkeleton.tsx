import { Skeleton } from "../ui/skeleton";
import { PageContainer } from "../layout/PageContainer";

export const DashboardSkeleton = () => {
    return (
        <div className="container mx-auto p-4 max-w-7xl space-y-6">
            {/* Header Skeleton */}
            <div className="p-4 rounded-xl border border-border/40 bg-background/80">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-32 rounded-full" />
                    </div>
                </div>
            </div>

            {/* KPI Grid Skeleton */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-64 rounded-2xl" />
                <div className="grid gap-4">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
            </div>
        </div>
    );
};
