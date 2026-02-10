export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-9 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-9 w-32 bg-muted rounded animate-pulse" />
                </div>
            </div>

            <div className="h-[1px] w-full bg-border" />

            <div className="space-y-4">
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted rounded animate-pulse" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 h-[400px] bg-muted rounded animate-pulse" />
                <div className="lg:col-span-2 h-[400px] bg-muted rounded animate-pulse" />
            </div>
        </div>
    );
}
