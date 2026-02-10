"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SERPPreviewProps {
    title: string;
    description: string;
    slug: string;
    className?: string;
    domain?: string;
    favicon?: string;
    pathPrefix?: string; // e.g., "produit" or "blog"
}

export const SERPPreview = ({
    title,
    description,
    slug,
    className,
    domain = "www.votre-boutique.com",
    favicon,
    pathPrefix = "produit"
}: SERPPreviewProps) => {
    // Helper to generic slug from title
    const generateSlugFromTitle = (t: string) => {
        return t.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanum with dashes
            .replace(/^-+|-+$/g, '') // trim dashes
            || 'produit';
    };

    let cleanSlug = slug;

    // 1. If empty, use title
    if (!cleanSlug) {
        cleanSlug = generateSlugFromTitle(title);
    }

    try {
        // 2. If it looks like a URL
        if (cleanSlug.includes('http') || cleanSlug.includes('www.') || cleanSlug.includes('/')) {
            const urlStr = cleanSlug.startsWith('http') ? cleanSlug : `https://${cleanSlug}`;
            const url = new URL(urlStr);

            // Try to get the last path segment
            const segments = url.pathname.split('/').filter(p => p.length > 0 && p !== 'product' && p !== 'produit');

            if (segments.length > 0) {
                cleanSlug = segments[segments.length - 1];
            } else {
                // If we have query params (like ?p=2003) but no path, 
                // it's a messy URL -> Use the title dynamically!
                cleanSlug = generateSlugFromTitle(title);
            }
        }
    } catch (e) {
        // parsing failed, simple cleanup
        cleanSlug = cleanSlug.replace(/^\/+|\/+$/g, '');
    }

    // Build URL with pathPrefix
    const fullUrl = `${domain} › ${pathPrefix} › ${cleanSlug}`;

    // Google typically truncates titles around 60 chars and descriptions around 160
    const displayTitle = title || "Titre du produit";
    const displayDesc = description || "Description du produit qui apparaîtra dans les résultats de recherche Google...";

    // Helper to truncate text with ellipsis if too long (visual simulation)
    const truncate = (str: string, max: number) => {
        return str.length > max ? str.substring(0, max) + '...' : str;
    };

    return (
        <Card className={cn("border-border/50 bg-card/30", className)}>
            <CardContent className="p-6">
                <div className="flex flex-col space-y-1 font-sans max-w-[600px]">
                    {/* Site Name / Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-sm text-[#202124] dark:text-[#dadce0] mb-1">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500 border overflow-hidden">
                            {favicon ? (
                                <img src={favicon} alt="Favicon" className="w-full h-full object-cover" />
                            ) : (
                                "Logo"
                            )}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-xs font-medium text-[#202124] dark:text-[#dadce0]">
                                {domain}
                            </span>
                            <span className="text-xs text-[#5f6368] dark:text-[#bdc1c6]">
                                {fullUrl}
                            </span>
                        </div>
                    </div>

                    {/* Title Link */}
                    <h3 className="text-xl text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium truncate">
                        {truncate(displayTitle, 60)}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] leading-snug">
                        {truncate(displayDesc, 160)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
