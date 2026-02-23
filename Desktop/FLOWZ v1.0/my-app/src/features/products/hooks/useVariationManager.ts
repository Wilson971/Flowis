"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    useProductVariations,
    ProductVariation,
    AppVariation,
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
    // Phase 1 extended fields
    globalUniqueId: string;
    backorders: "no" | "notify" | "yes";
    taxStatus: "taxable" | "shipping" | "none";
    taxClass: string;
    dateOnSaleFrom: string;
    dateOnSaleTo: string;
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
    fallbackVariants?: unknown[];
}

// ============================================================================
// HELPERS
// ============================================================================

/** generateTempId moved inside hook as instance-scoped (see useVariationManager) */

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
        description: dbVar.description || "",
        status: (dbVar.status as "publish" | "private" | "draft") || "publish",
        image: dbVar.image || null,
        attributes: safeAttrs,
        virtual: dbVar.virtual ?? false,
        downloadable: dbVar.downloadable ?? false,
        globalUniqueId: dbVar.global_unique_id || "",
        backorders: (dbVar.backorders as "no" | "notify" | "yes") || "no",
        taxStatus: (dbVar.tax_status as "taxable" | "shipping" | "none") || "taxable",
        taxClass: dbVar.tax_class || "",
        dateOnSaleFrom: dbVar.date_on_sale_from || "",
        dateOnSaleTo: dbVar.date_on_sale_to || "",
    };
}

/** Convert a Supabase PostgrestError to a proper Error with readable message */
function toError(err: { message?: string; code?: string; details?: string }): Error {
    const parts = [err.message || "Erreur Supabase inconnue"];
    if (err.details) parts.push(err.details);
    if (err.code) parts.push(`(code: ${err.code})`);
    return new Error(parts.join(" — "));
}

/** Convert a fallback AppVariation (from metadata) to EditableVariation */
function appVariationToEditable(appVar: AppVariation): EditableVariation {
    return {
        _localId: `meta_${appVar.id}`,
        _status: "synced",
        externalId: appVar.id,
        sku: appVar.sku || "",
        regularPrice: appVar.regular_price || "",
        salePrice: appVar.sale_price || "",
        stockQuantity: appVar.stock_quantity,
        manageStock: appVar.manage_stock,
        stockStatus: appVar.stock_status || "instock",
        weight: appVar.weight || "",
        dimensions: appVar.dimensions || { length: "", width: "", height: "" },
        description: appVar.description || "",
        status: (appVar.status as "publish" | "private" | "draft") || "publish",
        image: appVar.image || null,
        attributes: appVar.attributes,
        virtual: appVar.virtual ?? false,
        downloadable: appVar.downloadable ?? false,
        globalUniqueId: appVar.global_unique_id || "",
        backorders: (appVar.backorders as "no" | "notify" | "yes") || "no",
        taxStatus: (appVar.tax_status as "taxable" | "shipping" | "none") || "taxable",
        taxClass: appVar.tax_class || "",
        dateOnSaleFrom: appVar.date_on_sale_from || "",
        dateOnSaleTo: appVar.date_on_sale_to || "",
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
    fallbackVariants,
}: UseVariationManagerOptions) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch existing variations from DB (with metadata fallback)
    const {
        variations: dbVariations,
        appVariations,
        isLoading: isLoadingVariations,
        refetch: refetchVariations,
    } = useProductVariations({
        productId,
        storeId,
        platformProductId,
        enabled: enabled && !!storeId,
        fallbackVariants,
    });

    // Instance-scoped temp ID counter (avoids global counter shared across hook instances)
    const tempIdCounterRef = useRef(0);
    function generateTempId(): string {
        return `temp_${Date.now()}_${++tempIdCounterRef.current}`;
    }

    // Local state
    const [variations, setVariations] = useState<EditableVariation[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isInitialized, setIsInitialized] = useState(false);
    const [changeCounter, setChangeCounter] = useState(0);

    // Initialize local state from DB data (or metadata fallback)
    useEffect(() => {
        if (isLoadingVariations) return;
        if (isInitialized && variations.length > 0) return;

        // Prefer DB rows when available
        if (dbVariations && dbVariations.length > 0) {
            setVariations(dbVariations.map(dbToEditable));
            setIsInitialized(true);
            return;
        }

        // Fallback: metadata variants converted via appVariations
        if (appVariations && appVariations.length > 0) {
            setVariations(appVariations.map(appVariationToEditable));
            setIsInitialized(true);
        }
    }, [dbVariations, appVariations, isLoadingVariations]);

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
            prev
                // Remove "new" variations entirely (they don't exist in DB)
                .filter((v) => !(v._localId === localId && v._status === "new"))
                // Mark existing variations for deletion (need DB + WC sync)
                .map((v) => {
                    if (v._localId !== localId) return v;
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
            prev
                // Remove "new" variations entirely
                .filter((v) => !(selectedIds.has(v._localId) && v._status === "new"))
                // Mark existing variations for deletion
                .map((v) => {
                    if (!selectedIds.has(v._localId)) return v;
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
            globalUniqueId: "",
            backorders: "no",
            taxStatus: "taxable",
            taxClass: "",
            dateOnSaleFrom: "",
            dateOnSaleTo: "",
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
                        globalUniqueId: "",
                        backorders: "no",
                        taxStatus: "taxable",
                        taxClass: "",
                        dateOnSaleFrom: "",
                        dateOnSaleTo: "",
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
            setChangeCounter((c) => c + 1);

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
            setChangeCounter((c) => c + 1);
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
            // Metadata-only variations (from WC sync fallback) need to be
            // migrated into the product_variations table on first save.
            // This includes both "synced" (untouched) AND "modified" (user-edited)
            // metadata variations — both lack a dbId since they don't exist in the table yet.
            const toMigrateFromMetadata = variations.filter(
                (v) => !v.dbId && (v._status === "synced" || v._status === "modified")
            );
            // Only update variations that already exist in the DB (have a dbId)
            const toUpdate = variations.filter((v) => v._status === "modified" && v.dbId);
            const toDelete = variations.filter(
                (v) => v._status === "deleted" && v.dbId
            );

            // ── SKU uniqueness validation ──────────────────────────────
            const activeVariations = variations.filter(
                (v) => v._status !== "deleted" && v.sku?.trim()
            );
            // Deduplicate SKU list for cross-table checks (variations of the
            // same product are allowed to share a SKU — this is common in WooCommerce)
            const skuList = [...new Set(activeVariations.map((v) => v.sku.trim()))];

            // Cross-table duplicates (vs products + other variations in same store)
            if (skuList.length > 0) {
                // Get current variation DB IDs to exclude from check
                const currentDbIds = activeVariations
                    .filter((v) => v.dbId)
                    .map((v) => v.dbId!);

                // Check against products table (exclude the parent product —
                // WooCommerce allows variations to share the parent's SKU)
                const { data: conflictProducts } = await supabase
                    .from("products")
                    .select("sku, title")
                    .eq("store_id", storeId)
                    .neq("id", productId)
                    .in("sku", skuList);

                if (conflictProducts && conflictProducts.length > 0) {
                    const cp = conflictProducts[0];
                    throw new Error(
                        `Le SKU "${cp.sku}" est déjà utilisé par le produit "${cp.title || "sans titre"}". Veuillez choisir un SKU unique.`
                    );
                }

                // Check against other variations (exclude all variations of this product)
                const varQuery = supabase
                    .from("product_variations")
                    .select("sku, parent_product_external_id")
                    .eq("store_id", storeId)
                    .neq("product_id", productId)
                    .in("sku", skuList);

                const { data: conflictVariations } = await varQuery;
                if (conflictVariations && conflictVariations.length > 0) {
                    const cv = conflictVariations[0];
                    throw new Error(
                        `Le SKU "${cv.sku}" est déjà utilisé par une autre variation (parent #${cv.parent_product_external_id}). Veuillez choisir un SKU unique.`
                    );
                }
            }
            // ── End SKU validation ─────────────────────────────────────

            // Fetch user's workspace_id for RLS compliance
            const { data: membership } = await supabase
                .from("workspace_members")
                .select("workspace_id")
                .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
                .limit(1)
                .single();

            const workspaceId = membership?.workspace_id ?? null;

            // INSERT new variations
            if (toCreate.length > 0) {
                const rows = toCreate.map((v) => ({
                    store_id: storeId,
                    product_id: productId,
                    workspace_id: workspaceId,
                    parent_product_external_id: platformProductId,
                    external_id: `local_${v._localId}`,
                    platform: "woocommerce",
                    sku: v.sku || null,
                    price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                    regular_price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                    sale_price: v.salePrice ? parseFloat(v.salePrice) : null,
                    on_sale: !!v.salePrice && parseFloat(v.salePrice) > 0,
                    stock_quantity: v.stockQuantity,
                    stock_status: v.stockStatus,
                    manage_stock: v.manageStock,
                    weight: v.weight || null,
                    dimensions: v.dimensions,
                    attributes: v.attributes,
                    image: v.image,
                    status: v.status,
                    description: v.description,
                    virtual: v.virtual,
                    downloadable: v.downloadable,
                    backorders: v.backorders,
                    tax_status: v.taxStatus,
                    tax_class: v.taxClass || null,
                    original_data: { virtual: v.virtual, downloadable: v.downloadable },
                    is_dirty: true,
                    dirty_action: "created",
                }));

                const { error } = await supabase
                    .from("product_variations")
                    .insert(rows);
                if (error) throw toError(error);
            }

            // MIGRATE metadata-only variations to product_variations table.
            // Modified metadata variations are marked as dirty for WC sync.
            if (toMigrateFromMetadata.length > 0) {
                const migrateRows = toMigrateFromMetadata.map((v) => ({
                    store_id: storeId,
                    product_id: productId,
                    workspace_id: workspaceId,
                    parent_product_external_id: platformProductId,
                    external_id: v.externalId || `local_${v._localId}`,
                    platform: "woocommerce",
                    sku: v.sku || null,
                    price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                    regular_price: v.regularPrice ? parseFloat(v.regularPrice) : null,
                    sale_price: v.salePrice ? parseFloat(v.salePrice) : null,
                    on_sale: !!v.salePrice && parseFloat(v.salePrice) > 0,
                    stock_quantity: v.stockQuantity,
                    stock_status: v.stockStatus,
                    manage_stock: v.manageStock,
                    weight: v.weight || null,
                    dimensions: v.dimensions,
                    attributes: v.attributes,
                    image: v.image,
                    status: v.status,
                    description: v.description,
                    virtual: v.virtual,
                    downloadable: v.downloadable,
                    backorders: v.backorders,
                    tax_status: v.taxStatus,
                    tax_class: v.taxClass || null,
                    original_data: { virtual: v.virtual, downloadable: v.downloadable },
                    // Synced = pure migration (no user changes), Modified = user edited before migration
                    is_dirty: v._status === "modified",
                    dirty_action: v._status === "modified" ? "updated" : null,
                }));

                const { error } = await supabase
                    .from("product_variations")
                    .insert(migrateRows);
                if (error) throw toError(error);
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
                        on_sale: !!v.salePrice && parseFloat(v.salePrice) > 0,
                        stock_quantity: v.stockQuantity,
                        stock_status: v.stockStatus,
                        manage_stock: v.manageStock,
                        weight: v.weight || null,
                        dimensions: v.dimensions,
                        attributes: v.attributes,
                        image: v.image,
                        status: v.status,
                        description: v.description,
                        virtual: v.virtual,
                        downloadable: v.downloadable,
                        backorders: v.backorders,
                        tax_status: v.taxStatus,
                        tax_class: v.taxClass || null,
                        original_data: { virtual: v.virtual, downloadable: v.downloadable },
                        is_dirty: true,
                        dirty_action: "updated",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", v.dbId);
                if (error) throw toError(error);
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
                if (error) throw toError(error);
            }

            return {
                created: toCreate.length,
                migrated: toMigrateFromMetadata.length,
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
            queryClient.invalidateQueries({
                queryKey: ["dirty-variations-count"],
            });

            const parts: string[] = [];
            if (result.created > 0) parts.push(`${result.created} créée(s)`);
            if (result.migrated > 0) parts.push(`${result.migrated} migrée(s)`);
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

        // Change counter (for forcing re-render of uncontrolled inputs)
        changeCounter,
    };
}
