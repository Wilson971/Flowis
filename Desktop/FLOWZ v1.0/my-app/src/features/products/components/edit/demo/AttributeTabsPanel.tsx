"use client";

import { useState, useMemo, useCallback, KeyboardEvent } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Trash2,
    X,
    Eye,
    Shuffle,
    RefreshCw,
    LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "../../../schemas/product-schema";
import type { EditableVariation } from "../../../hooks/useVariationManager";
import { VariationGrid } from "../VariationGrid";

// ============================================================================
// ACCENT COLORS (exported for reuse in grid view)
// ============================================================================

export const TAB_ACCENTS = [
    { border: "border-l-emerald-500", bg: "bg-emerald-500/5", dot: "bg-emerald-500", text: "text-emerald-600", badgeBg: "bg-emerald-500/10" },
    { border: "border-l-amber-500", bg: "bg-amber-500/5", dot: "bg-amber-500", text: "text-amber-600", badgeBg: "bg-amber-500/10" },
    { border: "border-l-sky-500", bg: "bg-sky-500/5", dot: "bg-sky-500", text: "text-sky-600", badgeBg: "bg-sky-500/10" },
    { border: "border-l-purple-500", bg: "bg-purple-500/5", dot: "bg-purple-500", text: "text-purple-600", badgeBg: "bg-purple-500/10" },
    { border: "border-l-rose-500", bg: "bg-rose-500/5", dot: "bg-rose-500", text: "text-rose-600", badgeBg: "bg-rose-500/10" },
    { border: "border-l-teal-500", bg: "bg-teal-500/5", dot: "bg-teal-500", text: "text-teal-600", badgeBg: "bg-teal-500/10" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AttributeTabsPanelProps {
    variations: EditableVariation[];
    onUpdateField: (localId: string, field: keyof EditableVariation, value: unknown) => void;
    onDelete: (localId: string) => void;
    onOpenDetail: (localId: string) => void;
}

export function AttributeTabsPanel({
    variations,
    onUpdateField,
    onDelete,
    onOpenDetail,
}: AttributeTabsPanelProps) {
    const { control, watch } = useFormContext<ProductFormValues>();
    const { fields, append, remove } = useFieldArray({ control, name: "attributes" });
    const attributes = watch("attributes") || [];
    const [activeIndex, setActiveIndex] = useState(0);

    const handleAddAttribute = () => {
        append({
            id: 0,
            name: "",
            options: [],
            visible: true,
            variation: true,
            position: fields.length,
        });
        setActiveIndex(fields.length);
    };

    const handleRemoveAttribute = (index: number) => {
        remove(index);
        setActiveIndex((prev) => Math.max(0, Math.min(prev, fields.length - 2)));
    };

    return (
        <div className="flex flex-col h-full">
            {/* ── Header ── */}
            <div className="p-4 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">Attributs</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Définissez les attributs et leurs valeurs pour créer des variations.
                </p>
            </div>

            {/* ── Body ── */}
            {fields.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <Shuffle className="mx-auto h-8 w-8 text-muted-foreground/40" />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Aucun attribut défini.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={handleAddAttribute}
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Ajouter un attribut
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 min-h-0">
                    {/* ── Vertical Tab Strip (wider, with option values) ── */}
                    <div className="w-[180px] shrink-0 border-r border-border/50 flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            {fields.map((field, index) => {
                                const attr = attributes[index];
                                const isActive = activeIndex === index;
                                const accent = TAB_ACCENTS[index % TAB_ACCENTS.length];
                                const options = attr?.options || [];

                                return (
                                    <button
                                        key={field.id}
                                        type="button"
                                        onClick={() => setActiveIndex(index)}
                                        className={cn(
                                            "w-full text-left px-3 py-3 border-l-[3px] transition-all duration-200",
                                            isActive
                                                ? cn(accent.border, accent.bg)
                                                : "border-l-transparent hover:bg-muted/30"
                                        )}
                                    >
                                        {/* Name + dot */}
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn("h-2 w-2 rounded-full shrink-0", accent.dot)} />
                                            <span
                                                className={cn(
                                                    "block text-xs",
                                                    isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                                                )}
                                            >
                                                {attr?.name || "Sans nom"}
                                            </span>
                                        </div>

                                        {/* Option values as mini chips */}
                                        {options.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5 pl-3.5">
                                                {options.map((opt: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className={cn(
                                                            "inline-block text-[10px] leading-tight px-1.5 py-0.5 rounded-md",
                                                            isActive
                                                                ? cn(accent.badgeBg, accent.text)
                                                                : "bg-muted/50 text-muted-foreground"
                                                        )}
                                                    >
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {options.length === 0 && (
                                            <span className="block text-[10px] text-muted-foreground/60 mt-0.5 pl-3.5 italic">
                                                Aucune valeur
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Add button */}
                        <button
                            type="button"
                            onClick={handleAddAttribute}
                            className="w-full text-left px-3 py-2.5 border-t border-border/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter un attribut
                        </button>
                    </div>

                    {/* ── Tab Content (split: editor top + grid bottom) ── */}
                    <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        {activeIndex < fields.length && (
                            <AttributeTabContent
                                key={fields[activeIndex].id}
                                index={activeIndex}
                                accent={TAB_ACCENTS[activeIndex % TAB_ACCENTS.length]}
                                onRemove={() => handleRemoveAttribute(activeIndex)}
                                variations={variations}
                                onUpdateField={onUpdateField}
                                onDelete={onDelete}
                                onOpenDetail={onOpenDetail}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <div className="p-3 border-t border-border/50">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Générer les variations
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// TAB CONTENT (attribute editor + filtered VariationGrid)
// ============================================================================

interface AccentColors {
    border: string;
    bg: string;
    dot: string;
    text: string;
    badgeBg: string;
}

function AttributeTabContent({
    index,
    accent,
    onRemove,
    variations,
    onUpdateField,
    onDelete,
    onOpenDetail,
}: {
    index: number;
    accent: AccentColors;
    onRemove: () => void;
    variations: EditableVariation[];
    onUpdateField: (localId: string, field: keyof EditableVariation, value: unknown) => void;
    onDelete: (localId: string) => void;
    onOpenDetail: (localId: string) => void;
}) {
    const { register, watch, setValue } = useFormContext<ProductFormValues>();
    const [termInput, setTermInput] = useState("");

    const attrName = watch(`attributes.${index}.name`) || "";
    const rawOptions = watch(`attributes.${index}.options`) || [];
    const options: string[] = [...new Set(rawOptions)];
    const isVariation = watch(`attributes.${index}.variation`);
    const isVisible = watch(`attributes.${index}.visible`);

    // Filter variations that belong to this attribute (have a matching attribute entry)
    const filteredVariations = useMemo(() => {
        if (!attrName) return [];
        return variations.filter(
            (v) =>
                v._status !== "deleted" &&
                v.attributes.some((a) => a.name === attrName)
        );
    }, [variations, attrName]);

    // Local selection state for the filtered grid
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelect = useCallback((localId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(localId)) {
                next.delete(localId);
            } else {
                next.add(localId);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds((prev) => {
            if (prev.size === filteredVariations.length && filteredVariations.length > 0) {
                return new Set();
            }
            return new Set(filteredVariations.map((v) => v._localId));
        });
    }, [filteredVariations]);

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
        <div className="flex flex-col h-full">
            {/* ── Top: Attribute Editor (compact, scrollable) ── */}
            <div className="shrink-0 overflow-y-auto p-4 space-y-4 border-b border-border/50">
                {/* Attribute name */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nom de l&apos;attribut</Label>
                    <Input
                        {...register(`attributes.${index}.name`)}
                        placeholder="ex: Couleur, Taille"
                        className="h-8 text-sm"
                    />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs">Visible</Label>
                        <Switch
                            checked={isVisible}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.visible`, checked, { shouldDirty: true })
                            }
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs">Variation</Label>
                        <Switch
                            checked={isVariation}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.variation`, checked, { shouldDirty: true })
                            }
                        />
                    </div>
                </div>

                {/* Values (chips) + input */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                        Valeurs ({options.length})
                    </Label>

                    {options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {options.map((term, idx) => (
                                <Badge
                                    key={`${idx}-${term}`}
                                    variant="secondary"
                                    className="gap-1 pr-1 text-xs"
                                >
                                    {term}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTerm(term)}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-1.5">
                        <Input
                            value={termInput}
                            onChange={(e) => setTermInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ajouter une valeur"
                            className="h-7 text-xs"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 shrink-0 px-2"
                            onClick={handleAddTerm}
                            disabled={!termInput.trim()}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 px-2 text-muted-foreground hover:text-destructive"
                            onClick={onRemove}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Bottom: Filtered VariationGrid (editable) ── */}
            {filteredVariations.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Grid header */}
                    <div className="px-4 py-2 flex items-center gap-2 border-b border-border/30 bg-muted/10">
                        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                            Variations de &laquo;{attrName}&raquo;
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {filteredVariations.length}
                        </Badge>
                    </div>

                    {/* Scrollable grid */}
                    <div className="flex-1 overflow-y-auto">
                        <VariationGrid
                            variations={filteredVariations}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onToggleSelectAll={toggleSelectAll}
                            onUpdateField={onUpdateField}
                            onDelete={onDelete}
                            onOpenDetail={onOpenDetail}
                        />
                    </div>
                </div>
            )}

            {filteredVariations.length === 0 && attrName && (
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-xs text-muted-foreground italic">
                        Aucune variation pour cet attribut.
                    </p>
                </div>
            )}
        </div>
    );
}
