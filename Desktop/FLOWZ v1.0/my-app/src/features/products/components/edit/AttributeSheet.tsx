"use client";

import { useState, KeyboardEvent, useMemo } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Trash2,
    X,
    Eye,
    Shuffle,
    RefreshCw,
    Palette,
    Ruler,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// HELPERS
// ============================================================================

const COLOR_MAP: Record<string, string> = {
    rouge: "#ef4444", vert: "#22c55e", bleu: "#3b82f6", jaune: "#eab308",
    noir: "#000000", blanc: "#ffffff", gris: "#6b7280", orange: "#f97316",
    violet: "#a855f7", rose: "#ec4899", marron: "#92400e",
    red: "#ef4444", green: "#22c55e", blue: "#3b82f6", yellow: "#eab308",
    black: "#000000", white: "#ffffff", gray: "#6b7280",
    purple: "#a855f7", pink: "#ec4899", brown: "#92400e",
};

function getColorPreview(value: string): string | null {
    return COLOR_MAP[value.toLowerCase().trim()] || null;
}

function isColorAttribute(name: string): boolean {
    const lower = name.toLowerCase();
    return lower.includes("couleur") || lower.includes("color");
}

function getAttributeIcon(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes("couleur") || lower.includes("color")) return <Palette className="h-4 w-4" />;
    if (lower.includes("taille") || lower.includes("size")) return <Ruler className="h-4 w-4" />;
    return <Shuffle className="h-4 w-4" />;
}

// ============================================================================
// TYPES
// ============================================================================

interface AttributeSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: () => void;
    currentVariationCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AttributeSheet({
    open,
    onOpenChange,
    onGenerate,
    currentVariationCount,
}: AttributeSheetProps) {
    const { watch } = useFormContext<ProductFormValues>();
    const { append, remove } = useFieldArray({ name: "attributes" });
    const attributes = watch("attributes") || [];

    const expectedCount = useMemo(() => {
        const variationAttrs = attributes.filter((a) => a.variation && a.options.length > 0);
        if (variationAttrs.length === 0) return 0;
        return variationAttrs.reduce((acc, a) => acc * [...new Set(a.options)].length, 1);
    }, [attributes]);

    const delta = expectedCount - currentVariationCount;

    const handleAddAttribute = () => {
        append({
            id: 0,
            name: "",
            options: [],
            visible: true,
            variation: true,
            position: attributes.length,
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Shuffle className="h-5 w-5 text-primary" />
                        Gérer les attributs
                    </SheetTitle>
                    <SheetDescription>
                        Ajoutez ou modifiez les attributs et leurs valeurs, puis regénérez la matrice de variations.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    {attributes.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-border/50 p-8 text-center">
                            <Shuffle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Aucun attribut. Ajoutez-en pour créer des variations.
                            </p>
                        </div>
                    ) : (
                        attributes.map((_attr, index) => (
                            <AttributeBlock
                                key={`attr-${index}`}
                                index={index}
                                onRemove={() => remove(index)}
                            />
                        ))
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddAttribute}
                        className="w-full gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter un attribut
                    </Button>

                    <Separator />

                    <div className="space-y-3">
                        {delta !== 0 && (
                            <div className={cn(
                                "flex items-center gap-2 p-3 rounded-lg text-xs",
                                delta > 0 ? "bg-primary/5 border border-primary/20 text-primary" : "bg-amber-500/5 border border-amber-500/20 text-amber-700"
                            )}>
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>
                                    {delta > 0
                                        ? `${delta} nouvelle(s) combinaison(s) seront créées`
                                        : `${Math.abs(delta)} combinaison(s) seront supprimées`
                                    }
                                    {" "}({expectedCount} attendues, {currentVariationCount} actuelles)
                                </span>
                            </div>
                        )}
                        <Button
                            type="button"
                            onClick={() => {
                                onGenerate();
                                onOpenChange(false);
                            }}
                            disabled={expectedCount === 0}
                            className="w-full gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Regénérer la matrice
                            {expectedCount > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs bg-white/20">
                                    {expectedCount} variations
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ============================================================================
// ATTRIBUTE BLOCK
// ============================================================================

function AttributeBlock({
    index,
    onRemove,
}: {
    index: number;
    onRemove: () => void;
}) {
    const { register, watch, setValue } = useFormContext<ProductFormValues>();
    const [termInput, setTermInput] = useState("");

    const rawOptions = watch(`attributes.${index}.options`) || [];
    const options: string[] = [...new Set(rawOptions)];
    const isVariation = watch(`attributes.${index}.variation`);
    const isVisible = watch(`attributes.${index}.visible`);
    const attributeName = watch(`attributes.${index}.name`) || "";
    const isColor = isColorAttribute(attributeName);
    const Icon = getAttributeIcon(attributeName);

    const handleAddTerm = () => {
        const term = termInput.trim();
        if (!term || options.includes(term)) {
            setTermInput("");
            return;
        }
        setValue(`attributes.${index}.options`, [...options, term], { shouldDirty: true });
        setTermInput("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddTerm();
        }
    };

    const handleRemoveTerm = (term: string) => {
        setValue(
            `attributes.${index}.options`,
            options.filter((o) => o !== term),
            { shouldDirty: true }
        );
    };

    return (
        <div className={cn(
            "rounded-xl border p-4 space-y-3 transition-all",
            isVariation ? "border-primary/30 bg-primary/[0.02]" : "border-border/50"
        )}>
            <div className="flex items-center gap-2">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                    isVariation ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                )}>
                    {Icon}
                </div>
                <Input
                    {...register(`attributes.${index}.name`)}
                    placeholder="Nom (ex: Couleur, Taille...)"
                    className="h-8 text-sm font-medium flex-1"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={onRemove}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) =>
                            setValue(`attributes.${index}.visible`, checked, { shouldDirty: true })
                        }
                        className="scale-75"
                    />
                    <Eye className="h-3 w-3" />
                    Visible
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Switch
                        checked={isVariation}
                        onCheckedChange={(checked) =>
                            setValue(`attributes.${index}.variation`, checked, { shouldDirty: true })
                        }
                        className="scale-75"
                    />
                    <Shuffle className="h-3 w-3" />
                    Variation
                </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {options.map((term, idx) => {
                    const colorPreview = isColor ? getColorPreview(term) : null;
                    return (
                        <Badge
                            key={`${idx}-${term}`}
                            variant="secondary"
                            className={cn(
                                "gap-1 pr-1 text-xs h-6 px-2",
                                "bg-background text-foreground border border-border/50",
                                "hover:border-primary/50 transition-all"
                            )}
                        >
                            {colorPreview && (
                                <div
                                    className="h-2.5 w-2.5 rounded-full border border-border/50 shrink-0"
                                    style={{ backgroundColor: colorPreview }}
                                />
                            )}
                            <span className="truncate max-w-[120px]">{term}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveTerm(term)}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-all"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </Badge>
                    );
                })}
            </div>

            <div className="flex gap-2">
                <Input
                    value={termInput}
                    onChange={(e) => setTermInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ajouter une valeur (Entrée ou ,)"
                    className="h-8 text-xs flex-1"
                />
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    onClick={handleAddTerm}
                    disabled={!termInput.trim()}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                </Button>
            </div>
        </div>
    );
}
