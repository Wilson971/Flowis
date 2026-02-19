# Script de Modernisation Cards - Formulaire Produit

## Pattern à remplacer dans toutes les *Card.tsx

### AVANT (Old)
```tsx
<Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
    <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                <Icon className="w-5 h-5" />
            </div>
```

### APRÈS (New - Style 2026)
```tsx
<Card className="border-border/40 bg-card/90 backdrop-blur-lg overflow-hidden relative group hover:border-border hover:shadow-glow-sm hover:shadow-primary/5 transition-all duration-500">
    {/* Glass reflection */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
    {/* Gradient accent - couleur par card */}
    <div className="absolute inset-0 bg-gradient-to-br from-COLOR/[0.02] via-transparent to-COLOR2/[0.02] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

    <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-COLOR/10 group-hover:text-COLOR transition-all duration-300 border border-border/50">
                <Icon className="w-5 h-5" />
            </div>
```

### Et ajouter au CardContent
```tsx
<CardContent className="... relative z-10">
```

## Couleurs par Card

| Card | Gradient 1 | Gradient 2 | Icon Hover |
|------|-----------|------------|------------|
| PricingCard ✅ | emerald-500 | blue-500 | emerald-600 |
| OrganizationCard ✅ | violet-500 | blue-500 | violet-600 |
| PerformanceCard | orange-500 | amber-500 | orange-600 |
| ProductOptionsCard | blue-500 | cyan-500 | blue-600 |
| ExternalProductCard | indigo-500 | purple-500 | indigo-600 |
| LinkedProductsCard | pink-500 | rose-500 | pink-600 |
| SyncStatusCard | emerald-500 | teal-500 | emerald-600 |
| SyncHistoryCard | slate-500 | gray-500 | slate-600 |
| ProductVersionHistoryCard | amber-500 | yellow-500 | amber-600 |

## Cards Déjà Modernisées ✅
- PricingCard
- OrganizationCard

## Cards À Moderniser
- PerformanceCard
- ProductOptionsCard
- ExternalProductCard
- LinkedProductsCard
- SyncStatusCard
- SyncHistoryCard
- ProductVersionHistoryCard
