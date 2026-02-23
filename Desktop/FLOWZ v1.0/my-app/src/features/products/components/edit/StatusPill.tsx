"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// STATUS OPTIONS CONFIG
// ============================================================================

export const STATUS_OPTIONS = [
    { value: "publish", label: "Publi\u00e9", dotClass: "bg-emerald-500", textClass: "text-emerald-700 dark:text-emerald-400" },
    { value: "draft", label: "Brouillon", dotClass: "bg-zinc-400", textClass: "text-muted-foreground" },
    { value: "pending", label: "En attente", dotClass: "bg-amber-500", textClass: "text-amber-700 dark:text-amber-400" },
    { value: "private", label: "Priv\u00e9", dotClass: "bg-primary", textClass: "text-blue-700 dark:text-blue-400" },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const StatusPill = () => {
    const { setValue, control } = useFormContext<ProductFormValues>();
    const status = useWatch({ control, name: "status" });
    const [open, setOpen] = React.useState(false);

    const current = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[1];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border transition-colors text-sm font-semibold cursor-pointer",
                        "border-border/50 bg-muted/30 hover:bg-muted/60"
                    )}
                >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", current.dotClass)} />
                    <span className={current.textClass}>{current.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1.5" sideOffset={8}>
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                            setValue("status", opt.value, { shouldDirty: true });
                            setOpen(false);
                        }}
                        className={cn(
                            "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                            status === opt.value
                                ? "bg-muted font-semibold"
                                : "hover:bg-muted/50"
                        )}
                    >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", opt.dotClass)} />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {status === opt.value && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
};
