"use client";

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Plus,
    Trash2,
    X,
    Eye,
    Shuffle,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Pencil,
} from "lucide-react";
import { useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// HELPERS
// ============================================================================

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
// TYPES
// ============================================================================

interface AttributeDetailPanelProps {
    index: number;
    onRemove: () => void;
    onGenerate?: () => void;
    variationCount?: number;
    /** Called when an attribute option is renamed — allows cascading to variations */
    onRenameOption?: (attributeName: string, oldValue: string, newValue: string) => void;
    /** Called when an attribute option is removed — allows cleaning up variations */
    onRemoveOption?: (attributeName: string, removedValue: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AttributeDetailPanel - Displays and edits a SINGLE attribute
 * Used in the AttributeBuilderV2 layout (sidebar + details)
 */
export function AttributeDetailPanel({
    index,
    onRemove,
    onGenerate,
    variationCount = 0,
    onRenameOption,
    onRemoveOption,
}: AttributeDetailPanelProps) {
    const { register, watch, setValue } = useFormContext<ProductFormValues>();
    const [termInput, setTermInput] = useState("");
    const [editingTerm, setEditingTerm] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");

    // Deduplicate options — WooCommerce variation imports can produce duplicates
    const rawOptions = watch(`attributes.${index}.options`) || [];
    const options: string[] = [...new Set(rawOptions)];
    const isVariation = watch(`attributes.${index}.variation`);
    const isVisible = watch(`attributes.${index}.visible`);
    const attributeName = watch(`attributes.${index}.name`);

    const handleAddTerm = () => {
        const term = termInput.trim();
        if (!term) return;
        if (options.includes(term)) {
            setTermInput("");
            return;
        }
        setValue(`attributes.${index}.options`, [...options, term], {
            shouldDirty: true,
        });
        setTermInput("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTerm();
        }
        // Allow comma as separator
        if (e.key === ",") {
            e.preventDefault();
            handleAddTerm();
        }
    };

    const handleRemoveTerm = (term: string) => {
        setValue(
            `attributes.${index}.options`,
            options.filter((o: string) => o !== term),
            { shouldDirty: true }
        );
        // Notify parent to clean up variations referencing this value
        if (onRemoveOption && attributeName) {
            onRemoveOption(attributeName, term);
        }
    };

    const handleRenameTerm = (oldTerm: string, newTerm: string) => {
        const trimmed = newTerm.trim();
        if (!trimmed || trimmed === oldTerm) {
            setEditingTerm(null);
            return;
        }
        // Don't allow duplicates
        if (options.includes(trimmed)) {
            setEditingTerm(null);
            return;
        }
        // Update the option in the attribute options list
        setValue(
            `attributes.${index}.options`,
            options.map((o: string) => (o === oldTerm ? trimmed : o)),
            { shouldDirty: true }
        );
        // Cascade rename to all variations that reference this value
        if (onRenameOption && attributeName) {
            onRenameOption(attributeName, oldTerm, trimmed);
        }
        setEditingTerm(null);
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold tracking-tight text-foreground">
                        Détails de l&apos;attribut
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {onGenerate && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onGenerate}
                                className="h-8 text-[11px] rounded-lg gap-1.5 font-medium transition-colors"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Générer les variations
                                {variationCount > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs tabular-nums">
                                        {variationCount}
                                    </Badge>
                                )}
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] rounded-lg gap-1.5 font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={onRemove}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Attribute Name */}
                <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground">
                        Nom de l&apos;attribut
                    </Label>
                    <Input
                        {...register(`attributes.${index}.name`)}
                        placeholder="Ex: Couleur, Taille, Matériau..."
                        className="h-10 rounded-lg font-medium bg-background"
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Le nom affiché sur la fiche produit
                    </p>
                </div>

                {/* Toggles Row */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Visible Toggle */}
                    <div
                        className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer",
                            isVisible
                                ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm"
                                : "bg-muted/20 border-border/50 hover:border-border"
                        )}
                        onClick={() =>
                            setValue(`attributes.${index}.visible`, !isVisible, {
                                shouldDirty: true,
                            })
                        }
                    >
                        <Eye
                            className={cn(
                                "h-4 w-4 transition-colors shrink-0",
                                isVisible
                                    ? "text-emerald-600"
                                    : "text-muted-foreground"
                            )}
                        />
                        <Label className="text-xs font-medium cursor-pointer flex-1">
                            Visible sur la fiche
                        </Label>
                        <Switch
                            checked={isVisible}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.visible`, checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>

                    {/* Variation Toggle */}
                    <div
                        className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer",
                            isVariation
                                ? "bg-muted/40 border-border/60 shadow-sm"
                                : "bg-muted/20 border-border/50 hover:border-border"
                        )}
                        onClick={() =>
                            setValue(`attributes.${index}.variation`, !isVariation, {
                                shouldDirty: true,
                            })
                        }
                    >
                        <Shuffle
                            className={cn(
                                "h-4 w-4 transition-colors shrink-0",
                                isVariation
                                    ? "text-foreground/70"
                                    : "text-muted-foreground"
                            )}
                        />
                        <Label className="text-xs font-medium cursor-pointer flex-1">
                            Utilisé pour variations
                        </Label>
                        <Switch
                            checked={isVariation}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.variation`, checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>
                </div>

                {/* Help Text */}
                <div className={cn(
                    "p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2",
                    isVisible && isVariation && "bg-emerald-500/5 border-emerald-500/20 text-emerald-600",
                    isVisible && !isVariation && "bg-muted/30 border-border/50 text-foreground",
                    !isVisible && isVariation && "bg-amber-500/5 border-amber-500/20 text-amber-600",
                    !isVisible && !isVariation && "bg-muted/30 border-border/50 text-muted-foreground"
                )}>
                    {isVisible && isVariation && (
                        <>
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                Cet attribut sera <strong>visible</strong> sur la fiche
                                produit et <strong>utilisé pour créer des variations</strong>.
                            </span>
                        </>
                    )}
                    {isVisible && !isVariation && (
                        <>
                            <Eye className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                Cet attribut sera <strong>visible</strong> sur la fiche
                                produit mais <strong>ne créera pas de variations</strong>.
                            </span>
                        </>
                    )}
                    {!isVisible && isVariation && (
                        <>
                            <RefreshCw className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                Cet attribut sera <strong>masqué</strong> mais{" "}
                                <strong>utilisé pour créer des variations</strong>.
                            </span>
                        </>
                    )}
                    {!isVisible && !isVariation && (
                        <>
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                Cet attribut est <strong>masqué</strong> et{" "}
                                <strong>ne créera pas de variations</strong>.
                            </span>
                        </>
                    )}
                </div>

                {/* Values Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-[13px] font-medium text-foreground flex items-center gap-2">
                            Valeurs de l&apos;attribut
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-2 font-medium bg-muted/60 text-muted-foreground border-0 tabular-nums"
                            >
                                {options.length}
                            </Badge>
                        </Label>
                        {options.length > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {options.length}{" "}
                                {options.length === 1 ? "valeur" : "valeurs"}
                            </span>
                        )}
                    </div>

                    {/* Container for values + input */}
                    <div className="rounded-lg border border-border/50 overflow-hidden bg-muted/20">
                        {/* Existing values */}
                        {options.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 border-b border-border/50 bg-background/50">
                                {options.map((term: string, idx: number) => {
                                    // Detect if this is a color attribute
                                    const isColorAttr = attributeName?.toLowerCase().includes("couleur") ||
                                        attributeName?.toLowerCase().includes("color");
                                    const colorPreview = isColorAttr ? getColorPreview(term) : null;

                                    if (editingTerm === term) {
                                        return (
                                            <Input
                                                key={`edit-${idx}-${term}`}
                                                autoFocus
                                                defaultValue={term}
                                                className="h-7 text-xs w-auto min-w-[80px] max-w-[200px] px-2"
                                                onBlur={(e) => handleRenameTerm(term, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleRenameTerm(term, e.currentTarget.value);
                                                    }
                                                    if (e.key === "Escape") {
                                                        setEditingTerm(null);
                                                    }
                                                }}
                                            />
                                        );
                                    }

                                    return (
                                        <Badge
                                            key={`${idx}-${term}`}
                                            variant="secondary"
                                            className={cn(
                                                "group/badge gap-1 pr-1 text-xs font-medium h-7 px-2.5 cursor-default",
                                                "bg-background text-foreground border border-border/50",
                                                "hover:bg-muted/60 hover:border-border/80 hover:-translate-y-0.5 hover:shadow-md",
                                                "transition-all duration-150 ease-out"
                                            )}
                                        >
                                            {colorPreview && (
                                                <div
                                                    className="h-3 w-3 rounded-full border border-border/50 shrink-0"
                                                    style={{ backgroundColor: colorPreview }}
                                                />
                                            )}
                                            <span className="truncate max-w-[150px]">{term}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingTerm(term);
                                                    setEditingValue(term);
                                                }}
                                                className={cn(
                                                    "rounded-full p-0.5 shrink-0",
                                                    "opacity-0 group-hover/badge:opacity-60 hover:!opacity-100 hover:bg-muted",
                                                    "transition-opacity duration-150"
                                                )}
                                                aria-label={`Renommer "${term}"`}
                                            >
                                                <Pencil className="h-2.5 w-2.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTerm(term)}
                                                className={cn(
                                                    "rounded-full p-0.5 shrink-0",
                                                    "opacity-0 group-hover/badge:opacity-60 hover:!opacity-100 hover:bg-destructive/10 hover:text-destructive",
                                                    "transition-opacity duration-150"
                                                )}
                                                aria-label={`Supprimer "${term}"`}
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty state */}
                        {options.length === 0 && (
                            <div className="p-4 text-center border-b border-border/50 bg-background/50">
                                <p className="text-xs text-muted-foreground">
                                    Aucune valeur. Ajoutez-en ci-dessous.
                                </p>
                            </div>
                        )}

                        {/* Add value input - Always visible */}
                        <div className="p-3 bg-background/80">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Input
                                        value={termInput}
                                        onChange={(e) => setTermInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ajouter une valeur (Entrée ou virgule pour valider)"
                                        className="h-9 text-sm pr-16 bg-background"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 pointer-events-none font-medium">
                                        ↵ ou ,
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
                                    onClick={handleAddTerm}
                                    disabled={!termInput.trim()}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
