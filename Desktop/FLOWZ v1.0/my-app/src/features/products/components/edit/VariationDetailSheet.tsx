"use client";

import React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Image as ImageIcon,
    Package,
    DollarSign,
    Ruler,
    FileText,
    Loader2,
    Trash2,
    Barcode,
    Receipt,
    CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditableVariation } from "../../hooks/useVariationManager";

// ============================================================================
// TYPES
// ============================================================================

interface VariationDetailSheetProps {
    variation: EditableVariation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateField: (field: keyof EditableVariation, value: unknown) => void;
    onImageUpload?: (file: File) => void;
    isUploadingImage?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VariationDetailSheet({
    variation,
    open,
    onOpenChange,
    onUpdateField,
    onImageUpload,
    isUploadingImage,
}: VariationDetailSheetProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!variation) return null;

    const attributeTitle = variation.attributes
        .map((a) => a.option)
        .join(" / ");

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        Variation: {attributeTitle}
                    </SheetTitle>
                    <SheetDescription>
                        <div className="flex gap-1.5 flex-wrap">
                            {variation.attributes.map((attr) => (
                                <Badge
                                    key={attr.name}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {attr.name}: {attr.option}
                                </Badge>
                            ))}
                        </div>
                    </SheetDescription>
                </SheetHeader>

                <div key={variation._localId} className="space-y-6 mt-6">
                    {/* Image */}
                    <section>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Image
                        </Label>
                        <div className="flex items-end gap-3">
                            <div
                                className="h-32 w-32 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden cursor-pointer group relative"
                                onClick={() => onImageUpload && fileInputRef.current?.click()}
                            >
                                {isUploadingImage ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : variation.image?.src ? (
                                    <img
                                        src={variation.image.src}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                                        <span className="text-[10px] text-muted-foreground mt-1 block">
                                            Cliquer pour ajouter
                                        </span>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && onImageUpload) onImageUpload(file);
                                        e.target.value = "";
                                    }}
                                />
                            </div>
                            {variation.image?.src && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => onUpdateField("image", null)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Retirer
                                </Button>
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* Pricing */}
                    <section className="space-y-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Tarification
                        </Label>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Prix régulier</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={variation.regularPrice}
                                    className="h-9"
                                    onBlur={(e) =>
                                        onUpdateField(
                                            "regularPrice",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Prix promo</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={variation.salePrice}
                                    className="h-9"
                                    placeholder="—"
                                    onBlur={(e) =>
                                        onUpdateField(
                                            "salePrice",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">SKU</Label>
                            <Input
                                defaultValue={variation.sku}
                                className="h-9"
                                onBlur={(e) =>
                                    onUpdateField("sku", e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1.5">
                                <Barcode className="h-3 w-3" />
                                GTIN / EAN
                            </Label>
                            <Input
                                defaultValue={variation.globalUniqueId}
                                className="h-9"
                                placeholder="0012345678905"
                                onBlur={(e) =>
                                    onUpdateField("globalUniqueId", e.target.value)
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs flex items-center gap-1.5">
                                    <CalendarRange className="h-3 w-3" />
                                    Début promo
                                </Label>
                                <Input
                                    type="datetime-local"
                                    defaultValue={variation.dateOnSaleFrom || ""}
                                    className="h-9"
                                    onBlur={(e) =>
                                        onUpdateField("dateOnSaleFrom", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Fin promo</Label>
                                <Input
                                    type="datetime-local"
                                    defaultValue={variation.dateOnSaleTo || ""}
                                    className="h-9"
                                    onBlur={(e) =>
                                        onUpdateField("dateOnSaleTo", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Stock */}
                    <section className="space-y-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            Inventaire
                        </Label>

                        <div className="flex items-center justify-between">
                            <Label className="text-xs">
                                Gérer le stock
                            </Label>
                            <Switch
                                checked={variation.manageStock}
                                onCheckedChange={(checked) =>
                                    onUpdateField("manageStock", checked)
                                }
                            />
                        </div>

                        {variation.manageStock && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Quantité</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        defaultValue={
                                            variation.stockQuantity ?? ""
                                        }
                                        className="h-9"
                                        onBlur={(e) =>
                                            onUpdateField(
                                                "stockQuantity",
                                                e.target.value
                                                    ? parseInt(
                                                          e.target.value,
                                                          10
                                                      )
                                                    : null
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Statut stock
                                    </Label>
                                    <Select
                                        value={variation.stockStatus}
                                        onValueChange={(val) =>
                                            onUpdateField("stockStatus", val)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="instock">
                                                En stock
                                            </SelectItem>
                                            <SelectItem value="outofstock">
                                                Rupture
                                            </SelectItem>
                                            <SelectItem value="onbackorder">
                                                Précommande
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {!variation.manageStock && (
                            <div className="space-y-1.5">
                                <Label className="text-xs">Statut stock</Label>
                                <Select
                                    value={variation.stockStatus}
                                    onValueChange={(val) =>
                                        onUpdateField("stockStatus", val)
                                    }
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instock">
                                            En stock
                                        </SelectItem>
                                        <SelectItem value="outofstock">
                                            Rupture
                                        </SelectItem>
                                        <SelectItem value="onbackorder">
                                            Précommande
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-xs">Précommandes (backorders)</Label>
                            <Select
                                value={variation.backorders}
                                onValueChange={(val) =>
                                    onUpdateField("backorders", val)
                                }
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no">
                                        Ne pas autoriser
                                    </SelectItem>
                                    <SelectItem value="notify">
                                        Autoriser et notifier
                                    </SelectItem>
                                    <SelectItem value="yes">
                                        Autoriser
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    <Separator />

                    {/* Dimensions */}
                    <section className="space-y-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Ruler className="h-3.5 w-3.5" />
                            Logistique
                        </Label>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Poids (kg)</Label>
                            <Input
                                defaultValue={variation.weight}
                                className="h-9"
                                onBlur={(e) =>
                                    onUpdateField("weight", e.target.value)
                                }
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Long. (cm)</Label>
                                <Input
                                    defaultValue={
                                        variation.dimensions.length
                                    }
                                    className="h-9"
                                    onBlur={(e) =>
                                        onUpdateField("dimensions", {
                                            ...variation.dimensions,
                                            length: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Larg. (cm)</Label>
                                <Input
                                    defaultValue={
                                        variation.dimensions.width
                                    }
                                    className="h-9"
                                    onBlur={(e) =>
                                        onUpdateField("dimensions", {
                                            ...variation.dimensions,
                                            width: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Haut. (cm)</Label>
                                <Input
                                    defaultValue={
                                        variation.dimensions.height
                                    }
                                    className="h-9"
                                    onBlur={(e) =>
                                        onUpdateField("dimensions", {
                                            ...variation.dimensions,
                                            height: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Fiscalité */}
                    <section className="space-y-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Receipt className="h-3.5 w-3.5" />
                            Fiscalité
                        </Label>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Statut fiscal</Label>
                                <Select
                                    value={variation.taxStatus}
                                    onValueChange={(val) =>
                                        onUpdateField("taxStatus", val)
                                    }
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="taxable">
                                            Taxable
                                        </SelectItem>
                                        <SelectItem value="shipping">
                                            Livraison seul.
                                        </SelectItem>
                                        <SelectItem value="none">
                                            Aucun
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Classe de taxe</Label>
                                <Input
                                    defaultValue={variation.taxClass}
                                    className="h-9"
                                    placeholder="standard"
                                    onBlur={(e) =>
                                        onUpdateField("taxClass", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Description & Status */}
                    <section className="space-y-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            Description & Statut
                        </Label>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Textarea
                                defaultValue={variation.description}
                                className="min-h-[80px] text-sm"
                                placeholder="Description spécifique à cette variation..."
                                onBlur={(e) =>
                                    onUpdateField(
                                        "description",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Statut</Label>
                            <Select
                                value={variation.status}
                                onValueChange={(val) =>
                                    onUpdateField("status", val)
                                }
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="publish">
                                        Publié
                                    </SelectItem>
                                    <SelectItem value="private">
                                        Privé
                                    </SelectItem>
                                    <SelectItem value="draft">
                                        Brouillon
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={variation.virtual ?? false}
                                    onCheckedChange={(checked) =>
                                        onUpdateField("virtual", checked)
                                    }
                                    id="virtual-toggle"
                                />
                                <Label
                                    htmlFor="virtual-toggle"
                                    className="text-xs"
                                >
                                    Virtuel
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={
                                        variation.downloadable ?? false
                                    }
                                    onCheckedChange={(checked) =>
                                        onUpdateField(
                                            "downloadable",
                                            checked
                                        )
                                    }
                                    id="downloadable-toggle"
                                />
                                <Label
                                    htmlFor="downloadable-toggle"
                                    className="text-xs"
                                >
                                    Téléchargeable
                                </Label>
                            </div>
                        </div>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
