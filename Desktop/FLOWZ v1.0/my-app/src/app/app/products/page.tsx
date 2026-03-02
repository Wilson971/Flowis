"use client";

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductsListContentV2 } from './ProductsListContentV2';

function ProductsLoading() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/40 bg-card px-4 py-3 flex items-center justify-between">
                        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-8 rounded bg-muted animate-pulse" />
                    </div>
                ))}
            </div>
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-72" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProductsListPage() {
    return (
        <Suspense fallback={<ProductsLoading />}>
            <ProductsListContentV2 />
        </Suspense>
    );
}
