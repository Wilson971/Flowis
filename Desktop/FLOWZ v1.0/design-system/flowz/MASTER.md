# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** FLOWZ — Emerald Ledger
**Generated:** 2026-01-31 22:15:00
**Category:** SaaS Dashboard (Fintech / Crypto / BI)
**Style:** Dark Mode Premium + Glassmorphism

---

## 🎨 Color Palette

### Primary Colors (La Marque)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Emerald Primary | `#10B981` | `--color-primary` | Boutons, courbes de croissance, accents |
| Emerald Dark | `#047857` | `--color-primary-dark` | États hover, pressed |
| Emerald Light | `rgba(16, 185, 129, 0.1)` | `--color-primary-light` | Fonds de badges, icônes |
| Emerald Glow | `rgba(16, 185, 129, 0.2)` | `--color-primary-glow` | Glow effects, borders |

### Dark Mode (Default — Anthracite & Brushed Metal)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background Main | `#121215` | `--background` | Near-black with warm undertone |
| Surface 1 (Cards) | `#1C1C1F` | `--card` | Cards, brushed metal base |
| Surface 2 (Elevated) | `#252528` | `--popover` | Popovers, dropdowns |
| Surface 3 (Highest) | `#2E2E32` | `--border` | Borders, dividers |
| Border | `#2E2E32` | `--color-border` | Séparateurs subtils |
| Border Accent | `rgba(16, 185, 129, 0.4)` | `--border-accent` | Hover borders |
| Text Primary | `#FAFAFA` | `--foreground` | Titres, corps principaux |
| Text Secondary | `#A1A1A6` | `--muted-foreground` | Labels, descriptions |

### Light Mode (Néo-Banque)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background Main | `#F3F4F6` | `--color-bg-light` | Fond principal |
| Surface Card | `#FFFFFF` | `--color-surface-light` | Cards |
| Border | `#E5E7EB` | `--color-border-light` | Séparateurs |
| Text Primary | `#111827` | `--color-text-light` | Corps principal |
| Text Secondary | `#6B7280` | `--color-text-muted-light` | Labels |

### Semantic Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Success | `#10B981` | `--color-success` | Profits, confirmations |
| Warning | `#F59E0B` | `--color-warning` | Alertes, pending |
| Error | `#EF4444` | `--color-error` | Pertes, erreurs |
| Info | `#3B82F6` | `--color-info` | Informations |

---

## 📝 Typography

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Google Fonts:** [Inter + Space Grotesk](https://fonts.google.com/share?selection.family=Inter:wght@300;400;500;600;700|Space+Grotesk:wght@400;500;600;700)

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-h1` | `32px` | 700 | 1.2 | Page titles |
| `--text-h2` | `24px` | 600 | 1.3 | Section headers |
| `--text-h3` | `18px` | 600 | 1.4 | Card titles |
| `--text-kpi` | `36px` | 700 | 1.1 | Gros chiffres KPI |
| `--text-body` | `14px` | 400 | 1.6 | Corps de texte |
| `--text-small` | `12px` | 400 | 1.5 | Captions, labels |
| `--text-mono` | `13px` | 400 | 1.5 | Données, codes |

### Tabular Numbers (Finances)

```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' on;
}
```

---

## 📐 Spacing System

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--space-xs` | `4px` | `p-1` | Tight gaps |
| `--space-sm` | `8px` | `p-2` | Icon gaps |
| `--space-md` | `16px` | `p-4` | Standard padding |
| `--space-lg` | `24px` | `p-6` | Card padding |
| `--space-xl` | `32px` | `p-8` | Section gaps |
| `--space-2xl` | `48px` | `p-12` | Large sections |
| `--space-3xl` | `64px` | `p-16` | Hero padding |

---

## 🪩 Brushed Metal / Aluminum Cards

### Card Variants

| Class | Effect | Best For |
|-------|--------|----------|
| `card-metal` | Base metal with diagonal highlight + grain | KPI cards, main panels |
| `card-metal-brushed` | Horizontal brushed lines | Tables, lists |
| `card-metal-dark` | Darker industrial finish with inset shadow | Sidebars, modals |
| `card-metal-accent` | Metal with emerald top accent line | Featured cards, CTAs |

### Usage Example

```html
<div class="card-metal p-6">
  <h3 class="text-foreground font-semibold">Solde Total</h3>
  <p class="card-kpi-value">$42,593.00</p>
</div>
```

### Metal Effect Details

```css
/* Base metal gradient + highlight overlay + grain texture */
.card-metal {
  background: linear-gradient(145deg, #1C1C1F, #232326, #1A1A1D);
  /* ::before = diagonal light reflection */
  /* ::after = subtle noise grain texture */
}
```

---

## 🌫️ Glassmorphism Effects

### Glass Cards

```css
.glass-card {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.glass-card-light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Glass Levels

| Level | Blur | Opacity | Usage |
|-------|------|---------|-------|
| `glass-subtle` | `8px` | `0.6` | Background layers |
| `glass-default` | `12px` | `0.8` | Cards, panels |
| `glass-strong` | `20px` | `0.9` | Modals, overlays |

---

## 🎭 Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.4)` | Cards |
| `--shadow-lg` | `0 8px 24px rgba(0, 0, 0, 0.5)` | Elevated elements |
| `--shadow-xl` | `0 16px 48px rgba(0, 0, 0, 0.6)` | Modals |
| `--shadow-glow` | `0 0 20px rgba(16, 185, 129, 0.3)` | Emerald glow effect |
| `--shadow-glow-lg` | `0 0 40px rgba(16, 185, 129, 0.4)` | Hero glow |

---

## 🔲 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Buttons, inputs |
| `--radius-md` | `8px` | Small cards |
| `--radius-lg` | `12px` | Cards |
| `--radius-xl` | `16px` | Large cards, modals |
| `--radius-2xl` | `24px` | Hero sections |
| `--radius-full` | `9999px` | Avatars, badges |

---

## 🧩 Component Specifications

### Cards

```css
/* Standard Card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  border-color: var(--color-border-accent);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

/* KPI Card */
.card-kpi {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.card-kpi .value {
  font-size: var(--text-kpi);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.card-kpi .trend-up {
  color: var(--color-success);
}

.card-kpi .trend-down {
  color: var(--color-error);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
}

.btn-primary:hover {
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--color-primary-light);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-ghost:hover {
  color: var(--color-text);
  background: var(--color-surface-elevated);
}
```

### Inputs

```css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  color: var(--color-text);
  font-size: 14px;
  transition: all 200ms ease;
}

.input::placeholder {
  color: var(--color-text-subtle);
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-glow);
}
```

### Sidebar Navigation

```css
.sidebar {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  width: 280px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.nav-item:hover {
  color: var(--color-text);
  background: var(--color-surface-elevated);
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-left: 3px solid var(--color-primary);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

### Tables (Financial Data)

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  font-variant-numeric: tabular-nums;
}

.table tr:hover {
  background: var(--color-surface-elevated);
}
```

---

## ✨ Animation Guidelines

### Timing

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `--duration-fast` | `150ms` | `ease-out` | Micro-interactions |
| `--duration-normal` | `200ms` | `ease` | Default transitions |
| `--duration-slow` | `300ms` | `ease-in-out` | Complex animations |

### Keyframes

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.5); }
}

@keyframes skeleton {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-surface-elevated) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🚫 Anti-Patterns (Do NOT Use)

### Visual

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide)
- ❌ **Pure black background** (`#000000`) — Use `#0B0F19` (dark blue-black)
- ❌ **Light backgrounds in dark mode** — Maintain dark theme consistency
- ❌ **Ornate/decorative design** — Keep it clean and data-focused
- ❌ **Multiple competing colors** — Emerald is the primary accent

### Interaction

- ❌ **Missing cursor:pointer** — All clickable elements must have it
- ❌ **Layout-shifting hovers** — Avoid scale transforms
- ❌ **Instant state changes** — Always use 150-300ms transitions
- ❌ **Animations > 500ms** — Keep UI snappy

### Accessibility

- ❌ **Low contrast text** — Minimum 4.5:1 ratio
- ❌ **Invisible focus states** — Must be visible for keyboard nav
- ❌ **Color-only indicators** — Use icons/text alongside colors
- ❌ **Missing alt text** — All images need descriptions

---

## ✅ Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG: Heroicons/Lucide)
- [ ] All icons from consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Emerald accent used consistently

### Interaction
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected

### Dark/Light Mode
- [ ] Dark mode: proper contrast maintained
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Glass effects visible in both modes
- [ ] Borders visible in both modes

### Layout
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] No content hidden behind fixed navbars
- [ ] Proper spacing hierarchy

### Data Display
- [ ] Tabular nums enabled for financial data
- [ ] Trends use semantic colors (green ↑, red ↓)
- [ ] Loading states with skeleton animations
- [ ] Error states clearly visible

---

## 📋 Tailwind Config Reference

```js
// tailwind.config.js colors extension
colors: {
  emerald: {
    50: 'rgba(16, 185, 129, 0.1)',
    100: 'rgba(16, 185, 129, 0.2)',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  dark: {
    bg: '#0B0F19',
    surface: '#111827',
    elevated: '#1F2937',
    border: '#1F2937',
  },
  light: {
    bg: '#F3F4F6',
    surface: '#FFFFFF',
    border: '#E5E7EB',
  }
}
```
