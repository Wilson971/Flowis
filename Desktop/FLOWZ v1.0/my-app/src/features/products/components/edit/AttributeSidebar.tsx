"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Plus,
    GripVertical,
    Eye,
    EyeOff,
    Shuffle,
    ChevronRight,
    Palette,
    Ruler,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface AttributeSidebarProps {
    onAttributeClick?: (index: number) => void;
    activeIndex?: number | null;
}

// ============================================================================
// HELPER: Detect attribute type
// ============================================================================

function getAttributeIcon(name: string) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("couleur") || lowerName.includes("color")) {
        return <Palette className="h-4 w-4" />;
    }
    if (lowerName.includes("taille") || lowerName.includes("size")) {
        return <Ruler className="h-4 w-4" />;
    }
    return <Shuffle className="h-4 w-4" />;
}

function isColorAttribute(name: string): boolean {
    const lowerName = name.toLowerCase();
    return lowerName.includes("couleur") || lowerName.includes("color");
}

// Helper to parse color from value (e.g., "Rouge" → #ff0000 approximation)
const COLOR_MAP: Record<string, string> = {
    // Français
    rouge: "#ef4444",
    vert: "#22c55e",
    bleu: "#3b82f6",
    jaune: "#eab308",
    noir: "#000000",
    blanc: "#ffffff",
    gris: "#6b7280",
    orange: "#f97316",
    violet: "#a855f7",
    rose: "#ec4899",
    marron: "#92400e",
    // English
    red: "#ef4444",
    green: "#22c55e",
    blue: "#3b82f6",
    yellow: "#eab308",
    black: "#000000",
    white: "#ffffff",
    gray: "#6b7280",
    purple: "#a855f7",
    pink: "#ec4899",
    brown: "#92400e",
};

function getColorPreview(value: string): string | null {
    const lowerValue = value.toLowerCase().trim();
    return COLOR_MAP[lowerValue] || null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AttributeSidebar({
    onAttributeClick,
    activeIndex,
}: AttributeSidebarProps) {
    const { watch } = useFormContext<ProductFormValues>();
    const { append } = useFieldArray({
        name: "attributes",
    });

    const attributes = watch("attributes") || [];
    const [openItems, setOpenItems] = useState<Set<number>>(
        new Set([0, 1, 2]) // Open first 3 by default
    );

    const handleAddAttribute = () => {
        append({
            id: 0,
            name: "",
            options: [],
            visible: true,
            variation: true,
            position: attributes.length,
        });
        // Auto-select the new attribute
        if (onAttributeClick) {
            onAttributeClick(attributes.length);
        }
    };

    const toggleOpen = (index: number) => {
        setOpenItems((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    return (
        <Card className="overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">Attributs</h3>
                    </div>
                    <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted/60 text-muted-foreground inline-flex items-center tabular-nums">
                        {attributes.length}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Définissez les attributs pour créer des variations
                </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
                <AnimatePresence mode="popLayout">
                    {attributes.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6 text-center"
                        >
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mb-2">
                                <Shuffle className="h-[18px] w-[18px] text-muted-foreground/50" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Aucun attribut
                            </p>
                        </motion.div>
                    ) : (
                        attributes.map((attr, index) => (
                            <AttributeSidebarItem
                                key={`attr-${index}-${attr.name}`}
                                attribute={attr}
                                index={index}
                                isOpen={openItems.has(index)}
                                isActive={activeIndex === index}
                                onToggleOpen={() => toggleOpen(index)}
                                onClick={() => onAttributeClick?.(index)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer: Add button */}
            <div className="p-3 border-t border-border/50 bg-muted/20">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttribute}
                    className="w-full gap-2 h-8 text-[11px] rounded-lg font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un attribut
                </Button>
            </div>
        </Card>
    );
}

// ============================================================================
// SIDEBAR ITEM
// ============================================================================

interface AttributeSidebarItemProps {
    attribute: ProductFormValues["attributes"][0];
    index: number;
    isOpen: boolean;
    isActive: boolean;
    onToggleOpen: () => void;
    onClick: () => void;
}

function AttributeSidebarItem({
    attribute,
    index,
    isOpen,
    isActive,
    onToggleOpen,
    onClick,
}: AttributeSidebarItemProps) {
    const isColor = isColorAttribute(attribute.name);
    const Icon = getAttributeIcon(attribute.name);

    // Deduplicate options
    const options: string[] = [...new Set(attribute.options || [])];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={motionTokens.transitions.spring}
            className="mb-2"
        >
            <Collapsible open={isOpen} onOpenChange={onToggleOpen}>
                <div
                    className={cn(
                        "rounded-lg border transition-colors",
                        isActive
                            ? "border-border/60 bg-muted/40 shadow-sm"
                            : "border-border/50 bg-card hover:border-border/60 hover:shadow-sm"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 p-2">
                        {/* Drag handle */}
                        <div className="shrink-0 cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                        </div>

                        {/* Icon + Name */}
                        <div
                            className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                            onClick={onClick}
                        >
                            <div
                                className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
                                    attribute.visible
                                        ? "bg-muted/60 text-foreground/70 ring-1 ring-border/40"
                                        : "bg-muted/40 text-muted-foreground/60"
                                )}
                            >
                                {Icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className={cn(
                                        "text-xs font-medium truncate",
                                        attribute.name
                                            ? "text-foreground"
                                            : "text-muted-foreground italic"
                                    )}
                                >
                                    {attribute.name || "Sans nom"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {/* Visible badge */}
                                    {attribute.visible ? (
                                        <Eye className="h-3 w-3 text-foreground/70" />
                                    ) : (
                                        <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                                    )}
                                    {/* Variation badge */}
                                    {attribute.variation && (
                                        <Badge
                                            variant="secondary"
                                            className="h-3 px-1 text-[9px] bg-muted/60 text-muted-foreground border-0"
                                        >
                                            Variation
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Values count */}
                            <Badge
                                variant="outline"
                                className="shrink-0 h-5 px-1.5 text-[10px] font-medium border-border/50 tabular-nums"
                            >
                                {options.length}
                            </Badge>
                        </div>

                        {/* Collapse toggle */}
                        <CollapsibleTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                            >
                                <ChevronRight
                                    className={cn(
                                        "h-3.5 w-3.5 transition-transform duration-200",
                                        isOpen && "rotate-90"
                                    )}
                                />
                            </Button>
                        </CollapsibleTrigger>
                    </div>

                    {/* Collapsible content: value chips */}
                    <CollapsibleContent>
                        <Separator className="mb-2" />
                        <div className="px-3 pb-3">
                            {options.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {options.map((val, idx) => {
                                        const colorPreview =
                                            isColor ? getColorPreview(val) : null;
                                        return (
                                            <Badge
                                                key={`${idx}-${val}`}
                                                variant="secondary"
                                                className={cn(
                                                    "text-[11px] font-medium h-6 px-2.5",
                                                    "bg-muted/50 text-foreground border border-border/50",
                                                    "hover:border-border hover:bg-muted transition-colors"
                                                )}
                                            >
                                                {colorPreview && (
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full mr-1.5 border border-border/50 shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                colorPreview,
                                                        }}
                                                    />
                                                )}
                                                <span className="truncate">{val}</span>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground text-center py-1">
                                    Aucune valeur
                                </p>
                            )}
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </motion.div>
    );
}
