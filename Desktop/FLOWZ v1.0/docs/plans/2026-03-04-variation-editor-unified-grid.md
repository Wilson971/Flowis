# Variation Editor — Unified Grid Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Variation Studio from a 2-tab layout to a single unified grid view with inline bulk actions, search/filters, and an attribute management sheet.

**Architecture:** Remove the Grille/Attributs tab split in `ProductVariationsTab.tsx`. Replace `BulkVariationToolbar.tsx` with a contextual `VariationToolbar` that switches between filter mode and bulk mode. Move attribute management into a new `AttributeSheet` component. The grid (`VariationGrid.tsx`) and rows (`VariationRow.tsx`) stay largely intact. `useVariationManager` gets minor filter state additions.

**Tech Stack:** React 19, Next.js 16, shadcn/ui, Tailwind CSS v4, Framer Motion, React Hook Form, FLOWZ design system tokens

**Backup:** Original files in `features/products/components/edit/_backup_variations_studio/`

---

## Task 1: Create `VariationToolbar` — Filter Mode

**Files:**
- Create: `my-app/src/features/products/components/edit/VariationToolbar.tsx`

**Step 1: Create the toolbar component with search + attribute filters**

```tsx
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    CheckCircle2,
    DollarSign,
    Tag,
    Package,
    Trash2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditableVariation } from "../../hooks/useVariationManager";

// ============================================================================
// TYPES
// ============================================================================

export interface VariationFilters {
    search: string;
    attributes: Record<string, string>; // attributeName → selectedOption ("" = all)
}

interface VariationToolbarProps {
    /** Variation attributes from parent product form */
    variationAttributes: { name: string; options: string[] }[];
    /** Current filters */
    filters: VariationFilters;
    /** Update filters */
    onFiltersChange: (filters: VariationFilters) => void;
    /** Number of selected variations */
    selectedCount: number;
    /** Bulk update callback */
    onBulkUpdate: (field: keyof EditableVariation, value: unknown) => void;
    /** Delete selected variations */
    onDeleteSelected: () => void;
    /** Clear selection */
    onClearSelection: () => void;
    /** Total count (for badge) */
    totalCount: number;
    /** Filtered count */
    filteredCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VariationToolbar({
    variationAttributes,
    filters,
    onFiltersChange,
    selectedCount,
    onBulkUpdate,
    onDeleteSelected,
    onClearSelection,
    totalCount,
    filteredCount,
}: VariationToolbarProps) {
    // Bulk inline values
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkPromo, setBulkPromo] = useState("");
    const [bulkStock, setBulkStock] = useState("");

    const handleBulkApply = (field: keyof EditableVariation, value: string, setter: (v: string) => void) => {
        if (!value) return;
        if (field === "stockQuantity") {
            onBulkUpdate(field, parseInt(value, 10));
        } else {
            onBulkUpdate(field, value);
        }
        setter("");
    };

    const isFiltered = filters.search || Object.values(filters.attributes).some((v) => v !== "");

    // ===== BULK MODE =====
    if (selectedCount > 0) {
        return (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/20 bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {selectedCount} sélectionnée(s)
                </span>

                <div className="h-5 w-px bg-border mx-1" />

                {/* Inline bulk fields */}
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleBulkApply("regularPrice", bulkPrice, setBulkPrice);
                            }}
                            placeholder="Prix"
                            className="h-7 w-20 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkPromo}
                            onChange={(e) => setBulkPromo(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleBulkApply("salePrice", bulkPromo, setBulkPromo);
                            }}
                            placeholder="Promo"
                            className="h-7 w-20 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            min="0"
                            value={bulkStock}
                            onChange={(e) => setBulkStock(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleBulkApply("stockQuantity", bulkStock, setBulkStock);
                            }}
                            placeholder="Stock"
                            className="h-7 w-20 text-xs"
                        />
                    </div>

                    <Select onValueChange={(val) => onBulkUpdate("status", val)}>
                        <SelectTrigger className="h-7 w-auto text-xs">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="publish">Publié</SelectItem>
                            <SelectItem value="private">Privé</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-5 w-px bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                    onClick={onDeleteSelected}
                >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Supprimer
                </Button>

                <div className="ml-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onClearSelection}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        );
    }

    // ===== FILTER MODE =====
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    value={filters.search}
                    onChange={(e) =>
                        onFiltersChange({ ...filters, search: e.target.value })
                    }
                    placeholder="Rechercher SKU, attribut..."
                    className="h-8 w-48 pl-8 text-xs"
                />
            </div>

            {/* Attribute filters */}
            {variationAttributes.map((attr) => (
                <Select
                    key={attr.name}
                    value={filters.attributes[attr.name] || ""}
                    onValueChange={(val) =>
                        onFiltersChange({
                            ...filters,
                            attributes: {
                                ...filters.attributes,
                                [attr.name]: val === "__all__" ? "" : val,
                            },
                        })
                    }
                >
                    <SelectTrigger className="h-8 w-auto text-xs gap-1">
                        <span className="text-muted-foreground">{attr.name}:</span>
                        <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tous</SelectItem>
                        {attr.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}

            {/* Filter indicator */}
            {isFiltered && (
                <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] h-5">
                        {filteredCount}/{totalCount}
                    </Badge>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                            onFiltersChange({ search: "", attributes: {} })
                        }
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
```

**Step 2: Verify the file compiles**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/VariationToolbar.tsx
git commit -m "feat(variations): add VariationToolbar with search, filters, and inline bulk actions"
```

---

## Task 2: Create `AttributeSheet` component

**Files:**
- Create: `my-app/src/features/products/components/edit/AttributeSheet.tsx`

**Step 1: Create the sheet component that merges AttributeSidebar + AttributeDetailPanel into a single Sheet**

```tsx
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
import { Label } from "@/components/ui/label";
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
// HELPERS (from AttributeSidebar — deduplicated)
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
    const { register, watch, setValue } = useFormContext<ProductFormValues>();
    const { append, remove } = useFieldArray({ name: "attributes" });
    const attributes = watch("attributes") || [];

    // Compute expected variation count from attributes
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
                        attributes.map((attr, index) => (
                            <AttributeBlock
                                key={`attr-${index}`}
                                index={index}
                                onRemove={() => remove(index)}
                            />
                        ))
                    )}

                    {/* Add attribute button */}
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

                    {/* Generate section */}
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
// ATTRIBUTE BLOCK (inline in sheet)
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
            {/* Header row */}
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

            {/* Toggles */}
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

            {/* Options chips */}
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

            {/* Add option input */}
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
```

**Step 2: Verify compilation**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/AttributeSheet.tsx
git commit -m "feat(variations): add AttributeSheet - attribute management in a side sheet"
```

---

## Task 3: Add filter logic to `useVariationManager`

**Files:**
- Modify: `my-app/src/features/products/hooks/useVariationManager.ts`

**Step 1: Export a `filterVariations` utility function at the top of the file (after imports)**

Add this helper function near the top of the file, after the type exports:

```typescript
// Add after the existing type/interface exports

export function filterVariations(
    variations: EditableVariation[],
    filters: { search: string; attributes: Record<string, string> }
): EditableVariation[] {
    return variations.filter((v) => {
        // Search filter (SKU + attribute options)
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const matchesSku = v.sku?.toLowerCase().includes(q);
            const matchesAttr = v.attributes.some((a) =>
                a.option.toLowerCase().includes(q)
            );
            if (!matchesSku && !matchesAttr) return false;
        }
        // Attribute filters
        for (const [attrName, selectedOption] of Object.entries(filters.attributes)) {
            if (!selectedOption) continue;
            const attr = v.attributes.find((a) => a.name === attrName);
            if (!attr || attr.option !== selectedOption) return false;
        }
        return true;
    });
}
```

**Step 2: Verify compilation**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add my-app/src/features/products/hooks/useVariationManager.ts
git commit -m "feat(variations): add filterVariations utility for search and attribute filtering"
```

---

## Task 4: Rewrite `ProductVariationsTab` — Unified Grid Layout

**Files:**
- Modify: `my-app/src/features/products/components/edit/ProductVariationsTab.tsx`

**Step 1: Rewrite the component to remove tabs and use the unified layout**

Replace the entire file content with:

```tsx
"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContentFullscreen,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Shuffle,
    Loader2,
    RefreshCw,
    AlertCircle,
    ArrowLeft,
    Save,
    Settings2,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

import { VariationGrid } from "./VariationGrid";
import { VariationToolbar, type VariationFilters } from "./VariationToolbar";
import { AttributeSheet } from "./AttributeSheet";
import { VariationDetailSheet } from "./VariationDetailSheet";
import { useVariationManager, filterVariations } from "../../hooks/useVariationManager";
import { useVariationImageUpload } from "@/hooks/variations/useVariationImages";
import { useDirtyVariationsCount } from "@/hooks/products/useProductVariations";
import { toast } from "sonner";
import type { ProductFormValues } from "../../schemas/product-schema";
import type { VariationImage } from "@/hooks/products/useProductVariations";

// ============================================================================
// TYPES
// ============================================================================

interface ProductVariationsTabProps {
    productId: string;
    storeId?: string;
    platformProductId?: string;
    metadataVariants?: unknown[];
    onRegisterSave?: (saveFn: () => Promise<void>) => void;
    onRegisterDirtyCheck?: (dirtyFn: () => boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductVariationsTab({
    productId,
    storeId,
    platformProductId,
    metadataVariants,
    onRegisterSave,
    onRegisterDirtyCheck,
}: ProductVariationsTabProps) {
    const { watch } = useFormContext<ProductFormValues>();
    const attributes = watch("attributes") || [];

    // ===== UI STATE =====
    const [dialogOpen, setDialogOpen] = useState(false);
    const [attributeSheetOpen, setAttributeSheetOpen] = useState(false);
    const [detailVariationId, setDetailVariationId] = useState<string | null>(null);
    const [filters, setFilters] = useState<VariationFilters>({
        search: "",
        attributes: {},
    });

    // ===== HOOKS =====
    const manager = useVariationManager({
        productId,
        storeId,
        platformProductId,
        enabled: !!storeId,
        fallbackVariants: metadataVariants,
    });

    const { handleUpload, uploadingVariationId } = useVariationImageUpload({
        productId,
    });

    const { data: dirtyVariationsCount = 0 } = useDirtyVariationsCount(productId, storeId);

    // Register save/dirty with parent
    const managerRef = useRef(manager);
    managerRef.current = manager;

    useEffect(() => {
        if (onRegisterSave) {
            onRegisterSave(async () => {
                const m = managerRef.current;
                if (m.hasUnsavedChanges) {
                    await m.saveVariations();
                }
            });
        }
    }, [onRegisterSave]);

    useEffect(() => {
        if (onRegisterDirtyCheck) {
            onRegisterDirtyCheck(() => managerRef.current.hasUnsavedChanges);
        }
    }, [onRegisterDirtyCheck]);

    // ===== COMPUTED =====
    const variationAttributes = useMemo(
        () =>
            attributes
                .filter((a) => a.variation && a.options.length > 0)
                .map((a) => ({ name: a.name, options: [...new Set(a.options)] as string[] })),
        [attributes]
    );

    const canGenerate = variationAttributes.length > 0;

    const filteredVariations = useMemo(
        () => filterVariations(manager.variations, filters),
        [manager.variations, filters]
    );

    const parentAttributeOptions = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const attr of attributes) {
            if (attr.variation && attr.options?.length > 0) {
                map.set(attr.name, attr.options);
            }
        }
        return map;
    }, [attributes]);

    const variationAttributeCount = useMemo(
        () => attributes.filter((a) => a.variation === true).length,
        [attributes]
    );

    const priceRange = useMemo(() => {
        const prices = manager.variations
            .map((v) => parseFloat(v.regularPrice) || 0)
            .filter((p) => p > 0);
        if (prices.length === 0) return "N/A";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `${min.toFixed(2)} €`;
        return `${min.toFixed(2)} – ${max.toFixed(2)} €`;
    }, [manager.variations]);

    const totalStock = useMemo(
        () => manager.variations.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0),
        [manager.variations]
    );

    // ===== HANDLERS =====
    const handleGenerate = useCallback(() => {
        manager.generateFromAttributes(attributes);
    }, [manager, attributes]);

    const handleVariationImageUpload = useCallback(
        (localId: string, file: File) => {
            handleUpload(localId, file, (lid: string, image: VariationImage) => {
                manager.updateVariationField(lid, "image", image);
            });
        },
        [handleUpload, manager.updateVariationField]
    );

    const handleSaveAndClose = useCallback(async () => {
        if (manager.hasUnsavedChanges) {
            await manager.saveVariations();
            toast.info("Pensez à synchroniser", {
                description: "Les variations sont sauvegardées localement. Cliquez sur Sync pour mettre à jour votre boutique.",
                duration: 6000,
            });
        }
        setDialogOpen(false);
    }, [manager]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!dialogOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && manager.selectedIds.size > 0) {
                e.preventDefault();
                manager.clearSelection();
            }
            if (e.key === "a" && (e.ctrlKey || e.metaKey) && dialogOpen) {
                e.preventDefault();
                manager.toggleSelectAll();
            }
            if (e.key === "Delete" && manager.selectedIds.size > 0) {
                e.preventDefault();
                manager.deleteSelected();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [dialogOpen, manager.selectedIds.size, manager.clearSelection, manager.toggleSelectAll, manager.deleteSelected]);

    const detailVariation = detailVariationId
        ? manager.variations.find((v) => v._localId === detailVariationId) ?? null
        : null;

    // ===== RENDER =====
    return (
        <motion.div
            variants={motionTokens.variants.fadeIn}
            initial="hidden"
            animate="visible"
        >
            {/* ── Inline Summary Card ── */}
            <Card className="rounded-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Shuffle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">Variations</h3>
                                <Badge variant="secondary" className="text-xs">
                                    {manager.stats.total}
                                </Badge>
                                {manager.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-amber-500/50 text-amber-700 bg-amber-500/10"
                                    >
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        {manager.stats.new + manager.stats.modified + manager.stats.deleted} modif.
                                    </Badge>
                                )}
                                {dirtyVariationsCount > 0 && !manager.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-sky-500/50 text-sky-700 bg-sky-500/10"
                                    >
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Sync requise
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogOpen(true)}
                            className="gap-2 bg-success/5 text-success border-success/[0.02] hover:bg-success/15 hover:text-success/90 hover:border-success/20 transition-all ml-auto h-8 px-3 text-xs"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Gérer les Variations</span>
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Attributs</p>
                            <p className="text-sm font-medium text-foreground">{variationAttributeCount}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Fourchette prix</p>
                            <p className="text-sm font-medium text-foreground">{priceRange}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Stock total</p>
                            <p className="text-sm font-medium text-foreground">{totalStock}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Fullscreen Dialog — UNIFIED GRID ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContentFullscreen
                    className="overflow-hidden p-0"
                    ariaTitle="Variation Studio"
                >
                    <div className="flex h-screen flex-col bg-background">
                        {/* ── Top Toolbar ── */}
                        <div className="h-14 shrink-0 border-b border-border bg-background flex items-center px-4 gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDialogOpen(false)}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Button>

                            <Separator orientation="vertical" className="h-6" />

                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                    <Shuffle className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-semibold text-foreground">Variation Studio</span>
                            </div>

                            <Badge variant="secondary">{manager.stats.total} variations</Badge>

                            {manager.hasUnsavedChanges && (
                                <Badge
                                    variant="outline"
                                    className="text-xs border-amber-500/50 text-amber-700 bg-amber-500/10"
                                >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {manager.stats.new + manager.stats.modified + manager.stats.deleted} modif.
                                </Badge>
                            )}

                            <div className="flex-1" />

                            {/* Attribute Sheet trigger */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAttributeSheetOpen(true)}
                                className="gap-2"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Attributs
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                    {variationAttributeCount}
                                </Badge>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className={cn(
                                    "gap-2 font-medium transition-all",
                                    canGenerate && "hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                                )}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Générer
                            </Button>

                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveAndClose}
                                disabled={manager.isSaving}
                            >
                                {manager.isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Enregistrer &amp; Fermer
                            </Button>
                        </div>

                        {/* ── Contextual Toolbar (filters or bulk) ── */}
                        <VariationToolbar
                            variationAttributes={variationAttributes}
                            filters={filters}
                            onFiltersChange={setFilters}
                            selectedCount={manager.selectedIds.size}
                            onBulkUpdate={manager.bulkUpdateField}
                            onDeleteSelected={manager.deleteSelected}
                            onClearSelection={manager.clearSelection}
                            totalCount={manager.variations.length}
                            filteredCount={filteredVariations.length}
                        />

                        {/* ── Grid ── */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <VariationGrid
                                variations={filteredVariations}
                                selectedIds={manager.selectedIds}
                                onToggleSelect={manager.toggleSelect}
                                onToggleSelectAll={manager.toggleSelectAll}
                                onUpdateField={manager.updateVariationField}
                                onDelete={manager.deleteVariation}
                                onOpenDetail={setDetailVariationId}
                                onImageUpload={handleVariationImageUpload}
                                isLoading={manager.isLoading}
                                changeCounter={manager.changeCounter}
                                uploadingVariationId={uploadingVariationId}
                                parentAttributeOptions={parentAttributeOptions}
                            />
                        </div>

                        {/* ── Footer ── */}
                        <div className="h-10 shrink-0 border-t border-border bg-muted/30 flex items-center px-4 text-xs text-muted-foreground gap-4">
                            <span>{manager.stats.total} variations</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{manager.stats.new} nouvelle(s)</span>
                            <span>{manager.stats.modified} modifiée(s)</span>
                            <span>{manager.stats.deleted} supprimée(s)</span>
                            {filteredVariations.length !== manager.variations.length && (
                                <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span className="text-primary font-medium">
                                        {filteredVariations.length} affichée(s)
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContentFullscreen>
            </Dialog>

            {/* ── Attribute Sheet ── */}
            <AttributeSheet
                open={attributeSheetOpen}
                onOpenChange={setAttributeSheetOpen}
                onGenerate={handleGenerate}
                currentVariationCount={manager.variations.length}
            />

            {/* ── Detail Sheet ── */}
            <VariationDetailSheet
                variation={detailVariation}
                open={!!detailVariationId}
                onOpenChange={(open) => {
                    if (!open) setDetailVariationId(null);
                }}
                onUpdateField={(field, value) => {
                    if (detailVariationId) {
                        manager.updateVariationField(detailVariationId, field, value);
                    }
                }}
                onImageUpload={(file) => {
                    if (detailVariationId) {
                        handleVariationImageUpload(detailVariationId, file);
                    }
                }}
                isUploadingImage={
                    !!detailVariationId && uploadingVariationId === detailVariationId
                }
                parentAttributeOptions={parentAttributeOptions}
            />
        </motion.div>
    );
}
```

**Step 2: Verify compilation**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Fix any import issues (the old BulkVariationToolbar import is removed, AttributeSidebar/AttributeDetailPanel imports are removed)**

**Step 4: Commit**

```bash
git add my-app/src/features/products/components/edit/ProductVariationsTab.tsx
git commit -m "feat(variations): rewrite ProductVariationsTab - unified grid, no tabs, contextual toolbar"
```

---

## Task 5: Verify build & manual test

**Step 1: Run TypeScript check**

Run: `cd my-app && npx tsc --noEmit --pretty`
Expected: No errors

**Step 2: Run linter**

Run: `cd my-app && npx next lint`
Expected: No errors (or only pre-existing warnings)

**Step 3: Run build**

Run: `cd my-app && npx next build 2>&1 | tail -20`
Expected: Build succeeds

**Step 4: Manual verification checklist**

- [ ] Open a product with variations → Summary card shows correctly
- [ ] Click "Gérer les Variations" → Fullscreen dialog opens with unified grid (NO tabs)
- [ ] Toolbar shows search + attribute filters
- [ ] Select variations → Toolbar switches to bulk mode with inline inputs
- [ ] Type a price in bulk input + Enter → All selected variations updated
- [ ] Click "Attributs" button → Sheet opens on the right
- [ ] Add/remove attribute options → Delta preview shows expected count
- [ ] Click "Regénérer" → Sheet closes, grid updates
- [ ] Ctrl+A selects all, Escape deselects, Delete removes selected
- [ ] "Enregistrer & Fermer" saves and closes

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat(variations): unified grid refactoring complete - backup, toolbar, sheet, keyboard shortcuts"
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `_backup_variations_studio/` | Created | Backup of all original files |
| `VariationToolbar.tsx` | **NEW** | Contextual toolbar: search/filters ↔ bulk inline inputs |
| `AttributeSheet.tsx` | **NEW** | Side sheet for attribute management (replaces sidebar + detail panel) |
| `useVariationManager.ts` | Modified | Added `filterVariations` utility |
| `ProductVariationsTab.tsx` | **Rewritten** | Removed 2-tab layout, unified grid, keyboard shortcuts |
| `BulkVariationToolbar.tsx` | Unused | Superseded by VariationToolbar (kept for backup) |
| `AttributeSidebar.tsx` | Unused | Superseded by AttributeSheet (kept for backup) |
| `AttributeDetailPanel.tsx` | Unused | Superseded by AttributeSheet (kept for backup) |
