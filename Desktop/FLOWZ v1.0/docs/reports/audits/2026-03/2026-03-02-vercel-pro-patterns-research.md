# Recherche: Conventions & Patterns UI Vercel PRO 2026

> **Date:** 2026-03-02
> **Objectif:** Documenter les derniers patterns UI Vercel/Linear/Stripe pour mettre a jour le skill `vercel-ui-refactor-pro`
> **Sources:** Vercel Web Interface Guidelines, Geist Design System, shadcn/ui 2026, Linear Design Blog, Tailwind CSS v4, SaaS UI Trends 2026

---

## Table des matieres

1. [Vercel Web Interface Guidelines (2026)](#1-vercel-web-interface-guidelines-2026)
2. [Geist Design System](#2-geist-design-system)
3. [Linear Design Style](#3-linear-design-style)
4. [shadcn/ui 2026 Updates](#4-shadcnui-2026-updates)
5. [Tailwind CSS v4 Patterns](#5-tailwind-css-v4-patterns)
6. [SaaS UI Trends 2026](#6-saas-ui-trends-2026)
7. [Vercel Dashboard Redesign (Fev 2026)](#7-vercel-dashboard-redesign-fev-2026)
8. [React Server Components Patterns](#8-react-server-components-patterns)
9. [Synthese: Nouveaux patterns a integrer](#9-synthese-nouveaux-patterns-a-integrer)
10. [Impact sur le skill vercel-ui-refactor-pro](#10-impact-sur-le-skill-vercel-ui-refactor-pro)

---

## 1. Vercel Web Interface Guidelines (2026)

Source: [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | [vercel.com/design/guidelines](https://vercel.com/design/guidelines)

### 1.1 Interactions

| Regle | Detail | Statut dans notre skill |
|-------|--------|------------------------|
| **Hit targets >= 24px** (44px mobile) | Agrandir si visuel < 24px | NOUVEAU |
| **Input font >= 16px mobile** | Empeche auto-zoom iOS Safari | NOUVEAU |
| **Ne jamais disable zoom navigateur** | `user-scalable=yes` obligatoire | NOUVEAU |
| **Optimistic UI updates** | Mettre a jour UI immediatement, rollback en cas d'erreur | NOUVEAU |
| **Destructive = confirmation ou Undo** | Fenetre safe pour undo, jamais d'action irreversible immediate | NOUVEAU |
| **Spinners/skeletons: 150-300ms show-delay** | Ne pas afficher spinner instantanement, delai 150-300ms avant affichage | NOUVEAU |
| **Spinners: 300-500ms minimum duration** | Eviter flash de spinner trop rapide | NOUVEAU |
| **URL persiste state** | Filtres, tabs, pagination dans l'URL pour sharing/back | NOUVEAU |
| **touch-action: manipulation** | Empeche double-tap zoom | NOUVEAU |
| **overscroll-behavior: contain** | Pour modals/drawers, empeche scroll parent | NOUVEAU |
| **Tooltip delays** | Premier tooltip dans un groupe = delayed, suivants = instant | NOUVEAU |
| **Drag: disable text selection + inert** | Pendant drag, pas de selection/hover parasite | NOUVEAU |
| **`<a>`/`<Link>` pour navigation** | Cmd/Ctrl+Click, middle-click fonctionnent | DEJA COUVERT |
| **aria-live polite** | Pour toasts, updates async, validation | PARTIEL |
| **Deep-link filters, tabs, pagination** | useState dans l'URL | NOUVEAU |
| **Focus-visible > focus** | Eviter ring distrayant sur click souris | DEJA COUVERT |
| **Focus trap + restoration** | WAI-ARIA patterns pour modals | NOUVEAU |
| **Loading button = spinner + label original** | Ne pas remplacer le label, ajouter spinner | NOUVEAU |
| **Forgiving interactions** | Cibles genereueses, comportement previsible | NOUVEAU |

### 1.2 Animations

| Regle | Detail | Statut |
|-------|--------|--------|
| **Honor `prefers-reduced-motion`** | Variante reduite obligatoire | NOUVEAU - CRITIQUE |
| **Preference: CSS > Web Animations API > JS libs** | Privilegier CSS quand possible | NOUVEAU |
| **GPU-accelerated only** | `transform`, `opacity` uniquement. Eviter `width`, `height`, `top`, `left` | NOUVEAU |
| **Never `transition: all`** | Lister les proprietes explicitement | NOUVEAU |
| **Animations cancelable** | L'utilisateur peut interrompre par input | NOUVEAU |
| **Transform origin = point physique de depart** | Ancrer au bon endroit | NOUVEAU |
| **SVG: transformer sur `<g>` wrapper** | `transform-box: fill-box; transform-origin: center;` | NOUVEAU |
| **Animate = clarifier cause/effet ou delighter** | Pas d'animation gratuite | DEJA COUVERT |

### 1.3 Layout

| Regle | Detail | Statut |
|-------|--------|--------|
| **Optical alignment** | Ajuster +/-1px quand perception bat geometrie | NOUVEAU |
| **Deliberate alignment** | Chaque element aligne intentionnellement (grid, baseline, edge, center) | NOUVEAU |
| **Balance contrast in lockups** | Text + icons: equilibrer weight, size, spacing, color | NOUVEAU |
| **Responsive: mobile + laptop + ultra-wide** | Verifier zoom 50% pour ultra-wide | NOUVEAU |
| **CSS `env()` safe areas** | Pour notches mobiles | NOUVEAU |
| **Flex/grid/intrinsic > JS measurement** | Laisser CSS gerer le layout | NOUVEAU |
| **Eviter scrollbars excessives** | Fixer les overflow | NOUVEAU |

### 1.4 Content & States

| Regle | Detail | Statut |
|-------|--------|--------|
| **Skeletons = miroir exact du layout final** | Memes dimensions, pas de layout shift | DEJA COUVERT |
| **Inline help > tooltips** | Tooltips en dernier recours | NOUVEAU |
| **Toutes les states designees** | Empty, sparse, dense, error | PARTIEL |
| **`font-variant-numeric: tabular-nums`** | Pour comparaison de chiffres | NOUVEAU |
| **Curly quotes "" pas ""** | Typographie soignee | NOUVEAU |
| **Ellipsis character (…) pas (...)** | 1 caractere, pas 3 points | NOUVEAU |
| **Format dates/nombres per locale** | `Intl.DateTimeFormat`, `Intl.NumberFormat` | NOUVEAU |
| **Non-breaking spaces** | Units (`10 MB`), shortcuts (`Cmd + K`), noms (`Vercel SDK`) | NOUVEAU |
| **`<title>` reflete contexte** | Titre page = etat courant | NOUVEAU |
| **Chaque ecran offre next step ou recovery** | Pas de cul-de-sac | NOUVEAU |
| **Redundant status cues** | Ne pas se fier uniquement a la couleur | NOUVEAU |
| **Layouts handle short + long content** | Tester contenu minimal et maximal | NOUVEAU |
| **`scroll-margin-top` pour anchor links** | Compenser header sticky | NOUVEAU |

### 1.5 Forms

| Regle | Detail | Statut |
|-------|--------|--------|
| **Enter soumet si seul input ou dernier** | Comportement natif | NOUVEAU |
| **Cmd/Ctrl+Enter soumet dans textarea** | Enter = newline dans textarea | NOUVEAU |
| **Label clickable = focus input** | `htmlFor` obligatoire | DEJA COUVERT |
| **Submit toujours enabled** | Disable pendant flight + spinner + idempotency key | NOUVEAU |
| **Erreurs a cote du champ + focus premier** | Pas de banner generique en haut | NOUVEAU |
| **`autocomplete` correct** | Bon `name` pour autofill | NOUVEAU |
| **`inputmode` correct** | Meilleur clavier mobile | NOUVEAU |
| **Placeholder = signal de vide + ellipsis** | `sk-012345679…`, `+1 (123) 456-7890` | NOUVEAU |
| **Warn avant navigation si data non sauvee** | `beforeunload` | NOUVEAU |
| **Password manager compatible** | Autoriser paste sur codes | NOUVEAU |
| **Trim whitespace** | Sur remplacement/expansion de texte | NOUVEAU |

### 1.6 Performance

| Regle | Detail | Statut |
|-------|--------|--------|
| **POST/PATCH/DELETE < 500ms** | Latence reseau cible | NOUVEAU |
| **Minimize re-renders** | React DevTools / React Scan | COUVERT (skill react-best-practices) |
| **Virtualize large lists** | `virtua`, `content-visibility: auto` | NOUVEAU |
| **Preload above-fold images** | Lazy-load le reste | NOUVEAU |
| **Explicit image dimensions** | Empecher CLS | NOUVEAU |
| **Preconnect CDN** | `<link rel="preconnect">` | NOUVEAU |
| **Preload critical fonts** | Eviter flash/shift | NOUVEAU |
| **Subset fonts** | `unicode-range` pour reduire poids | NOUVEAU |
| **Web Workers** | Travail lourd hors main thread | NOUVEAU |

### 1.7 Design

| Regle | Detail | Statut |
|-------|--------|--------|
| **Layered shadows** | >= 2 couches (ambient + direct light) | NOUVEAU |
| **Semi-transparent borders** | Ameliore clarte des bords | DEJA COUVERT (ring-border/50) |
| **Nested radii** | Enfant <= parent, concentrique | NOUVEAU |
| **Hue consistency** | Teinter borders/shadows vers meme hue sur fond non-neutre | NOUVEAU |
| **Color-blind palettes** | Charts accessibles | NOUVEAU |
| **APCA > WCAG 2** | Contraste perceptuel, pas calcul WCAG classique | NOUVEAU |
| **Interactions = contraste accru** | hover/active/focus > rest state | DEJA COUVERT |
| **`<meta name="theme-color">`** | Aligner browser UI avec background | NOUVEAU |
| **`color-scheme: dark` sur `<html>`** | Scrollbars correctes en dark mode | NOUVEAU |
| **Avoid gradient banding** | Background images > CSS masks pour fade to dark | NOUVEAU |

### 1.8 Copywriting (Style Vercel)

| Regle | Detail |
|-------|--------|
| **Active voice** | "Install the CLI" pas "The CLI will be installed" |
| **Title Case** (headings/buttons) | Chicago style pour produit, sentence case pour marketing |
| **Prefer `&` over "and"** | Plus concis |
| **Second person** | "You" pas "I" |
| **Numerals** | "8 deployments" pas "eight deployments" |
| **Error = problem + solution** | Guide la sortie |
| **Positive framing** | Meme pour les erreurs |

---

## 2. Geist Design System

Source: [vercel.com/geist](https://vercel.com/geist/introduction) | [Figma Community](https://www.figma.com/community/file/1330020847221146106/geist-design-system-vercel)

### 2.1 Composants (50+)

**Core UI:** Avatar, Badge, Button, Checkbox, Input, Radio, Select, Switch, Textarea, Toggle
**Feedback:** Error, Loading Dots, Progress, Skeleton, Spinner, Toast (Sonner)
**Navigation:** Tabs, Menu, Pagination, Drawer, Modal, Sheet, Collapse
**Data:** Table, Description, Entity, Scroller
**Advanced:** Combobox, Command Menu (cmdk), Context Menu, Multi-Select, Calendar, Gauge, Slider
**Specialized:** Code Block, Keyboard Input, Status Dot, Tooltip, Relative Time Card

### 2.2 Typographie Geist

**Fonts:** Geist Sans (interface), Geist Mono (code), Geist Pixel (experimental/banners), Geist Serif (en cours)

| Style | Classe Tailwind | Usage |
|-------|----------------|-------|
| Heading 72 | `text-heading-72` | Marketing heroes |
| Heading 64 | `text-heading-64` | Landing sections |
| Heading 48 | `text-heading-48` | Feature titles |
| Heading 40 | `text-heading-40` | Section titles |
| Heading 32 | `text-heading-32` | Dashboard headings |
| Heading 24 | `text-heading-24` | Sub-sections |
| Heading 20 | `text-heading-20` | Card titles |
| Heading 16 | `text-heading-16` | Small headings |
| Heading 14 | `text-heading-14` | Micro headings |
| Button 16 | `text-button-16` | Large buttons |
| Button 14 | `text-button-14` | Default buttons |
| Button 12 | `text-button-12` | Tiny buttons |
| Label 20-12 | `text-label-{size}` | Labels, avec Strong/Mono variants |
| Label 13 | `text-label-13` | + Tabular variant pour chiffres |
| Copy 24-13 | `text-copy-{size}` | Body text, avec Strong variant |
| Copy 14 | `text-copy-14` | Most common body |
| Copy 13 Mono | `text-copy-13-mono` | Inline code |

**Modifier variants:** Subtle (texte secondaire), Strong (emphasis), Mono (code), Tabular (chiffres)

### 2.3 Couleurs

- Systeme haute-contraste accessible
- Gray scale semantique (gray-700 a gray-1000)
- Accents: blue, purple, pink, red, amber, green, teal
- Variants: alpha, background states
- Theming light/dark natif

### 2.4 Grid & Layout

- Grid responsive fondamental ("huge part of the new Vercel aesthetic")
- Breakpoints: xs, sm, smd, md, lg
- Alignement grid comme signature visuelle Vercel

### 2.5 Icones

- Set d'icones taillees pour developer tools
- Monochromes, minimales

---

## 3. Linear Design Style

Source: [linear.app/now/how-we-redesigned-the-linear-ui](https://linear.app/now/how-we-redesigned-the-linear-ui) | [LogRocket Blog](https://blog.logrocket.com/ux-design/linear-design/)

### 3.1 Principes fondamentaux

| Principe | Detail |
|----------|--------|
| **Linearite** | Flow sequentiel top-to-bottom, left-to-right, jamais de zig-zag |
| **Dark mode dominant** | Brand color a 1-10% lightness (pas noir pur) |
| **Densite d'information** | Maximum d'info dans minimum d'espace |
| **Typographie bold** | Polices distinctives, pas de sans-serif generiques |
| **Monochrome + accents surgicaux** | Couleur en quantite minimale, impact maximal |
| **Professional feel** | Interface qui "ressemble a un IDE" pour ingenieurs |

### 3.2 Theme Generation (nouveau 2026)

Linear a redesigne son systeme de themes:
- **3 variables au lieu de 98:** base color, accent color, contrast
- **LCH color space** pour gerer les elevations (background, foreground, panels, dialogs, modals)
- Texte et icones neutrales: plus sombres en light, plus claires en dark
- Font: Inter (dark gray sans-serif)

### 3.3 Techniques visuelles

| Technique | Implementation |
|-----------|---------------|
| **Gradients complexes** | Ajoutent profondeur sans clutter |
| **Glassmorphism subtil** | Effets glass raffines |
| **Micro-motion** | Animations minimales et fonctionnelles |
| **Textures abstraites** | Noisy overlays pour richesse subtile |
| **Reduction de couleur** | Palettes reduites = sophistication |
| **Typographie comme differentiation** | Plus bold, plus distinctive |

### 3.4 Couleurs recommandees

| Context | Valeurs |
|---------|---------|
| Background dark | `#121212` a `#1a1a1a` (off-black, jamais `#000000`) |
| Text dark mode | `#e0e0e0` a `#f0f0f0` (off-white) |
| Elevation | Lighter values (pas shadows) pour creer profondeur |
| Accents | Sparingly, bold, high contrast |

---

## 4. shadcn/ui 2026 Updates

Source: [ui.shadcn.com/docs/changelog](https://ui.shadcn.com/docs/changelog)

### 4.1 Nouveautes Fevrier 2026

| Feature | Detail | Impact |
|---------|--------|--------|
| **Blocks Radix + Base UI** | Login, signup, sidebar, dashboard blocks en Radix ET Base UI | Nouveau |
| **RTL support** | First-class right-to-left, composants auto-adapt | Nouveau |
| **Package radix-ui unifie** | `radix-ui` au lieu de `@radix-ui/react-*` individuels | Migration |
| **Charts (Recharts)** | 53 pre-built charts (line, bar, pie, area) | Dashboard patterns |
| **Sidebar collapsible** | Collapse natif + responsive | Navigation |
| **Sonner remplace Toast** | Toast deprecie, Sonner recommande | Migration |
| **Command Menu (cmdk)** | Command palette Vercel-style | Navigation |

### 4.2 Patterns Dashboard shadcn/ui

```
DataTable + Sidebar + Card + Chart = couverture complete dashboard
```

- **Atomic Design:** Tokens -> Atoms (Button, Input) -> Molecules (Card with actions) -> Organisms (Dashboard section)
- **States:** Default, Hover, Focus, Active/Selected, Error, Disabled pour CHAQUE composant
- **Registry:** Partage de composants/blocks/tokens via shadcn Registry

---

## 5. Tailwind CSS v4 Patterns

Source: [tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4)

### 5.1 Nouveautes majeures

| Feature | Detail | Impact |
|---------|--------|--------|
| **CSS-first config** | `@theme` dans CSS, plus de `tailwind.config.js` | Architecture |
| **Cascade layers** | `@layer` CSS natif | Specificity |
| **`@property` registered** | Custom properties typees | Theming |
| **`color-mix()`** | Melange de couleurs natif CSS | Couleurs |
| **Performance 5x-100x** | Full build 5x faster, incremental 100x | DX |
| **4 nouvelles palettes** | mauve, olive, mist, taupe (v4.2) | Couleurs |
| **Block-direction utilities** | Padding/margin/border logiques | i18n/RTL |
| **`not-*` variant** | Style elements qui ne matchent pas | Composants |
| **`field-sizing`** | Auto-resize textareas | Forms |
| **`inert` support** | Disable interactions sur zones | A11y |
| **Complex shadows** | Shadows multi-couches natives | Design |
| **Dark mode par defaut** | `@media (prefers-color-scheme: dark)` | Theming |

### 5.2 Migration

- `@tailwindcss/upgrade` codemod gere ~90% des changements
- Dark mode: configurer explicitement `darkMode: 'selector'` si class-based

---

## 6. SaaS UI Trends 2026

Sources: [landdding.com](https://landdding.com/blog/ui-design-trends-2026) | [f1studioz.com](https://f1studioz.com/blog/smart-saas-dashboard-design/) | [onething.design](https://www.onething.design/post/b2b-saas-ux-design)

### 6.1 Bento Grids (Modular Architecture)

- 67% des SaaS integrent des layouts cards modulaires
- Cards de tailles variees encodent la hierarchie visuelle
- Spacing coherent, corner radius unifie, structure interne coherente
- **Pattern:** Cards grandes pour KPIs principaux, petites pour metriques secondaires

### 6.2 Motion as Feedback

- **Micro-delight philosophy** — animations petites, fonctionnelles
- Chaque animation confirme une action ou guide l'attention
- Animations communiquent l'intelligence du systeme
- Reduisent hesitation, augmentent confiance

### 6.3 Dark Mode as Design Foundation

- 45% des nouveaux SaaS defaultent en dark
- Background off-black: `#121212` a `#1a1a1a`
- Text off-white: `#e0e0e0` a `#f0f0f0`
- Profondeur par elevation (lighter values) pas par shadows
- Meilleur contraste pour charts et data viz

### 6.4 Skeleton Loading

- **Mirror exact layout final** — memes dimensions
- Animation subtile pour indiquer activite
- Disparition progressive (pas tout d'un coup)
- **Show delay 150-300ms** pour eviter flash

### 6.5 Optimistic Updates

- Resultat attendu affiche AVANT confirmation serveur
- Rollback en cas d'erreur avec notification
- Error handling robuste obligatoire
- Pattern dominant pour actions CRUD

### 6.6 Progressive Disclosure

- **3-tier hierarchy:**
  - Primary: 5-7 metriques critiques, 80% des users, 0 clics
  - Secondary: Details on-demand (expand, hover, click)
  - Tertiary: Configuration avancee, settings
- Filtres dynamiques: basic -> contextual secondary filters
- Role-based interfaces: cacher la complexite non pertinente

### 6.7 Data Density

- **F-pattern** pour scanner rapidement
- Semantic color coding (pas seulement couleur, redundant cues)
- Visualisations appropriees au type de donnees
- **Insights intelligents** integres aux dashboards

### 6.8 AI Interface Conventions

- Streaming text output (SSE)
- Confidence indicators
- Source citations
- Regeneration options
- Preference controls pour personalisation

---

## 7. Vercel Dashboard Redesign (Fev 2026)

Source: [vercel.com/changelog](https://vercel.com/changelog/dashboard-navigation-redesign-rollout)

### 7.1 Changements cles

| Avant | Apres (Fev 2026) |
|-------|-------------------|
| Tabs horizontaux | **Sidebar resizable** |
| Navigation eclatee | **Sidebar unifie** team + project |
| Navigation fixe | **Quick navigation** (jump direct a n'importe quelle page) |
| Desktop-only | **Mobile: floating bottom bar** (one-handed use) |
| Switching team/project | **Projects as filters** (switch inline) |

### 7.2 Patterns a retenir

- **Sidebar collapsible + resizable** — pas un simple toggle
- **Quick navigation** — search bar dans sidebar pour jump direct
- **Projet comme filtre** — pas de context switch lourd
- **Mobile bottom bar flottante** — navigation mobile premium
- **Priorite workflows** — items reordonnes par frequence d'usage

---

## 8. React Server Components Patterns

Source: [patterns.dev/react/react-2026](https://www.patterns.dev/react/react-2026/)

### 8.1 Patterns 2026

| Pattern | Detail |
|---------|--------|
| **Server Components par defaut** | Tout est RSC sauf interaction explicite |
| **Client Islands** | Isoler l'interactivite en petits composants client imports dans RSC |
| **Server Components as props** | Passer RSC en prop a un Client Component pour nested server UI |
| **Server Actions** | Mutations structurees (form submit, data update) comme fonctions serveur |
| **Partial Prerendering** | Static shell + dynamic regions dans un seul route |
| **Cache Components** | Caching granulaire par composant |
| **Streaming** | Suspense boundaries pour streamer progressivement |

### 8.2 Impact sur l'UI

- Moins de JavaScript client = meilleure performance percue
- Skeleton/Suspense boundaries deviennent naturels
- Server-rendered data tables = pas de loading state client
- Formulaires via Server Actions = moins de useState/useEffect

---

## 9. Synthese: Nouveaux patterns a integrer

### 9.1 Patterns MANQUANTS dans notre skill actuel (priorite haute)

| # | Pattern | Source | Priorite |
|---|---------|--------|----------|
| 1 | **`prefers-reduced-motion`** support | Vercel Guidelines | CRITIQUE |
| 2 | **Hit targets >= 24px (44px mobile)** | Vercel Guidelines | HAUTE |
| 3 | **Spinner show-delay 150-300ms** | Vercel Guidelines | HAUTE |
| 4 | **Optimistic UI updates** | Vercel/SaaS Trends | HAUTE |
| 5 | **`font-variant-numeric: tabular-nums`** | Vercel Guidelines | HAUTE |
| 6 | **Nested border-radius** (enfant <= parent) | Vercel Guidelines | HAUTE |
| 7 | **`color-scheme: dark` sur `<html>`** | Vercel Guidelines | HAUTE |
| 8 | **`<meta name="theme-color">`** | Vercel Guidelines | MOYENNE |
| 9 | **Never `transition: all`** | Vercel Guidelines | HAUTE |
| 10 | **GPU-only animations** (transform, opacity) | Vercel Guidelines | HAUTE |
| 11 | **Layered shadows (2+ couches)** | Vercel Guidelines | MOYENNE |
| 12 | **Progressive disclosure 3-tier** | SaaS Trends 2026 | MOYENNE |
| 13 | **Bento grid / modular cards** | SaaS Trends 2026 | MOYENNE |
| 14 | **Command Menu (cmdk)** pattern | Vercel/shadcn | MOYENNE |
| 15 | **Sonner remplace Toast** | shadcn 2026 | HAUTE |
| 16 | **URL state persistence** | Vercel Guidelines | MOYENNE |
| 17 | **Sidebar collapsible/resizable** | Vercel Dashboard 2026 | MOYENNE |
| 18 | **Mobile floating bottom bar** | Vercel Dashboard 2026 | BASSE |
| 19 | **`scroll-margin-top` pour anchors** | Vercel Guidelines | BASSE |
| 20 | **`overscroll-behavior: contain`** modals | Vercel Guidelines | MOYENNE |
| 21 | **Form submit = always enabled** | Vercel Guidelines | HAUTE |
| 22 | **Loading button = spinner + label** | Vercel Guidelines | HAUTE |
| 23 | **Optical alignment (+/-1px)** | Vercel Guidelines | BASSE |
| 24 | **Content-visibility for long lists** | Vercel Guidelines/Perf | MOYENNE |
| 25 | **Geist Pixel font** pour banners/experimental | Geist DS | BASSE |
| 26 | **LCH color space** pour themes | Linear 2026 | BASSE |
| 27 | **Curly quotes + ellipsis char** | Vercel Copywriting | BASSE |

### 9.2 Patterns DEJA COUVERTS (confirmation)

- Dark gradient overlay sur cards premium
- Typography dense (10/11/13/15px)
- Monochrome icons
- ring-1 ring-border/50 pour borders subtiles
- CSS hover pour simple, Framer Motion pour complexe
- Skeletons miroir du layout final
- motionTokens.* centralize
- cn() obligatoire
- shadcn/ui components base
- Active nav monochrome
- Status dots
- Empty states

---

## 10. Impact sur le skill vercel-ui-refactor-pro

### 10.1 Sections a AJOUTER

#### A. Accessibility & Reduced Motion (NOUVEAU)
```tsx
// OBLIGATOIRE: Support prefers-reduced-motion
<motion.div
  variants={motionTokens.variants.slideUp}
  initial="hidden"
  animate="visible"
  // Ajouter systmatiquement:
  style={{ willChange: 'transform, opacity' }}
>

// CSS companion:
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### B. Hit Targets & Touch (NOUVEAU)
```tsx
// OBLIGATOIRE: boutons/liens >= 24px (44px mobile)
<button className="min-h-[44px] min-w-[44px] sm:min-h-6 sm:min-w-6">
// Ou padding genereux pour atteindre la cible

// Touch action
className="touch-action-manipulation"

// Overscroll pour modals/drawers
className="overscroll-contain"
```

#### C. Tabular Numbers (NOUVEAU)
```tsx
// OBLIGATOIRE pour tout affichage de chiffres/metriques
className="tabular-nums"
// Equivalent: font-variant-numeric: tabular-nums

// KPI values, table columns numeriques, counters
<span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
  {value}
</span>
```

#### D. Spinner Timing (NOUVEAU)
```tsx
// Spinner show-delay: 150-300ms avant affichage
// Spinner min-duration: 300-500ms une fois affiche

// Pattern CSS:
.spinner-delayed {
  animation: fadeIn 200ms ease-out 200ms both; /* 200ms delay */
}

// Pattern React:
const [showSpinner, setShowSpinner] = useState(false);
useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(timer);
  }
  setShowSpinner(false);
}, [isLoading]);
```

#### E. Loading Button Pattern (NOUVEAU)
```tsx
// CORRECT: spinner + label original visible
<Button disabled={isPending}>
  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
  {label}  {/* Garder le label, ne pas remplacer */}
</Button>

// INTERDIT: remplacer label par "Loading..."
<Button>{isPending ? 'Loading...' : label}</Button>
```

#### F. Nested Border Radius (NOUVEAU)
```tsx
// Enfant <= parent, concentrique
// Card: rounded-xl (12px) -> contenu interne: rounded-lg (8px)
// Modal: rounded-2xl (16px) -> cards internes: rounded-xl (12px)

// Formule: child_radius = parent_radius - parent_padding
```

#### G. Theme Color Meta (NOUVEAU)
```tsx
// Dans layout.tsx / head
<meta name="theme-color" content="#000000" />
// + color-scheme sur html
<html style={{ colorScheme: 'dark' }}>
```

#### H. Never Transition All (NOUVEAU)
```tsx
// INTERDIT
className="transition-all"

// CORRECT: lister les proprietes
className="transition-colors"        // couleurs uniquement
className="transition-opacity"       // opacite uniquement
className="transition-transform"     // transform uniquement
className="transition-[color,opacity,transform]"  // combo explicite
```

#### I. Sonner Toast Pattern (NOUVEAU)
```tsx
// OBLIGATOIRE: Sonner au lieu de Toast
import { toast } from 'sonner'

// Success
toast.success('Modifications sauvegardees')

// Error avec description
toast.error('Erreur de sauvegarde', {
  description: 'Verifiez votre connexion et reessayez.'
})

// Promise pattern
toast.promise(saveData(), {
  loading: 'Sauvegarde en cours...',
  success: 'Sauvegarde reussie',
  error: 'Erreur de sauvegarde'
})
```

#### J. Command Menu Pattern (NOUVEAU)
```tsx
// Pattern cmdk pour navigation rapide
<CommandDialog>
  <CommandInput placeholder="Rechercher..." />
  <CommandList>
    <CommandEmpty>Aucun resultat</CommandEmpty>
    <CommandGroup heading="Pages">
      <CommandItem>Dashboard</CommandItem>
      <CommandItem>Products</CommandItem>
    </CommandGroup>
    <CommandGroup heading="Actions">
      <CommandItem>Create Product</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### 10.2 Sections a ENRICHIR

#### Audit Grid (ajouter ces checks)
```
| Tabular nums pour chiffres | tabular-nums sur KPIs, tables | /5 |
| Hit targets >= 24px | Boutons, liens, zones cliquables | /5 |
| prefers-reduced-motion | Variante reduite testee | /5 |
| transition-all interdit | Properties explicites | /5 |
| Nested radii coherents | Enfant <= parent | /5 |
```

#### Anti-patterns (ajouter)
```
| `transition-all` | `transition-colors` / explicit | GPU perf |
| Button label remplace par "Loading..." | Spinner + label original | UX |
| Spinner affiche instantanement | Show-delay 200ms | Perceptual perf |
| Chiffres sans tabular-nums | `tabular-nums` class | Alignement |
| Modal sans overscroll-contain | `overscroll-contain` | Scroll leak |
| Hit target < 24px | Min 24px (44px mobile) | Touch |
```

#### Checklist Finale (ajouter)
```
### Performance Perceptuelle
- [ ] Spinners avec show-delay (150-300ms)
- [ ] Loading buttons: spinner + label original
- [ ] tabular-nums sur tous les chiffres/metriques
- [ ] transition-all remplace par properties explicites

### Responsive & Touch
- [ ] Hit targets >= 24px (44px mobile)
- [ ] touch-action: manipulation sur elements interactifs
- [ ] overscroll-behavior: contain sur modals/drawers
- [ ] Input font >= 16px mobile

### Theme & Meta
- [ ] color-scheme: dark sur <html>
- [ ] <meta name="theme-color"> aligne avec background
- [ ] prefers-reduced-motion respecte

### Navigation
- [ ] Sonner au lieu de Toast
- [ ] Command Menu (cmdk) pour navigation rapide
- [ ] URL persiste filtres/tabs/pagination
```

---

## Sources

- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
- [GitHub: vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- [Geist Design System](https://vercel.com/geist/introduction)
- [Geist Typography](https://vercel.com/geist/typography)
- [Geist Pixel Font](https://vercel.com/blog/introducing-geist-pixel)
- [Vercel Dashboard Redesign](https://vercel.com/changelog/dashboard-navigation-redesign-rollout)
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog)
- [shadcn/ui Charts](https://ui.shadcn.com/docs/components/radix/chart)
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Design Trend - LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [UI Design Trends 2026 - Landdding](https://landdding.com/blog/ui-design-trends-2026)
- [SaaS Dashboard Design - F1Studioz](https://f1studioz.com/blog/smart-saas-dashboard-design/)
- [B2B SaaS UX 2026 - Onething Design](https://www.onething.design/post/b2b-saas-ux-design)
- [React 2026 Patterns](https://www.patterns.dev/react/react-2026/)
- [Stripe Apps Design Patterns](https://docs.stripe.com/stripe-apps/patterns)
- [Vercel Academy - shadcn/ui](https://vercel.com/academy/shadcn-ui/extending-shadcn-ui-with-custom-components)
- [cmdk - Command Menu](https://github.com/pacocoursey/cmdk)
- [Vercel Geist Empty State](https://vercel.com/geist/empty-state)
