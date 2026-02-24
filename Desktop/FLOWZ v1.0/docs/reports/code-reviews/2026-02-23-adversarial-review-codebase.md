# Adversarial Code Review — FLOWZ v1.0 Codebase

**Date:** 2026-02-23
**Scope:** API routes, auth/RLS, data flow, performance
**Reviewer:** Claude Code (flowz-review)

## Summary

| Severity | Count |
|----------|-------|
| HIGH     | 4     |
| MEDIUM   | 8     |
| **Total**| **12**|

## HIGH Severity

### 1. SSRF Bypass via Redirect Following
**Files:** `api/photo-studio/process-job/route.ts`, `api/photo-studio/generate/route.ts`, `api/batch-generation/stream/route.ts`

All `fetchImageFromUrl` implementations use `redirect: "follow"`. Attacker supplies URL that passes hostname validation, then 302-redirects to `http://169.254.169.254/latest/meta-data/`.

**Fix:** Set `redirect: "manual"` and validate each redirect URL. For DNS rebinding, resolve hostname to IP and validate before connecting.

### 2. Unbounded Product Fetch — No Pagination
**File:** `hooks/products/useProducts.ts` (lines 27-55)

`useProducts` fetches ALL products for a store with no `.limit()`. A store with 10,000+ products downloads all rows including heavy JSONB columns.

**Fix:** Add `.range(offset, offset + pageSize)` and use `useInfiniteQuery` or cursor-based pagination. Select only necessary columns for list view.

### 3. IDOR in Batch Generation — No Product Ownership Check
**File:** `api/batch-generation/stream/route.ts` (lines 404-409)

Product fetch only filters by `id`, not by `store_id`. Relies solely on RLS.

**Fix:** Add `.eq('store_id', store_id)` to product fetch query.

### 4. Base64 Images Stored in Database (JSONB)
**File:** `api/photo-studio/process-job/route.ts` (lines 179, 403-409)

Full base64 image data stored in `studio_jobs.output_urls`. 80 images = 400MB+ of base64 in JSONB.

**Fix:** Upload to Supabase Storage, store only URLs.

## MEDIUM Severity

### 5. Auth Check After Data Access in process-job
**File:** `api/photo-studio/process-job/route.ts` (lines 262-288)

Job fetched before user authentication. Reorder: auth first, then fetch.

### 6. Client-Side Product Stats Counting
**File:** `hooks/products/useProducts.ts` (lines 96-128)

Fetches ALL products to count client-side. Use `.select('id', { count: 'exact', head: true })`.

### 7. TipTapEditor XSS via javascript: Links
**File:** `components/editor/TipTapEditor.tsx` (line 198)

`setLink` accepts `javascript:` URLs from user input. Validate URL scheme.

### 8. Token Limit Named DAILY but Queries MONTHLY
**File:** `api/flowriter/stream/route.ts` (lines 152, 168-176)

`DAILY_TOKEN_LIMIT` queries by month. Either rename or fix query timeframe.

### 9. Outline Items Max 300 Enables Prompt Stuffing
**File:** `api/flowriter/stream/route.ts` (line 246)

300 items x 200 chars = 60K chars of user content in prompt. Reduce to 30-50.

### 10. No Ownership Check in useQuickUpdateProduct
**File:** `hooks/products/useProductSave.ts` (lines 554-598)

Blind update by product ID, no tenant_id filter. Add `.eq('tenant_id', user.id)`.

### 11. Client-Side Sequential Job Dispatch
**File:** `features/photo-studio/hooks/useBatchStudioJobs.ts` (lines 54-74)

Batch jobs processed sequentially from browser. Move to server-side or add concurrency.

### 12. No Tenant Scoping on forceRestartSync
**File:** `hooks/sync/useSyncManager.ts` (lines 167-176)

Cancels jobs by `store_id` without `tenant_id` filter. Add `.eq('tenant_id', user.id)`.

## Action Items

- [ ] Fix SSRF redirect following (P0 — security)
- [ ] Add pagination to useProducts (P0 — scalability)
- [ ] Add ownership checks to batch-gen product fetch (P1)
- [ ] Move base64 images to Storage (P1 — cost/perf)
- [ ] Sanitize TipTap link URLs (P1 — XSS)
- [ ] Fix token limit naming/logic (P2)
- [ ] Reduce maxOutlineItems to 50 (P2)
- [ ] Add tenant_id to quick update and sync cancel (P2)
- [ ] Move batch dispatch to server-side (P3)
