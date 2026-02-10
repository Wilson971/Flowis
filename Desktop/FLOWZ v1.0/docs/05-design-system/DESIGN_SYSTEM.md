# FLOWZ v1.0 Design System Standard

This document captures the design system patterns observed in the "Products" module. All new feature implementations and refactoring efforts MUST adhere to these standards to ensure application-wide harmony.

## 1. Core Principles
- **Modern & Clean**: Heavy use of whitespace, subtle borders, and soft shadows (`shadow-sm`).
- **Data-Dense but Legible**: specialized typography for headers vs data (uppercase/tracking for labels, tabular-nums for data).
- **Interactive & Alive**: Micro-interactions on hover and smooth entrance animations using `framer-motion`.
- **Semantic Coloring**: Use of specific color pairings (bg + text) for status and state indication.

## 2. Layout & Containers

### Page Structure
```jsx
<div className="space-y-6">
  {/* Header */}
  {/* Stats Cards */}
  {/* Toolbar/Filters */}
  {/* Main Content/Table */}
</div>
```

### Cards
- **Base**: `<Card className="shadow-sm border-border-subtle">`
- **Padding**: `p-5` or `p-6` for standard cards.
- **Background**: Default `bg-card` (white/dark-gray).
- **Hover Effects**: `transition-all hover:border-border-active hover:shadow-md` for interactive cards.

## 3. Typography

### Page Headers
- **Title**: `text-2xl font-bold tracking-tight text-foreground`
- **Description**: `text-muted-foreground mt-1 text-[13px] leading-relaxed max-w-2xl`
- **Breadcrumbs**: `text-[11px] font-semibold text-muted-foreground uppercase tracking-widest`

### Table/Data Headers
- **Standard**: `text-[10px] font-bold uppercase text-zinc-400 tracking-widest`

### Data Values
- **Primary Numbers**: `text-2xl font-bold text-foreground tabular-nums tracking-tight`
- **Secondary Text**: `text-xs text-muted-foreground`
- **Monospace (IDs/SKUs)**: `font-mono text-[11px]`

## 4. Components & UI Elements

### Badges & Status Indicators
Custom styles are preferred over default ShadCN badges for specific contexts:
- **Base**: `px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide`
- **Success**: `bg-emerald-50 text-emerald-700 border-emerald-100` (Dark: `bg-emerald-900/20 text-emerald-400`)
- **Warning**: `bg-amber-50 text-amber-700 border-amber-100`
- **Info**: `bg-blue-50 text-blue-700 border-blue-100`
- **Neutral**: `bg-muted text-muted-foreground border-border`

### Buttons
- **Actions**: `variant="outline"` with `shadow-sm` for secondary actions.
- **Icons**: `h-3.5 w-3.5` or `h-4 w-4`.
- **Ghost**: Used for row actions (`Edit`, `More`), often `text-zinc-500 hover:text-primary`.

### Empty States
- **Container**: `p-12 text-center`
- **Icon**: `h-20 w-20 rounded-full bg-primary/10` container with `h-10 w-10 text-primary` icon.
- **Title**: `text-xl font-semibold mb-2 text-text-main`
- **Description**: `text-muted-foreground mb-6 text-sm`

## 5. Animation (Framer Motion)
Standardize on these transition props:
- **Entrance**: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}`
- **Stagger**: Use `delay` props (`delay: 0.1`, `delay: 0.2`) for sequential elements.
- **Hover**: `whileHover={{ scale: 1.02 }}` or `{{ scale: 1.05 }}` for interactive cards/badges.

## 6. Implementation Checklist for New Features
1. [ ] Wrap page content in `space-y-6`.
2. [ ] Use `ProductsPageHeader` style for the top section.
3. [ ] If displaying stats, use the `StatCard` pattern with `useCounterAnimation`.
4. [ ] For tables, strictly use `text-[10px] uppercase tracking-widest` for headers.
5. [ ] Apply `shadow-sm` and `border-border-subtle` to all content containers.
6. [ ] Ensure all entry components have motion entrance animations.
