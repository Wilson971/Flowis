"use client";

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FolderTree, ChevronsUpDown, Check, Plus, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { motion, AnimatePresence } from "framer-motion";
import { ProductFormValues } from "../../schemas/product-schema";
import { useProductEditContext } from "../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";

// Types for categories
interface Category {
    id: string | number;
    name: string;
    slug?: string;
}

// Types for tags
interface ProductTag {
    id: string | number;
    name: string;
    slug?: string;
}

interface OrganizationCardProps {
    availableCategories?: Category[];
    isLoadingCategories?: boolean;
    availableTags?: ProductTag[];
    isLoadingTags?: boolean;
}

/**
 * OrganizationCard
 *
 * Carte pour la gestion des catégories, tags, type de produit et marque.
 * Utilise useFormContext pour accéder au formulaire parent.
 */
export const OrganizationCard = ({
    availableCategories = [],
    isLoadingCategories = false,
    availableTags = [],
    isLoadingTags = false,
}: OrganizationCardProps) => {
    const { register, setValue, getValues, control } = useFormContext<ProductFormValues>();
    const { dirtyFieldsData } = useProductEditContext();
    const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [tagOpen, setTagOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [tagSearchValue, setTagSearchValue] = useState("");

    const watchedCategories = useWatch({ control, name: "categories", defaultValue: [] });
    const watchedTags = useWatch({ control, name: "tags", defaultValue: [] });
    const productType = useWatch({ control, name: "product_type" });

    const handleAddCategory = (categoryName: string) => {
        const currentCategories = getValues("categories") || [];
        if (!currentCategories.includes(categoryName)) {
            setValue("categories", [...currentCategories, categoryName], {
                shouldDirty: true,
                shouldValidate: true,
            });
        }
    };

    const handleRemoveCategory = (categoryName: string) => {
        const currentCategories = getValues("categories") || [];
        setValue(
            "categories",
            currentCategories.filter((c: string) => c !== categoryName),
            { shouldDirty: true, shouldValidate: true }
        );
    };

    const handleToggleCategory = (categoryName: string) => {
        if (watchedCategories.includes(categoryName)) {
            handleRemoveCategory(categoryName);
        } else {
            handleAddCategory(categoryName);
        }
    };

    // Tag handlers
    const handleAddTag = (tagName: string) => {
        const currentTags = getValues("tags") || [];
        if (!currentTags.includes(tagName)) {
            setValue("tags", [...currentTags, tagName], {
                shouldDirty: true,
                shouldValidate: true,
            });
        }
    };

    const handleRemoveTag = (tagName: string) => {
        const currentTags = getValues("tags") || [];
        setValue(
            "tags",
            currentTags.filter((t: string) => t !== tagName),
            { shouldDirty: true, shouldValidate: true }
        );
    };

    const handleToggleTag = (tagName: string) => {
        if (watchedTags.includes(tagName)) {
            handleRemoveTag(tagName);
        } else {
            handleAddTag(tagName);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
        >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                            <FolderTree className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Arborescence
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Catégories et attributs
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="product_type" className="text-xs font-semibold">
                                Type de produit
                            </Label>
                            <Select
                                value={productType || "simple"}
                                onValueChange={(v) => setValue("product_type", v, { shouldDirty: true })}
                            >
                                <SelectTrigger className="bg-background/50 border border-border/50 h-8 text-xs">
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
                            <Label htmlFor="brand" className="text-xs font-semibold">
                                Marque
                            </Label>
                            <Input
                                id="brand"
                                {...register("brand")}
                                placeholder="Marque"
                                className="bg-background/50 border border-border/50 h-8 text-xs px-3"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                            Catégories
                            {watchedCategories && watchedCategories.length > 0 && (
                                <span className="text-xs text-muted-foreground font-normal">
                                    ({watchedCategories.length})
                                </span>
                            )}
                            <FieldStatusBadge isDirty={isDirty("categories")} />
                        </Label>

                        {availableCategories.length > 0 ? (
                            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <div className="flex items-center justify-between h-8 w-full rounded-lg border border-border/50 bg-background/50 group px-3 cursor-pointer hover:bg-background/70 transition-all">
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
                                                        <span className="text-xs font-medium truncate">
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
                                                className="p-3 max-w-[280px] bg-background/80 backdrop-blur-md border border-border/50 text-foreground shadow-xl"
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
                                                                className="text-[10px] bg-primary/5 border-primary/20 px-1.5 h-5 font-medium"
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
                                                            handleAddCategory(searchValue);
                                                            setSearchValue("");
                                                        }}
                                                    >
                                                        <Plus className="mr-2 h-3 w-3" />
                                                        Créer "{searchValue}"
                                                    </Button>
                                                )}
                                            </CommandEmpty>
                                            <CommandGroup heading="Toutes les catégories">
                                                {availableCategories.map((category) => (
                                                    <CommandItem
                                                        key={category.id}
                                                        value={category.name}
                                                        onSelect={() => handleToggleCategory(category.name)}
                                                        className="flex items-center gap-2 py-2 px-2 cursor-pointer rounded-md mb-1 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className={cn(
                                                            "flex h-3.5 w-3.5 items-center justify-center rounded-sm border",
                                                            watchedCategories.includes(category.name)
                                                                ? "bg-primary border-primary"
                                                                : "border-border"
                                                        )}>
                                                            {watchedCategories.includes(category.name) && (
                                                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs">{category.name}</span>
                                                    </CommandItem>
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

                    {/* Tags Section */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold flex items-center gap-2">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            Tags
                            {watchedTags && watchedTags.length > 0 && (
                                <span className="text-xs text-muted-foreground font-normal">
                                    ({watchedTags.length})
                                </span>
                            )}
                            <FieldStatusBadge isDirty={isDirty("tags")} />
                        </Label>

                        {/* Display current tags */}
                        {watchedTags && watchedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                <AnimatePresence>
                                    {watchedTags.map((tag: string, i: number) => (
                                        <motion.div
                                            key={tag}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                        >
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] h-5 gap-1 pr-1 bg-primary/5 border-primary/20"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="ml-0.5 h-3.5 w-3.5 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
                                                >
                                                    <X className="h-2 w-2" />
                                                </button>
                                            </Badge>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {availableTags.length > 0 ? (
                            <Popover open={tagOpen} onOpenChange={setTagOpen}>
                                <PopoverTrigger asChild>
                                    <div className="flex items-center justify-between h-8 w-full rounded-lg border border-border/50 bg-background/50 group px-3 cursor-pointer hover:bg-background/70 transition-all">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <Tag className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
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
                                                            handleAddTag(tagSearchValue);
                                                            setTagSearchValue("");
                                                        }}
                                                    >
                                                        <Plus className="mr-2 h-3 w-3" />
                                                        Créer "{tagSearchValue}"
                                                    </Button>
                                                )}
                                            </CommandEmpty>
                                            <CommandGroup heading="Tags disponibles">
                                                {availableTags.map((tag) => (
                                                    <CommandItem
                                                        key={tag.id}
                                                        value={tag.name}
                                                        onSelect={() => handleToggleTag(tag.name)}
                                                        className="flex items-center gap-2 py-2 px-2 cursor-pointer rounded-md mb-1 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div
                                                            className={cn(
                                                                "flex h-3.5 w-3.5 items-center justify-center rounded-sm border",
                                                                watchedTags.includes(tag.name)
                                                                    ? "bg-primary border-primary"
                                                                    : "border-border"
                                                            )}
                                                        >
                                                            {watchedTags.includes(tag.name) && (
                                                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs">{tag.name}</span>
                                                    </CommandItem>
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
                                    className="bg-background/50 border border-border/50 h-8 text-xs flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && tagSearchValue.trim()) {
                                            e.preventDefault();
                                            handleAddTag(tagSearchValue.trim());
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
                                            handleAddTag(tagSearchValue.trim());
                                            setTagSearchValue("");
                                        }
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
