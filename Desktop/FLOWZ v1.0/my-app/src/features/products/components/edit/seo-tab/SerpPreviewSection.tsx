"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERPPreview } from "@/components/seo/SERPPreview";
import { Smartphone } from "lucide-react";

export const SerpPreviewSection = ({
    theme,
    previewTitle,
    previewDesc,
    slug,
    isDraft,
    domain,
    favicon,
}: {
    theme: { container: string; glassReflection: string };
    previewTitle: string;
    previewDesc: string;
    slug: string;
    isDraft: boolean;
    domain: string;
    favicon: string;
}) => {
    return (
        <Card className={theme.container}>
            <div className={theme.glassReflection} />
            <CardContent className="p-5 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Aperçu Google
                        </h3>
                        <Tabs defaultValue="desktop" className="w-auto">
                            <TabsList className="h-7">
                                <TabsTrigger value="desktop" className="text-xs px-2 py-1 h-auto">Desktop</TabsTrigger>
                                <TabsTrigger value="mobile" className="text-xs px-2 py-1 h-auto">
                                    <Smartphone className="h-3 w-3 mr-1" />
                                    Mobile
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="desktop" className="mt-3">
                                <SERPPreview
                                    title={previewTitle}
                                    description={previewDesc}
                                    slug={isDraft ? "" : slug}
                                    domain={domain}
                                    favicon={favicon}
                                />
                            </TabsContent>
                            <TabsContent value="mobile" className="mt-3">
                                <div className="max-w-[375px] mx-auto border border-border/50 rounded-xl bg-background p-4 shadow-sm">
                                    <SERPPreview
                                        title={previewTitle}
                                        description={previewDesc}
                                        slug={isDraft ? "" : slug}
                                        className="border-0 shadow-none bg-transparent p-0"
                                        domain={domain}
                                        favicon={favicon}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
