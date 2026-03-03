# Generation Manifest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `generation_manifest` column to track AI generation decisions (improved vs validated) per field, with UX badges in editor and enriched tooltips in product list.

**Architecture:** New JSONB column `generation_manifest` on `products` table. The batch-generation API builds the manifest during generation and writes it atomically with the draft. Frontend reads it via existing `useProductContent` hook and displays "✓ IA" badges for validated fields (24h expiry) and enriched tooltips in the product list.

**Tech Stack:** Supabase (PostgreSQL migration), TypeScript types, Next.js API route, React components (shadcn/ui Badge + Tooltip), TanStack Query.

---

### Task 1: DB Migration — Add `generation_manifest` column

**Files:**
- Create: `supabase/migrations/20260303000001_add_generation_manifest.sql`

**Step 1: Create the migration file**

```sql
-- Add generation_manifest column to products table
-- Stores AI generation decisions per field: improved vs validated
ALTER TABLE products ADD COLUMN IF NOT EXISTS generation_manifest jsonb DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN products.generation_manifest IS 'Tracks AI generation decisions per field. Shape: { batch_job_id, generated_at, fields: { [field]: { status: improved|validated } } }';
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: Migration applied successfully.

**Step 3: Commit**

```bash
git add supabase/migrations/20260303000001_add_generation_manifest.sql
git commit -m "feat(db): add generation_manifest column to products table"
```

---

### Task 2: TypeScript Types

**Files:**
- Modify: `my-app/src/types/productContent.ts` (after line 156)
- Modify: `my-app/src/types/product.ts` (after line 275)
- Modify: `my-app/src/components/products/table/types.ts` (after line 19)

**Step 1: Add GenerationManifest types to productContent.ts**

After the `ProductContentBuffer` interface (line 156), add:

```typescript
/**
 * Tracks AI generation decisions per field.
 * Written by batch-generation API, read by editor UI.
 */
export interface GenerationManifestField {
    status: 'improved' | 'validated';
}

export interface GenerationManifest {
    batch_job_id: string;
    generated_at: string; // ISO 8601
    fields: Record<string, GenerationManifestField>;
}
```

Add `generation_manifest` to `ProductContentBuffer`:

```typescript
// In ProductContentBuffer, after dirty_fields_content:
generation_manifest?: GenerationManifest | null;
```

**Step 2: Add to Product type in product.ts**

After line 275 (`draft_generated_content`), add:

```typescript
generation_manifest?: GenerationManifest | null;
```

Add the import at the top of product.ts:

```typescript
import type { GenerationManifest } from './productContent';
```

**Step 3: Add to table types.ts**

After line 19 (`draft_generated_content?: any;`), add:

```typescript
generation_manifest?: any;
```

**Step 4: Commit**

```bash
git add my-app/src/types/productContent.ts my-app/src/types/product.ts my-app/src/components/products/table/types.ts
git commit -m "feat(types): add GenerationManifest type definitions"
```

---

### Task 3: Data Fetching — useProductContent + useProducts

**Files:**
- Modify: `my-app/src/hooks/products/useProductContent.ts:93-123`
- Modify: `my-app/src/hooks/products/useProducts.ts:26`

**Step 1: Add generation_manifest to useProductContent SELECT**

In `useProductContent` (line 95-105), add `generation_manifest` to the SELECT:

```typescript
const { data, error } = await supabase
    .from('products')
    .select(`
        id,
        store_snapshot_content,
        working_content,
        draft_generated_content,
        generation_manifest,
        dirty_fields_content,
        store_content_updated_at,
        working_content_updated_at,
        platform,
        content_version
    `)
```

In the return object (line 111-123), add after `draft_generated_content`:

```typescript
generation_manifest: data.generation_manifest as GenerationManifest | null,
```

Add the import at the top:

```typescript
import type { GenerationManifest } from '@/types/productContent';
```

Also add `generation_manifest` to `ProductContentData` interface (which is defined locally in this file or inferred — check and add if needed).

**Step 2: Add to useProducts LIST_COLUMNS**

In `useProducts.ts` line 26, append `, generation_manifest` to LIST_COLUMNS:

```typescript
const LIST_COLUMNS = 'id, title, platform_product_id, image_url, ai_enhanced, dirty_fields_content, last_synced_at, stock, stock_status, manage_stock, store_id, imported_at, updated_at, status, platform, tenant_id, price, regular_price, sale_price, product_type, metadata, draft_generated_content, generation_manifest';
```

**Step 3: Commit**

```bash
git add my-app/src/hooks/products/useProductContent.ts my-app/src/hooks/products/useProducts.ts
git commit -m "feat(data): add generation_manifest to product queries"
```

---

### Task 4: API — Build and write manifest in batch-generation

**Files:**
- Modify: `my-app/src/app/api/batch-generation/stream/route.ts`

This is the core change. The manifest must be built **before** the filtering step and written atomically with the draft.

**Step 1: Add manifest type import and declare manifest before the field generation loop**

Near the top of the per-product processing (around line 486, after `const draft: Record<string, any> = {};`), add:

```typescript
const manifest: {
    batch_job_id: string;
    generated_at: string;
    fields: Record<string, { status: 'improved' | 'validated' }>;
} = {
    batch_job_id: batchJob.id,
    generated_at: new Date().toISOString(),
    fields: {},
};
```

**Step 2: Populate manifest during the filtering step**

Replace the existing filter block (lines 598-634) with a version that builds the manifest:

```typescript
// ── Build manifest + filter identical fields from draft ──
const working = (product.working_content || {}) as WorkingJsonb;
const normalizeStr = (v: unknown): string =>
    (typeof v === 'string' ? v.trim() : '') || '';

// Simple text fields
for (const key of ['title', 'short_description', 'description', 'sku'] as const) {
    if (key in draft) {
        if (normalizeStr(draft[key]) === normalizeStr(working[key])) {
            manifest.fields[key] = { status: 'validated' };
            delete draft[key];
        } else {
            manifest.fields[key] = { status: 'improved' };
        }
    }
}

// SEO fields
if (draft.seo) {
    const wSeo = working.seo || {};
    if (draft.seo.title) {
        if (normalizeStr(draft.seo.title) === normalizeStr(wSeo.title)) {
            manifest.fields['seo_title'] = { status: 'validated' };
            delete draft.seo.title;
        } else {
            manifest.fields['seo_title'] = { status: 'improved' };
        }
    }
    if (draft.seo.description) {
        if (normalizeStr(draft.seo.description) === normalizeStr(wSeo.description)) {
            manifest.fields['meta_description'] = { status: 'validated' };
            delete draft.seo.description;
        } else {
            manifest.fields['meta_description'] = { status: 'improved' };
        }
    }
    if (!draft.seo.title && !draft.seo.description) {
        delete draft.seo;
    }
}

// Images (alt text)
if (draft.images && Array.isArray(draft.images)) {
    const wImages = working.images || [];
    const originalLength = draft.images.length;
    draft.images = draft.images.filter((draftImg, idx) => {
        const wImg = wImages[idx] || wImages.find((wi) => wi.id === draftImg.id);
        return normalizeStr(draftImg.alt) !== normalizeStr(wImg?.alt);
    });
    if (originalLength > 0) {
        manifest.fields['alt_text'] = {
            status: draft.images.length > 0 ? 'improved' : 'validated',
        };
    }
    if (draft.images.length === 0) delete draft.images;
}
```

**Step 3: Write manifest in the DB update**

In the Supabase update call (currently writing `finalDraft`), add `generation_manifest`:

```typescript
await supabase
    .from('products')
    .update({
        draft_generated_content: finalDraft,
        generation_manifest: manifest,
        seo_score: seoScore,
    })
    .eq('id', productId)
    .eq('tenant_id', user.id);
```

**Step 4: Keep the stale cleanup for mergedDraft** (lines 647-670)

This stays as-is — it cleans up old draft fields that match working after merging with existing draft. No changes needed.

**Step 5: Commit**

```bash
git add my-app/src/app/api/batch-generation/stream/route.ts
git commit -m "feat(api): build generation manifest during batch generation"
```

---

### Task 5: Context — Expose manifest in ProductEditContext

**Files:**
- Modify: `my-app/src/features/products/context/ProductEditContext.tsx`
- Modify: `my-app/src/features/products/components/ProductEditorContainerV2.tsx`
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

**Step 1: Add manifest to ProductEditContextType**

In `ProductEditContext.tsx`, add import:

```typescript
import type { GenerationManifest } from '@/types/productContent';
```

Add to `ProductEditContextType` after `remainingProposals` (line 68):

```typescript
generationManifest?: GenerationManifest | null;
```

**Step 2: Pass manifest in ProductEditorContainerV2**

In `ProductEditorContainerV2.tsx`, after `remainingProposals` in the context value (around line 269):

```typescript
generationManifest: contentBuffer?.generation_manifest ?? null,
```

Add it to the `useMemo` deps array too (line 281).

**Step 3: Same for ProductEditorContainer (V1)**

Mirror the same change in `ProductEditorContainer.tsx`.

**Step 4: Commit**

```bash
git add my-app/src/features/products/context/ProductEditContext.tsx my-app/src/features/products/components/ProductEditorContainerV2.tsx my-app/src/features/products/components/ProductEditorContainer.tsx
git commit -m "feat(context): expose generationManifest in ProductEditContext"
```

---

### Task 6: FieldStatusBadge — Add "validated" state

**Files:**
- Modify: `my-app/src/components/products/FieldStatusBadge.tsx`

**Step 1: Add `isValidated` prop and render validated badge**

```typescript
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, AlertTriangle, Pencil, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FieldStatusBadgeProps {
    hasDraft?: boolean;
    isValidated?: boolean;
    isSynced?: boolean;
    isDirty?: boolean;
    hasConflict?: boolean;
    tooltip?: string;
    className?: string;
}

export const FieldStatusBadge = ({
    hasDraft,
    isValidated,
    isSynced,
    isDirty,
    hasConflict,
    tooltip,
    className
}: FieldStatusBadgeProps) => {
    // 1. Priorité aux conflits
    if (hasConflict) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="destructive" className={`h-5 gap-1 px-1.5 ${className}`}>
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">Conflit</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Des modifications concurrentes ont été détectées"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // 2. Draft AI (Priorité sur Validated)
    if (hasDraft) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className={`h-5 gap-1 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 ${className}`}>
                            <Sparkles className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">IA v2</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Une proposition IA est disponible pour ce champ"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // 2b. Validated by AI (no change needed)
    if (isValidated) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className={`h-5 gap-1 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 ${className}`}>
                            <Check className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">✓ IA</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Validé par l'IA · Ce champ est déjà optimal. Aucune modification requise."}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // 3. Dirty (modifications locales non synchronisées)
    if (isDirty) {
        // ... existing code unchanged
    }

    // 4. Synced
    if (isSynced) {
        // ... existing code unchanged
    }

    return null;
};
```

**Step 2: Commit**

```bash
git add my-app/src/components/products/FieldStatusBadge.tsx
git commit -m "feat(ui): add validated-by-AI state to FieldStatusBadge"
```

---

### Task 7: Manifest helpers + isValidated in editor components

**Files:**
- Modify: `my-app/src/lib/productHelpers.ts`
- Modify: `my-app/src/features/products/components/edit/sidebar/PricingCardV2.tsx`
- Modify: `my-app/src/features/products/components/edit/tabs/GeneralTabV2.tsx`
- Modify: `my-app/src/features/products/components/edit/seo-tab/ProductSeoTab.tsx`
- Modify: `my-app/src/features/products/components/edit/tabs/MediaTabV2.tsx`
- Modify: V1 equivalents of the above (PricingCard, ProductGeneralTab, ProductMediaTab)

**Step 1: Add manifest helper to productHelpers.ts**

After `getGeneratedFieldsTooltip` (line 264), add:

```typescript
/**
 * Checks if a field was validated by AI and the manifest hasn't expired (24h).
 * Maps editor field names to manifest field keys.
 */
const EDITOR_TO_MANIFEST_KEY: Record<string, string> = {
    'title': 'title',
    'short_description': 'short_description',
    'description': 'description',
    'sku': 'sku',
    'seo.title': 'seo_title',
    'seo.description': 'meta_description',
    'meta_title': 'seo_title',
    'meta_description': 'meta_description',
    'images': 'alt_text',
};

export function isFieldValidatedByAI(
    manifest: GenerationManifest | null | undefined,
    field: string
): boolean {
    if (!manifest?.fields || !manifest.generated_at) return false;

    // 24h expiry
    const generatedAt = new Date(manifest.generated_at).getTime();
    if (Date.now() - generatedAt > 24 * 60 * 60 * 1000) return false;

    const manifestKey = EDITOR_TO_MANIFEST_KEY[field] || field;
    return manifest.fields[manifestKey]?.status === 'validated';
}
```

Add import at top of file:

```typescript
import type { GenerationManifest } from '@/types/productContent';
```

**Step 2: Update getGeneratedFieldsTooltip to include manifest info**

Replace `getGeneratedFieldsTooltip`:

```typescript
export function getGeneratedFieldsTooltip(
    draftContent: ContentData | null | undefined,
    workingContent: ContentData | null | undefined,
    manifest?: GenerationManifest | null
): string {
    const improved = getRemainingProposals(draftContent, workingContent);

    // Get validated fields from manifest (if not expired)
    const validated: string[] = [];
    if (manifest?.fields && manifest.generated_at) {
        const generatedAt = new Date(manifest.generated_at).getTime();
        const isExpired = Date.now() - generatedAt > 24 * 60 * 60 * 1000;
        if (!isExpired) {
            for (const [key, value] of Object.entries(manifest.fields)) {
                if (value.status === 'validated') {
                    // Map manifest keys back to display labels
                    const displayKey = key === 'seo_title' ? 'seo.title'
                        : key === 'meta_description' ? 'seo.description'
                        : key === 'alt_text' ? 'images'
                        : key;
                    validated.push(displayKey);
                }
            }
        }
    }

    if (improved.length === 0 && validated.length === 0) return '';

    const parts: string[] = [];
    for (const field of improved) {
        parts.push(`✨ ${getFieldLabel(field)} (amélioré)`);
    }
    for (const field of validated) {
        parts.push(`✓ ${getFieldLabel(field)} (validé)`);
    }

    return `Champs analysés :\n${parts.join('\n')}`;
}
```

**Step 3: Wire `isValidated` into PricingCardV2 (SKU)**

In `PricingCardV2.tsx`, add:

```typescript
const { dirtyFieldsData, remainingProposals, draftActions, contentBuffer, generationManifest } = useProductEditContext();
```

Add import:

```typescript
import { isFieldValidatedByAI } from "@/lib/productHelpers";
```

Add helper:

```typescript
const isValidated = (field: string) => isFieldValidatedByAI(generationManifest, field);
```

Update the FieldStatusBadge for SKU:

```tsx
<FieldStatusBadge hasDraft={hasDraft("sku")} isValidated={isValidated("sku")} isDirty={isDirty("sku")} />
```

**Step 4: Wire into GeneralTabV2 (title, short_description, description)**

Same pattern — add `generationManifest` from context, `isValidated` helper, pass `isValidated={isValidated(field)}` to each FieldStatusBadge.

**Step 5: Wire into ProductSeoTab (seo.title, seo.description)**

Same pattern with `isValidated("seo.title")` and `isValidated("seo.description")`.

**Step 6: Wire into MediaTabV2 (images/alt_text)**

Same pattern with `isValidated("images")`.

**Step 7: Mirror all changes in V1 components** (PricingCard, ProductGeneralTab, ProductMediaTab)

**Step 8: Commit**

```bash
git add my-app/src/lib/productHelpers.ts my-app/src/features/products/components/edit/sidebar/PricingCardV2.tsx my-app/src/features/products/components/edit/tabs/GeneralTabV2.tsx my-app/src/features/products/components/edit/seo-tab/ProductSeoTab.tsx my-app/src/features/products/components/edit/tabs/MediaTabV2.tsx my-app/src/features/products/components/edit/PricingCard.tsx my-app/src/features/products/components/edit/ProductGeneralTab.tsx my-app/src/features/products/components/edit/ProductMediaTab.tsx
git commit -m "feat(ui): show validated-by-AI badges in product editor fields"
```

---

### Task 8: Product List — Enriched tooltip with manifest

**Files:**
- Modify: `my-app/src/components/products/table/ProductRowActionsV2.tsx`
- Modify: `my-app/src/components/products/table/ProductRowActions.tsx`

**Step 1: Pass manifest to getGeneratedFieldsTooltip in ProductRowActionsV2**

Update the tooltip call (line 56-59):

```typescript
const generatedFieldsTooltip = getGeneratedFieldsTooltip(
    product.draft_generated_content,
    product.working_content,
    product.generation_manifest
);
```

**Step 2: Same for ProductRowActions (V1)**

Mirror the change.

**Step 3: Commit**

```bash
git add my-app/src/components/products/table/ProductRowActionsV2.tsx my-app/src/components/products/table/ProductRowActions.tsx
git commit -m "feat(ui): enriched tooltip with validated/improved field status"
```

---

### Task 9: Revert earlier SKU prompt hack

**Files:**
- Modify: `my-app/src/lib/ai/product-prompts.ts`

The `buildSkuPrompt` was modified earlier to force different SKU generation. With the manifest, this is no longer needed — we can keep the original prompt that shows the current SKU and let the AI decide. If it validates the existing SKU, the manifest will show "✓ IA" instead of nothing.

**Step 1: Revert to clean SKU prompt**

```typescript
export function buildSkuPrompt(
    product: ProductContext,
    settings: ModularGenerationSettings
): string {
    const format = settings.sku_format || {
        pattern: 'product_name_based',
        separator: '-',
        max_length: 12,
    };

    const patternDesc = {
        category_based: `Basé sur la catégorie + identifiant unique. Ex: ELEC-TV-001`,
        product_name_based: `Basé sur le nom du produit abrégé. Ex: TISS-CIEL-BLC`,
        custom: `Code alphanumérique unique aléatoire. Ex: PRD-X8K2M`,
    };

    return `Génère un SKU (Stock Keeping Unit) pour ce produit.

NOM: "${product.title}"
${product.categories?.length ? `CATÉGORIE: ${product.categories[0]}` : ''}
${product.sku ? `SKU ACTUEL: ${product.sku}` : ''}

RÈGLES:
- Pattern: ${patternDesc[format.pattern]}
- Séparateur: "${format.separator}"
- Longueur max: ${format.max_length} caractères
${format.prefix ? `- Préfixe obligatoire: "${format.prefix}"` : ''}
- Majuscules uniquement
- Pas d'espaces, pas de caractères spéciaux sauf le séparateur
- Doit être unique et mémorisable

Réponds UNIQUEMENT avec le SKU, sans explication.`;
}
```

**Step 2: Commit**

```bash
git add my-app/src/lib/ai/product-prompts.ts
git commit -m "refactor: revert SKU prompt to original (manifest handles validated state)"
```

---

### Task 10: Type-check + manual verification

**Step 1: Run TypeScript check**

Run: `cd my-app && npx tsc --noEmit`
Expected: No errors.

**Step 2: Run dev server and test**

Run: `npm run dev`

Manual test flow:
1. Go to product list, select a product with existing good SKU
2. Launch batch generation with SKU + Description checked
3. Wait for completion
4. Check tooltip on product row — should show "✨ Description (amélioré)" and "✓ SKU (validé)"
5. Open product editor
6. Check SKU field — should show green "✓ IA" badge with tooltip
7. Check Description field — should show purple "IA V2" badge + "Voir la suggestion" button
8. Wait 24h (or temporarily change the expiry to 1 minute to test) — validated badges should disappear

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: generation manifest — track AI decisions per field with validated/improved status"
```
