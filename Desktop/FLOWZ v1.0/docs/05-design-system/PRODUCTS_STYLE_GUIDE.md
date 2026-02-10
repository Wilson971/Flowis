# Guide de Style - Liste de Produits Professionnelle

Ce guide vous montre comment créer des tableaux et listes de produits avec le même style professionnel et propre que la page overview de FLOWZ.

## 🎨 Principes de Design

### 1. Style Visuel
- **Cartes avec ombres légères** : `shadow-sm` et `border-border-subtle`
- **Gradients subtils** : Utilisation de `bg-gradient-to-br` pour les badges et boutons
- **Espacements cohérents** : Padding et gaps standardisés (4, 5, 6)
- **Couleurs sémantiques** : Codes couleur cohérents pour les statuts

### 2. Animations
- **Framer Motion** : Animations fluides pour l'apparition des éléments
- **Hover effects** : Scale et transitions sur les interactions
- **Staggered animations** : Délais progressifs pour les listes

### 3. Typographie
- **Headers** : `text-3xl font-bold tracking-tight`
- **Labels** : `text-[10px] font-bold uppercase text-zinc-400 tracking-widest`
- **Valeurs** : `text-sm font-semibold` ou `text-2xl font-bold`

## 📦 Composants Disponibles

### 1. ProductsTableModern
Tableau complet avec toutes les fonctionnalités avancées :
- Sélection multiple
- Actions en ligne
- Statuts SEO et SERP
- Sync et draft management

**Fichier** : `/src/components/products/ProductsTableModern.tsx`

```tsx
import { ProductsTableModern } from '@/components/products/ProductsTableModern';

<ProductsTableModern
  products={products}
  selectedProducts={selectedProducts}
  onToggleSelect={toggleProduct}
  onToggleSelectAll={toggleAll}
/>
```

### 2. SimpleProductsList
Liste simplifiée avec cartes horizontales :
- Statistiques en haut
- Grid responsive
- Actions rapides
- État vide animé

**Fichier** : `/src/components/products/SimpleProductsList.tsx`

```tsx
import { SimpleProductsList } from '@/components/products/SimpleProductsList';

<SimpleProductsList
  products={products}
  onEdit={(id) => router.push(`/products/${id}/edit`)}
  onView={(id) => window.open(`/products/${id}`, '_blank')}
/>
```

## 🎯 Exemples d'Utilisation

### Exemple 1 : Page de produits complète
Voir : `/src/app/app/products/page.tsx`

```tsx
"use client";

import { motion } from 'framer-motion';
import { ProductsTableModern } from '@/components/products/ProductsTableModern';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Header avec animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          Mes Produits
          <Sparkles className="text-primary w-6 h-6" />
        </h1>
      </motion.div>

      {/* Tableau avec animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ProductsTableModern products={products} {...props} />
      </motion.div>
    </div>
  );
}
```

### Exemple 2 : Liste simple
Voir : `/src/app/app/products/example/page.tsx`

```tsx
import { SimpleProductsList, exampleProducts } from '@/components/products/SimpleProductsList';

export default function ExamplePage() {
  return (
    <SimpleProductsList
      products={exampleProducts}
      onEdit={(id) => console.log('Edit', id)}
      onView={(id) => console.log('View', id)}
    />
  );
}
```

## 🎨 Classes CSS Réutilisables

### Cartes
```tsx
// Carte standard
<Card className="shadow-sm border-border-subtle">

// Carte avec hover
<Card className="shadow-sm border-border-subtle hover:shadow-md hover:border-primary/30 transition-all duration-200">

// Carte avec animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <Card className="shadow-sm border-border-subtle">
    {/* Contenu */}
  </Card>
</motion.div>
```

### Badges de Statut
```tsx
// Badge publié
<Badge className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 font-medium text-xs px-3 py-1 shadow-sm">
  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
  Publié
</Badge>

// Badge brouillon
<Badge className="bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200 font-medium text-xs px-3 py-1 shadow-sm">
  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
  Brouillon
</Badge>

// Badge en attente
<Badge className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 font-medium text-xs px-3 py-1 shadow-sm">
  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5" />
  En attente
</Badge>

// Badge rupture de stock
<Badge className="bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200 font-medium text-xs px-3 py-1 shadow-sm">
  Rupture de stock
</Badge>
```

### Boutons d'Action
```tsx
// Bouton principal avec gradient
<Button
  variant="outline"
  className="h-8 px-3 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 text-xs font-semibold shadow-sm"
>
  <Check className="h-3.5 w-3.5 mr-1.5" />
  Accepter
</Button>

// Bouton icône avec hover
<Button
  size="icon"
  variant="ghost"
  className="h-8 w-8 text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all duration-200"
>
  <Edit className="h-4 w-4" />
</Button>
```

### Headers de Tableau
```tsx
<span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
  Produit
</span>
```

### Images de Produits
```tsx
// Avec image
<motion.div whileHover={{ scale: 1.1 }} className="cursor-pointer">
  <div className="h-12 w-12 relative rounded-lg overflow-hidden border-2 border-border-subtle bg-zinc-50 shadow-sm">
    <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
  </div>
</motion.div>

// Sans image (placeholder)
<div className="h-12 w-12 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center">
  <Package className="h-6 w-6 text-zinc-400" />
</div>
```

### Prix
```tsx
// Prix normal
<p className="text-lg font-bold text-text-main">
  {price.toFixed(2)} €
</p>

// Prix en promotion
<div className="flex flex-col items-end gap-0.5">
  <span className="text-[11px] text-muted-foreground line-through font-normal">
    {regularPrice.toFixed(2)} €
  </span>
  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2">
    {salePrice.toFixed(2)} €
  </Badge>
</div>
```

### Cartes Statistiques
```tsx
<Card className="shadow-sm border-border-subtle">
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Total Produits
        </p>
        <p className="text-2xl font-bold text-text-main">
          1,240
        </p>
      </div>
      <div className="p-2 rounded-lg bg-primary/10">
        <Package className="h-5 w-5 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

### État Vide
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4 }}
>
  <Card className="shadow-sm border-border-subtle">
    <CardContent className="p-12 text-center">
      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Package className="h-10 w-10 text-primary" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2 text-text-main">
          Aucun produit trouvé
        </h3>
        <p className="text-muted-foreground text-sm">
          Commencez par ajouter vos premiers produits
        </p>
      </div>
    </CardContent>
  </Card>
</motion.div>
```

## 🎬 Animations Recommandées

### Animation d'entrée de page
```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Header */}
</motion.div>
```

### Animation de liste avec délais progressifs
```tsx
{products.map((product, index) => (
  <motion.div
    key={product.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
  >
    {/* Produit */}
  </motion.div>
))}
```

### Hover effect sur image
```tsx
<motion.div whileHover={{ scale: 1.05 }}>
  <img src={image} alt={name} />
</motion.div>
```

### Animation de bouton avec rotation
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <>
      <Check className="h-3.5 w-3.5 mr-1.5" />
      Accepter
    </>
  )}
</Button>
```

## 🎯 Palette de Couleurs

### Statuts
- **Succès/Publié** : `emerald-50/100/200/500/600/700`
- **Attention/Brouillon** : `amber-50/100/200/500/600/700`
- **Info/En attente** : `blue-50/100/200/500/600/700`
- **Erreur/Rupture** : `red-50/100/200/500/600`
- **Neutre** : `zinc-50/100/200/400/500/600/900`

### Éléments UI
- **Primary** : `primary` (variable CSS)
- **Bordures** : `border-border-subtle`
- **Texte principal** : `text-text-main`
- **Texte secondaire** : `text-text-muted` ou `text-muted-foreground`

## 📱 Responsive Design

```tsx
// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// Flex responsive avec wrapping
<div className="flex flex-col sm:flex-row items-center justify-between gap-3">

// Largeur maximale adaptative
<div className="min-w-0 max-w-[250px] lg:max-w-md">
```

## ✅ Checklist pour un Design Professionnel

- [ ] Utiliser `framer-motion` pour les animations d'entrée
- [ ] Appliquer `shadow-sm` et `border-border-subtle` aux cartes
- [ ] Utiliser des gradients subtils pour les badges de statut
- [ ] Ajouter des hover effects avec `transition-all duration-200`
- [ ] Respecter la hiérarchie typographique (10px/12px/14px/24px/32px)
- [ ] Ajouter des icônes pour améliorer la lisibilité
- [ ] Utiliser des délais progressifs pour les animations de liste
- [ ] Inclure des états vides bien conçus
- [ ] Optimiser pour mobile avec des grids responsives
- [ ] Ajouter des tooltips pour les actions

## 🚀 Pour aller plus loin

1. **Personnalisation des couleurs** : Modifiez les variables CSS dans votre configuration Tailwind
2. **Ajout de fonctionnalités** : Pagination, recherche, filtres avancés
3. **Optimisation** : Lazy loading des images, virtualisation pour grandes listes
4. **Accessibilité** : ARIA labels, navigation au clavier
5. **Tests** : Tests unitaires et E2E pour les interactions

---

**Astuce** : Pour voir tous les exemples en action, visitez `/app/products/example`
