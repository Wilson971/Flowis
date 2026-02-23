export default function ProductsLoading() {
    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
                    <div className="h-4 w-56 bg-muted rounded-lg animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
                    <div className="h-9 w-32 bg-muted rounded-lg animate-pulse" />
                </div>
            </div>

            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />

            <div className="space-y-2">
                <div className="h-12 w-full bg-muted rounded-lg animate-pulse" />
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 w-full bg-muted rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    );
}
