# Adversarial Code Review — Full Codebase
**Date:** 2026-02-24
**Scope:** Entire FLOWZ v1.0 codebase
**Type:** Deep review (Security, Performance, Quality, Architecture)
**Reviewer:** Claude Code (flowz-review agent)

## Dashboard

| Axe | CRITICAL | HIGH | MEDIUM | LOW | Total |
|-----|----------|------|--------|-----|-------|
| Sécurité | 4 | 5 | 3 | 0 | **12** |
| Performance | 2 | 4 | 7 | 2 | **15** |
| Qualité | 1 | 5 | 12 | 5 | **23** |
| Architecture | 0 | 3 | 8 | 0 | **11** |
| **Total** | **7** | **17** | **30** | **7** | **61** |

---

## CRITICAL (7) — Blocker avant production

### C1: SSRF Bypass via Redirect Chains
- **Severity:** CRITICAL
- **File:** `my-app/src/lib/ssrf.ts:75-79`
- **Description:** SSRF protection uses `redirect: 'error'` but doesn't validate resolved IPs. DNS rebinding and redirect chains can reach internal services (cloud metadata endpoints).
- **Attack Vector:** User provides URL → attacker server redirects → `http://169.254.169.254/` (AWS metadata)
- **Fix:** Implement DNS validation with private IP blocking after resolution
- **Status:** 🟢 FIXED (2026-02-24) — Added DNS resolution validation with private IP blocking (`node:dns/promises`). Validates both IPv4 and IPv6 resolved addresses against blocked ranges.

### C2: Missing Rate Limiting on AI Endpoints
- **Severity:** CRITICAL
- **Files:**
  - `my-app/src/app/api/flowriter/stream/route.ts`
  - `my-app/src/app/api/batch-generation/stream/route.ts`
  - `my-app/src/app/api/photo-studio/generate/route.ts`
  - `my-app/src/app/api/seo/suggest/route.ts`
- **Description:** No per-request rate limiting. Authenticated user can spam AI endpoints, exhausting Google API quota and causing unexpected billing.
- **Fix:** Created `my-app/src/lib/rate-limit.ts` — in-memory sliding window rate limiter. Added to all 4 endpoints with per-endpoint configs (FloWriter: 5/min, Batch: 2/min, Photo Studio: 10/min, SEO: 20/min). Returns 429 + Retry-After header.
- **Status:** 🟢 FIXED (2026-02-24)

### C3: Tenant Isolation Race Condition (IDOR)
- **Severity:** CRITICAL
- **File:** `my-app/src/app/api/batch-generation/stream/route.ts:357-362`
- **Description:** Product fetch in batch loop checks `store_id` but NOT `tenant_id`. Attacker can reference other tenants' product IDs.
- **Fix:** Added `.eq('tenant_id', user.id)` to product fetch query in batch loop.
- **Status:** 🟢 FIXED (2026-02-24)

### C4: Overly Permissive CORS
- **Severity:** CRITICAL → MEDIUM (reassessed)
- **File:** `supabase/functions/push-to-store/index.ts:40-46`
- **Description:** CORS restricted to specific domains but relies on browser enforcement. Direct API calls bypass CORS entirely.
- **Assessment:** Already mitigated — JWT Authorization header is validated server-side via `authClient.auth.getUser()` at line 392. CORS is defense-in-depth only.
- **Status:** 🟢 ALREADY MITIGATED (verified 2026-02-24)

### C5: SSE Heartbeat Memory Leak
- **Severity:** CRITICAL
- **Files:** `my-app/src/app/api/flowriter/stream/route.ts`, `my-app/src/app/api/batch-generation/stream/route.ts`
- **Description:** `setInterval()` for heartbeat may not be cleared if stream crashes before `finally` block. Interval continues running, leaking memory.
- **Fix:** Added immediate `clearInterval()` in `sendEvent()` catch block when stream write fails. Both flowriter and batch-generation routes patched.
- **Status:** 🟢 FIXED (2026-02-24)

### C6: OOM via Unbounded Batch Image Fetching
- **Severity:** CRITICAL
- **File:** `my-app/src/app/api/batch-generation/stream/route.ts`
- **Description:** Each product in batch can fetch 10MB image. 100 products = 1GB in memory. No total batch size limit, no deduplication, no concurrent fetch limit.
- **Fix:** Added: image dedup cache (Map), 50MB total budget (`MAX_BATCH_IMAGE_BUDGET`), reduced per-image limit to 5MB, max 100 products per batch (`MAX_PRODUCTS_PER_BATCH`). All 3 fetch call sites use `fetchImageWithBudget()`.
- **Status:** 🟢 FIXED (2026-02-24)

### C7: SSRF Surface — fetchImageSafe Without DB Source Check
- **Severity:** CRITICAL
- **File:** `my-app/src/app/api/batch-generation/stream/route.ts`
- **Description:** `fetchImageSafe()` fetches user-supplied URLs without verifying they originate from database product records.
- **Fix:** Images are now fetched only from `product.image_url` and `product.metadata.images[]` — data that comes from the DB, not user input. Combined with C3 fix (tenant_id check), product data is guaranteed to belong to the authenticated user. Additionally, SSRF DNS validation (C1) provides defense-in-depth.
- **Status:** 🟢 FIXED (2026-02-24)

---

## HIGH (17)

### Security (5)

#### H1: UUID IDOR in GSC
- **File:** `my-app/src/app/api/gsc/indexation/inspect/route.ts:18`
- **Description:** siteId UUID validated for format but not ownership
- **Assessment:** Already mitigated — `getGscTokensForSite()` validates ownership, and all subsequent queries use `.eq('tenant_id', user.id)` (lines 46, 87, 97, 115, 174)
- **Status:** 🟢 ALREADY MITIGATED (verified 2026-02-24)

#### H2: Sensitive Error Information Disclosure
- **Files:** `api/seo/suggest:174`, `api/flowriter/stream:701`, `api/gsc/oauth/callback:196`
- **Description:** Raw AI responses and error details exposed to client
- **Fix:** Removed `raw` field from seo/suggest response. Removed `details` field from flowriter error. Sanitized GSC callback error to generic codes only.
- **Status:** 🟢 FIXED (2026-02-24)

#### H3: Base64 Credentials in Transit
- **File:** `my-app/src/app/api/stores/test-connection/route.ts:58`
- **Description:** Credentials base64-encoded in-memory for HTTP Basic Auth
- **Assessment:** Credentials are used in-memory only for the fetch call, never stored or logged. The console.error at line 135 only logs `err.message`, not credentials. Acceptable risk.
- **Status:** 🟡 ACCEPTED RISK (verified 2026-02-24)

#### H4: CSRF State Token Race Condition
- **File:** `my-app/src/app/api/gsc/oauth/callback/route.ts:44-63`
- **Description:** State token read-then-delete was vulnerable to race conditions (TOCTOU)
- **Fix:** Replaced with atomic `DELETE ... RETURNING` — state is deleted and returned in a single operation, guaranteeing one-time use.
- **Status:** 🟢 FIXED (2026-02-24)

#### H5: Unbounded Image Fetching (batch level)
- **File:** `my-app/src/app/api/batch-generation/stream/route.ts`
- **Description:** No total batch image size limit
- **Fix:** Covered by C6 fix — 50MB budget, dedup cache, 5MB/image limit
- **Status:** 🟢 FIXED (2026-02-24, via C6)

### Performance (4)

#### H6: Aggressive Polling Without Tab Visibility Check
- **Files:** `useStudioJobs.ts`, `useBatchStudioJobs.ts`, `useBatchProgress.ts`, `useSyncQueueStatus.ts`, `useSyncReports.ts`, `useProducts.ts`
- **Description:** 9 polling hooks poll every 2-5s regardless of tab visibility
- **Fix:** Added `document.hidden` check to all 9 `refetchInterval` callbacks. Polling pauses when tab is hidden.
- **Status:** 🟢 FIXED (2026-02-24)

#### H7: No Pagination for 200+ Products
- **File:** `my-app/src/hooks/products/useProducts.ts:35-71`
- **Description:** Hard limit 200 products, no offset/page support
- **Fix:** Requires UI changes (pagination controls). Deferred to feature sprint.
- **Status:** 🔴 OPEN (deferred — needs UI work)

#### H8: Context Providers Cascade Re-renders
- **File:** `my-app/src/app/providers.tsx:14-79`
- **Description:** 6 nested providers, any update causes app-wide re-render
- **Fix:** Requires architectural refactor. Deferred — low measured impact (providers rarely update simultaneously).
- **Status:** 🔴 OPEN (deferred — low measured impact)

#### H9: SELECT * in Product Editor
- **File:** `my-app/src/hooks/products/useProducts.ts:83-92`
- **Description:** Loads all studio_jobs, SEO history, variations via SELECT *
- **Fix:** Replaced `*` with explicit columns. Nested relations now limited: studio_jobs (last 10), product_seo_analysis (last 1), product_serp_analysis (last 5).
- **Status:** 🟢 FIXED (2026-02-24)

### Quality (5)

#### H10: 17× `as any` Type Assertions
- **Files:** `useProductSave.ts`, `useArticleEditorForm.ts`, `ProductsListContent.tsx`, `productHelpers.ts`
- **Fix:** Create proper TypeScript interfaces
- **Status:** 🔴 OPEN

#### H11: 12 Empty Catch Blocks
- **Files:** `useVariationImages.ts:57`, `useLocalStorage.ts:20,29`, `MorphSurfaceDock.tsx:169,230`, `WooConnectionCard.tsx:160`
- **Fix:** Add error logging and user-facing feedback
- **Status:** 🔴 OPEN

#### H12: 5 "God Hooks" >300 Lines
- **Files:** `useProductSave.ts` (420L), `ProductEditorContainer.tsx` (450L), `useProductVariations.ts` (320L), `useSyncEngine.ts` (400L), `useArticleEditorForm.ts` (380L)
- **Fix:** Split into focused hooks
- **Status:** 🔴 OPEN

#### H13: Stale Closures in Callbacks
- **Files:** `ProductEditorContainer.tsx:344`, `useProductSave.ts:287`, `useFlowriterSync.ts:350`
- **Fix:** Use refs or exhaustive-deps enforcement
- **Status:** 🔴 OPEN

#### H14: wpFetch() Without Domain Whitelist
- **File:** `supabase/functions/sync-manager/index.ts:125-148`
- **Description:** shopUrl parameter could accept arbitrary domains
- **Assessment:** Already mitigated — `shop_url` is read from `platform_connections` table (line 553), which is fetched with `.eq('tenant_id', user.id)` (line 537). URLs come from DB, not user input.
- **Status:** 🟢 ALREADY MITIGATED (verified 2026-02-24)

### Architecture (3)

#### H15: Feature Boundary Violations (4 instances)
- **Files:** `ProductMediaTab.tsx`, `PhotoStudioPage.tsx`, `GscKeywordsExplorerTab.tsx`
- **Fix:** Use proper module boundaries and event-based communication
- **Status:** 🔴 OPEN

#### H16: Prop Drilling in ProductEditorContainer
- **File:** `ProductEditorContainer.tsx`
- **Description:** 12+ hooks drilled to children
- **Fix:** Create ProductEditorProvider context
- **Status:** 🔴 OPEN

#### H17: Potential Circular Dependencies
- **Files:** `usePushToStore` ↔ `useProductSave`, `ProductEditContext`
- **Fix:** Use barrel exports and dependency injection
- **Status:** 🔴 OPEN

---

## MEDIUM (30)

- ~50 `console.log` statements in production code
- Prompt injection patterns incomplete (10 regex, missing unicode/role transition)
- Token logging without redaction (OAuth endpoints)
- Inconsistent staleTime across queries (1s to 5min)
- Inline callbacks without useCallback (FilterPills, etc.)
- Redundant state (isDirty stored + derivable from formState)
- 8 functions missing return type annotations
- Inconsistent naming conventions (camelCase vs snake_case)
- Optimistic locking absent on product/article saves
- Missing keys in VariationGrid column map (index-based)
- No batch dispatch retry on failure
- Landing components not lazy-loaded (~50KB unnecessary)
- Time-ago interval on every banner instance
- Drag sensors not memoized (dnd-kit)
- New objects created every render in ProductsListContent
- Unbounded parallel queries in useProductStats
- No pagination on blog articles query
- Memory leaks in timer refs cleanup
- Inefficient array comparisons (JSON.stringify)
- Unsafe query invalidation patterns (sequential instead of batched)
- Missing dependency array guards (optional chaining instability)
- Redundant caching (state + TanStack Query)
- Weak random state generation (acceptable but improvable)
- Missing input validation on outline item count
- Loose request validation in push-to-store
- ModularGenerationSettings not fully validated
- Untrusted data in GSC keywords explorer
- Missing optimistic locking on article saves

---

## LOW (7)

- Generic variable names (`data`, `result`, `response`)
- Mixed barrel export patterns (`types.ts` vs `index.ts`)
- Single-use utility functions that could be inlined
- Unused type imports in some files
- Minor naming inconsistencies in Supabase functions

---

## Recommendations

### Immediate (before production)
1. Fix all 7 CRITICAL issues
2. Implement rate limiting on AI endpoints
3. Add tenant_id checks on all data access
4. Fix memory leaks in SSE streaming

### Short-term (1-2 weeks)
1. Fix HIGH security issues (H1-H5)
2. Add tab visibility checks to polling hooks
3. Implement pagination
4. Purge console.log statements

### Medium-term (1 month)
1. Split god hooks into focused modules
2. Fix TypeScript strictness (remove `as any`)
3. Add error boundaries and proper error handling
4. Implement optimistic locking

### Long-term
1. Add test coverage (currently 0%)
2. Set up CI/CD with lint + type-check gates
3. Bundle size optimization
4. Feature boundary enforcement via ESLint rules
