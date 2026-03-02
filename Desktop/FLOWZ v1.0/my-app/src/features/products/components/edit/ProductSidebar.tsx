"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
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
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* SEO Sidebar Widget */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <SeoSidebarWidget />
            </motion.div>

            {/* Sync History Card */}
            {productId && (
                <motion.div variants={motionTokens.variants.staggerItem}>
                    <SyncHistoryCard productId={productId} />
                </motion.div>
            )}

            {/* Version History Card */}
            {productId && (
                <motion.div variants={motionTokens.variants.staggerItem}>
                    <ProductVersionHistoryCard
                        productId={productId}
                        onVersionRestored={onVersionRestored}
                    />
                </motion.div>
            )}

            {/* Performance Card (if we have stats) */}
            {(totalRevenue > 0 || totalSales > 0) && (
                <motion.div variants={motionTokens.variants.staggerItem}>
                    <PerformanceCard
                        totalRevenue={totalRevenue}
                        totalSales={totalSales}
                        averageRating={averageRating}
                        reviewCount={reviewCount}
                    />
                </motion.div>
            )}

            {/* Pricing & Inventory Card */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <PricingCard
                    isVariableProduct={isVariableProduct}
                    variationsCount={variationsCount}
                    onManageVariants={onManageVariants}
                />
            </motion.div>

            {/* Product Options Card (Featured, Purchasable, Reviews, etc.) */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <ProductOptionsCard />
            </motion.div>

            {/* External Product Card (only for external products) */}
            {productType === "external" && (
                <motion.div variants={motionTokens.variants.staggerItem}>
                    <ExternalProductCard />
                </motion.div>
            )}

            {/* Organization Card (Categories, Tags, Type, Brand) */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <OrganizationCard
                    availableCategories={availableCategories}
                    isLoadingCategories={isLoadingCategories}
                    availableTags={availableTags}
                    isLoadingTags={isLoadingTags}
                />
            </motion.div>

            {/* Linked Products Card (Upsell, Cross-sell, Related) */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <LinkedProductsCard
                    availableProducts={availableProducts}
                    isLoadingProducts={isLoadingProducts}
                />
            </motion.div>
        </motion.div>
    );
};
