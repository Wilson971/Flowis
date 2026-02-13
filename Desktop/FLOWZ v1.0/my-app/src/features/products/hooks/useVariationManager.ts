"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    useProductVariations,
    ProductVariation,
    VariationAttribute,
    VariationImage,
} from "@/hooks/products/useProductVariations";
import { cartesianProduct } from "../utils/cartesianProduct";
import type { ProductAttribute } from "../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

export type VariationStatus = "synced" | "new" | "modified" | "deleted";

export interface EditableVariation {
    /** Client-side unique ID (UUID for existing, temp ID for new) */
    _localId: string;
    _status: VariationStatus;
    /** Database UUID (product_variations.id) — undefined for new variations */
    dbId?: string;
    /** WooCommerce variation ID */
    externalId?: string;
    sku: string;
    regularPrice: string;
    salePrice: string;
    stockQuantity: number | null;
    manageStock: boolean;
    stockStatus: "instock" | "outofstock" | "onbackorder";
    weight: string;
    dimensions: { length: string; width: string; height: string };
    description: string;
    status: "publish" | "private" | "draft";
    image: VariationImage | null;
    attributes: VariationAttribute[];
    virtual: boolean;
    downloadable: boolean;
}

export interface VariationStats {
    total: number;
    new: number;
    modified: number;
    deleted: number;
}

interface UseVariationManagerOptions {
    productId: string;
    storeId?: string;
    platformProductId?: string;
    enabled?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

let tempIdCounter = 0;
function generateTempId(): string {
    return `temp_${Date.now()}_${++tempIdCounter}`;
}

/** Build a unique key for a variation's attribute combination */
function attributeKey(attrs: VariationAttribute[]): string {
    return [...attrs]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => `${a.name}:${a.option}`)
        .join("|");
}

/** Convert a DB row to an EditableVariation */
function dbToEditable(dbVar: ProductVariation): EditableVariation {
    const safeAttrs = Array.isArray(dbVar.attributes) ? dbVar.attributes : [];
    return {
        _localId: dbVar.id,
        _status: "synced",
        dbId: dbVar.id,
        externalId: dbVar.external_id || undefined,
        sku: dbVar.sku || "",
        regularPrice: dbVar.regular_price?.toString() || "",
        salePrice: dbVar.sale_price?.toString() || "",
        stockQuantity: dbVar.stock_quantity,
        manageStock: dbVar.manage_stock,
        stockStatus: dbVar.stock_status || "instock",
        weight: dbVar.weight || "",
        dimensions: dbVar.dimensions || { length: "", width: "", height: "" },
        description: "",
        status: (dbVar.status as "publish" | "private" | "draft") || "publish",
        image: dbVar.image || null,
        attributes: safeAttrs,
        virtual: false,
        downloadable: false,
    };
}

// ============================================================================
// HOOK
// ============================================================================

export function useVariationManager({
    productId,
    storeId,
    platformProductId,
    enabled = true,
}: UseVariationManagerOptions) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch existing variations from DB
    const {
        variations: dbVariations,
        isLoading: isLoadingVariations,
        refetch: refetchVariations,
    } = useProductVariations({
        productId,
        storeId,
        platformProductId,
        enabled: enabled && !!storeId,
    });

    // Local state
    const [variations, setVariations] = useState<EditableVariation[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize local state from DB data
    useEffect(() => {
        if (!dbVariations || isLoadingVariations) return;
        if (isInitialized && variations.length > 0) return;

        const mapped = dbVariations.map(dbToEditable);
        setVariations(mapped);
        setIsInitialized(true);
    }, [dbVariations, isLoadingVariations]);

    // ===== COMPUTED =====

    const activeVariations = useMemo(
        () => variations.filter((v) => v._status !== "deleted"),
        [variations]
    );

    const stats: VariationStats = useMemo(() => {
        const active = variations.filter((v) => v._status !== "deleted");
        return {
            total: active.length,
            new: variations.filter((v) => v._status === "new").length,
            modified: variations.filter((v) => v._status === "modified").length,
            deleted: variations.filter((v) => v._status === "deleted").length,
        };
    }, [variations]);

    const hasUnsavedChanges = useMemo(
        () => stats.new > 0 || stats.modified > 0 || stats.deleted > 0,
        [stats]
    );

    // ===== SELECTION =====

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
            if (prev.size === activeVariations.length) {
                return new Set();
            }
            return new Set(activeVariations.map((v) => v._localId));
        });
    }, [activeVariations]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ===== CRUD =====

    const updateVariationField = useCallback(
        (localId: string, field: keyof EditableVariation, value: unknown) => {
            setVariations((prev) =>
                prev.map((v) => {
                    if (v._localId !== localId) return v;
                    return {
                        ...v,
                        [field]: value,
                        _status: v._status === "new" ? "new" : "modified",
                    };
                })
            );
        },
        []
    );

    const deleteVariation = useCallback((localId: string) => {
        setVariations((prev) =>
            prev.map((v) => {
                if (v._localId !== localId) return v;
                // New variations can be removed immediately
                if (v._status === "new") return { ...v, _status: "deleted" as const };
                // Existing variations are marked for deletion
                return { ...v, _status: "deleted" as const };
            })
        );
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(localId);
            return next;
        });
    }, []);

    const deleteSelected = useCallback(() => {
        setVariations((prev) =>
            prev.map((v) => {
                if (!selectedIds.has(v._localId)) return v;
                if (v._status === "new") return { ...v, _status: "deleted" as const };
                return { ...v, _status: "deleted" as const };
            })
        );
        setSelectedIds(new Set());
    }, [selectedIds]);

    const addVariation = useCallback((attrs: VariationAttribute[]) => {
        const newVar: EditableVariation = {
            _localId: generateTempId(),
            _status: "new",
            sku: "",
            regularPrice: "",
            salePrice: "",
            stockQuantity: null,
            manageStock: false,
            stockStatus: "instock",
            weight: "",
            dimensions: { length: "", width: "", height: "" },
            description: "",
            status: "publish",
            image: null,
            attributes: attrs,
            virtual: false,
            downloadable: false,
        };
        setVariations((prev) => [...prev, newVar]);
    }, []);

    // ===== MATRIX GENERATION =====

    const generateFromAttributes = useCallback(
        (attributes: ProductAttribute[]) => {
            const variationAttrs = attributes.filter(
                (a) => a.variation && a.options.length > 0
            );
            if (variationAttrs.length === 0) {
                toast.error("Aucun attribut de variation avec des options");
                return;
            }

            const attrNames = variationAttrs.map((a) => a.name);
            const optionArrays = variationAttrs.map((a) => a.options);
            const combos = cartesianProduct(optionArrays);

            // Build lookup of existing variations by attribute key
            const existingMap = new Map<string, EditableVariation>();
            for (const v of variations) {
                if (v._status !== "deleted") {
                    existingMap.set(attributeKey(v.attributes), v);
                }
            }

            const result: EditableVariation[] = [];
            let newCount = 0;

            for (const combo of combos) {
                const attrs: VariationAttribute[] = combo.map((option, i) => ({
                    name: attrNames[i],
                    option,
                }));
                const key = attributeKey(attrs);
                const existing = existingMap.get(key);

                if (existing) {
                    result.push(existing);
                    existingMap.delete(key);
                } else {
                    result.push({
                        _localId: generateTempId(),
                        _status: "new",
                        sku: "",
                        regularPrice: "",
                        salePrice: "",
                        stockQuantity: null,
                        manageStock: false,
                        stockStatus: "instock",
                        weight: "",
                        dimensions: { length: "", width: "", height: "" },
                        description: "",
                        status: "publish",
                        image: null,
                        attributes: attrs,
                        virtual: false,
                        downloadable: false,
                    });
                    newCount++;
                }
            }

            // Keep deleted-but-synced variations that are no longer in the combo matrix
            // They'll still be tracked for WC deletion
            const orphaned = [...existingMap.values()].filter(
                (v) => v._status === "synced" || v._status === "modified"
            );
            for (const v of orphaned) {
                result.push({ ...v, _status: "deleted" });
            }

            setVariations(result);
            setSelectedIds(new Set());

            if (newCount > 0) {
                toast.success(`${newCount} nouvelle(s) variation(s) générée(s)`);
            } else {
                toast.info("Toutes les combinaisons existent déjà");
            }
        },
        [variations]
    );

    // ===== BULK OPERATIONS =====

    const bulkUpdateField = useCallback(
        (field: keyof EditableVariation, value: unknown) => {
            setVariations((prev) =>
                prev.map((v) => {
                    if (!selectedIds.has(v._localId)) return v;
                    if (v._status === "deleted") return v;
                    return {
                        ...v,
                        [field]: value,
                        _status: v._status === "new" ? "new" : "modified",
                    };
                })
            );
        },
        [selectedIds]
    );

    // ===== PERSISTENCE =====

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!storeId || !platformProductId) {
                throw new Error("Store ID et Product ID requis");
            }

            const toCreate = variations.filter((v) => v._status === "new");
            const toUpdate = variations.filter((v) => v._status === "modified");
            const toDelete = variations.filter(
                (v) => v._status === "deleted" && v.dbId
            );

            // INSERT new variations
            if (toCreate.length > 0) {
                const rows = toCreate.map((v) => ({
                    store_id: storeId,
                    product_id: productId,
                    parent_product_external_id: platformProductId,
                    external_id: `local_${v._localId}`,
                    platform: "woocommerce",
                    sku: v.sku || null,
                    price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                    regular_price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                    sale_price: v.salePrice ? parseFloat(v.salePrice) : null,
                    stock_quantity: v.stockQuantity,
                    stock_status: v.stockStatus,
                    manage_stock: v.manageStock,
                    weight: v.weight || null,
                    dimensions: v.dimensions,
                    attributes: v.attributes,
                    image: v.image,
                    status: v.status,
                    description: v.description,
                    is_dirty: true,
                    dirty_action: "created",
                }));

                const { error } = await supabase
                    .from("product_variations")
                    .insert(rows);
                if (error) throw error;
            }

            // UPDATE modified variations
            for (const v of toUpdate) {
                if (!v.dbId) continue;
                const { error } = await supabase
                    .from("product_variations")
                    .update({
                        sku: v.sku || null,
                        price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                        regular_price: v.regularPrice
                            ? parseFloat(v.regularPrice)
                            : null,
                        sale_price: v.salePrice ? parseFloat(v.salePrice) : null,
                        stock_quantity: v.stockQuantity,
                        stock_status: v.stockStatus,
                        manage_stock: v.manageStock,
                        weight: v.weight || null,
                        dimensions: v.dimensions,
                        attributes: v.attributes,
                        image: v.image,
                        status: v.status,
                        description: v.description,
                        is_dirty: true,
                        dirty_action: "updated",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", v.dbId);
                if (error) throw error;
            }

            // DELETE removed variations
            if (toDelete.length > 0) {
                const deleteIds = toDelete.map((v) => v.dbId!);
                // Mark as dirty for WC sync (soft delete approach)
                const { error } = await supabase
                    .from("product_variations")
                    .update({
                        is_dirty: true,
                        dirty_action: "deleted",
                    })
                    .in("id", deleteIds);
                if (error) throw error;
            }

            return {
                created: toCreate.length,
                updated: toUpdate.length,
                deleted: toDelete.length,
            };
        },
        onSuccess: async (result) => {
            // Refetch to get the DB-assigned IDs for new variations
            await refetchVariations();
            // Re-initialize from DB
            setIsInitialized(false);

            queryClient.invalidateQueries({
                queryKey: ["product-variations", productId],
            });

            const parts: string[] = [];
            if (result.created > 0) parts.push(`${result.created} créée(s)`);
            if (result.updated > 0) parts.push(`${result.updated} modifiée(s)`);
            if (result.deleted > 0) parts.push(`${result.deleted} supprimée(s)`);

            toast.success(`Variations sauvegardées: ${parts.join(", ")}`);
        },
        onError: (error: Error) => {
            toast.error("Erreur de sauvegarde", { description: error.message });
        },
    });

    return {
        // State
        variations: activeVariations,
        allVariations: variations,
        selectedIds,
        hasUnsavedChanges,
        isLoading: isLoadingVariations,

        // Selection
        toggleSelect,
        toggleSelectAll,
        clearSelection,

        // CRUD
        updateVariationField,
        deleteVariation,
        deleteSelected,
        addVariation,

        // Matrix
        generateFromAttributes,

        // Bulk
        bulkUpdateField,

        // Persistence
        saveVariations: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,

        // Stats
        stats,
    };
}
