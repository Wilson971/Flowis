# Design System Violations Audit — FLOWZ v1.0

**Date:** 2026-02-23
**Scope:** All components in `src/components/` and `src/features/`
**Reviewer:** Claude Code (flowz-ds-enforce)

## Summary

| Violation Type | Instances | Files | Severity |
|----------------|-----------|-------|----------|
| Hardcoded colors | ~80+ | ~25 | HIGH |
| Hardcoded FM durations | ~35+ | ~20 | HIGH |
| `rounded-md` | ~13 | 11 | MEDIUM |
| Arbitrary text sizes | ~12 | 6 | MEDIUM |
| `p-5` | 7 | 4 | LOW |
| Local FM variants | 6 | 4 | MEDIUM |
| `@/lib/motion` imports | 0 | 0 | CLEAN |

## Worst Offenders

1. **`features/gsc/`** — Google brand colors hardcoded everywhere (`#4285f4`, `#5e35b1`). Should use CSS vars `--gsc-clicks`, `--gsc-impressions`.
2. **`components/landing/`** — `bg-[#0A0B0E]` repeated in 7+ files. Should define `--landing-bg`.
3. **`features/photo-studio/PhotoStudioPage.tsx`** — 8+ hardcoded Framer Motion durations.
4. **`components/article-editor/ArticleEditor.tsx`** — 3 local variants + hardcoded durations + arbitrary text sizes.
5. **`components/seo/SERPPreview.tsx`** — 6 hardcoded Google SERP colors.
6. **`components/onboarding/PlatformSelector.tsx`** — Platform colors should use `--platform-*` CSS vars.

## Hardcoded Colors (top offenders)

- `components/landing/*` — `bg-[#0A0B0E]`, `bg-[#0f1115]`, `bg-[#0c0d10]`
- `features/gsc/*` — `#4285f4`, `#5e35b1`, `#00897b`, `#e65100`
- `components/seo/SERPPreview.tsx` — `#202124`, `#1a0dab`, `#5f6368`, `#4d5156`
- `components/onboarding/PlatformSelector.tsx` — `#95BF47` (Shopify), `#96588a` (WooCommerce)

## p-5 Violations

- `dashboard/GscTrafficOverviewCard.tsx`, `GscIndexationStatusCard.tsx`, `GscFastOpportunitiesCard.tsx`
- `features/products/edit/ProductSeoTab.tsx` (x4)

## rounded-md Violations

- `dashboard/NorthStarKPICard.tsx`, `GscTrafficOverviewCard.tsx`, `GscFastOpportunitiesCard.tsx`, `GscIndexationStatusCard.tsx`
- `components/ui/toggle.tsx`, `toggle-group.tsx`
- `features/gsc/GscKpiCards.tsx`, `GscTabbedData.tsx`, `GscDateRangePicker.tsx`
- `components/products/ProductsTableSkeleton.tsx`

## Recommended Fix Strategy

1. **Create CSS variables** for recurring color groups (GSC, landing, SERP, platform)
2. **Replace hardcoded FM durations** with `motionTokens.transitions.*`
3. **Replace local variants** with `motionTokens.variants.*`
4. **Batch find-replace** `p-5` → `p-4`/`p-6`, `rounded-md` → `rounded-lg`
5. **Replace arbitrary text sizes** with `typographyTokens.scale.*`
