"use client";

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FolderTree, ChevronsUpDown, Check, Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ProductFormValues, PRODUCT_TYPE_DEFAULT } from "../../../schemas/product-schema";
import { useProductEditContext } from "../../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";

// ============================================================================
// TYPES
// ============================================================================

interface ChipItem {
    id: string | number;
    name: string;
    slug?: string;
}

// ============================================================================
// REUSABLE HOOK: manage a string[] form field (add/remove/toggle)
// ============================================================================

function useChipField(fieldName: 'categories' | 'tags') {
    const { setValue, getValues } = useFormContext<ProductFormValues>();

    const add = (name: string) => {
        const current = getValues(fieldName) || [];
        if (!current.includes(name)) {
            setValue(fieldName, [...current, name], { shouldDirty: true, shouldValidate: true });
        }
    };

    const remove = (name: string) => {
        const current = getValues(fieldName) || [];
        setValue(fieldName, current.filter(c => c !== name), { shouldDirty: true, shouldValidate: true });
    };

    const toggle = (name: string, selected: string[]) => {
        selected.includes(name) ? remove(name) : add(name);
    };

    return { add, remove, toggle };
}

// ============================================================================
// REUSABLE: Command item with checkbox indicator
// ============================================================================

const CheckableCommandItem = ({ item, isSelected, onToggle }: {
    item: ChipItem; isSelected: boolean; onToggle: () => void;
}) => (
    <CommandItem
        key={item.id}
        value={item.name}
        onSelect={onToggle}
        className="flex items-center gap-2 py-2 px-2 cursor-pointer rounded-lg mb-1 hover:bg-muted/50 transition-colors"
    >
        <div className={cn(
            "flex h-3.5 w-3.5 items-center justify-center rounded-sm border",
            isSelected ? "bg-primary border-primary" : "border-border"
        )}>
            {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </div>
        <span className="text-xs">{item.name}</span>
    </CommandItem>
);

interface OrganizationCardV2Props {
    availableCategories?: ChipItem[];
    isLoadingCategories?: boolean;
    availableTags?: ChipItem[];
    isLoadingTags?: boolean;
}

export const OrganizationCardV2 = ({
    availableCategories = [],
    isLoadingCategories = false,
    availableTags = [],
    isLoadingTags = false,
}: OrganizationCardV2Props) => {
    const { register, setValue, control } = useFormContext<ProductFormValues>();
    const { dirtyFieldsData } = useProductEditContext();
    const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [tagOpen, setTagOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [tagSearchValue, setTagSearchValue] = useState("");

    const watchedCategories = useWatch({ control, name: "categories", defaultValue: [] });
    const watchedTags = useWatch({ control, name: "tags", defaultValue: [] });
    const productType = useWatch({ control, name: "product_type" });

    const categoryChip = useChipField('categories');
    const tagChip = useChipField('tags');

    return (
        <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
            <div className="relative z-10">
                {/* Header */}
                <div className="p-4 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center shrink-0">
                            <FolderTree className="h-5 w-5 text-foreground/70" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Organisation</h3>
                            <p className="text-xs text-muted-foreground">Catégories, tags et attributs</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-4 space-y-4">
                    {/* Product Type + Brand */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="product_type" className="text-[13px] font-medium text-foreground">
                                Type de produit
                            </Label>
                            <Select
                                value={productType && productType.length > 0 ? productType : PRODUCT_TYPE_DEFAULT}
                                onValueChange={(v) => setValue("product_type", v, { shouldDirty: true })}
                            >
                                <SelectTrigger className="h-8 text-sm rounded-lg">
                                    <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="simple">Simple</SelectItem>
                                    <SelectItem value="variable">Variable</SelectItem>
                                    <SelectItem value="grouped">Groupé</SelectItem>
                                    <SelectItem value="external">Externe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="brand" className="text-[13px] font-medium text-foreground">
                                Marque
                            </Label>
                            <Input
                                id="brand"
                                {...register("brand")}
                                placeholder="Marque"
                                className="h-8 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30 pt-4">
                        {/* Categories */}
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                Catégories
                                {watchedCategories && watchedCategories.length > 0 && (
                                    <span className="text-xs text-muted-foreground font-normal">
                                        ({watchedCategories.length})
                                    </span>
                                )}
                                <FieldStatusBadge isDirty={isDirty("categories")} />
                            </Label>

                            {/* Category chips */}
                            {watchedCategories && watchedCategories.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {watchedCategories.map((cat: string) => (
                                        <span
                                            key={cat}
                                            className="inline-flex items-center gap-1 h-6 rounded-full bg-muted/60 px-2.5 text-[11px] font-medium text-foreground"
                                        >
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => categoryChip.remove(cat)}
                                                className="p-0.5 rounded-full hover:bg-muted transition-colors"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground/60" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {availableCategories.length > 0 ? (
                                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <PopoverTrigger asChild>
                                                    <div className="flex items-center justify-between h-8 w-full rounded-lg border border-border/50 bg-background/50 group px-3 cursor-pointer hover:bg-muted/40 transition-colors">
                                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                                            <FolderTree className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                            <span className="text-xs font-medium truncate text-muted-foreground">
                                                                {watchedCategories.length > 0
                                                                    ? (watchedCategories.length === 1
                                                                        ? watchedCategories[0]
                                                                        : `${watchedCategories.length} catégories`)
                                                                    : "Sélectionner..."}
                                                            </span>
                                                        </div>
                                                        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                                                    </div>
                                                </PopoverTrigger>
                                            </TooltipTrigger>
                                            {watchedCategories.length > 0 && (
                                                <TooltipContent
                                                    side="bottom"
                                                    align="start"
                                                    className="p-3 max-w-[280px]"
                                                >
                                                    <div className="flex flex-col gap-1.5">
                                                        <p className="text-xs font-semibold text-foreground/80 border-b border-border/50 pb-2 mb-2">
                                                            Catégories sélectionnées
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {watchedCategories.map((cat: string, i: number) => (
                                                                <Badge
                                                                    key={i}
                                                                    variant="outline"
                                                                    className="text-[10px] px-1.5 h-5 font-medium"
                                                                >
                                                                    {cat}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-[300px] p-0 shadow-2xl border-border/40" align="start">
                                        <Command className="bg-background/95 backdrop-blur-xl [&_[cmdk-input-wrapper]]:border-b-0">
                                            <CommandInput
                                                placeholder="Rechercher..."
                                                className="h-9 border-none focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 ring-0 shadow-none bg-transparent !border-none !outline-none !ring-0 !shadow-none"
                                                value={searchValue}
                                                onValueChange={setSearchValue}
                                            />
                                            <CommandList>
                                                <CommandEmpty className="py-2 text-xs text-muted-foreground text-center px-2">
                                                    <p>Aucune catégorie trouvée.</p>
                                                    {searchValue && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="mt-2 w-full justify-start text-primary h-8 px-2"
                                                            onClick={() => {
                                                                categoryChip.add(searchValue);
                                                                setSearchValue("");
                                                            }}
                                                        >
                                                            <Plus className="mr-2 h-3 w-3" />
                                                            Créer &quot;{searchValue}&quot;
                                                        </Button>
                                                    )}
                                                </CommandEmpty>
                                                <CommandGroup heading="Toutes les catégories">
                                                    {availableCategories.map((category) => (
                                                        <CheckableCommandItem
                                                            key={category.id}
                                                            item={category}
                                                            isSelected={watchedCategories.includes(category.name)}
                                                            onToggle={() => categoryChip.toggle(category.name, watchedCategories)}
                                                        />
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <div className="border border-border/50 rounded-lg p-3 bg-muted/30">
                                    <p className="text-xs text-muted-foreground text-center italic">
                                        {isLoadingCategories ? "Chargement..." : "Aucune catégorie disponible."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30 pt-4">
                        {/* Tags */}
                        <div className="space-y-2">
                            <Label className="text-[13px] font-medium text-foreground flex items-center gap-2">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                Tags
                                {watchedTags && watchedTags.length > 0 && (
                                    <span className="text-xs text-muted-foreground font-normal">
                                        ({watchedTags.length})
                                    </span>
                                )}
                                <FieldStatusBadge isDirty={isDirty("tags")} />
                            </Label>

                            {/* Tag chips */}
                            {watchedTags && watchedTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {watchedTags.map((tag: string) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 h-6 rounded-full bg-muted/60 px-2.5 text-[11px] font-medium text-foreground"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => tagChip.remove(tag)}
                                                className="p-0.5 rounded-full hover:bg-muted transition-colors"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground/60" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {availableTags.length > 0 ? (
                                <Popover open={tagOpen} onOpenChange={setTagOpen}>
                                    <PopoverTrigger asChild>
                                        <div className="flex items-center justify-between h-8 w-full rounded-lg border border-border/50 bg-background/50 group px-3 cursor-pointer hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span className="text-xs font-medium truncate text-muted-foreground">
                                                    Ajouter des tags...
                                                </span>
                                            </div>
                                            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 shadow-2xl border-border/40" align="start">
                                        <Command className="bg-background/95 backdrop-blur-xl [&_[cmdk-input-wrapper]]:border-b-0">
                                            <CommandInput
                                                placeholder="Rechercher un tag..."
                                                className="h-9 border-none focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 ring-0 shadow-none bg-transparent !border-none !outline-none !ring-0 !shadow-none"
                                                value={tagSearchValue}
                                                onValueChange={setTagSearchValue}
                                            />
                                            <CommandList>
                                                <CommandEmpty className="py-2 text-xs text-muted-foreground text-center px-2">
                                                    <p>Aucun tag trouvé.</p>
                                                    {tagSearchValue && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="mt-2 w-full justify-start text-primary h-8 px-2"
                                                            onClick={() => {
                                                                tagChip.add(tagSearchValue);
                                                                setTagSearchValue("");
                                                            }}
                                                        >
                                                            <Plus className="mr-2 h-3 w-3" />
                                                            Créer &quot;{tagSearchValue}&quot;
                                                        </Button>
                                                    )}
                                                </CommandEmpty>
                                                <CommandGroup heading="Tags disponibles">
                                                    {availableTags.map((tag) => (
                                                        <CheckableCommandItem
                                                            key={tag.id}
                                                            item={tag}
                                                            isSelected={watchedTags.includes(tag.name)}
                                                            onToggle={() => tagChip.toggle(tag.name, watchedTags)}
                                                        />
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ajouter un tag..."
                                        value={tagSearchValue}
                                        onChange={(e) => setTagSearchValue(e.target.value)}
                                        className="h-8 text-sm rounded-lg flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && tagSearchValue.trim()) {
                                                e.preventDefault();
                                                tagChip.add(tagSearchValue.trim());
                                                setTagSearchValue("");
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => {
                                            if (tagSearchValue.trim()) {
                                                tagChip.add(tagSearchValue.trim());
                                                setTagSearchValue("");
                                            }
                                        }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
