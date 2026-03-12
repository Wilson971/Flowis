# Sprint 1 — Critical Technical Debt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 critical technical debt items: IDOR vulnerability, token quota enforcement, stripHtml extraction, product type consolidation, and HTML sanitization in copilot tools.

**Architecture:** Surgical fixes across API routes, shared utilities, and type definitions. No new dependencies needed (DOMPurify already installed via `isomorphic-dompurify`).

**Tech Stack:** Next.js 16, Supabase, TypeScript, isomorphic-dompurify

---

### Task 1: Fix IDOR — Add tenant_id to studio_jobs query in process-batch

**Files:**
- Modify: `my-app/src/app/api/photo-studio/process-batch/route.ts:79-84`

**Step 1: Add tenant_id filter to studio_jobs query**

In `process-batch/route.ts`, line 79-84, the query fetches studio_jobs by `batch_id` only. Add `.eq("tenant_id", user.id)` to prevent cross-tenant access:

```typescript
// BEFORE (line 79-84):
const { data: pendingJobs, error: jobsError } = await supabase
  .from("studio_jobs")
  .select("id")
  .eq("batch_id", batchId)
  .eq("status", "pending")
  .order("created_at", { ascending: true });

// AFTER:
const { data: pendingJobs, error: jobsError } = await supabase
  .from("studio_jobs")
  .select("id")
  .eq("batch_id", batchId)
  .eq("tenant_id", user.id)
  .eq("status", "pending")
  .order("created_at", { ascending: true });
```

**Step 2: Also add tenant_id to batch status update (line 102-105)**

```typescript
// BEFORE:
await supabase
  .from("batch_jobs")
  .update({ status: "processing" })
  .eq("id", batchId);

// AFTER:
await supabase
  .from("batch_jobs")
  .update({ status: "processing" })
  .eq("id", batchId)
  .eq("tenant_id", user.id);
```

**Step 3: Commit**

```bash
git add my-app/src/app/api/photo-studio/process-batch/route.ts
git commit -m "fix(security): add tenant_id filter to studio_jobs query in process-batch

Prevents IDOR vulnerability where a user could process another tenant's batch jobs
by knowing the batchId."
```

---

### Task 2: Implement token quota enforcement in FloWriter

**Files:**
- Modify: `my-app/src/app/api/flowriter/stream/route.ts:139-146`

**Step 1: Replace the no-op `logTokenUsage` with actual DB insert**

The `onComplete` callback at line 675-682 already inserts into `ai_usage`. The issue is that `logTokenUsage()` at line 139-146 is a no-op and never persists. Since `onComplete` handles the real persistence, `logTokenUsage` is dead code. Remove it and add a `MAX_CONTENT_SIZE` guard to prevent unbounded stream accumulation:

```typescript
// REMOVE the empty logTokenUsage function (lines 139-146):
// function logTokenUsage(...) { }

// REPLACE with a max content size constant:
const MAX_CONTENT_SIZE = 500_000; // ~500KB max article size
```

**Step 2: Add content size guard in generateWithRetry (around line 365-366)**

```typescript
if (text) {
  fullContent += text;
  // Guard against unbounded memory growth
  if (fullContent.length > MAX_CONTENT_SIZE) {
    throw new Error('Content size limit exceeded');
  }
  chunkCount++;
```

**Step 3: Remove the dead logTokenUsage call (line 410-414)**

```typescript
// REMOVE these lines:
logTokenUsage(tokenUsage, {
  topic: config.topic,
  targetWordCount: config.targetWordCount,
  timestamp: Date.now(),
});
```

**Step 4: Commit**

```bash
git add my-app/src/app/api/flowriter/stream/route.ts
git commit -m "fix(security): remove dead logTokenUsage, add content size guard

Token tracking already works via onComplete callback inserting into ai_usage table.
Added MAX_CONTENT_SIZE guard to prevent unbounded memory growth during streaming."
```

---

### Task 3: Extract stripHtml to shared utility

**Files:**
- Modify: `my-app/src/lib/utils.ts` (add stripHtml export)
- Modify: 6 files with local `stripHtml` definitions
- Modify: 4 files with inline `.replace(/<[^>]*>/g, '')` patterns

**Step 1: Add stripHtml to lib/utils.ts**

```typescript
// Add after stripMarkdown function:

/**
 * Strip HTML tags from a string, returning plain text.
 * Handles null/undefined safely.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
```

**Step 2: Replace local definitions in each file**

Files with local `function stripHtml` to replace with import:

1. `my-app/src/components/article-editor/WCPreviewCard.tsx:26-28`
   - Remove local `function stripHtml(html: string): string { ... }`
   - Add `import { stripHtml } from '@/lib/utils'`

2. `my-app/src/components/products/ui/AISuggestionModal.tsx:22-28`
   - Remove local `function stripHtml(html: string): string { ... }`
   - Update existing `import { cn } from '@/lib/utils'` to `import { cn, stripHtml } from '@/lib/utils'`

3. `my-app/src/features/products/components/edit/ProductGeneralTab.tsx:57`
   - Remove `const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();`
   - Add/extend import from `@/lib/utils`

4. `my-app/src/features/products/components/edit/ProductVersionHistoryDialog.tsx:92`
   - Remove `function stripHtml(html: string | undefined | null): string { ... }`
   - Add import from `@/lib/utils`

5. `my-app/src/features/products/components/edit/SeoDetailSheet.tsx:151`
   - Remove `const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();`
   - Add/extend import from `@/lib/utils`

6. `my-app/src/features/products/components/edit/tabs/GeneralTabV2.tsx:54`
   - Remove `const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();`
   - Add/extend import from `@/lib/utils`

**Step 3: Replace inline patterns**

Files with inline `.replace(/<[^>]*>/g, '')` to use `stripHtml()`:

7. `my-app/src/components/article-editor/tabs/ArticleSeoPreviewTab.tsx:67`
   - Add `import { stripHtml } from '@/lib/utils'`
   - Replace: `(seoDescription || excerpt || '').replace(/<[^>]*>/g, '').substring(0, 160)`
   - With: `stripHtml(seoDescription || excerpt || '').substring(0, 160)`

8. `my-app/src/components/products/ProductSeoForm.tsx:138`
   - Add `import { stripHtml } from '@/lib/utils'`
   - Replace: `detailedDesc.replace(/<[^>]*>/g, '')`
   - With: `stripHtml(detailedDesc)`

9. `my-app/src/features/products/components/edit/seo-tab/ProductSeoTab.tsx:120,133-134`
   - Add `import { stripHtml } from '@/lib/utils'`
   - Replace 3 inline patterns

**Note:** `my-app/src/lib/seo/analyzer.ts:98` uses `html.replace(/<[^>]*>/g, ' ')` (replaces with space, not empty) — this is intentional for word counting, leave as-is.

**Step 4: Commit**

```bash
git add my-app/src/lib/utils.ts my-app/src/components/article-editor/WCPreviewCard.tsx my-app/src/components/products/ui/AISuggestionModal.tsx my-app/src/features/products/components/edit/ProductGeneralTab.tsx my-app/src/features/products/components/edit/ProductVersionHistoryDialog.tsx my-app/src/features/products/components/edit/SeoDetailSheet.tsx my-app/src/features/products/components/edit/tabs/GeneralTabV2.tsx my-app/src/components/article-editor/tabs/ArticleSeoPreviewTab.tsx my-app/src/components/products/ProductSeoForm.tsx my-app/src/features/products/components/edit/seo-tab/ProductSeoTab.tsx
git commit -m "refactor: extract stripHtml to shared utility in lib/utils

Consolidates 6 local definitions + 4 inline patterns into a single
reusable stripHtml() function. Handles null/undefined safely."
```

---

### Task 4: Consolidate product type files (3 → 2)

**Files:**
- Modify: `my-app/src/types/product-content.ts` (simplify to re-export only)
- Verify: `my-app/src/types/product.ts` (canonical, no changes needed)
- Verify: `my-app/src/types/productContent.ts` (canonical, no changes needed)
- Modify: `my-app/src/hooks/blog/useArticleEditorForm.ts` (update import path)

**Analysis:**
- `productContent.ts` → canonical source for `ContentData`, `SeoData`, `ImageItem`, etc.
- `product.ts` → canonical source for `Product`, `ProductMetadata`, etc. — imports from `productContent.ts`
- `product-content.ts` → re-export bridge file. Only 1 consumer (`useArticleEditorForm.ts`)

**Step 1: Check what useArticleEditorForm imports**

It imports `ArticleCustomFields`, `ArticleSeoData`, `ArticleTaxonomies`, `ArticleAuthor`, `BlogArticleSyncFields` from `@/types/product-content`. These types are ONLY defined in `product-content.ts`.

Since these article-related types have nothing to do with product content, they should be moved to a more appropriate location.

**Step 2: Move article sync types to their own file**

Create `my-app/src/types/article.ts` with the article-specific types from `product-content.ts`:

```typescript
/**
 * WordPress sync metadata types for BlogArticle rows.
 */

export interface ArticleCustomFields {
  id?: number;
  link?: string;
  comment_status?: string;
  ping_status?: string;
  sticky?: boolean;
  format?: string;
  template?: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ alt_text?: string; source_url?: string }>;
    author?: Array<{ id?: number; name?: string }>;
  };
  [key: string]: unknown;
}

export interface ArticleSeoData {
  title?: string;
  description?: string;
  og_image?: string;
  canonical?: string;
  robots?: {
    index?: string;
    follow?: string;
  };
  [key: string]: unknown;
}

export interface ArticleTaxonomies {
  categories?: Array<{ id?: number; name: string; slug?: string }>;
  tags?: Array<{ id?: number; name: string; slug?: string }>;
  [key: string]: unknown;
}

export interface ArticleAuthor {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

export interface BlogArticleSyncFields {
  custom_fields?: ArticleCustomFields;
  seo_data?: ArticleSeoData;
  taxonomies?: ArticleTaxonomies;
  author?: ArticleAuthor;
  featured_image?: string;
  featured_image_alt?: string;
  platform_post_id?: string;
}
```

**Step 3: Update useArticleEditorForm.ts import**

```typescript
// BEFORE:
import { ArticleCustomFields, ArticleSeoData, ArticleTaxonomies, ArticleAuthor, BlogArticleSyncFields } from '@/types/product-content';

// AFTER:
import type { ArticleCustomFields, ArticleSeoData, ArticleTaxonomies, ArticleAuthor, BlogArticleSyncFields } from '@/types/article';
```

**Step 4: Simplify product-content.ts to pure re-exports**

Replace `product-content.ts` with:

```typescript
/**
 * Re-export bridge — prefer importing from '@/types/product' or '@/types/productContent' directly.
 * @deprecated Import from '@/types/product' or '@/types/productContent' instead.
 */

export type { ProductMetadata } from './product';
export type { ContentData, SeoData, ImageItem } from './productContent';

// Article types moved to '@/types/article'
export type {
  ArticleCustomFields,
  ArticleSeoData,
  ArticleTaxonomies,
  ArticleAuthor,
  BlogArticleSyncFields,
} from './article';

export type { ProductMetadata as WooMetadata } from './product';
export type { ContentData as WorkingContent } from './productContent';
export type { SeoData as SeoContent } from './productContent';
export type { ContentData as DraftGeneratedContent } from './productContent';
```

**Step 5: Commit**

```bash
git add my-app/src/types/article.ts my-app/src/types/product-content.ts my-app/src/hooks/blog/useArticleEditorForm.ts
git commit -m "refactor(types): extract article types, simplify product-content bridge

Moves article WordPress sync types to types/article.ts where they belong.
Marks product-content.ts as deprecated re-export bridge."
```

---

### Task 5: Sanitize HTML in copilot update_product_content tool

**Files:**
- Modify: `my-app/src/app/api/copilot/stream/tools.ts:260-280`

**Step 1: Import sanitizeHtml and add validation**

```typescript
// At top of file, add import:
import { sanitizeHtml } from '@/lib/sanitize';
```

**Step 2: Sanitize HTML fields before storing**

In the `update_product_content` tool's `execute` function (around line 277-281), sanitize HTML fields:

```typescript
// BEFORE:
if (fields.short_description !== undefined) { updatedWc.short_description = fields.short_description; changedFields.push("short_description"); }
if (fields.description !== undefined) { updatedWc.description = fields.description; changedFields.push("description"); }

// AFTER:
if (fields.short_description !== undefined) { updatedWc.short_description = sanitizeHtml(fields.short_description); changedFields.push("short_description"); }
if (fields.description !== undefined) { updatedWc.description = sanitizeHtml(fields.description); changedFields.push("description"); }
```

Non-HTML fields (title, seo_title, meta_description) should be stripped of all HTML:

```typescript
// Add import at top:
import { stripHtml } from '@/lib/utils';

// BEFORE:
if (fields.title !== undefined) { updatedWc.title = fields.title; changedFields.push("title"); }
if (fields.seo_title !== undefined) { updatedWc.seo_title = fields.seo_title; changedFields.push("seo_title"); }
if (fields.meta_description !== undefined) { updatedWc.meta_description = fields.meta_description; changedFields.push("meta_description"); }

// AFTER:
if (fields.title !== undefined) { updatedWc.title = stripHtml(fields.title); changedFields.push("title"); }
if (fields.seo_title !== undefined) { updatedWc.seo_title = stripHtml(fields.seo_title); changedFields.push("seo_title"); }
if (fields.meta_description !== undefined) { updatedWc.meta_description = stripHtml(fields.meta_description); changedFields.push("meta_description"); }
```

Also update the top-level title update:

```typescript
// BEFORE:
if (fields.title !== undefined) {
  updatePayload.title = fields.title;
}

// AFTER:
if (fields.title !== undefined) {
  updatePayload.title = stripHtml(fields.title);
}
```

**Step 3: Also fix SSRF IPv6 gaps while we're on security**

In `my-app/src/lib/ssrf.ts`, add missing IPv6-mapped IPv4 patterns to `BLOCKED_IP_PATTERNS`:

```typescript
// ADD after /^fd/i:
/^::ffff:127\./i,           // IPv6-mapped IPv4 loopback
/^::ffff:10\./i,            // IPv6-mapped private 10.x
/^::ffff:172\.(1[6-9]|2[0-9]|3[01])\./i, // IPv6-mapped private 172.16-31.x
/^::ffff:192\.168\./i,      // IPv6-mapped private 192.168.x
/^::ffff:169\.254\./i,      // IPv6-mapped link-local
/^2001:db8:/i,              // Documentation prefix
```

**Step 4: Commit**

```bash
git add my-app/src/app/api/copilot/stream/tools.ts my-app/src/lib/ssrf.ts
git commit -m "fix(security): sanitize HTML in copilot tools, complete SSRF IPv6 blocking

- Sanitize HTML fields (description, short_description) with DOMPurify
- Strip HTML from plain-text fields (title, seo_title, meta_description)
- Add IPv6-mapped IPv4 private ranges to SSRF blocklist"
```

---

## Summary

| Task | Type | Impact | Files Modified |
|------|------|--------|----------------|
| 1. IDOR fix | Security | CRITICAL | 1 |
| 2. Token quota + memory guard | Security | CRITICAL | 1 |
| 3. Extract stripHtml | Debt | HIGH | 10 |
| 4. Consolidate types | Debt | HIGH | 3 (+ 1 new) |
| 5. HTML sanitization + SSRF | Security | HIGH | 2 |

**Total:** 17 file modifications, 1 new file
