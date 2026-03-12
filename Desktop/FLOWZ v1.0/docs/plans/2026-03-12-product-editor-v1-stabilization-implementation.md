# Product Editor V1 Stabilization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all remaining security, data integrity, robustness, and performance issues to make the product editor production-ready for paying customers.

**Architecture:** Incremental fixes organized in 4 phases by risk priority. Each phase is independently committable. No structural refactoring — only targeted fixes in existing files.

**Tech Stack:** Next.js 16, React 19, TanStack Query, React Hook Form, Zod, Supabase, DOMPurify (new dependency)

---

## Phase 1: Security

### Task 1: Install DOMPurify

**Files:**
- Modify: `my-app/package.json`

**Step 1: Install dependency**

Run: `cd my-app && npm install dompurify && npm install -D @types/dompurify`

**Step 2: Verify installation**

Run: `cd my-app && node -e "require('dompurify')"`
Expected: No error

**Step 3: Commit**

```bash
git add my-app/package.json my-app/package-lock.json
git commit -m "chore: install DOMPurify for XSS sanitization"
```

---

### Task 2: Create sanitize utility

**Files:**
- Create: `my-app/src/lib/sanitize.ts`

**Step 1: Write the sanitize helper**

```typescript
import DOMPurify from "dompurify";

/**
 * Sanitize HTML string to prevent XSS.
 * Allows safe formatting tags from TipTap/WooCommerce content.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return html;
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            "p", "br", "strong", "b", "em", "i", "u", "s", "del",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li", "blockquote", "pre", "code",
            "a", "img", "table", "thead", "tbody", "tr", "th", "td",
            "span", "div", "hr", "sub", "sup",
        ],
        ALLOWED_ATTR: [
            "href", "target", "rel", "src", "alt", "width", "height",
            "class", "id", "style", "colspan", "rowspan",
        ],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Strip all HTML tags, returning plain text.
 * Useful for character counting and SEO analysis.
 */
export function stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}
```

**Step 2: Commit**

```bash
git add my-app/src/lib/sanitize.ts
git commit -m "feat: add DOMPurify sanitize utility for XSS prevention"
```

---

### Task 3: Sanitize HTML on form input (useProductForm)

**Files:**
- Modify: `my-app/src/features/products/hooks/useProductForm.ts`

**Step 1: Add sanitization to calculateInitialFormValues**

At the top of the file, add import:
```typescript
import { sanitizeHtml } from "@/lib/sanitize";
```

In `calculateInitialFormValues()`, sanitize the HTML fields when reading from metadata/working_content. Modify lines 76-77:

```typescript
// Before:
short_description: wc.short_description ?? (product.metadata as Record<string, any>)?.short_description ?? "",
description: wc.description ?? (product.metadata as Record<string, any>)?.description ?? "",

// After:
short_description: sanitizeHtml(wc.short_description ?? (product.metadata as Record<string, any>)?.short_description ?? ""),
description: sanitizeHtml(wc.description ?? (product.metadata as Record<string, any>)?.description ?? ""),
```

**Step 2: Verify build**

Run: `cd my-app && npx next build 2>&1 | head -30`
Expected: No new errors

**Step 3: Commit**

```bash
git add my-app/src/features/products/hooks/useProductForm.ts
git commit -m "security: sanitize HTML descriptions on form input (XSS fix)"
```

---

### Task 4: Sanitize HTML on save output (useProductSave)

**Files:**
- Modify: `my-app/src/hooks/products/useProductSave.ts`

**Step 1: Add sanitization before DB write**

Add import at top:
```typescript
import { sanitizeHtml } from "@/lib/sanitize";
```

In `mutationFn`, after building `newWorkingContent` (after line 306 in current code), sanitize HTML fields:

```typescript
// Sanitize HTML fields before writing to DB
if (typeof newWorkingContent.description === 'string') {
    newWorkingContent.description = sanitizeHtml(newWorkingContent.description);
}
if (typeof newWorkingContent.short_description === 'string') {
    newWorkingContent.short_description = sanitizeHtml(newWorkingContent.short_description);
}
```

**Step 2: Commit**

```bash
git add my-app/src/hooks/products/useProductSave.ts
git commit -m "security: sanitize HTML descriptions on save output (XSS fix)"
```

---

### Task 5: Input sanitization on focus_keyword and text fields

**Files:**
- Modify: `my-app/src/features/products/schemas/product-schema.ts`

**Step 1: Add validation constraints**

Modify the SEO fields in ProductFormSchema (lines 57-60):

```typescript
// Before:
meta_title: z.string().optional().default(""),
meta_description: z.string().optional().default(""),
focus_keyword: z.string().optional().default(""),
slug: z.string().optional().default(""),

// After:
meta_title: z.string().max(200).optional().default(""),
meta_description: z.string().max(500).optional().default(""),
focus_keyword: z.string().max(100).optional().default("")
    .transform(v => v.replace(/<[^>]*>/g, "").trim()),
slug: z.string().max(200).optional().default("")
    .transform(v => v.replace(/[^a-z0-9-]/gi, "-").toLowerCase()),
```

**Step 2: Verify build**

Run: `cd my-app && npx next build 2>&1 | head -30`
Expected: No new errors

**Step 3: Commit**

```bash
git add my-app/src/features/products/schemas/product-schema.ts
git commit -m "security: add max length + sanitization on SEO text fields"
```

---

### Task 6: Error info disclosure fix

**Files:**
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`
- Modify: `my-app/src/hooks/products/useProductSave.ts`

**Step 1: Fix error disclosure in ProductEditorContainer**

In `handleManualSave` catch block (line 282-284), replace:

```typescript
// Before:
toast.error("Erreur de sauvegarde", {
    description: e instanceof Error ? e.message : "Une erreur est survenue. Veuillez réessayer.",
});

// After:
if (e instanceof StaleDataError || e instanceof DuplicateSkuError) {
    // These are user-facing errors with safe messages — handled by useProductSave.onError
} else {
    console.error("[ProductEditor] Save failed:", e);
    toast.error("Erreur de sauvegarde", {
        description: "Une erreur est survenue. Veuillez réessayer.",
    });
}
```

Add the imports at the top of ProductEditorContainer:
```typescript
import { StaleDataError, DuplicateSkuError } from "@/hooks/products/useProductSave";
```

**Step 2: Fix generic error in useProductSave.onError**

In `useProductSave.ts` line 473-474, replace:

```typescript
// Before:
} else {
    toast.error('Erreur de sauvegarde', { description: error.message });
}

// After:
} else {
    console.error('[useProductSave] Unexpected error:', error);
    const isNetwork = error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch');
    toast.error('Erreur de sauvegarde', {
        description: isNetwork
            ? 'Connexion perdue — vérifiez votre réseau et réessayez.'
            : 'Une erreur inattendue est survenue. Veuillez réessayer.',
    });
}
```

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/ProductEditorContainer.tsx my-app/src/hooks/products/useProductSave.ts
git commit -m "security: prevent error info disclosure in save error handling"
```

---

### Task 7: Verify RLS + Phase 1 commit

RLS is already fully applied via `supabase/migrations/20260222100001_fix_rls_critical.sql` — confirmed ENABLE ROW LEVEL SECURITY + all 4 CRUD policies on `products` table with `tenant_id = auth.uid()`.

**No action needed. Mark as verified.**

---

## Phase 2: Data Integrity

### Task 8: Race condition — cancel auto-save before manual save

**Files:**
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

**Step 1: Verify auto-save is used and wire cancelAutoSave**

Check if ProductEditorContainer uses `useAutoSaveProduct`. Currently, it does NOT import or use `useAutoSaveProduct` — the auto-save hook is not wired in the container. The `actions` object comes from `useProductActions` which calls `useProductSave` directly.

If auto-save is not currently wired, this issue is NOT APPLICABLE in the current code. Skip.

**However**, if auto-save is wired elsewhere or added later, the pattern should be:

```typescript
// At the start of handleManualSave:
autoSave.cancelAutoSave();
```

**Step 2: Add save lock to prevent double-save**

In `handleManualSave` (line 235), add a guard using the existing `isSaving` state:

```typescript
// Before:
const handleManualSave = useCallback(async (data: ProductFormValues) => {
    try {
        setSaveStatus('saving');

// After:
const isSavingRef = useRef(false);

const handleManualSave = useCallback(async (data: ProductFormValues) => {
    if (isSavingRef.current) return; // Prevent double-save
    isSavingRef.current = true;
    try {
        setSaveStatus('saving');
```

And at the end, in both success and catch paths, add:
```typescript
    } finally {
        isSavingRef.current = false;
    }
```

Replace the current try/catch structure to use try/catch/finally.

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/ProductEditorContainer.tsx
git commit -m "fix: prevent double-save with save lock ref"
```

---

### Task 9: Save-before-publish flow

**Files:**
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

**Step 1: Modify handlePublish to auto-save first**

Replace the current `handlePublish` (lines 96-111):

```typescript
// Before:
const handlePublish = useCallback(() => {
    const title = methods.getValues("title");
    if (!title?.trim()) {
        toast.warning("Titre requis", {
            description: "Le produit doit avoir un titre avant d'être publié vers la boutique.",
        });
        return;
    }
    if (methods.formState.isDirty || variationDirtyRef.current?.()) {
        toast.warning("Modifications non sauvegardées", {
            description: "Sauvegardez d'abord vos modifications (Ctrl+S) avant de publier.",
        });
        return;
    }
    pushToStore.push(productId);
}, [pushToStore, productId, methods]);

// After:
const handlePublish = useCallback(async () => {
    const title = methods.getValues("title");
    if (!title?.trim()) {
        toast.warning("Titre requis", {
            description: "Le produit doit avoir un titre avant d'être publié vers la boutique.",
        });
        return;
    }
    // Auto-save before publish if there are unsaved changes
    if (methods.formState.isDirty || variationDirtyRef.current?.()) {
        try {
            const formData = methods.getValues();
            await handleManualSave(formData);
        } catch {
            // Save failed — toast already shown by handleManualSave
            return;
        }
    }
    pushToStore.push(productId);
}, [pushToStore, productId, methods, handleManualSave]);
```

**Step 2: Update the Publish button — remove isDirty disable**

In `ProductEditorHeader.tsx` line 255, the button is disabled when `isDirty`. Since we now auto-save, remove that constraint:

```typescript
// Before:
disabled={isPublishing || isDirty || (!hasPendingChanges && !hasConflict)}

// After:
disabled={isPublishing || isSaving || (!hasPendingChanges && !hasConflict && !isDirty)}
```

The button is now:
- Disabled when publishing or saving (in-flight operations)
- Disabled when there are no pending changes AND no conflict AND no unsaved edits
- Enabled when there are unsaved edits (will auto-save first) OR pending changes

**Step 3: Verify build**

Run: `cd my-app && npx next build 2>&1 | head -30`

**Step 4: Commit**

```bash
git add my-app/src/features/products/components/ProductEditorContainer.tsx my-app/src/features/products/components/edit/ProductEditorHeader.tsx
git commit -m "feat: auto-save before publish — seamless save+push flow"
```

---

### Task 10: Version history race with auto-save

**Files:**
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

Since auto-save is NOT currently wired in ProductEditorContainer, this race condition does not exist. The version creation at line 268-273 only runs after `handleManualSave` completes, which is sequential.

**No action needed. Mark as verified.**

---

## Phase 3: Robustness

### Task 11: Polling visibility check on useConflictDetection

**Files:**
- Modify: `my-app/src/hooks/products/useConflictDetection.ts`

**Step 1: Add refetchInterval with visibility check**

In `useConflictDetection` (line 163), add `refetchInterval` to the query config:

```typescript
// Before (line 198-200):
enabled: !!productId,
staleTime: STALE_TIMES.LIST,

// After:
enabled: !!productId,
staleTime: STALE_TIMES.REALTIME,
refetchInterval: () => {
    if (typeof document !== 'undefined' && document.hidden) return false;
    return 15_000; // Check for conflicts every 15s when tab is visible
},
```

This fixes both issue #6 (visibility check) and issue #22 (staleTime too high) — changed from `LIST` (30s) to `REALTIME` (5s) and added active polling with visibility guard.

**Step 2: Commit**

```bash
git add my-app/src/hooks/products/useConflictDetection.ts
git commit -m "fix: add visibility check + reduce staleTime on conflict detection polling"
```

---

### Task 12: Retry on save mutations

**Files:**
- Modify: `my-app/src/hooks/products/useProductSave.ts`

**Step 1: Add retry config to useMutation**

In `useProductSave`, add `retry` to the mutation config (after `mutationFn`, before `onSuccess`):

```typescript
retry: (failureCount, error) => {
    // Don't retry user-facing errors or data conflicts
    if (error instanceof StaleDataError) return false;
    if (error instanceof DuplicateSkuError) return false;
    // Retry once for network/transient errors
    return failureCount < 1;
},
retryDelay: 1000,
```

**Step 2: Commit**

```bash
git add my-app/src/hooks/products/useProductSave.ts
git commit -m "fix: add retry on transient errors for product save mutation"
```

---

### Task 13: Enriched error messages

**Files:**
- Modify: `my-app/src/hooks/products/useProductSave.ts`

Already partially done in Task 6. The `onError` handler now has:
- `StaleDataError` → specific warning
- `DuplicateSkuError` → specific error with SKU name
- Network error → "Connexion perdue"
- Other → generic message (no info disclosure)

**No additional action needed. Mark as done.**

---

### Task 14: Fix silent NaN in coerceNumber

**Files:**
- Modify: `my-app/src/features/products/utils/transformFormToSaveData.ts`

**Step 1: Handle European number format and NaN**

Replace the `coerceNumber` function (lines 20-25):

```typescript
// Before:
function coerceNumber(v: string | number | null | undefined, fallback: null | undefined): number | null | undefined {
    if (v == null || v === "") return fallback;
    return Number(v);
}

// After:
function coerceNumber(v: string | number | null | undefined, fallback: null | undefined): number | null | undefined {
    if (v == null || v === "") return fallback;
    if (typeof v === "number") return v;
    // Handle European format: "10,99" → "10.99"
    const normalized = v.replace(",", ".");
    const num = Number(normalized);
    if (Number.isNaN(num)) return fallback;
    return num;
}
```

Keep the overload signatures as-is (lines 20-21), only replace the implementation body.

**Step 2: Commit**

```bash
git add my-app/src/features/products/utils/transformFormToSaveData.ts
git commit -m "fix: handle European number format and prevent NaN in coerceNumber"
```

---

### Task 15: Accessibility — aria-labels on header buttons

**Files:**
- Modify: `my-app/src/features/products/components/edit/ProductEditorHeader.tsx`

**Step 1: Add aria-labels to action buttons**

On the Undo button (line 189-198), add `aria-label`:
```typescript
<Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={history.undo}
    disabled={!history.canUndo}
    aria-label="Annuler (Ctrl+Z)"
    className="h-7 w-7 text-muted-foreground hover:text-foreground"
>
```

On the Redo button (line 204-213), add `aria-label`:
```typescript
<Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={history.redo}
    disabled={!history.canRedo}
    aria-label="Rétablir (Ctrl+Y)"
    className="h-7 w-7 text-muted-foreground hover:text-foreground"
>
```

On the Reset button (line 227-234), add `aria-label`:
```typescript
<Button
    variant="outline"
    onClick={onReset}
    disabled={!isDirty || isSaving}
    aria-label="Annuler les modifications"
    className="..."
>
```

On the Save button (line 235-252), add `aria-label`:
```typescript
<Button
    onClick={onSave}
    disabled={isSaving}
    variant="outline"
    aria-label="Enregistrer (Ctrl+S)"
    className="..."
>
```

On the Publish button (line 253-280), add `aria-label`:
```typescript
<Button
    onClick={onPublish}
    disabled={isPublishing || isSaving || (!hasPendingChanges && !hasConflict && !isDirty)}
    variant="outline"
    aria-label="Publier vers la boutique"
    className={cn(...)}
>
```

**Step 2: Commit**

```bash
git add my-app/src/features/products/components/edit/ProductEditorHeader.tsx
git commit -m "a11y: add aria-labels to all product editor header buttons"
```

---

## Phase 4: Performance & Polish

### Task 16: Reduce maxSnapshots in useFormHistory

**Files:**
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

**Step 1: Change maxSnapshots from 50 to 30**

In ProductEditorContainer line 191:

```typescript
// Before:
maxSnapshots: 50,

// After:
maxSnapshots: 30,
```

**Step 2: Commit**

```bash
git add my-app/src/features/products/components/ProductEditorContainer.tsx
git commit -m "perf: reduce form history snapshots from 50 to 30 (save ~1MB)"
```

---

### Task 17: Fix useMemo dependencies for contextValue

**Files:**
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

**Step 1: Extract stable values from methods**

The `methods` object from react-hook-form changes ref every render. Extract the stable parts:

Before the `contextValue` useMemo (around line 327), add:

```typescript
// Extract stable refs from react-hook-form to prevent useMemo invalidation
const formControl = methods.control;
const formGetValues = methods.getValues;
const formSetValue = methods.setValue;
const formReset = methods.reset;
const formHandleSubmit = methods.handleSubmit;
const formState = methods.formState;
```

Then in the useMemo dependencies (line 347-351), replace `methods` with the individual stable values:

```typescript
}, [
    productId, product, isLoading, formControl, formState, actions.isSaving, actions.handleSave,
    refetchProduct, refetchContentBuffer, selectedStore, analysisData, runServerAnalysis,
    contentBuffer, contentBuffer?.generation_manifest, dirtyFieldsData, remainingProposals, draftActions, history, saveStatus
]);
```

**Note:** Keep `form: methods` in the context value itself — only the dependency array changes.

**Step 2: Verify build**

Run: `cd my-app && npx next build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add my-app/src/features/products/components/ProductEditorContainer.tsx
git commit -m "perf: fix useMemo dependencies to prevent unnecessary context re-renders"
```

---

### Task 18: Centralize editor timings

**Files:**
- Create: `my-app/src/features/products/constants/editor-config.ts`
- Modify: `my-app/src/features/products/components/ProductEditorContainer.tsx`

**Step 1: Create the config file**

```typescript
/**
 * Centralized configuration for the product editor.
 * All timing values in milliseconds.
 */
export const EDITOR_CONFIG = {
    /** Max undo/redo snapshots kept in memory */
    MAX_SNAPSHOTS: 30,
    /** Debounce delay for form history captures (ms) */
    HISTORY_DEBOUNCE_MS: 500,
    /** Delay before save status resets to idle after success (ms) */
    SAVE_STATUS_RESET_MS: 3000,
    /** Delay before save status resets to idle after error (ms) */
    SAVE_STATUS_ERROR_RESET_MS: 5000,
    /** Conflict detection polling interval (ms) */
    CONFLICT_POLL_INTERVAL_MS: 15_000,
} as const;
```

**Step 2: Use in ProductEditorContainer**

Replace hardcoded values:
- `maxSnapshots: 30` → `maxSnapshots: EDITOR_CONFIG.MAX_SNAPSHOTS`
- `debounceMs: 500` → `debounceMs: EDITOR_CONFIG.HISTORY_DEBOUNCE_MS`
- `setTimeout(() => { ... }, 3000)` → `setTimeout(() => { ... }, EDITOR_CONFIG.SAVE_STATUS_RESET_MS)`
- `setTimeout(() => { ... }, 5000)` → `setTimeout(() => { ... }, EDITOR_CONFIG.SAVE_STATUS_ERROR_RESET_MS)`

Import at top:
```typescript
import { EDITOR_CONFIG } from "../constants/editor-config";
```

**Step 3: Use in useConflictDetection**

Replace `return 15_000;` with import from config:
```typescript
import { EDITOR_CONFIG } from "@/features/products/constants/editor-config";
// ...
return EDITOR_CONFIG.CONFLICT_POLL_INTERVAL_MS;
```

**Step 4: Commit**

```bash
git add my-app/src/features/products/constants/editor-config.ts my-app/src/features/products/components/ProductEditorContainer.tsx my-app/src/hooks/products/useConflictDetection.ts
git commit -m "refactor: centralize editor timing configuration"
```

---

### Task 19: Final verification

**Step 1: Run build**

Run: `cd my-app && npm run build`
Expected: Build succeeds with no new errors

**Step 2: Run lint**

Run: `cd my-app && npm run lint`
Expected: No new lint errors

**Step 3: Manual smoke test checklist**

- [ ] Open a product editor page
- [ ] Edit title → "Non enregistré" appears
- [ ] Ctrl+S → saves successfully
- [ ] Click "Publier" with unsaved changes → auto-saves then publishes
- [ ] Undo/Redo buttons work with aria-labels (inspect element)
- [ ] European price format "10,99" saves as 10.99
- [ ] Switch tab away and back → no unnecessary polling (check network tab)

**Step 4: Final commit**

```bash
git commit --allow-empty -m "chore: product editor V1 stabilization complete — 4 phases applied"
```
