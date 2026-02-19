# 🎨 Card Theme System - FLOWZ Design System

## 📋 Vue d'ensemble

Au lieu de **hardcoder les couleurs** dans chaque card, FLOWZ utilise maintenant un **système de thèmes centralisé** qui garantit :

- ✅ **Cohérence** - Toutes les cards utilisent les mêmes palettes
- ✅ **Maintenabilité** - Changez une couleur une fois, partout
- ✅ **Sémantique** - Les couleurs ont un sens (commerce=vert, organisation=violet)
- ✅ **Scalabilité** - Ajoutez de nouveaux thèmes facilement

---

## 🎯 Thèmes Disponibles

### Commerce & Vente 🟢
```tsx
theme: "commerce"
// Emerald-Blue gradient
// Pour: Pricing, Stock, Orders, Payments
```

### Organisation & Taxonomie 💜
```tsx
theme: "organization"
// Violet-Blue gradient
// Pour: Categories, Tags, Attributes, Taxonomies
```

### Analytics & Performance 🟠
```tsx
theme: "analytics"
// Orange-Amber gradient
// Pour: Stats, Reports, Metrics, KPIs
```

### Synchronisation 💚
```tsx
theme: "sync"
// Emerald-Teal gradient
// Pour: Sync, API, Webhooks, Integrations
```

### Configuration ⚙️
```tsx
theme: "settings"
// Blue-Cyan gradient
// Pour: Settings, Preferences, Options
```

### Contenu & Média 🌸
```tsx
theme: "media"
// Pink-Rose gradient
// Pour: Images, Files, Media, Gallery
```

### Historique 📜
```tsx
theme: "history"
// Slate-Gray gradient
// Pour: History, Logs, Versions, Audit
```

### Relations 🔗
```tsx
theme: "relations"
// Indigo-Purple gradient
// Pour: Related, Linked, Cross-sell, Upsell
```

### Temporalité 🕐
```tsx
theme: "temporal"
// Amber-Yellow gradient
// Pour: Dates, Schedule, Calendar, Timeline
```

### Blanc & Gris Clair ⚪
```tsx
theme: "light"
// Slate-Gray light gradient
// Pour: Cards neutres, minimalistes, secondaires
```

---

## 🚀 Utilisation

### Méthode 1 : Fonction Helper (Recommandé)

```tsx
import { getProductCardTheme } from "@/lib/design-system";

export const PricingCard = () => {
  // Récupère automatiquement le thème de PricingCard
  const theme = getProductCardTheme('PricingCard');

  return (
    <Card className={theme.container}>
      {/* Glass reflection */}
      <div className={theme.glassReflection} />
      {/* Gradient accent */}
      <div className={theme.gradientAccent} />

      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          {/* Icon avec couleurs auto */}
          <div className={theme.iconContainer}>
            <CreditCard className="w-5 h-5" />
          </div>
          {/* Contenu... */}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Contenu... */}
      </CardContent>
    </Card>
  );
};
```

### Méthode 2 : Composant ThemedCard

```tsx
import {
  ThemedCard,
  ThemedCardHeader,
  ThemedCardIcon,
  ThemedCardTitle,
  ThemedCardLabel,
  ThemedCardContent,
} from "@/components/ui/themed-card";

export const MyCard = () => {
  return (
    <ThemedCard theme="commerce" animated animationDelay={0.1}>
      <ThemedCardHeader theme="commerce">
        <div className="flex items-center gap-3">
          <ThemedCardIcon theme="commerce" icon={<CreditCard className="w-5 h-5" />} />
          <div>
            <ThemedCardLabel>Vente & Stock</ThemedCardLabel>
            <ThemedCardTitle>Tarification</ThemedCardTitle>
          </div>
        </div>
      </ThemedCardHeader>

      <ThemedCardContent>
        {/* Contenu... */}
      </ThemedCardContent>
    </ThemedCard>
  );
};
```

### Méthode 3 : Classes Directes

```tsx
import { getCardThemeClasses } from "@/lib/design-system";

const theme = getCardThemeClasses('analytics');

// Accès aux valeurs brutes
console.log(theme.raw.gradientFrom); // 'orange-500'
console.log(theme.raw.iconHoverBg);  // 'orange-500/10'
```

---

## 📦 Mapping des Cards Produit

Le système détecte automatiquement le thème selon le nom de la card :

| Card | Thème | Couleur |
|------|-------|---------|
| `PricingCard` | commerce | 🟢 Emerald-Blue |
| `ExternalProductCard` | commerce | 🟢 Emerald-Blue |
| `OrganizationCard` | organization | 💜 Violet-Blue |
| `ProductOptionsCard` | settings | 🔵 Blue-Cyan |
| `PerformanceCard` | analytics | 🟠 Orange-Amber |
| `SyncStatusCard` | sync | 💚 Emerald-Teal |
| `SyncHistoryCard` | history | 📜 Slate-Gray |
| `LinkedProductsCard` | relations | 🔗 Indigo-Purple |
| `ProductVersionHistoryCard` | history | 📜 Slate-Gray |

---

## 🔧 Ajouter un Nouveau Thème

### 1. Définir le thème dans `card-themes.ts`

```tsx
export const cardThemes = {
  // ... thèmes existants

  // Nouveau thème
  myNewTheme: {
    gradientFrom: 'red-500',
    gradientTo: 'orange-500',
    iconHoverBg: 'red-500/10',
    iconHoverText: 'red-600',
    glowColor: 'red-500/10',
  },
} as const;
```

### 2. L'assigner à une card

```tsx
export const productCardThemes: Record<string, CardThemeKey> = {
  // ... mappings existants
  MyNewCard: 'myNewTheme',
};
```

### 3. Utiliser

```tsx
const theme = getProductCardTheme('MyNewCard');
```

---

## 🎨 Personnaliser les Couleurs

### Option 1 : Modifier un thème existant

Éditez `card-themes.ts` :

```tsx
commerce: {
  gradientFrom: 'teal-500',  // ← Changez ici
  gradientTo: 'green-500',   // ← Et ici
  // ...
}
```

**Impact** : Toutes les cards "commerce" changent automatiquement ! ✨

### Option 2 : Créer une variante

```tsx
commerceDark: {
  gradientFrom: 'emerald-700',
  gradientTo: 'teal-700',
  // ...
}
```

---

## 🆚 Avant / Après

### ❌ AVANT (Hardcodé)

```tsx
// PricingCard.tsx
<Card className="... from-emerald-500/[0.02] ...">  ← Hardcodé
  <div className="... group-hover:bg-emerald-500/10 ...">  ← Hardcodé
```

**Problèmes** :
- Couleurs dupliquées dans chaque card
- Difficile de changer globalement
- Pas de cohérence garantie
- Risque d'incohérences

### ✅ APRÈS (Design System)

```tsx
// PricingCard.tsx
const theme = getProductCardTheme('PricingCard');

<Card className={theme.container}>  ← Géré centralement
  <div className={theme.iconContainer}>  ← Géré centralement
```

**Avantages** :
- Une seule source de vérité
- Changement global en 1 ligne
- Cohérence garantie
- Sémantique claire

---

## 📊 Structure du Thème

Chaque thème contient :

```tsx
type CardTheme = {
  gradientFrom: string;      // Couleur début gradient (ex: 'emerald-500')
  gradientTo: string;        // Couleur fin gradient (ex: 'blue-500')
  iconHoverBg: string;       // Background icon au hover (ex: 'emerald-500/10')
  iconHoverText: string;     // Couleur icon au hover (ex: 'emerald-600')
  glowColor?: string;        // Couleur du glow (optionnel)
};
```

---

## 🎯 Best Practices

### ✅ DO

```tsx
// Utilisez le système de thèmes
const theme = getProductCardTheme('PricingCard');
<Card className={theme.container}>

// Ou ThemedCard
<ThemedCard theme="commerce">
```

### ❌ DON'T

```tsx
// Ne hardcodez JAMAIS les couleurs
<Card className="from-emerald-500/[0.02] ...">

// N'utilisez pas de couleurs arbitraires
<div className="bg-green-500/10">
```

---

## 🔍 Debugging

### Voir tous les thèmes disponibles

```tsx
import { cardThemes } from '@/lib/design-system';

console.log(Object.keys(cardThemes));
// ['commerce', 'organization', 'analytics', ...]
```

### Voir le mapping des cards

```tsx
import { productCardThemes } from '@/lib/design-system';

console.log(productCardThemes);
// { PricingCard: 'commerce', OrganizationCard: 'organization', ... }
```

### Tester un thème

```tsx
const theme = getCardThemeClasses('analytics');
console.log(theme.raw);
// { gradientFrom: 'orange-500', gradientTo: 'amber-500', ... }
```

---

## 🚀 Migration Guide

Pour migrer une card existante :

### Étape 1 : Importer

```tsx
import { getProductCardTheme } from "@/lib/design-system";
```

### Étape 2 : Récupérer le thème

```tsx
export const MyCard = () => {
  const theme = getProductCardTheme('MyCard');
  // ...
```

### Étape 3 : Remplacer les classes hardcodées

```diff
- <Card className="border-border/40 bg-card/90 ... from-emerald-500/[0.02] ...">
+ <Card className={theme.container}>

- <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] ...">
+ <div className={theme.glassReflection} />

- <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] ...">
+ <div className={theme.gradientAccent} />

- <div className="w-10 h-10 ... group-hover:bg-emerald-500/10 ...">
+ <div className={theme.iconContainer}>
```

### Étape 4 : Tester

Vérifiez que les couleurs s'affichent correctement ! ✅

---

## 📚 Ressources

- **Fichier source** : `src/lib/design-system/card-themes.ts`
- **Composant** : `src/components/ui/themed-card.tsx`
- **Export** : `src/lib/design-system/index.ts`
- **Exemple d'usage** : `src/features/products/components/edit/PricingCard.tsx`

---

## 🎉 Résumé

Le **Card Theme System** de FLOWZ vous permet de :

1. ✨ **Maintenir** une cohérence visuelle
2. 🎨 **Personnaliser** facilement les couleurs
3. 📦 **Réutiliser** les thèmes partout
4. 🚀 **Scaler** sans duplication de code
5. 🔍 **Débugger** facilement les couleurs

**Plus de hardcoding, vive le design system ! 🎨**
