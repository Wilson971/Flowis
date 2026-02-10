# Dashboard Page Override

> **LOGIC:** This file contains page-specific rules for the Dashboard.
> These rules **override** the rules in `MASTER.md` for this page only.
> If a property is not defined here, fall back to MASTER.md.

---

**Page:** Dashboard
**Last Updated:** 2026-01-31 22:18:00

---

## Layout Overrides

### Grid Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (Fixed)                                                  │
├──────────┬──────────────────────────────────────────────────────┤
│          │ Main Content Area                                    │
│ Sidebar  │ ┌─────────────┬─────────────┬─────────────┐          │
│ (Fixed)  │ │ KPI Card 1  │ KPI Card 2  │ KPI Card 3  │          │
│          │ ├─────────────┴─────────────┴─────────────┤          │
│          │ │ Chart Area (Sparklines, Line Charts)    │          │
│          │ ├──────────────────────────────────────────┤          │
│          │ │ Recent Transactions Table               │          │
│          │ └──────────────────────────────────────────┘          │
└──────────┴──────────────────────────────────────────────────────┘
```

### Spacing for Dashboard

| Area | Padding | Gap |
|------|---------|-----|
| Header | `16px` horizontal | - |
| Sidebar | `16px` | `8px` between items |
| Main Content | `24px` | `24px` between sections |
| KPI Grid | - | `16px` between cards |

---

## Component Overrides

### KPI Cards (Dashboard Specific)

```css
/* Dashboard KPI Card - More compact */
.dashboard-kpi-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--card);
  border: 1px solid var(--border);
}

/* Value styling with tabular nums */
.dashboard-kpi-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--foreground);
}

/* Trend with sparkline space */
.dashboard-kpi-trend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
```

### Sidebar Navigation (Dashboard)

| State | Background | Text Color | Border |
|-------|------------|------------|--------|
| Default | `transparent` | `--muted-foreground` | none |
| Hover | `--muted` | `--foreground` | none |
| Active | `rgba(16, 185, 129, 0.1)` | `--primary` | `3px left emerald` |

```css
.dashboard-nav-item {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.dashboard-nav-item:hover {
  background: var(--muted);
  color: var(--foreground);
}

.dashboard-nav-item.active {
  background: rgba(16, 185, 129, 0.1);
  color: var(--primary);
  border-left: 3px solid var(--primary);
  font-weight: 500;
}
```

### Charts (Dashboard Specific)

| Chart Type | Primary Color | Grid Lines | Tooltip |
|------------|---------------|------------|---------|
| Line (Growth) | `#10B981` | `--border` | Glass bg |
| Area (Volume) | `rgba(16, 185, 129, 0.2)` | `--border` | Glass bg |
| Bar (Comparison) | Emerald gradient | `--border` | Glass bg |

```css
/* Chart container */
.dashboard-chart-container {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
}

/* Recharts overrides */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: var(--border);
}

.recharts-tooltip-wrapper .recharts-default-tooltip {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-md) !important;
}
```

### Transactions Table (Dashboard)

```css
.dashboard-table {
  width: 100%;
}

.dashboard-table th {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.dashboard-table td {
  padding: 16px;
  font-variant-numeric: tabular-nums;
  border-bottom: 1px solid var(--border);
}

.dashboard-table tr:hover {
  background: var(--muted);
}

/* Amount styling */
.amount-positive {
  color: var(--success);
}

.amount-negative {
  color: var(--destructive);
}
```

---

## Quick Actions Bar

### Action Buttons (Dashboard Top)

| Action | Icon | Background | Hover |
|--------|------|------------|-------|
| Send | Arrow Up Right | `--primary` | Glow |
| Receive | Arrow Down Left | `--muted` | Lift |
| Swap | Arrows Exchange | `--muted` | Lift |
| Buy | Plus Circle | `--muted` | Lift |

```css
.dashboard-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  background: var(--muted);
  transition: all 200ms ease;
  cursor: pointer;
}

.dashboard-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.dashboard-action-btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.dashboard-action-btn-primary:hover {
  box-shadow: var(--shadow-glow);
}

.dashboard-action-icon {
  width: 24px;
  height: 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
}
```

---

## Responsive Breakpoints

| Breakpoint | KPI Grid | Sidebar | Charts |
|------------|----------|---------|--------|
| `< 640px` | 1 col | Hidden (drawer) | Full width |
| `640-1024px` | 2 cols | Collapsed icons | Full width |
| `> 1024px` | 3-4 cols | Full width | Side by side |

---

## Anti-Patterns (Dashboard Specific)

- ❌ **No real-time indicators** — Show live status dots on updating data
- ❌ **Static charts** — Add hover tooltips and zoom on click
- ❌ **No loading states** — Use skeleton loaders for async data
- ❌ **Crowded layout** — Maintain consistent spacing between cards
