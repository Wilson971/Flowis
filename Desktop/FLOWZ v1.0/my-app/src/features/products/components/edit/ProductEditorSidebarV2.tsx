"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import type { ProductFormValues } from "../../schemas/product-schema";
import { SeoWidgetV2 } from "./sidebar/SeoWidgetV2";
import { SyncStatusCardV2 } from "./sidebar/SyncStatusCardV2";
import { SyncHistoryCardV2 } from "./sidebar/SyncHistoryCardV2";
import { VersionHistoryCardV2 } from "./sidebar/VersionHistoryCardV2";
import { PerformanceCardV2 } from "./sidebar/PerformanceCardV2";
import { PricingCardV2 } from "./sidebar/PricingCardV2";
import { OptionsCardV2 } from "./sidebar/OptionsCardV2";
import { ExternalProductCardV2 } from "./sidebar/ExternalProductCardV2";
import { OrganizationCardV2 } from "./sidebar/OrganizationCardV2";
import { LinkedProductsCardV2 } from "./sidebar/LinkedProductsCardV2";

interface ProductSidebarV2Props {
  productId?: string;
  availableCategories?: Array<{ id: string | number; name: string; slug?: string }>;
  isLoadingCategories?: boolean;
  onVersionRestored?: (formData: any) => void;
  isVariableProduct?: boolean;
  variationsCount?: number;
  // Performance data
  totalRevenue?: number;
  totalSales?: number;
  averageRating?: number;
  reviewCount?: number;
  // Sync data
  lastSyncedAt?: string | null;
  dirtyFields?: string[];
  hasConflict?: boolean;
  onResolveConflicts?: () => void;
}

export const ProductEditorSidebarV2 = ({
  productId,
  availableCategories = [],
  isLoadingCategories = false,
  onVersionRestored,
  isVariableProduct = false,
  variationsCount = 0,
  totalRevenue = 0,
  totalSales = 0,
  averageRating,
  reviewCount = 0,
  lastSyncedAt,
  dirtyFields = [],
  hasConflict = false,
  onResolveConflicts,
}: ProductSidebarV2Props) => {
  const { control } = useFormContext<ProductFormValues>();
  const productType = useWatch({ control, name: "product_type" });

  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SeoWidgetV2 />
      </motion.div>

      {productId && (
        <motion.div variants={motionTokens.variants.staggerItem}>
          <SyncStatusCardV2
            productId={productId}
            lastSyncedAt={lastSyncedAt}
            dirtyFields={dirtyFields}
            hasConflict={hasConflict}
            onResolveConflicts={onResolveConflicts}
          />
        </motion.div>
      )}

      {productId && (
        <motion.div variants={motionTokens.variants.staggerItem}>
          <SyncHistoryCardV2 productId={productId} />
        </motion.div>
      )}

      {productId && (
        <motion.div variants={motionTokens.variants.staggerItem}>
          <VersionHistoryCardV2
            productId={productId}
            onVersionRestored={onVersionRestored}
          />
        </motion.div>
      )}

      {(totalRevenue > 0 || totalSales > 0) && (
        <motion.div variants={motionTokens.variants.staggerItem}>
          <PerformanceCardV2
            totalRevenue={totalRevenue}
            totalSales={totalSales}
            averageRating={averageRating}
            reviewCount={reviewCount}
          />
        </motion.div>
      )}

      <motion.div variants={motionTokens.variants.staggerItem}>
        <PricingCardV2
          isVariableProduct={isVariableProduct}
          variationsCount={variationsCount}
        />
      </motion.div>

      <motion.div variants={motionTokens.variants.staggerItem}>
        <OptionsCardV2 />
      </motion.div>

      {productType === "external" && (
        <motion.div variants={motionTokens.variants.staggerItem}>
          <ExternalProductCardV2 />
        </motion.div>
      )}

      <motion.div variants={motionTokens.variants.staggerItem}>
        <OrganizationCardV2
          availableCategories={availableCategories}
          isLoadingCategories={isLoadingCategories}
        />
      </motion.div>

      <motion.div variants={motionTokens.variants.staggerItem}>
        <LinkedProductsCardV2 />
      </motion.div>
    </motion.div>
  );
};
