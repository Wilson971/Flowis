"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { ProductFormValues } from "../../schemas/product-schema";
import { PricingCard } from "./PricingCard";
import { OrganizationCard } from "./OrganizationCard";
import { PerformanceCard } from "./PerformanceCard";
import { SeoSidebarWidget } from "./SeoSidebarWidget";
import { ProductOptionsCard } from "./ProductOptionsCard";
import { ExternalProductCard } from "./ExternalProductCard";
import { LinkedProductsCard } from "./LinkedProductsCard";
import { SyncHistoryCard } from "./SyncHistoryCard";
import { ProductVersionHistoryCard } from "./ProductVersionHistoryCard";

// Types pour les catégories
interface Category {
    id: string | number;
    name: string;
    slug?: string;
}

// Types pour les tags
interface ProductTag {
    id: string | number;
    name: string;
    slug?: string;
}

// Types pour les produits liés
interface LinkedProduct {
    id: number;
    name?: string;
}

interface ProductSidebarProps {
    productId?: string;
    availableCategories?: Category[];
    isLoadingCategories?: boolean;
    availableTags?: ProductTag[];
    isLoadingTags?: boolean;
    availableProducts?: LinkedProduct[];
    isLoadingProducts?: boolean;
    isVariableProduct?: boolean;
    variationsCount?: number;
    onManageVariants?: () => void;
    totalRevenue?: number;
    totalSales?: number;
    averageRating?: number;
    reviewCount?: number;
    onVersionRestored?: (formData: any) => void;
}


export const ProductSidebar = ({
    productId,
    availableCategories = [],
    isLoadingCategories = false,
    availableTags = [],
    isLoadingTags = false,
    availableProducts = [],
    isLoadingProducts = false,
    isVariableProduct = false,
    variationsCount = 0,
    onManageVariants,
    totalRevenue = 0,
    totalSales = 0,
    averageRating,
    reviewCount = 0,
    onVersionRestored,
}: ProductSidebarProps) => {
    const { control } = useFormContext<ProductFormValues>();
    const productType = useWatch({ control, name: "product_type" });

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4"
        >
            {/* SEO Sidebar Widget */}
            <SeoSidebarWidget />

            {/* Sync History Card */}
            {productId && (
                <SyncHistoryCard productId={productId} />
            )}

            {/* Version History Card */}
            {productId && (
                <ProductVersionHistoryCard
                    productId={productId}
                    onVersionRestored={onVersionRestored}
                />
            )}

            {/* Performance Card (if we have stats) */}
            {(totalRevenue > 0 || totalSales > 0) && (
                <PerformanceCard
                    totalRevenue={totalRevenue}
                    totalSales={totalSales}
                    averageRating={averageRating}
                    reviewCount={reviewCount}
                />
            )}

            {/* Pricing & Inventory Card */}
            <PricingCard
                isVariableProduct={isVariableProduct}
                variationsCount={variationsCount}
                onManageVariants={onManageVariants}
            />

            {/* Product Options Card (Featured, Purchasable, Reviews, etc.) */}
            <ProductOptionsCard />

            {/* External Product Card (only for external products) */}
            {productType === "external" && <ExternalProductCard />}

            {/* Organization Card (Categories, Tags, Type, Brand) */}
            <OrganizationCard
                availableCategories={availableCategories}
                isLoadingCategories={isLoadingCategories}
                availableTags={availableTags}
                isLoadingTags={isLoadingTags}
            />

            {/* Linked Products Card (Upsell, Cross-sell, Related) */}
            <LinkedProductsCard
                availableProducts={availableProducts}
                isLoadingProducts={isLoadingProducts}
            />
        </motion.div>
    );
};
