"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Trash2,
    X,
    GripVertical,
    Eye,
    Shuffle,
} from "lucide-react";
import { useState, useMemo, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "../../schemas/product-schema";

export function AttributeBuilder() {
    const { control, setValue, watch } = useFormContext<ProductFormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "attributes",
    });

    const attributes = watch("attributes");

    const handleAddAttribute = () => {
        append({
            id: 0,
            name: "",
            options: [],
            visible: true,
            variation: true,
            position: fields.length,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        Attributs du produit
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Définissez les attributs (ex: Couleur, Taille) et leurs valeurs pour créer des variations.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttribute}
                    className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all hover:shadow-md"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un attribut
                </Button>
            </div>

            {fields.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-border/50 p-8 text-center bg-muted/20">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                        <Shuffle className="h-6 w-6 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        Aucun attribut défini
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Ajoutez des attributs pour créer des variations de produit
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <AttributeRow
                        key={field.id}
                        index={index}
                        onRemove={() => remove(index)}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// ATTRIBUTE ROW
// ============================================================================

function AttributeRow({
    index,
    onRemove,
}: {
    index: number;
    onRemove: () => void;
}) {
    const { register, watch, setValue } = useFormContext<ProductFormValues>();
    const [termInput, setTermInput] = useState("");

    // Deduplicate options — WooCommerce variation imports can produce duplicates
    const rawOptions = watch(`attributes.${index}.options`) || [];
    const options: string[] = useMemo(() => [...new Set(rawOptions)], [rawOptions]);
    const isVariation = watch(`attributes.${index}.variation`);
    const isVisible = watch(`attributes.${index}.visible`);

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
    };

    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-card p-4 space-y-4",
                "transition-all duration-200 hover:shadow-md hover:border-primary/20"
            )}
        >
            {/* Header: Name + Actions */}
            <div className="flex items-center gap-3">
                <div className="shrink-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab hover:text-muted-foreground transition-colors" />
                </div>

                <div className="flex-1">
                    <Input
                        {...register(`attributes.${index}.name`)}
                        placeholder="Nom de l'attribut (ex: Couleur, Taille)"
                        className="h-9 font-medium border-0 bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Visible toggle with label */}
                    <div
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                            "border transition-all",
                            isVisible
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-muted/30 border-border"
                        )}
                    >
                        <Eye className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isVisible ? "text-emerald-600" : "text-muted-foreground"
                        )} />
                        <Switch
                            checked={isVisible}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.visible`, checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                        <span className={cn(
                            "text-xs font-medium transition-colors",
                            isVisible ? "text-emerald-700" : "text-muted-foreground"
                        )}>
                            Visible
                        </span>
                    </div>

                    {/* Variation toggle with label */}
                    <div
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                            "border transition-all",
                            isVariation
                                ? "bg-primary/10 border-primary/30"
                                : "bg-muted/30 border-border"
                        )}
                    >
                        <Shuffle className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isVariation ? "text-primary" : "text-muted-foreground"
                        )} />
                        <Switch
                            checked={isVariation}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.variation`, checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                        <span className={cn(
                            "text-xs font-medium transition-colors",
                            isVariation ? "text-primary" : "text-muted-foreground"
                        )}>
                            Variation
                        </span>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={onRemove}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Terms/Options */}
            <div className="pl-7 space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground flex items-center gap-2">
                        Valeurs
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-semibold">
                            {options.length}
                        </Badge>
                    </Label>
                    {options.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                            {options.length} {options.length === 1 ? 'valeur' : 'valeurs'}
                        </span>
                    )}
                </div>

                {/* Existing terms as chips */}
                {options.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                        {options.map((term: string, idx: number) => (
                            <Badge
                                key={`${idx}-${term}`}
                                variant="secondary"
                                className={cn(
                                    "gap-1.5 pr-1 text-xs font-medium",
                                    "bg-background border border-border/50",
                                    "hover:border-primary/50 transition-all",
                                    "shadow-sm"
                                )}
                            >
                                {term}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTerm(term)}
                                    className={cn(
                                        "ml-0.5 rounded-full p-0.5",
                                        "hover:bg-destructive/20 hover:text-destructive",
                                        "transition-all"
                                    )}
                                    title={`Supprimer "${term}"`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border/50 text-center">
                        <p className="text-xs text-muted-foreground">
                            Aucune valeur. Ajoutez-en ci-dessous.
                        </p>
                    </div>
                )}

                {/* Add term input */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            value={termInput}
                            onChange={(e) => setTermInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ajouter une valeur (Entrée ou virgule pour valider)"
                            className="h-9 text-sm pr-20 border-border/50 focus-visible:border-primary"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                            ↵ ou ,
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 shrink-0 gap-1.5 transition-all",
                            termInput.trim() && "bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-md"
                        )}
                        onClick={handleAddTerm}
                        disabled={!termInput.trim()}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter
                    </Button>
                </div>
            </div>
        </div>
    );
}
