"use client";

import { Search, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GscEmptyState() {
    return (
        <Card className="border-border/40">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4 py-12">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Search className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h3 className="text-lg font-bold">Connecter Google Search Console</h3>
                        <p className="text-sm text-muted-foreground">
                            Visualisez vos performances Google : clics, impressions, CTR, position.
                            Identifiez vos meilleurs mots-cles et pages.
                        </p>
                    </div>
                    <Button
                        onClick={() => { window.location.href = "/api/gsc/oauth/authorize"; }}
                        className="gap-2 mt-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Connecter GSC
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
