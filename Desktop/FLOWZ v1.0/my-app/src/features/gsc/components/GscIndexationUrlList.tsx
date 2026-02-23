"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GscIndexationUrlRow } from "./GscIndexationUrlRow";
import type { GscIndexationUrl } from "@/lib/gsc/types";

interface GscIndexationUrlListProps {
    urls: GscIndexationUrl[];
    total: number;
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    siteUrl: string;
    onSubmitUrl: (url: string) => void;
    isSubmitting: boolean;
    isLoading: boolean;
}

export function GscIndexationUrlList({
    urls,
    total,
    page,
    perPage,
    onPageChange,
    siteUrl,
    onSubmitUrl,
    isSubmitting,
    isLoading,
}: GscIndexationUrlListProps) {
    const totalPages = Math.ceil(total / perPage);

    if (isLoading) {
        return (
            <Card className="border-border/40">
                <CardContent className="p-4 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (urls.length === 0) {
        return (
            <Card className="border-border/40">
                <CardContent className="p-6">
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        Aucune URL trouvee. Actualisez le sitemap pour decouvrir les pages.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/40">
            <CardContent className="p-4">
                {/* URL rows */}
                <div className="divide-y divide-border/30">
                    {urls.map((item) => (
                        <GscIndexationUrlRow
                            key={item.id}
                            item={item}
                            siteUrl={siteUrl}
                            onSubmit={onSubmitUrl}
                            isSubmitting={isSubmitting}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Precedent
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === page ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 text-xs p-0"
                                        onClick={() => onPageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                        >
                            Suivant
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
