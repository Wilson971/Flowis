# 📘 Guide des Patterns UX FLOWZ

Ce guide présente les patterns UX standard utilisés dans FLOWZ v1.0, illustrés par les améliorations apportées au Variation Studio.

---

## 🎯 Pattern 1: Header avec Gradient & Elevation

### ❌ Avant (basique)
```tsx
<CardHeader className="pb-4">
    <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-base">Titre</CardTitle>
    </div>
</CardHeader>
```

### ✅ Après (moderne)
```tsx
<CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/50">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <motion.div
                className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "border border-primary/20 shadow-sm",
                    "text-primary"
                )}
                whileHover={{ scale: 1.05 }}
                transition={motionTokens.transitions.spring}
            >
                <Icon className="h-5 w-5" />
            </motion.div>
            <div>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold">Titre Section</CardTitle>
                    {count > 0 && (
                        <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
                            {count}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Description claire et informative
                </p>
            </div>
        </div>
    </div>
</CardHeader>
```

**Bénéfices:**
- ✅ Gradient pour délimitation visuelle
- ✅ Icon plus grande avec micro-interaction
- ✅ Typography hiérarchisée (lg + description)
- ✅ Badge contextuel coloré

---

## 🎯 Pattern 2: Empty State Engageant

### ❌ Avant (minimal)
```tsx
<div className="rounded-lg border border-dashed p-6 text-center">
    <Icon className="mx-auto h-8 w-8 text-muted-foreground/50" />
    <p className="mt-2 text-sm text-muted-foreground">
        Aucun élément. Ajoutez-en un.
    </p>
</div>
```

### ✅ Après (engageant)
```tsx
<div className="rounded-xl border-2 border-dashed border-border/50 p-8 text-center bg-muted/20">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
        <Icon className="h-6 w-6 text-primary/60" />
    </div>
    <p className="text-sm font-medium text-foreground">
        Aucun élément défini
    </p>
    <p className="text-xs text-muted-foreground mt-1">
        Ajoutez votre premier élément pour commencer
    </p>
</div>
```

**Bénéfices:**
- ✅ Icon dans un cercle coloré (plus visuel)
- ✅ Typography en 2 niveaux (titre + description)
- ✅ Border dashed plus épaisse (2px)
- ✅ Background subtil

---

## 🎯 Pattern 3: Toggle avec Label Intégré

### ❌ Avant (séparé)
```tsx
<div className="flex items-center gap-1.5">
    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
    <Switch checked={isVisible} onCheckedChange={setVisible} />
</div>
<div className="pl-7">
    <span className="text-xs text-muted-foreground">
        {isVisible ? "Visible" : "Masqué"}
    </span>
</div>
```

### ✅ Après (intégré)
```tsx
<div
    className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
        isVisible
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-muted/30 border-border"
    )}
>
    <Eye className={cn(
        "h-3.5 w-3.5 transition-colors",
        isVisible ? "text-emerald-600" : "text-muted-foreground"
    )} />
    <Switch checked={isVisible} onCheckedChange={setVisible} />
    <span className={cn(
        "text-xs font-medium transition-colors",
        isVisible ? "text-emerald-700" : "text-muted-foreground"
    )}>
        Visible
    </span>
</div>
```

**Bénéfices:**
- ✅ Label intégré (plus besoin de deviner)
- ✅ Background et border colorés selon l'état
- ✅ Icon colorée selon l'état
- ✅ Feedback visuel immédiat
- ✅ Couleur sémantique (vert = actif)

**Pattern réutilisable:**
```tsx
function ToggleWithLabel({
    icon: Icon,
    label,
    checked,
    onChange,
    activeColor = "emerald" // ou "primary", "amber", etc.
}) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
            checked
                ? `bg-${activeColor}-500/10 border-${activeColor}-500/30`
                : "bg-muted/30 border-border"
        )}>
            <Icon className={cn(
                "h-3.5 w-3.5 transition-colors",
                checked ? `text-${activeColor}-600` : "text-muted-foreground"
            )} />
            <Switch checked={checked} onCheckedChange={onChange} />
            <span className={cn(
                "text-xs font-medium transition-colors",
                checked ? `text-${activeColor}-700` : "text-muted-foreground"
            )}>
                {label}
            </span>
        </div>
    );
}
```

---

## 🎯 Pattern 4: Chips/Tags Améliorés

### ❌ Avant (simple)
```tsx
<div className="flex flex-wrap gap-1.5">
    {items.map(item => (
        <Badge key={item} variant="secondary" className="gap-1 pr-1">
            {item}
            <button onClick={() => remove(item)}>
                <X className="h-3 w-3" />
            </button>
        </Badge>
    ))}
</div>
```

### ✅ Après (container + hover)
```tsx
{items.length > 0 ? (
    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
        {items.map(item => (
            <Badge
                key={item}
                variant="secondary"
                className={cn(
                    "gap-1.5 pr-1 text-xs font-medium",
                    "bg-background border border-border/50 shadow-sm",
                    "hover:border-primary/50 transition-all"
                )}
            >
                {item}
                <button
                    onClick={() => remove(item)}
                    className={cn(
                        "ml-0.5 rounded-full p-0.5",
                        "hover:bg-destructive/20 hover:text-destructive",
                        "transition-all"
                    )}
                    title={`Supprimer "${item}"`}
                >
                    <X className="h-3 w-3" />
                </button>
            </Badge>
        ))}
    </div>
) : (
    <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border/50 text-center">
        <p className="text-xs text-muted-foreground">Aucune valeur.</p>
    </div>
)}
```

**Bénéfices:**
- ✅ Container dédié pour délimitation
- ✅ Hover state sur les chips
- ✅ Shadow subtile pour élévation
- ✅ Empty state intégré
- ✅ Tooltip sur le bouton de suppression

---

## 🎯 Pattern 5: Input avec Guidance Visuelle

### ❌ Avant (basique)
```tsx
<Input
    value={value}
    onChange={e => setValue(e.target.value)}
    placeholder="Ajouter une valeur"
/>
```

### ✅ Après (guidé)
```tsx
<div className="flex-1 relative">
    <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ajouter une valeur (Entrée ou virgule pour valider)"
        className="h-9 text-sm pr-20 border-border/50 focus-visible:border-primary"
    />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
        ↵ ou ,
    </div>
</div>
```

**Bénéfices:**
- ✅ Indicateur visuel du raccourci clavier
- ✅ Placeholder explicite
- ✅ Focus state avec border colorée

---

## 🎯 Pattern 6: Hover States sur Lignes de Tableau

### ❌ Avant (uniforme)
```tsx
<TableRow className="border-l-4 border-l-emerald-500">
    <TableCell>...</TableCell>
</TableRow>
```

### ✅ Après (interactif)
```tsx
<TableRow
    className={cn(
        "border-l-4 transition-all duration-200 group",
        statusBorderColors[status],
        statusBgColors[status],
        "hover:bg-muted/30"
    )}
>
    <TableCell className="sticky left-0 bg-background group-hover:bg-muted/30 transition-colors">
        ...
    </TableCell>

    {/* Actions révélées au hover */}
    <TableCell>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button>Action</Button>
        </div>
    </TableCell>
</TableRow>
```

**Bénéfices:**
- ✅ Background coloré subtil selon le status
- ✅ Hover state sur toute la ligne
- ✅ Actions révélées au hover (moins de bruit)
- ✅ Group hover pour coordination

**Status colors pattern:**
```tsx
const statusBorderColors: Record<Status, string> = {
    synced: "border-l-emerald-500",
    new: "border-l-blue-500",
    modified: "border-l-amber-500",
    deleted: "border-l-red-500",
};

const statusBgColors: Record<Status, string> = {
    synced: "bg-emerald-500/5",
    new: "bg-blue-500/5",
    modified: "bg-amber-500/5",
    deleted: "bg-red-500/5",
};
```

---

## 🎯 Pattern 7: Image Preview avec Affordance

### ❌ Avant (basique)
```tsx
<div className="h-16 w-16 rounded-lg bg-muted border cursor-pointer">
    {image ? (
        <img src={image} />
    ) : (
        <ImageIcon className="h-4 w-4" />
    )}
</div>
```

### ✅ Après (riche)
```tsx
<div
    className={cn(
        "h-16 w-16 rounded-xl bg-muted border-2 border-border/50",
        "cursor-pointer group/img relative",
        "transition-all duration-200",
        "hover:border-primary hover:shadow-md hover:scale-105"
    )}
    onClick={() => inputRef.current?.click()}
>
    {isUploading ? (
        <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[9px] text-muted-foreground">Upload...</span>
        </div>
    ) : image ? (
        <img src={image} className="h-full w-full object-cover" />
    ) : (
        <div className="flex flex-col items-center gap-1">
            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/50">Ajouter</span>
        </div>
    )}

    {/* Overlay au hover */}
    {!isUploading && (
        <div className={cn(
            "absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100",
            "flex items-center justify-center transition-all duration-200"
        )}>
            <span className="text-[10px] text-white font-medium">
                {image ? 'Changer' : 'Upload'}
            </span>
        </div>
    )}

    <input ref={inputRef} type="file" className="hidden" />
</div>
```

**Bénéfices:**
- ✅ Scale au hover (1.05) pour affordance
- ✅ Shadow au hover pour élévation
- ✅ Overlay au hover plus visible
- ✅ Label "Ajouter" dans l'empty state
- ✅ Indicateur de progression avec texte
- ✅ Border plus épaisse (2px)

---

## 🎯 Pattern 8: Select avec Couleurs Sémantiques

### ❌ Avant (neutre)
```tsx
<Select value={status} onValueChange={setStatus}>
    <SelectTrigger>
        <SelectValue />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="publish">Publié</SelectItem>
        <SelectItem value="draft">Brouillon</SelectItem>
    </SelectContent>
</Select>
```

### ✅ Après (coloré)
```tsx
<Select value={status} onValueChange={setStatus}>
    <SelectTrigger
        className={cn(
            "h-8 text-xs font-medium border-border/50",
            status === "publish" && "border-emerald-500/50 bg-emerald-500/5 text-emerald-700",
            status === "private" && "border-amber-500/50 bg-amber-500/5 text-amber-700",
            status === "draft" && "border-muted-foreground/50 bg-muted/30 text-muted-foreground"
        )}
    >
        <SelectValue />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="publish" className="text-emerald-700">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Publié
            </div>
        </SelectItem>
        <SelectItem value="private" className="text-amber-700">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Privé
            </div>
        </SelectItem>
        <SelectItem value="draft" className="text-muted-foreground">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                Brouillon
            </div>
        </SelectItem>
    </SelectContent>
</Select>
```

**Bénéfices:**
- ✅ Couleur de fond et border selon la valeur
- ✅ Points colorés dans les options
- ✅ Feedback visuel immédiat
- ✅ Cohérence avec le reste de l'UI

---

## 🎯 Pattern 9: Status Indicator Multi-Level

### ❌ Avant (single)
```tsx
<TableRow className="border-l-4 border-l-emerald-500">
```

### ✅ Après (multi-level)
```tsx
<TableRow className={cn(
    "border-l-4",
    statusBorderColors[status],
    statusBgColors[status]
)}>
    <TableCell>
        <div className="flex items-center gap-2">
            <Checkbox />
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-2 w-2 rounded-full",
                        status === "synced" && "bg-emerald-500",
                        status === "new" && "bg-blue-500",
                        status === "modified" && "bg-amber-500",
                        status === "deleted" && "bg-red-500"
                    )} />
                </TooltipTrigger>
                <TooltipContent>
                    {statusLabels[status]}
                </TooltipContent>
            </Tooltip>
        </div>
    </TableCell>
</TableRow>
```

**Bénéfices:**
- ✅ Triple indication (border-l + background + point)
- ✅ Point coloré avec tooltip explicatif
- ✅ Redundance pour accessibilité

---

## 🎯 Pattern 10: Button Dynamique selon l'État

### ❌ Avant (statique)
```tsx
<Button
    onClick={handleAdd}
    disabled={!input.trim()}
>
    <Plus className="h-3.5 w-3.5" />
</Button>
```

### ✅ Après (dynamique)
```tsx
<Button
    onClick={handleAdd}
    disabled={!input.trim()}
    className={cn(
        "h-9 shrink-0 gap-1.5 transition-all",
        input.trim() && "bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-md"
    )}
>
    <Plus className="h-3.5 w-3.5" />
    Ajouter
</Button>
```

**Bénéfices:**
- ✅ Devient primary quand l'input est rempli
- ✅ Shadow pour attirer l'attention
- ✅ Label explicite au lieu d'icon seule

---

## 📋 Checklist d'Application

Quand vous créez un nouveau composant, vérifiez :

### Header/Section
- [ ] Gradient background sur le header
- [ ] Icon avec hover scale
- [ ] Typography hiérarchisée (lg + description)
- [ ] Badge de compteur si applicable

### Empty States
- [ ] Icon dans un cercle coloré
- [ ] Typography en 2 niveaux
- [ ] Border dashed épaisse (2px)
- [ ] Background subtil

### Toggles/Switches
- [ ] Label intégré dans le container
- [ ] Background et border colorés selon l'état
- [ ] Icon colorée selon l'état
- [ ] Couleur sémantique

### Inputs
- [ ] Guidance visuelle (placeholder + hint)
- [ ] Focus state avec border colorée
- [ ] Label clair et descriptif

### Listes/Tableaux
- [ ] Hover state sur les lignes
- [ ] Status indicators multiples
- [ ] Actions révélées au hover
- [ ] Group hover pour coordination

### Images/Media
- [ ] Scale au hover
- [ ] Shadow au hover
- [ ] Overlay avec texte explicatif
- [ ] Loading state avec texte

### Selects/Dropdowns
- [ ] Couleurs sémantiques selon la valeur
- [ ] Icons/dots dans les options
- [ ] Font weight et colors différenciées

### Buttons
- [ ] État dynamique selon le contexte
- [ ] Hover states avec shadow
- [ ] Icons + label (pas d'icon seule)
- [ ] Disabled state clair

---

## 🎨 Palette de Couleurs Sémantiques

```tsx
// Status positif
bg-emerald-500/5, bg-emerald-500/10
border-emerald-500/30, border-emerald-500/50
text-emerald-600, text-emerald-700

// Status attention
bg-amber-500/5, bg-amber-500/10
border-amber-500/30, border-amber-500/50
text-amber-600, text-amber-700

// Status information
bg-blue-500/5, bg-blue-500/10
border-blue-500/30, border-blue-500/50
text-blue-600, text-blue-700

// Status erreur
bg-red-500/5, bg-red-500/10
border-red-500/30, border-red-500/50
text-red-600, text-red-700

// Primary (actions)
bg-primary/5, bg-primary/10
border-primary/20, border-primary/30, border-primary/50
text-primary

// Neutre
bg-muted/20, bg-muted/30
border-border, border-border/50
text-muted-foreground, text-foreground
```

---

**Version:** 1.0
**Date:** 2026-02-15
**Basé sur:** Variation Studio UX improvements
