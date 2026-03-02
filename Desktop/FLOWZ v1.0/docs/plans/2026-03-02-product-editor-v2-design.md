# Product Editor V2 — Vercel Pro Redesign

> **Date:** 2026-03-02
> **Type:** Redesign (reconstruction de zero avec patterns premium)
> **Scope:** Formulaire d'edition produit complet

---

## Decision Summary

| Decision | Choice |
|----------|--------|
| Layout | Main (2/3) + Sidebar (1/3), 2 colonnes |
| Navigation | Underline tabs Vercel avec layoutId |
| Sidebar | Tous les cards conserves |
| Header | Dense Vercel, ligne unique ~48px |
| Strategy | Nouveaux fichiers *V2.tsx (pas de refactoring in-place) |
| Business logic | Reutilisation des hooks existants, aucun changement logique |

---

## Architecture

### File Structure

```
features/products/components/edit/
├── ProductEditorContainerV2.tsx    (orchestrateur — branche les hooks existants)
├── ProductEditorLayoutV2.tsx       (grid 2 colonnes)
├── ProductEditorHeaderV2.tsx       (sticky header dense)
├── ProductEditorTabsV2.tsx         (underline tabs avec layoutId)
├── ProductEditorSidebarV2.tsx      (sidebar aggregator)
│
├── tabs/
│   ├── GeneralTabV2.tsx            (title + short desc + description)
│   ├── MediaTabV2.tsx              (image gallery)
│   ├── VariationsTabV2.tsx         (attribute grid + bulk ops)
│   └── SeoTabV2.tsx                (score + SERP + field editors)
│
└── sidebar/
    ├── SeoWidgetV2.tsx             (SEO score KPI)
    ├── PricingCardV2.tsx           (prix + stock + logistics)
    ├── OrganizationCardV2.tsx      (type, brand, status, categories, tags)
    ├── OptionsCardV2.tsx           (toggles)
    ├── SyncStatusCardV2.tsx        (sync state + dirty fields)
    ├── SyncHistoryCardV2.tsx       (timeline events)
    ├── VersionHistoryCardV2.tsx    (versions + restore)
    ├── PerformanceCardV2.tsx       (revenue, sales, rating)
    ├── LinkedProductsCardV2.tsx    (upsells, cross-sells)
    └── ExternalProductCardV2.tsx   (external URL + button text)
```

### Data Flow

```
ProductEditorContainerV2
├── useProduct(productId)
├── useProductContent(productId)
├── useProductForm(product, isRestoringRef)
├── useProductActions()
├── useDraftActions()
├── useFormHistory(form, contentBuffer)
├── useFormHistoryKeyboard()
├── useFormStabilization()
├── useNavigationGuard()
└── <ProductEditContext.Provider>
    └── <FormProvider>
        └── ProductEditorLayoutV2
            ├── ProductEditorHeaderV2
            ├── ProductEditorTabsV2 + Tab Content
            └── ProductEditorSidebarV2
```

No hooks are modified. All business logic stays identical.

---

## Visual Design (Vercel Pro Patterns)

### Header

- Single dense row, `h-14`, `border-b border-border/40`, `bg-card/80 backdrop-blur-xl sticky top-0 z-30`
- Back: ghost button `text-[13px]`
- Title: `text-[13px] font-semibold tracking-tight truncate max-w-[300px]`
- Status pills: `h-5 rounded-full px-2 text-[10px] font-medium border-0`
- Save state: `text-[11px] text-muted-foreground`
- Undo/Redo: `p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60`
- Save: `h-7 text-[11px] rounded-lg` outline
- Publish: `h-8 text-[11px] rounded-lg` primary, spinner + label original

### Tabs

- Underline with `layoutId="activeProductTab"`, `h-0.5 bg-foreground`
- Tab: `text-[13px] font-medium`, active `text-foreground`, idle `text-muted-foreground`
- Count badge: `text-[10px] text-muted-foreground/60 tabular-nums ml-1.5`
- Container: `border-b border-border/40`

### Cards (all)

```
rounded-xl border border-border/40 bg-card relative group overflow-hidden
+ dark gradient overlay (absolute inset-0)
+ relative z-10 content wrapper
```

- Card header: icon container `h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50` + `text-[15px] font-semibold tracking-tight` + `text-xs text-muted-foreground`
- Card padding: `p-6` standard, `p-4` for compact KPI cards
- Dividers inside: `border-t border-border/30`
- Section labels: `text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider`

### Form Fields

- Label: `text-[13px] font-medium text-foreground`
- Input: `rounded-lg text-sm`, icon `h-3.5 w-3.5 text-muted-foreground/50`
- Helper: `text-[11px] text-muted-foreground/60`
- Char count: `text-[10px] tabular-nums text-muted-foreground/60`

### Sidebar Cards

- Spacing: `space-y-4`
- Sticky: `xl:sticky xl:top-20`
- All use standard Vercel Pro card pattern
- Collapsible sections inside PricingCardV2 (Stock, Logistics, Tax) with ChevronRight

### Motion

- Page entry: `staggerContainer` + `staggerItem`
- Card entry in sidebar: stagger
- Tab content switch: `fadeIn` with `AnimatePresence mode="wait"`
- All transitions via `motionTokens.transitions.*`

### States

- Loading: skeleton mirroring exact card layout
- Empty: icon + title + description + CTA
- Error: inline alert with recovery action
- Toast: Sonner for all notifications

---

## Scope Exclusions

- No changes to hooks, context, schemas, types, or API routes
- No changes to V1 files (coexistence)
- No new features added (pure visual redesign)
- TipTap editor component reused as-is
- ProductImageGallery reused as-is
- AISuggestionModal reused as-is
