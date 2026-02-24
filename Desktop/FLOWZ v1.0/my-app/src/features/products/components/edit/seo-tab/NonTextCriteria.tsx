"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getScoreColorConfig } from "@/lib/seo/scoreColors";
import { Image, Tag, Sparkles, MousePointerClick } from "lucide-react";

export const NonTextCriteria = ({
    fieldScores,
}: {
    fieldScores: Record<string, number>;
}) => {
    const criteria = [
        { key: "images", label: "Images produit", icon: Image, desc: "Nombre d'images" },
        { key: "alt_text", label: "Alt text images", icon: Tag, desc: "Texte alternatif" },
        { key: "keyword_presence", label: "Mot-clé principal", icon: Sparkles, desc: "Présence dans les champs" },
        { key: "cta_detection", label: "Appel à l'action", icon: MousePointerClick, desc: "CTA en meta description" },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {criteria.map(({ key, label, icon: Icon, desc }) => {
                const score = fieldScores[key] || 0;
                const cfg = getScoreColorConfig(score);
                return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/10">
                        <div className={cn("p-1.5 rounded-lg", cfg.text)} style={{ backgroundColor: `${cfg.primary}15` }}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{label}</p>
                            <p className="text-[10px] text-muted-foreground">{desc}</p>
                        </div>
                        <span className={cn("text-sm font-bold tabular-nums", cfg.text)}>
                            {Math.round(score)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
