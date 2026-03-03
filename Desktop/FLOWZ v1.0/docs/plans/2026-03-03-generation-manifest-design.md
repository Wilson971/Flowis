# Generation Manifest — Design Document

**Date**: 2026-03-03
**Status**: Approved
**Approach**: B — Separate DB column `generation_manifest`

## Problem

After batch AI generation, `draft_generated_content` only stores fields where the AI produced a **different** value. Fields where the AI analyzed the content and confirmed it's already optimal are silently dropped. This creates confusion:

- Tooltip in product list says "SKU generated" but editor shows no suggestion
- User doesn't know if the AI skipped a field or validated it
- No feedback for fields that are already good

## Solution

Add a `generation_manifest` JSONB column to the `products` table that tracks the AI's **decision** per field, separate from the content itself.

## Schema

### DB Migration

```sql
ALTER TABLE products ADD COLUMN generation_manifest jsonb DEFAULT NULL;
```

### TypeScript Type

```typescript
interface GenerationManifestField {
  status: 'improved' | 'validated';
}

interface GenerationManifest {
  batch_job_id: string;
  generated_at: string; // ISO 8601
  fields: Record<string, GenerationManifestField>;
}
```

Field keys: `title`, `short_description`, `description`, `sku`, `seo_title`, `meta_description`, `alt_text`.

## API Changes

### batch-generation/stream/route.ts

After generating each field for a product:

1. Compare generated value vs `working_content`
2. If **different** → `draft[field] = generated`, manifest field = `improved`
3. If **identical** → no draft write, manifest field = `validated`
4. Write both `draft_generated_content` and `generation_manifest` atomically

## Data Fetching

### useProductContent.ts

- Add `generation_manifest` to the SELECT query
- Return it in `ProductContentData`

### ProductContentBuffer type

- Add `generation_manifest?: GenerationManifest | null`

## Context

### ProductEditContext

- Expose `generation_manifest` from content buffer
- New helper: `getFieldManifestStatus(field): 'improved' | 'validated' | null`

## UX — Editor

### FieldStatusBadge (extended)

| State | Condition | Render |
|-------|-----------|--------|
| draft (improved) | `hasDraft(field)` = true | Purple badge "IA V2" + "Voir la suggestion" button |
| validated | manifest.fields[field].status === 'validated' && <24h | Green badge "✓ IA" + tooltip |
| dirty | field modified vs snapshot | Orange badge "Modifié" |
| none | — | Nothing |

### Validated Tooltip

On hover over "✓ IA" badge:
> Validé par l'IA · Ce champ est déjà optimal. Aucune modification requise.

### Expiration

Validated badges disappear after 24h (client-side check: `generated_at` + 24h < `Date.now()`).

## UX — Product List

### Tooltip (getGeneratedFieldsTooltip)

Enriched with manifest data:

```
Champs générés :
✨ Description (améliorée)
✨ Titre SEO (amélioré)
✨ Méta-description (améliorée)
✓ SKU (validé)
✓ Alt images (validé)
```

## Lifecycle

- **Created**: by batch-generation API on each product completion
- **Replaced**: a new batch overwrites the previous manifest
- **Expiration**: "validated" badges hidden client-side after 24h
- **Cleanup**: manifest set to null when all improved fields are accepted/rejected AND >24h

## Files Impacted

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_generation_manifest.sql` | Add column |
| `my-app/src/types/productContent.ts` | New `GenerationManifest` type |
| `my-app/src/types/product.ts` | Add `generation_manifest` to Product |
| `my-app/src/components/products/table/types.ts` | Add `generation_manifest` |
| `my-app/src/hooks/products/useProductContent.ts` | Add to SELECT + return type |
| `my-app/src/app/api/batch-generation/stream/route.ts` | Build + write manifest |
| `my-app/src/lib/productHelpers.ts` | Enrich tooltip with manifest |
| `my-app/src/features/products/context/ProductEditContext.tsx` | Expose manifest |
| `my-app/src/features/products/components/ProductEditorContainerV2.tsx` | Pass manifest |
| `my-app/src/features/products/components/ProductEditorContainer.tsx` | Pass manifest (V1) |
| `my-app/src/components/products/ui/FieldStatusBadge.tsx` | Add "validated" state |
| `my-app/src/components/products/table/ProductRowActionsV2.tsx` | Pass manifest to tooltip |
| `my-app/src/components/products/table/ProductRowActions.tsx` | Pass manifest to tooltip (V1) |
