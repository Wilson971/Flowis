"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { VerdictDot } from "./GscIndexationStatusBar";
import type { GscIndexationUrl } from "@/lib/gsc/types";

interface GscIndexationUrlRowProps {
    item: GscIndexationUrl;
    siteUrl: string;
    onSubmit: (url: string) => void;
    isSubmitting: boolean;
}

export function GscIndexationUrlRow({ item, siteUrl, onSubmit, isSubmitting }: GscIndexationUrlRowProps) {
    // Extract relative path from full URL
    const relativePath = item.url.replace(/^https?:\/\/[^/]+/, '') || '/';

    return (
        <div className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group">
            <VerdictDot verdict={item.verdict} />

            <div className="flex-1 min-w-0">
                <span className="text-xs font-mono truncate block">
                    {relativePath}
                </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Source badge */}
                {item.source !== 'sitemap' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.source === 'product' ? 'Produit' : item.source === 'blog' ? 'Blog' : 'Manuel'}
                    </span>
                )}

                {/* Open in browser */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.open(item.url, '_blank')}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Ouvrir la page</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Submit for indexation */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 hover:text-primary hover:bg-primary/10",
                                    isSubmitting && "animate-pulse"
                                )}
                                onClick={() => onSubmit(item.url)}
                                disabled={isSubmitting}
                            >
                                <Zap className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Indexer cette page</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
