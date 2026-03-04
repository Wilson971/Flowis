# Variation Editor — Unified Grid Refactoring

**Date:** 2026-03-04
**Status:** Approved

## Problem

The current Variation Studio has 3 UX issues:
1. **Too many steps** — fullscreen dialog with 2 tabs (Grille/Attributs), grid duplicated in both
2. **Limited bulk actions** — each action opens a separate popover, only visible after selection
3. **Awkward flow** — Attributs tab mixes attribute management AND grid in split view

## Design: Unified Grid

### Layout (Single-pane)

Replace the 2-tab layout with a **single grid view**:

```
┌──────────────────────────────────────────────────────────┐
│ ← Retour │ Variation Studio │ 24 var. │ [Attributs ⚙] [Générer ↻] [Enregistrer & Fermer] │
├──────────────────────────────────────────────────────────┤
│ Toolbar: 🔍 Search │ Taille ▾ │ Couleur ▾ │ Colonnes ⚙ │
│──────────────────────────────────────────────────────────│
│ Grid with inline editing                                 │
├──────────────────────────────────────────────────────────┤
│ Footer: stats                                            │
└──────────────────────────────────────────────────────────┘
```

### Toolbar — Contextual States

**Default (nothing selected):**
- Search field (filters SKU, attributes)
- Dropdown filters per variation attribute (auto-generated)
- Column visibility selector

**Selection mode (1+ checked):**
- "N sélectionnées" badge
- Inline input fields: Prix, Promo, Stock (Enter to apply)
- Status dropdown
- Delete button + Clear selection
- Keyboard: Ctrl+A, Escape, Delete

### Inline Editing

- Editable cells: Prix, Promo, Stock, SKU — click to edit
- Enter validates, Escape cancels, Tab moves to next field
- Modified cells show amber left border dot
- Read-only cells: attributes, image

### Attribute Management — Sheet

Button "Attributs ⚙" opens a **right Sheet** (not a tab):
- List all attributes with their options
- Add/remove/rename options
- Preview delta ("3 new combinations")
- Single CTA "Regénérer la matrice"
- Sheet closes, grid updates

### What Stays Unchanged

- `useVariationManager` hook (logic intact)
- `VariationDetailSheet` (accessed via row chevron `>`)
- Summary card outside the dialog
- Cartesian generation from attributes
- Save/dirty integration with parent container
- Image upload per variation

## Files Impacted

| File | Action |
|------|--------|
| `ProductVariationsTab.tsx` | Major rewrite — remove tabs, unified layout |
| `BulkVariationToolbar.tsx` | Rewrite — inline inputs, contextual states |
| `VariationGrid.tsx` | Enhance — inline editing, filters |
| `VariationRow.tsx` | Enhance — editable cells |
| `AttributeSidebar.tsx` | Remove (replaced by Sheet) |
| `AttributeDetailPanel.tsx` | Remove (merged into Sheet) |
| NEW `AttributeSheet.tsx` | New — Sheet for attribute management |
| NEW `VariationToolbar.tsx` | New — Unified toolbar with search/filters/bulk |
| `useVariationManager.ts` | Minor — add filter state |

## Backup

Original files backed up in `features/products/components/edit/_backup_variations_studio/`
