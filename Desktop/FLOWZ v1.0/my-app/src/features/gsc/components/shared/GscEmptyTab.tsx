"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface GscEmptyTabProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function GscEmptyTab({ icon: Icon, title, description }: GscEmptyTabProps) {
    return (
        <Card className="border-border/40">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4 py-12">
                    <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Icon className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
