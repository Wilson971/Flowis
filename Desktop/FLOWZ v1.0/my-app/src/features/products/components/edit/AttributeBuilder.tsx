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
import { useState, KeyboardEvent } from "react";
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
                    <h4 className="text-sm font-semibold text-foreground">
                        Attributs du produit
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Définissez les attributs (ex: Couleur, Taille) et leurs
                        valeurs pour créer des variations.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttribute}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un attribut
                </Button>
            </div>

            {fields.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <Shuffle className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Aucun attribut défini. Ajoutez des attributs pour créer
                        des variations.
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

    const options = watch(`attributes.${index}.options`) || [];
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
                "rounded-lg border border-border bg-card p-4 space-y-3",
                "transition-colors duration-200"
            )}
        >
            {/* Header: Name + Actions */}
            <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />

                <div className="flex-1">
                    <Input
                        {...register(`attributes.${index}.name`)}
                        placeholder="Nom de l'attribut (ex: Couleur, Taille)"
                        className="h-9 font-medium"
                    />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Visible toggle */}
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <Switch
                            checked={isVisible}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.visible`, checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>

                    {/* Variation toggle */}
                    <div className="flex items-center gap-1.5">
                        <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
                        <Switch
                            checked={isVariation}
                            onCheckedChange={(checked) =>
                                setValue(`attributes.${index}.variation`, checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={onRemove}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Labels for toggles */}
            <div className="flex items-center gap-4 pl-7">
                <span className="text-xs text-muted-foreground">
                    {isVisible ? "Visible sur la fiche" : "Masqué"}
                </span>
                <span className="text-xs text-muted-foreground">
                    {isVariation
                        ? "Utilisé pour les variations"
                        : "Attribut simple"}
                </span>
            </div>

            {/* Terms/Options */}
            <div className="pl-7 space-y-2">
                <Label className="text-xs text-muted-foreground">
                    Valeurs ({options.length})
                </Label>

                {/* Existing terms as chips */}
                {options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {options.map((term: string) => (
                            <Badge
                                key={term}
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

                {/* Add term input */}
                <div className="flex gap-2">
                    <Input
                        value={termInput}
                        onChange={(e) => setTermInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ajouter une valeur (Entrée ou virgule pour valider)"
                        className="h-8 text-sm"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0"
                        onClick={handleAddTerm}
                        disabled={!termInput.trim()}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
