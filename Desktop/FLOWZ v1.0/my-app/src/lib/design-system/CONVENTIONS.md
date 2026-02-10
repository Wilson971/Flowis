# FLOWZ Design Conventions

> **Source unique de verte pour tout composant, style, animation et layout du projet.**
> Ce fichier est contractuel. Tout code qui ne respecte pas ces conventions doit etre refactore.

---

## Table des matieres

1. [Principes fondamentaux](#1-principes-fondamentaux)
2. [Couleurs et Theming](#2-couleurs-et-theming)
3. [Typographie](#3-typographie)
4. [Spacing et Layout](#4-spacing-et-layout)
5. [Composants](#5-composants)
6. [Motion Design (Framer Motion)](#6-motion-design-framer-motion)
7. [CSS et Tailwind](#7-css-et-tailwind)
8. [Z-Index](#8-z-index)
9. [Responsive](#9-responsive)
10. [Accessibilite](#10-accessibilite)
11. [Regles strictes / Interdictions](#11-regles-strictes--interdictions)

---

## 1. Principes fondamentaux

### 1.1 Hierarchie des imports design

```typescript
// ORDRE OBLIGATOIRE des imports design dans chaque composant :
import { cn } from '@/lib/utils'
import { styles, motionTokens, typographyTokens } from '@/lib/design-system'

// composants shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
```

### 1.2 Source unique des tokens

| Token | Source | Import |
|-------|--------|--------|
| Couleurs | CSS variables (`_semantic.css`) | Via Tailwind classes |
| Typographie | `tokens/typography.ts` | `typographyTokens.scale.*` |
| Motion | `tokens/motion.ts` | `motionTokens.variants.*` |
| Cards | `tokens/cards.ts` | `cardTokens.*` |
| Badges | `tokens/badges.ts` | `badgeTokens.*` |
| Styles CSS | `styles.ts` | `styles.card.*`, `styles.text.*` |

### 1.3 Fichier legacy a NE PAS utiliser

```typescript
// INTERDIT - fichier legacy, ne pas importer
import { staggerContainer, fadeIn } from '@/lib/motion'  // <-- NON

// CORRECT - toujours utiliser le design system
import { motionTokens } from '@/lib/design-system'       // <-- OUI
```

---

## 2. Couleurs et Theming

### 2.1 Regles absolues

**JAMAIS de couleurs hardcodees.** Utiliser exclusivement les CSS variables semantiques.

```typescript
// INTERDIT
className="text-[#96bf48]"
className="bg-[#0A0B0E]"
className="text-slate-300"
className="text-red-500"
className="from-primary to-[#4285f4]"
style={{ color: '#ffffff' }}

// CORRECT
className="text-foreground"
className="bg-background"
className="text-muted-foreground"
className="text-destructive"
className="text-primary"
```

### 2.2 Palette semantique

| Usage | Classe Tailwind | Variable CSS |
|-------|----------------|--------------|
| Fond principal | `bg-background` | `--background` |
| Fond carte | `bg-card` | `--card` |
| Fond muted | `bg-muted` | `--muted` |
| Texte principal | `text-foreground` | `--foreground` |
| Texte secondaire | `text-muted-foreground` | `--muted-foreground` |
| Texte carte | `text-card-foreground` | `--card-foreground` |
| Bordure | `border-border` | `--border` |
| Primaire | `bg-primary` / `text-primary` | `--primary` |
| Destructif | `bg-destructive` / `text-destructive` | `--destructive` |

### 2.3 Couleurs de statut

```typescript
// Utiliser UNIQUEMENT ces tokens de statut
className="text-success"         // Succes (vert)
className="text-warning"         // Avertissement (ambre)
className="text-destructive"     // Erreur (rouge)
className="text-info"            // Information (bleu)
className="text-muted-foreground" // Neutre
```

### 2.4 Couleurs de plateformes

Pour les couleurs specifiques aux plateformes (Shopify, WooCommerce, etc.), utiliser des CSS variables dediees :

```css
/* A definir dans _semantic.css */
--platform-shopify: #96bf48;
--platform-woocommerce: #9b5c8f;
--platform-wordpress: #21759b;
```

### 2.5 Opacites

```typescript
// INTERDIT
className="bg-white/[0.02]"
className="ring-white/5"

// CORRECT - utiliser les niveaux d'opacite standard
className="bg-card/50"           // 50%
className="bg-muted/50"          // 50%
className="border-border/40"     // 40%
className="bg-primary/15"        // 15% (pour badges)
className="bg-primary/10"        // 10% (pour backgrounds subtils)
```

Niveaux d'opacite autorises : `/5`, `/10`, `/15`, `/20`, `/30`, `/40`, `/50`, `/60`, `/70`, `/80`, `/90`

---

## 3. Typographie

### 3.1 Echelle typographique obligatoire

Utiliser **exclusivement** les classes du design system. Jamais de tailles arbitraires.

| Token | Taille | Usage | Classe CSS |
|-------|--------|-------|------------|
| `display2xl` | 72px | Hero titre | `text-6xl font-bold leading-tight tracking-tight` |
| `displayXl` | 60px | Landing sections | `text-5xl font-bold leading-tight tracking-tight` |
| `displayLg` | 48px | Feature titles | `text-4xl font-bold leading-tight tracking-tight` |
| `heading1` | 36px | Page titles | `text-3xl font-semibold leading-tight tracking-tight` |
| `heading2` | 30px | Section titles | `text-2xl font-semibold leading-tight tracking-tight` |
| `heading3` | 24px | Sub-section titles | `text-xl font-semibold leading-snug tracking-tight` |
| `heading4` | 20px | Card titles | `text-lg font-semibold leading-snug tracking-tight` |
| `heading5` | 18px | Widget titles | `text-base font-semibold` |
| `heading6` | 16px | Small titles | `text-sm font-semibold leading-snug` |
| `bodyLg` | 18px | Grande description | `text-lg leading-relaxed` |
| `bodyBase` | 16px | Corps principal | `text-base leading-relaxed` |
| `bodySm` | 14px | Corps compact | `text-sm leading-relaxed` |
| `bodyXs` | 12px | Notes, details | `text-xs leading-relaxed` |
| `labelLg` | 14px | Labels formulaires | `text-sm font-medium leading-none` |
| `labelBase` | 12px | Labels secondaires | `text-xs font-medium leading-none` |
| `labelSm` | 10px | Micro-labels | `text-[10px] font-medium leading-none uppercase tracking-wide` |
| `caption` | 12px | Legendes | `text-xs leading-relaxed` |

### 3.2 Usage rapide via styles.ts

```typescript
import { styles } from '@/lib/design-system'

// Headings
<h1 className={styles.text.h1}>Titre de page</h1>        // text-3xl font-bold tracking-tight
<h2 className={styles.text.h2}>Section</h2>               // text-2xl font-bold tracking-tight
<h3 className={styles.text.h3}>Sous-section</h3>          // text-xl font-semibold
<h4 className={styles.text.h4}>Carte</h4>                 // text-lg font-semibold

// Body
<p className={styles.text.body}>Texte normal</p>          // text-sm text-foreground
<p className={styles.text.bodyMuted}>Texte muted</p>      // text-sm text-muted-foreground
<p className={styles.text.bodySmall}>Petit texte</p>      // text-xs text-muted-foreground

// Labels
<label className={styles.text.label}>Label</label>        // text-sm font-medium
<span className={styles.text.labelSmall}>LABEL</span>     // text-xs font-medium uppercase tracking-wider
```

### 3.3 Interdictions typographiques

```typescript
// INTERDIT - tailles arbitraires
className="text-[11px]"
className="text-[13px]"
className="text-[10px] font-bold"
className="text-3xl font-bold tracking-tight"  // utiliser styles.text.h1

// CORRECT
className={styles.text.labelSmall}  // pour 10px
className={styles.text.bodySmall}   // pour 12px
className={styles.text.body}        // pour 14px
```

### 3.4 Fonts

| Usage | Font | Classe |
|-------|------|--------|
| Interface (defaut) | Inter | `font-sans` |
| Titres d'impact | Space Grotesk | `font-heading` |
| Code | Geist Mono | `font-mono` |

---

## 4. Spacing et Layout

### 4.1 Echelle de spacing (base 4px)

| Token | Valeur | Usage |
|-------|--------|-------|
| `space-1` | 4px | Gap intra-composant |
| `space-2` | 8px | Gap compact entre elements |
| `space-3` | 12px | Gap default entre elements |
| `space-4` | 16px | Gap standard (default) |
| `space-5` | 20px | Gap medium |
| `space-6` | 24px | Gap entre sections dans une carte |
| `space-8` | 32px | Gap entre sections de page |
| `space-10` | 40px | Gap entre blocs majeurs |
| `space-12` | 48px | Gap entre sections de page |
| `space-16` | 64px | Gap entre sections landing |

### 4.2 Regles de padding des cartes

**Convention stricte pour les Cards :**

| Type de carte | Padding | Classe |
|---------------|---------|--------|
| Card standard | 24px (p-6) | `p-6` |
| Card compacte | 16px (p-4) | `p-4` |
| CardHeader | `p-6 pb-0` | shadcn default |
| CardContent | `p-6 pt-4` | `p-6 pt-4` |
| Card premium/CTA | 24px (p-6) | `p-6` |

```typescript
// INTERDIT
className="p-5"  // pas dans l'echelle standard

// CORRECT
className="p-4"  // compact
className="p-6"  // standard
```

### 4.3 Layouts de page

```typescript
import { styles } from '@/lib/design-system'

// Page container
<div className={styles.layout.pageContainer}>  // container mx-auto px-4 py-6

// Sections
<section className={styles.layout.section}>    // space-y-6

// Grids
<div className={styles.layout.gridCols2}>      // grid grid-cols-1 md:grid-cols-2 gap-4
<div className={styles.layout.gridCols3}>      // grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
<div className={styles.layout.gridCols4}>      // grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4

// Flex patterns
<div className={styles.layout.flexBetween}>    // flex items-center justify-between
<div className={styles.layout.flexCenter}>     // flex items-center justify-center
<div className={styles.layout.flexStart}>      // flex items-center gap-2
<div className={styles.layout.flexCol}>        // flex flex-col gap-4
```

### 4.4 Gap vs Space-y

| Situation | Utiliser | Exemple |
|-----------|----------|---------|
| Flex/Grid children | `gap-*` | `flex gap-4` |
| Stacked elements | `space-y-*` | `space-y-6` |
| Sections de page | `space-y-6` ou `space-y-8` | Section principale |
| Elements dans une carte | `space-y-4` | Champs de formulaire |
| Elements tres proches | `gap-2` | Icone + texte |

### 4.5 Border Radius

| Element | Radius | Classe |
|---------|--------|--------|
| Boutons | 8px | `rounded-lg` |
| Cartes | 12px | `rounded-xl` |
| Inputs | 8px | `rounded-lg` |
| Badges | 9999px | `rounded-full` |
| Modals/Sheets | 16px | `rounded-2xl` |
| Avatars | 9999px | `rounded-full` |
| Tooltips | 8px | `rounded-lg` |
| Popovers | 12px | `rounded-xl` |

```typescript
// INTERDIT
className="rounded-[1.2em]"  // valeur custom
className="rounded-md"        // pas dans la convention

// CORRECT
className="rounded-lg"   // 8px - boutons, inputs
className="rounded-xl"   // 12px - cartes
className="rounded-2xl"  // 16px - modals
className="rounded-full"  // pill - badges, avatars
```

---

## 5. Composants

### 5.1 Card Pattern

```typescript
// Pattern standard pour toute carte
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'

// Card standard
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>

// Card interactive (hover)
<Card className={cn(styles.card.interactive)}>
  ...
</Card>

// Card avec elevation
<Card className={cn(styles.card.elevated)}>
  ...
</Card>

// Card glass
<Card className={cn(styles.card.glass)}>
  ...
</Card>
```

### 5.2 Variantes de Card autorisees

| Variante | Classe | Usage |
|----------|--------|-------|
| `base` | `bg-card border border-border rounded-lg` | Default |
| `elevated` | `+ shadow-md` | Mise en avant |
| `glass` | `bg-card/80 backdrop-blur-xl border-border/40 rounded-xl` | Premium |
| `interactive` | `+ hover:bg-muted/50` | Cliquable |
| `lift` | `+ hover:-translate-y-0.5 hover:shadow-lg` | Liste de cartes |
| `flat` | `bg-muted/50 rounded-lg` | Fond neutre |

### 5.3 Button Variants

Utiliser exclusivement les variantes shadcn/ui :

| Variant | Usage |
|---------|-------|
| `default` | Action principale |
| `secondary` | Action secondaire |
| `outline` | Action tertiaire |
| `ghost` | Actions subtiles, navigation |
| `destructive` | Actions dangereuses |
| `link` | Liens textuels |

```typescript
// CORRECT
<Button variant="default">Sauvegarder</Button>
<Button variant="outline" size="sm">Annuler</Button>
<Button variant="ghost" size="icon"><Settings /></Button>

// INTERDIT - ne pas creer de variants custom inline
<button className="bg-gradient-to-r from-emerald-500 ...">
```

### 5.4 Badge Variants

Utiliser les presets du design system :

```typescript
import { getBadgeClasses, badgePresets } from '@/lib/design-system/tokens'

// Via presets
const badge = badgePresets.synced    // { label, variant, iconName }
const badge = badgePresets.draft
const badge = badgePresets.published

// Via variantes directes
<Badge variant="success">Actif</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="destructive">Erreur</Badge>
<Badge variant="outline">Brouillon</Badge>
```

### 5.5 Icon Pattern

```typescript
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'

// Container standard
<div className={cn(styles.iconContainer.md, styles.iconContainer.muted)}>
  <Icon className="h-5 w-5 text-muted-foreground" />
</div>

// Container primary
<div className={cn(styles.iconContainer.md, styles.iconContainer.primary)}>
  <Icon className="h-5 w-5" />
</div>
```

Tailles d'icones standard :

| Taille | Classes | Usage |
|--------|---------|-------|
| XS | `h-3.5 w-3.5` | Dans les badges, labels |
| SM | `h-4 w-4` | Inline avec texte |
| MD | `h-5 w-5` | Boutons, listes |
| LG | `h-6 w-6` | Titres de section |
| XL | `h-8 w-8` | Illustrations, empty states |

---

## 6. Motion Design (Framer Motion)

### 6.1 Source unique

**TOUJOURS** importer depuis `@/lib/design-system` :

```typescript
import { motionTokens } from '@/lib/design-system'

// OU destructurer
import { variants, transitions, durations, easings } from '@/lib/design-system'
```

### 6.2 Variants disponibles et leur usage

#### Fade

```typescript
// Fade simple - elements textuels, conteneurs
<motion.div variants={motionTokens.variants.fadeIn} initial="hidden" animate="visible">

// Fade + scale - modals, popovers
<motion.div variants={motionTokens.variants.fadeInScale} initial="hidden" animate="visible">
```

#### Slide

```typescript
// Slide up - contenu de page, cartes (DEFAUT pour entree de composants)
<motion.div variants={motionTokens.variants.slideUp} initial="hidden" animate="visible">

// Slide down - notifications, dropdowns
<motion.div variants={motionTokens.variants.slideDown} initial="hidden" animate="visible">

// Slide left - sidebars, panels depuis la gauche
<motion.div variants={motionTokens.variants.slideLeft} initial="hidden" animate="visible">

// Slide right - panels depuis la droite
<motion.div variants={motionTokens.variants.slideRight} initial="hidden" animate="visible">
```

#### Stagger (listes et grids)

```typescript
// Pattern obligatoire pour listes/grids
<motion.div variants={motionTokens.variants.staggerContainer} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={motionTokens.variants.staggerItem}>
      <Card>...</Card>
    </motion.div>
  ))}
</motion.div>
```

#### Modal/Overlay

```typescript
// Backdrop
<motion.div variants={motionTokens.variants.backdrop} initial="hidden" animate="visible" exit="exit">

// Modal content
<motion.div variants={motionTokens.variants.modal} initial="hidden" animate="visible" exit="exit">

// Dropdown
<motion.div variants={motionTokens.variants.dropdown} initial="hidden" animate="visible" exit="exit">

// Tooltip
<motion.div variants={motionTokens.variants.tooltip} initial="hidden" animate="visible" exit="exit">
```

#### Interactive

```typescript
// Boutons et elements cliquables
<motion.button whileTap={motionTokens.variants.tap}>

// Cards avec lift
<motion.div whileHover={motionTokens.variants.hoverLift}>

// Cards avec scale
<motion.div whileHover={motionTokens.variants.hoverScale}>
```

### 6.3 Transitions autorisees

| Transition | Duration | Easing | Usage |
|------------|----------|--------|-------|
| `transitions.default` | 300ms | smooth | Defaut pour tout |
| `transitions.fast` | 200ms | snap | Micro-interactions |
| `transitions.slow` | 400ms | smooth | Emphasis, modals |
| `transitions.spring` | spring | 300/25 | Elements physiques |
| `transitions.gentleSpring` | spring | 200/20 | Mouvements subtils |

### 6.4 Regles de motion

```typescript
// INTERDIT - durations hardcodees
transition={{ duration: 0.4 }}
transition={{ duration: 0.5 }}
transition={{ duration: 0.8, ease: 'easeOut' }}

// CORRECT
transition={motionTokens.transitions.default}   // 300ms
transition={motionTokens.transitions.fast}       // 200ms
transition={motionTokens.transitions.slow}       // 400ms

// INTERDIT - variants locaux
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
}

// CORRECT - utiliser les variants du design system
variants={motionTokens.variants.fadeIn}
variants={motionTokens.variants.slideUp}
variants={motionTokens.variants.staggerContainer}
```

### 6.5 Spring presets

```typescript
// INTERDIT - springs ad-hoc
transition={{ type: 'spring', stiffness: 400, damping: 30 }}
transition={{ type: 'spring', bounce: 0.5 }}

// CORRECT
transition={motionTokens.transitions.spring}        // stiffness: 300, damping: 25
transition={motionTokens.transitions.gentleSpring}   // stiffness: 200, damping: 20
```

### 6.6 Stagger delays

```typescript
// INTERDIT
transition={{ delay: i * 0.2 }}
staggerChildren: 0.1

// CORRECT
staggerChildren: motionTokens.staggerDelays.normal  // 0.08
delay: i * motionTokens.staggerDelays.normal         // 0.08

// Si besoin de custom stagger
import { createStaggerContainer, createStaggerItem } from '@/lib/design-system'
const container = createStaggerContainer(motionTokens.staggerDelays.slow)
```

### 6.7 AnimatePresence

```typescript
// Toujours wrapper avec AnimatePresence pour les animations de sortie
import { AnimatePresence } from 'framer-motion'

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="unique-key"
      variants={motionTokens.variants.fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

### 6.8 Pattern complet d'une page animee

```typescript
'use client'

import { motion } from 'framer-motion'
import { motionTokens } from '@/lib/design-system'

export function MyPage() {
  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <h1 className={styles.text.h1}>Page Title</h1>
      </motion.div>

      {/* Grid de cartes */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <div className={styles.layout.gridCols3}>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              variants={motionTokens.variants.staggeredSlideUp}
              custom={i}
            >
              <Card className={styles.card.lift}>
                ...
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
```

### 6.9 Quand utiliser CSS vs Framer Motion

| Situation | Utiliser | Raison |
|-----------|----------|--------|
| Hover/focus states simples | CSS (Tailwind) | Performance |
| Color transitions | CSS (Tailwind) | GPU-optimized |
| Entree/sortie de composants | Framer Motion | AnimatePresence |
| Listes staggered | Framer Motion | Orchestration |
| Scroll-triggered | Framer Motion | `whileInView` |
| Loading spinners | CSS (`animate-spin`) | Leger |
| Skeleton loading | CSS (`animate-pulse`) | Leger |
| Page transitions | Framer Motion | Orchestration complexe |
| Drag & drop | Framer Motion | Gestures |

---

## 7. CSS et Tailwind

### 7.1 Ordre des classes Tailwind

Suivre cet ordre dans chaque `className` :

```
1. Layout       : flex, grid, block, inline-flex
2. Position     : relative, absolute, fixed, sticky
3. Sizing       : w-*, h-*, min-*, max-*
4. Spacing      : p-*, m-*, gap-*
5. Typography   : text-*, font-*, leading-*, tracking-*
6. Visual       : bg-*, border-*, rounded-*, shadow-*
7. Effects      : opacity-*, backdrop-*
8. Transitions  : transition-*, duration-*
9. States       : hover:*, focus:*, active:*
10. Responsive  : sm:*, md:*, lg:*
```

### 7.2 Utilisation de cn()

**Toujours** utiliser `cn()` pour combiner des classes :

```typescript
import { cn } from '@/lib/utils'

// Combination conditionnelle
<div className={cn(
  styles.card.base,
  isActive && 'border-primary',
  className
)}>

// INTERDIT
<div className={`${styles.card.base} ${isActive ? 'border-primary' : ''}`}>
```

### 7.3 Regles CSS strictes

```typescript
// INTERDIT - inline styles
style={{ backgroundColor: '#000', padding: '20px' }}
style={{ backgroundImage: 'linear-gradient(...)' }}

// EXCEPTIONS autorisees pour inline styles :
// - Valeurs dynamiques calculees (width en %, transform custom)
// - SVG attributes (strokeDashoffset, etc.)
// - Gradients complexes generes dynamiquement
style={{ width: `${progress}%` }}                    // OK
style={{ strokeDashoffset: calculatedValue }}         // OK

// INTERDIT - classes Tailwind arbitraires avec couleurs
className="text-[#ff0000]"
className="bg-[rgba(0,0,0,0.5)]"

// CORRECT
className="text-destructive"
className="bg-background/50"
```

### 7.4 Shadows

| Niveau | Classe | Usage |
|--------|--------|-------|
| Aucun | (rien) | Cartes flat |
| Subtil | `shadow-sm` | Inputs focus |
| Default | `shadow-md` | Cartes elevated |
| Fort | `shadow-lg` | Dropdowns, popovers |
| Intense | `shadow-xl` | Modals |
| Glow | `shadow-glow-sm` | CTA premium |

```typescript
// INTERDIT
className="shadow-[0_0_15px_rgba(16,185,129,0.2)]"

// CORRECT
className="shadow-md"
className="shadow-glow-sm"
```

---

## 8. Z-Index

### 8.1 Echelle z-index

| Layer | Valeur | Usage |
|-------|--------|-------|
| Base | `z-0` | Contenu normal |
| Elevated | `z-10` | Cartes superposees, sticky elements |
| Dropdown | `z-20` | Menus deroulants, popovers |
| Sticky | `z-30` | Headers sticky, barres de navigation |
| Overlay | `z-40` | Backdrops, overlays |
| Modal | `z-50` | Modals, sheets, dialogs |
| Toast | `z-[60]` | Notifications toast |
| Tooltip | `z-[70]` | Tooltips (toujours au-dessus) |

```typescript
// INTERDIT
className="z-[9999]"
className="z-[100]"

// CORRECT
className="z-50"    // modal
className="z-[60]"  // toast (seule exception avec valeur custom)
className="z-[70]"  // tooltip
```

---

## 9. Responsive

### 9.1 Breakpoints

| Breakpoint | Largeur | Usage |
|------------|---------|-------|
| (defaut) | < 640px | Mobile-first base |
| `sm:` | >= 640px | Mobile paysage |
| `md:` | >= 768px | Tablettes |
| `lg:` | >= 1024px | Desktop |
| `xl:` | >= 1280px | Large desktop |
| `2xl:` | >= 1536px | Ultra-wide |

### 9.2 Patterns responsive

```typescript
// Grids
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Texte
className="text-2xl md:text-3xl lg:text-4xl"

// Spacing
className="px-4 md:px-6 lg:px-8"

// Visibilite
className="hidden md:block"      // Visible seulement sur desktop
className="block md:hidden"      // Visible seulement sur mobile
```

---

## 10. Accessibilite

### 10.1 Regles obligatoires

```typescript
// Focus visible sur tous les elements interactifs
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

// Labels pour tous les inputs
<Label htmlFor="email">Email</Label>
<Input id="email" />

// Alt text pour toutes les images
<img alt="Description de l'image" />

// ARIA pour les elements dynamiques
<div role="alert" aria-live="polite">
<button aria-label="Fermer" aria-expanded={isOpen}>
```

### 10.2 Contraste minimum

- Texte normal : ratio 4.5:1 minimum
- Texte large (>= 18px bold ou >= 24px) : ratio 3:1 minimum
- Elements UI interactifs : ratio 3:1 minimum

---

## 11. Regles strictes / Interdictions

### 11.1 INTERDICTIONS ABSOLUES

| Interdit | Raison | Alternative |
|----------|--------|-------------|
| `import from '@/lib/motion'` | Fichier legacy | `import from '@/lib/design-system'` |
| `text-[Npx]` avec N arbitraire | Hors echelle | Utiliser les tokens typographiques |
| `bg-[#hex]` / `text-[#hex]` | Couleur hardcodee | Variables CSS semantiques |
| `transition={{ duration: N }}` inline | Duration non-standardisee | `motionTokens.transitions.*` |
| Variants de motion locaux | Non reutilisable | `motionTokens.variants.*` |
| `rounded-md` | Pas dans la convention | `rounded-lg` (8px) |
| `p-5` | Pas dans l'echelle standard | `p-4` ou `p-6` |
| `shadow-[custom]` | Shadow arbitraire | Utiliser l'echelle de shadows |
| `z-[9999]` / `z-[100]` | Z-index anarchique | Suivre l'echelle z-index |
| `style={{ color: '...' }}` | Inline styles | Classes Tailwind |
| Springs ad-hoc | Parametres inconstants | `transitions.spring` / `gentleSpring` |

### 11.2 Checklist avant PR

- [ ] Aucune couleur hardcodee (`#hex`, `rgb(...)`, couleurs Tailwind raw comme `slate-*`)
- [ ] Aucune taille typographique arbitraire
- [ ] Aucun import de `@/lib/motion`
- [ ] Aucun variant Framer Motion defini localement
- [ ] Aucune duration/easing hardcodee
- [ ] Toutes les cartes utilisent les composants shadcn Card
- [ ] Tous les boutons utilisent les variantes shadcn Button
- [ ] `cn()` utilise pour toute combinaison de classes
- [ ] Responsive mobile-first
- [ ] Focus visible sur les elements interactifs
- [ ] Z-index respecte l'echelle definie

---

## Quick Reference Card

```
IMPORTS
  cn()            -> @/lib/utils
  styles          -> @/lib/design-system
  motionTokens    -> @/lib/design-system
  UI components   -> @/components/ui/*

CARDS
  Standard        -> styles.card.base
  Elevated        -> styles.card.elevated
  Interactive     -> styles.card.interactive
  Glass           -> styles.card.glass

MOTION (entrees)
  Page/Section    -> variants.slideUp
  Listes          -> variants.staggerContainer + staggerItem
  Modal           -> variants.modal + variants.backdrop
  Micro           -> transitions.fast
  Default         -> transitions.default

SPACING
  Intra-element   -> gap-2
  Elements        -> gap-4
  Sections carte  -> space-y-4
  Sections page   -> space-y-6 / space-y-8

RADIUS
  Buttons/Inputs  -> rounded-lg
  Cards           -> rounded-xl
  Modals          -> rounded-2xl
  Badges/Pills    -> rounded-full
```
