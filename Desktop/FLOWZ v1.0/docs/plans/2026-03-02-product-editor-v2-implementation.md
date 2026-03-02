# Product Editor V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the product editor form with Vercel Pro premium design patterns while reusing all existing hooks and business logic.

**Architecture:** New V2 files alongside existing V1. Each component is a visual-only reconstruction using the same hooks/context. Layout = Main (2/3) + Sidebar (1/3) with underline tabs Vercel-style.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, React Hook Form, motionTokens from `@/lib/design-system`

---

## Conventions for ALL Tasks

Every V2 component MUST follow these rules:

```tsx
// IMPORTS — always in this order
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-system'

// CARD PATTERN — every card
<div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
  <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
  <div className="relative z-10">{/* content */}</div>
</div>

// TYPOGRAPHY
// Page title:    text-lg font-semibold tracking-tight text-foreground
// Section title: text-[15px] font-semibold tracking-tight text-foreground
// Card title:    text-[13px] font-semibold tracking-tight text-foreground
// Description:   text-xs text-muted-foreground
// Overline:      text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider
// Values:        text-[11px] font-medium text-foreground tabular-nums
// Helper:        text-[11px] text-muted-foreground/60

// ICON CONTAINERS
// Large: flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0
// Small: flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/40 shrink-0
// Icon:  h-[18px] w-[18px] text-foreground/70 (MONOCHROME always)

// BADGES: h-5 rounded-full px-2 text-[10px] font-medium border-0
// BUTTONS: h-7 or h-8, text-[11px] rounded-lg font-medium
// MOTION: motionTokens.variants.* and motionTokens.transitions.*
// NEVER: font-bold, transition-all, rounded-md, p-5, hardcoded colors, local variants
```

Reference files to consult:
- `.claude/skills/vercel-premium-pro.md` — visual patterns
- `my-app/src/lib/design-system/CONVENTIONS.md` — DS rules
- `my-app/src/app/app/design-demo/vercel-pro/page.tsx` — live examples

---

## Task 1: ProductEditorLayoutV2

**Files:**
- Create: `my-app/src/features/products/components/edit/ProductEditorLayoutV2.tsx`

**Step 1: Create the layout component**

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface ProductEditorLayoutV2Props {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

export const ProductEditorLayoutV2 = ({
  children,
  sidebar,
  className,
}: ProductEditorLayoutV2Props) => {
  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6",
        className
      )}
    >
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-6 min-w-0">
        {children}
      </motion.div>

      <motion.div variants={motionTokens.variants.staggerItem}>
        <div className="xl:sticky xl:top-20 space-y-4">
          {sidebar}
        </div>
      </motion.div>
    </motion.div>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/ProductEditorLayoutV2.tsx
git commit -m "feat(product-editor): add ProductEditorLayoutV2 with Vercel Pro patterns"
```

---

## Task 2: ProductEditorHeaderV2

**Files:**
- Create: `my-app/src/features/products/components/edit/ProductEditorHeaderV2.tsx`

**Step 1: Create the dense header**

This is a single-line sticky header with:
- Back button (ghost, icon)
- Product title (truncated, `text-[13px]`)
- StatusPill + SyncPill (reused from V1)
- Save status indicator
- Undo/Redo buttons
- History counter
- Separator
- Save button (outline, h-7)
- Publish button (primary, h-8)

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import {
  ArrowLeft, Loader2, ExternalLink, Check,
  Undo2, Redo2, Save, Upload
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { ProductFormValues } from "../../schemas/product-schema";
import { StatusPill } from "./StatusPill";
import { SyncPill } from "./SyncPill";

// ── Title Display (isolated re-renders) ──
const ProductTitleDisplay = () => {
  const { control } = useFormContext<ProductFormValues>();
  const title = useWatch({ control, name: "title" });
  return (
    <span className="text-[13px] font-semibold tracking-tight text-foreground truncate max-w-[300px]">
      {title || "Nouveau produit"}
    </span>
  );
};

// ── Types ──
interface FormHistory {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  historyIndex: number;
}

export interface ProductEditorHeaderV2Props {
  product: Product;
  productId: string;
  selectedStore: any;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  dirtyFieldsContent: string[];
  hasConflict: boolean;
  isSaving: boolean;
  isPublishing?: boolean;
  history: FormHistory;
  onSave: () => void;
  onPublish: () => void;
  onReset: () => void;
  onResolveConflicts: () => void;
}

function buildProductUrl(product: Product, selectedStore: any): string | null {
  const metadata = product.metadata || {};
  const platform = product.platform;
  if (platform === "shopify") {
    const handle = (product as any).handle || metadata.handle;
    const shopUrl = selectedStore?.platform_connections?.shop_url || "";
    if (handle && shopUrl) {
      const cleanUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return `https://${cleanUrl}/products/${handle}`;
    }
  } else if (platform === "woocommerce") {
    const permalink = metadata.permalink || null;
    if (permalink) return permalink;
    const shopUrl = selectedStore?.platform_connections?.shop_url;
    const slug = product.slug || metadata.slug;
    if (shopUrl && slug) {
      return `${shopUrl.replace(/\/$/, "")}/product/${slug}/`;
    }
  }
  return null;
}

export const ProductEditorHeaderV2 = ({
  product,
  productId,
  selectedStore,
  saveStatus,
  isDirty,
  dirtyFieldsContent,
  hasConflict,
  isSaving,
  isPublishing = false,
  history,
  onSave,
  onPublish,
  onReset,
  onResolveConflicts,
}: ProductEditorHeaderV2Props) => {
  const hasPendingChanges = dirtyFieldsContent.length > 0;
  const productUrl = buildProductUrl(product, selectedStore);

  return (
    <div className="sticky top-0 z-30 h-14 flex items-center border-b border-border/40 bg-card/80 backdrop-blur-xl -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 text-[11px] rounded-lg gap-1 font-medium text-muted-foreground hover:text-foreground shrink-0"
          >
            <Link href="/app/products">
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>
          </Button>

          <div className="w-px h-5 bg-border/30 shrink-0" />

          <div className="flex items-center gap-1.5 min-w-0">
            <ProductTitleDisplay />
            {productUrl && (
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                aria-label="Voir en ligne"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status pills */}
          <StatusPill />
          <SyncPill
            productId={productId}
            dirtyFields={dirtyFieldsContent}
            lastSyncedAt={product.last_synced_at}
            hasConflict={hasConflict}
            onResolveConflicts={onResolveConflicts}
          />

          {/* Save status */}
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            {isSaving ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde…</>
            ) : isPublishing ? (
              <><Upload className="h-3 w-3 animate-pulse text-foreground/70" /> Publication…</>
            ) : saveStatus === "error" ? (
              <span className="text-red-500">Erreur</span>
            ) : isDirty ? (
              <span className="text-amber-600">Non enregistre</span>
            ) : (
              <><Check className="h-3 w-3" /> Sauvegarde</>
            )}
          </span>

          {/* Undo / Redo */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={history.undo}
                    disabled={!history.canUndo}
                    className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Annuler (Ctrl+Z)"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={history.redo}
                    disabled={!history.canRedo}
                    className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Retablir (Ctrl+Y)"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Retablir (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">
            {history.historyIndex}/{history.historyLength}
          </span>

          <div className="w-px h-5 bg-border/30" />

          {/* Reset */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!isDirty || isSaving}
            className="h-7 text-[11px] rounded-lg font-medium text-muted-foreground hover:text-foreground"
          >
            Annuler
          </Button>

          {/* Save */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-muted/50"
          >
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            <Save className="h-3.5 w-3.5" />
            Enregistrer
          </Button>

          {/* Publish */}
          <Button
            type="button"
            size="sm"
            onClick={onPublish}
            disabled={isPublishing || isDirty || (!hasPendingChanges && !hasConflict)}
            className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
          >
            {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Upload className="h-3.5 w-3.5" />
            Publier
            {hasPendingChanges && (
              <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-primary-foreground/20 tabular-nums">
                {dirtyFieldsContent.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/ProductEditorHeaderV2.tsx
git commit -m "feat(product-editor): add ProductEditorHeaderV2 — dense Vercel Pro header"
```

---

## Task 3: ProductEditorTabsV2

**Files:**
- Create: `my-app/src/features/products/components/edit/ProductEditorTabsV2.tsx`

**Step 1: Create underline tabs with layoutId**

```tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

export type ProductTab = "general" | "media" | "variations" | "seo";

interface TabItem {
  id: ProductTab;
  label: string;
  count?: number;
  hidden?: boolean;
}

interface ProductEditorTabsV2Props {
  activeTab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  tabs: TabItem[];
}

export const ProductEditorTabsV2 = ({
  activeTab,
  onTabChange,
  tabs,
}: ProductEditorTabsV2Props) => {
  const visibleTabs = tabs.filter((t) => !t.hidden);

  return (
    <div className="flex items-center gap-1 border-b border-border/40">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-3 py-2 text-[13px] font-medium transition-colors",
            activeTab === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ml-1.5 text-[10px] text-muted-foreground/60 tabular-nums">
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeProductTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
              transition={motionTokens.transitions.fast}
            />
          )}
        </button>
      ))}
    </div>
  );
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/ProductEditorTabsV2.tsx
git commit -m "feat(product-editor): add ProductEditorTabsV2 — Vercel underline tabs with layoutId"
```

---

## Task 4: GeneralTabV2

**Files:**
- Create: `my-app/src/features/products/components/edit/tabs/GeneralTabV2.tsx`

**Step 1: Create the general tab**

This component reuses:
- `useFormContext<ProductFormValues>()` for form access
- `useProductEditContext()` for drafts, dirty fields, SEO analysis
- `TipTapEditor` for rich text
- `ScoreBadge`, `calculateScore` from existing SEO components
- `FieldStatusBadge`, `DraftSuggestionButton`, `AISuggestionModal` from V1

Structure: Single Vercel Pro card with 3 field sections (Title, Short Description, Description), each with:
- Label `text-[13px] font-medium` + char count `text-[10px] tabular-nums` + score badge `h-5 rounded-full`
- Input/Editor
- Draft indicator dot + AI suggestion button

Replicate the exact same logic from `ProductGeneralTab.tsx` but with Vercel Pro visual patterns:
- Card: `rounded-xl border border-border/40 bg-card` + dark overlay
- Header: icon container + `text-[15px] font-semibold tracking-tight` title
- Field labels: `text-[13px] font-medium text-foreground`
- Char counts: `text-[10px] font-medium tabular-nums text-muted-foreground/60`
- Section dividers: `border-t border-border/30 pt-6`
- Helper text: `text-[11px] text-muted-foreground/60`

Read `ProductGeneralTab.tsx` fully for the exact business logic (stripHtml, calculateScore calls, modal state, renderFieldActions) and replicate it with only visual changes.

**Step 2: Verify TypeScript compiles**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/tabs/GeneralTabV2.tsx
git commit -m "feat(product-editor): add GeneralTabV2 — Vercel Pro general content tab"
```

---

## Task 5: MediaTabV2

**Files:**
- Create: `my-app/src/features/products/components/edit/tabs/MediaTabV2.tsx`

**Step 1: Create the media tab**

Reuses existing `ProductMediaTab.tsx` logic. Wrap in Vercel Pro card pattern. The media tab uses:
- `ProductImageGallery` component (reuse as-is)
- Form field `images` via `useFormContext`

Structure:
- Vercel Pro card with icon container (Image icon) + title "Media" + desc
- Content: `ProductImageGallery` component (pass through all props)

Read `ProductMediaTab.tsx` fully for the exact imports and props, then wrap in Vercel Pro card.

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/tabs/MediaTabV2.tsx
git commit -m "feat(product-editor): add MediaTabV2 — Vercel Pro media tab"
```

---

## Task 6: VariationsTabV2

**Files:**
- Create: `my-app/src/features/products/components/edit/tabs/VariationsTabV2.tsx`

**Step 1: Create the variations tab**

This is complex. Reuse `ProductVariationsTab.tsx` exactly — just wrap it in Vercel Pro card pattern and adjust typography/badges to match Vercel Pro conventions.

Read `ProductVariationsTab.tsx` fully. It takes props: `productId`, `storeId`, `platformProductId`, `metadataVariants`, `onRegisterSave`. Replicate the same interface.

For the V2 version, wrap the existing content in a Vercel Pro card shell. The internal variation grid/table is complex enough that we should primarily wrap it rather than rebuild every detail.

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/tabs/VariationsTabV2.tsx
git commit -m "feat(product-editor): add VariationsTabV2 — Vercel Pro variations tab"
```

---

## Task 7: SeoTabV2

**Files:**
- Create: `my-app/src/features/products/components/edit/tabs/SeoTabV2.tsx`

**Step 1: Create the SEO tab**

Reuse `ProductSeoTab.tsx` and its sub-components (`seo-tab/ScoreOverview.tsx`, `SerpPreviewSection.tsx`, `SeoFieldEditors.tsx`, `NonTextCriteria.tsx`, `SlugField.tsx`). Wrap the overall tab in Vercel Pro card. Internal sub-components can be reused as-is initially.

Read `my-app/src/features/products/components/edit/seo-tab/ProductSeoTab.tsx` for the exact structure, then create V2 wrapper.

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/tabs/SeoTabV2.tsx
git commit -m "feat(product-editor): add SeoTabV2 — Vercel Pro SEO tab"
```

---

## Task 8: Sidebar Cards V2 — SeoWidgetV2 + PerformanceCardV2

**Files:**
- Create: `my-app/src/features/products/components/edit/sidebar/SeoWidgetV2.tsx`
- Create: `my-app/src/features/products/components/edit/sidebar/PerformanceCardV2.tsx`

**Step 1: SeoWidgetV2**

Reuse `SeoSidebarWidget.tsx` logic. Rebuild visual with:
- Vercel Pro card + dark overlay
- Icon container `h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50`
- Score as KPI: `text-2xl font-semibold tracking-tight tabular-nums`
- Issue counts as info rows: `bg-muted/30 px-3 py-2 rounded-lg`
- "Analyser" button: `h-7 text-[11px] rounded-lg`
- Spinner + label original on loading button

**Step 2: PerformanceCardV2**

Reuse `PerformanceCard.tsx` logic. KPI mini-grid:
- 2x2 grid of KPI values (Revenue, Sales, Rating, Reviews)
- Each: label `text-[11px]` + value `text-lg font-semibold tabular-nums`
- Vercel Pro card shell

**Step 3: Verify TypeScript compiles**

**Step 4: Commit**

```bash
git add my-app/src/features/products/components/edit/sidebar/SeoWidgetV2.tsx my-app/src/features/products/components/edit/sidebar/PerformanceCardV2.tsx
git commit -m "feat(product-editor): add SeoWidgetV2 + PerformanceCardV2 sidebar cards"
```

---

## Task 9: Sidebar Cards V2 — PricingCardV2

**Files:**
- Create: `my-app/src/features/products/components/edit/sidebar/PricingCardV2.tsx`

**Step 1: Create PricingCardV2**

This is the most complex sidebar card. Read `PricingCard.tsx` fully (it's ~300 lines). Rebuild with:
- Vercel Pro card + dark overlay
- Collapsible sections for Stock, Logistics, Tax (using `Collapsible` from shadcn + `ChevronRight` with rotate-90)
- Price inputs: `rounded-lg text-sm` with currency prefix icon
- Switch toggles in hoverable rows: `flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40`
- Field labels: `text-[13px] font-medium`
- Helper text: `text-[11px] text-muted-foreground/60`
- Variable product warning: inline alert `bg-amber-500/5 rounded-lg px-4 py-3`

Same form fields, same `useFormContext` calls, same `useWatch` values.

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/sidebar/PricingCardV2.tsx
git commit -m "feat(product-editor): add PricingCardV2 — collapsible pricing sidebar"
```

---

## Task 10: Sidebar Cards V2 — OrganizationCardV2 + OptionsCardV2

**Files:**
- Create: `my-app/src/features/products/components/edit/sidebar/OrganizationCardV2.tsx`
- Create: `my-app/src/features/products/components/edit/sidebar/OptionsCardV2.tsx`

**Step 1: OrganizationCardV2**

Read `OrganizationCard.tsx` fully. Rebuild with Vercel Pro card. Key elements:
- Product Type select: `rounded-lg text-sm`
- Brand input: `rounded-lg text-sm`
- Status select
- Categories: command palette multi-select (reuse `useChipField` pattern)
- Tags: chip display with add/remove
- Section dividers: `border-t border-border/30`

**Step 2: OptionsCardV2**

Read `ProductOptionsCard.tsx` fully. Rebuild as hoverable rows with Switch:
```
Featured     [switch]
Purchasable  [switch]
Individual   [switch]
Reviews      [switch]
```
Each row: `flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/40`
Label: `text-[13px] font-medium` with icon `h-4 w-4 text-foreground/70`

**Step 3: Verify TypeScript compiles**

**Step 4: Commit**

```bash
git add my-app/src/features/products/components/edit/sidebar/OrganizationCardV2.tsx my-app/src/features/products/components/edit/sidebar/OptionsCardV2.tsx
git commit -m "feat(product-editor): add OrganizationCardV2 + OptionsCardV2 sidebar cards"
```

---

## Task 11: Sidebar Cards V2 — SyncStatusCardV2 + SyncHistoryCardV2

**Files:**
- Create: `my-app/src/features/products/components/edit/sidebar/SyncStatusCardV2.tsx`
- Create: `my-app/src/features/products/components/edit/sidebar/SyncHistoryCardV2.tsx`

**Step 1: SyncStatusCardV2**

Read `SyncStatusCard.tsx` fully. Rebuild with:
- Status dot `h-1.5 w-1.5 rounded-full` (emerald/amber/red)
- Info rows for dirty fields: `bg-muted/30 rounded-lg px-3 py-2`
- Action buttons: revert (danger icon), push (outline h-7)
- AlertDialog for revert confirmation (reuse from V1)

**Step 2: SyncHistoryCardV2**

Read `SyncHistoryCard.tsx` fully. Rebuild with Timeline pattern:
- Dot `h-2 w-2 rounded-full` + vertical line `w-px bg-border/40`
- Event text: `text-[13px] text-foreground`
- Timestamp: `text-[11px] text-muted-foreground/50`

**Step 3: Verify TypeScript compiles**

**Step 4: Commit**

```bash
git add my-app/src/features/products/components/edit/sidebar/SyncStatusCardV2.tsx my-app/src/features/products/components/edit/sidebar/SyncHistoryCardV2.tsx
git commit -m "feat(product-editor): add SyncStatusCardV2 + SyncHistoryCardV2 sidebar cards"
```

---

## Task 12: Sidebar Cards V2 — VersionHistoryCardV2 + LinkedProductsCardV2 + ExternalProductCardV2

**Files:**
- Create: `my-app/src/features/products/components/edit/sidebar/VersionHistoryCardV2.tsx`
- Create: `my-app/src/features/products/components/edit/sidebar/LinkedProductsCardV2.tsx`
- Create: `my-app/src/features/products/components/edit/sidebar/ExternalProductCardV2.tsx`

**Step 1: VersionHistoryCardV2**

Read `ProductVersionHistoryCard.tsx`. Rebuild with hoverable rows:
- Each version: hoverable row with trigger type icon + relative time + restore button (opacity-0 group-hover:opacity-100)
- "Voir tout" link at bottom

**Step 2: LinkedProductsCardV2**

Read `LinkedProductsCard.tsx`. Rebuild with collapsible sections (Upsells, Cross-sells, Related) each with ChevronRight + chip display.

**Step 3: ExternalProductCardV2**

Read `ExternalProductCard.tsx`. Simple Vercel Pro card with 2 form fields (URL + Button Text).

**Step 4: Verify TypeScript compiles**

**Step 5: Commit**

```bash
git add my-app/src/features/products/components/edit/sidebar/VersionHistoryCardV2.tsx my-app/src/features/products/components/edit/sidebar/LinkedProductsCardV2.tsx my-app/src/features/products/components/edit/sidebar/ExternalProductCardV2.tsx
git commit -m "feat(product-editor): add VersionHistoryV2 + LinkedProductsV2 + ExternalProductV2"
```

---

## Task 13: ProductEditorSidebarV2

**Files:**
- Create: `my-app/src/features/products/components/edit/ProductEditorSidebarV2.tsx`

**Step 1: Create sidebar aggregator**

Same logic as `ProductSidebar.tsx` but importing V2 sidebar cards:

```tsx
"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import type { ProductFormValues } from "../../schemas/product-schema";
import { SeoWidgetV2 } from "./sidebar/SeoWidgetV2";
import { SyncHistoryCardV2 } from "./sidebar/SyncHistoryCardV2";
import { VersionHistoryCardV2 } from "./sidebar/VersionHistoryCardV2";
import { PerformanceCardV2 } from "./sidebar/PerformanceCardV2";
import { PricingCardV2 } from "./sidebar/PricingCardV2";
import { OptionsCardV2 } from "./sidebar/OptionsCardV2";
import { ExternalProductCardV2 } from "./sidebar/ExternalProductCardV2";
import { OrganizationCardV2 } from "./sidebar/OrganizationCardV2";
import { LinkedProductsCardV2 } from "./sidebar/LinkedProductsCardV2";

// Same props interface as ProductSidebar
interface ProductSidebarV2Props {
  productId?: string;
  availableCategories?: Array<{ id: string | number; name: string; slug?: string }>;
  isLoadingCategories?: boolean;
  onVersionRestored?: (formData: any) => void;
  isVariableProduct?: boolean;
  variationsCount?: number;
}

export const ProductEditorSidebarV2 = ({
  productId,
  availableCategories = [],
  isLoadingCategories = false,
  onVersionRestored,
  isVariableProduct = false,
  variationsCount = 0,
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
```

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/edit/ProductEditorSidebarV2.tsx
git commit -m "feat(product-editor): add ProductEditorSidebarV2 — aggregates all V2 sidebar cards"
```

---

## Task 14: ProductEditorContainerV2

**Files:**
- Create: `my-app/src/features/products/components/ProductEditorContainerV2.tsx`

**Step 1: Create the orchestrator**

Copy `ProductEditorContainer.tsx` exactly but replace imports:
- `ProductEditorLayout` → `ProductEditorLayoutV2`
- `ProductEditorHeader` → `ProductEditorHeaderV2`
- `ProductSidebar` → `ProductEditorSidebarV2`
- `ProductGeneralTab` → `GeneralTabV2`
- `ProductMediaTab` → `MediaTabV2`
- `ProductVariationsTab` → `VariationsTabV2`
- `ProductSeoTab` → `SeoTabV2`

Add tab state management:
```tsx
const [activeTab, setActiveTab] = useState<ProductTab>("general");
```

Add `ProductEditorTabsV2` above the tab content with `AnimatePresence mode="wait"` for tab switching.

Replace the loading skeleton with Vercel Pro skeleton (exact mirror of final layout).

Replace the error state with Vercel Pro empty state pattern (icon container + title + description + CTA).

All hooks, context, form logic, save handlers — **identical** to V1.

**Step 2: Verify TypeScript compiles**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/ProductEditorContainerV2.tsx
git commit -m "feat(product-editor): add ProductEditorContainerV2 — V2 orchestrator"
```

---

## Task 15: Route Integration + Final Verification

**Files:**
- Modify: `my-app/src/app/app/products/[productId]/edit/page.tsx`

**Step 1: Add V2 toggle**

Read the existing page.tsx. Add a simple conditional to use V2:

```tsx
import { ProductEditorContainer } from "@/features/products/components/ProductEditorContainer";
import { ProductEditorContainerV2 } from "@/features/products/components/ProductEditorContainerV2";

// For now, use V2 by default (can be toggled via query param ?v=1 for fallback)
export default function ProductEditPage({ params, searchParams }: { params: { productId: string }; searchParams: { v?: string } }) {
  const useV1 = searchParams.v === "1";
  const Container = useV1 ? ProductEditorContainer : ProductEditorContainerV2;
  return <Container productId={params.productId} />;
}
```

**Step 2: Build verification**

Run: `cd my-app && npm run build 2>&1 | tail -30`
Expected: Build succeeds with no errors.

**Step 3: Visual verification**

Run: `cd my-app && npm run dev`
Navigate to `/app/products/[any-product-id]/edit` and verify:
- Header is dense, single line
- Tabs render with underline animation
- Cards use Vercel Pro patterns
- Sidebar cards are visible and functional
- Add `?v=1` to URL to verify V1 still works

**Step 4: Final commit**

```bash
git add my-app/src/app/app/products/*/edit/page.tsx
git commit -m "feat(product-editor): integrate V2 editor with route toggle (?v=1 for fallback)"
```

---

## Summary

| Task | Component | Complexity |
|------|-----------|------------|
| 1 | ProductEditorLayoutV2 | Simple |
| 2 | ProductEditorHeaderV2 | Medium |
| 3 | ProductEditorTabsV2 | Simple |
| 4 | GeneralTabV2 | Medium |
| 5 | MediaTabV2 | Simple (wrapper) |
| 6 | VariationsTabV2 | Simple (wrapper) |
| 7 | SeoTabV2 | Simple (wrapper) |
| 8 | SeoWidgetV2 + PerformanceCardV2 | Medium |
| 9 | PricingCardV2 | Complex |
| 10 | OrganizationCardV2 + OptionsCardV2 | Medium |
| 11 | SyncStatusCardV2 + SyncHistoryCardV2 | Medium |
| 12 | VersionHistoryV2 + LinkedProductsV2 + ExternalProductV2 | Medium |
| 13 | ProductEditorSidebarV2 | Simple (aggregator) |
| 14 | ProductEditorContainerV2 | Medium |
| 15 | Route Integration | Simple |

**Total: 15 tasks, ~20 new files**
