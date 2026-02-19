# 🚀 FLOWZ UX Cheat Sheet

Copy-paste ces patterns pour améliorer rapidement votre UI.

---

## 🎨 Quick Wins

### 1. Header avec Gradient (30s)

```tsx
<CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/50">
    <div className="flex items-center gap-4">
        <motion.div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm text-primary"
            whileHover={{ scale: 1.05 }}
            transition={motionTokens.transitions.spring}
        >
            <Icon className="h-5 w-5" />
        </motion.div>
        <div>
            <CardTitle className="text-lg font-semibold">Titre</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Description</p>
        </div>
    </div>
</CardHeader>
```

---

### 2. Empty State (20s)

```tsx
<div className="rounded-xl border-2 border-dashed border-border/50 p-8 text-center bg-muted/20">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
        <Icon className="h-6 w-6 text-primary/60" />
    </div>
    <p className="text-sm font-medium text-foreground">Titre</p>
    <p className="text-xs text-muted-foreground mt-1">Description</p>
</div>
```

---

### 3. Toggle avec Label (45s)

```tsx
<div className={cn(
    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
    isActive
        ? "bg-emerald-500/10 border-emerald-500/30"
        : "bg-muted/30 border-border"
)}>
    <Icon className={cn(
        "h-3.5 w-3.5 transition-colors",
        isActive ? "text-emerald-600" : "text-muted-foreground"
    )} />
    <Switch checked={isActive} onCheckedChange={setActive} />
    <span className={cn(
        "text-xs font-medium transition-colors",
        isActive ? "text-emerald-700" : "text-muted-foreground"
    )}>
        Label
    </span>
</div>
```

---

### 4. Hover Row (15s)

```tsx
<TableRow className={cn(
    "border-l-4 transition-all duration-200 group",
    "border-l-emerald-500 bg-emerald-500/5",
    "hover:bg-muted/30"
)}>
    <TableCell className="sticky left-0 bg-background group-hover:bg-muted/30 transition-colors">
        ...
    </TableCell>
    <TableCell>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button>Action</Button>
        </div>
    </TableCell>
</TableRow>
```

---

### 5. Image Upload (40s)

```tsx
<div
    className={cn(
        "h-16 w-16 rounded-xl border-2 border-border/50 cursor-pointer group/img relative",
        "transition-all duration-200",
        "hover:border-primary hover:shadow-md hover:scale-105"
    )}
    onClick={() => inputRef.current?.click()}
>
    {image ? (
        <img src={image} className="h-full w-full object-cover" />
    ) : (
        <div className="flex flex-col items-center gap-1">
            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            <span className="text-[9px]">Ajouter</span>
        </div>
    )}
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
        <span className="text-[10px] text-white font-medium">
            {image ? 'Changer' : 'Upload'}
        </span>
    </div>
    <input ref={inputRef} type="file" className="hidden" />
</div>
```

---

### 6. Chips Container (30s)

```tsx
{items.length > 0 ? (
    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
        {items.map(item => (
            <Badge
                key={item}
                className="gap-1.5 pr-1 bg-background border border-border/50 shadow-sm hover:border-primary/50 transition-all"
            >
                {item}
                <button
                    onClick={() => remove(item)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-all"
                >
                    <X className="h-3 w-3" />
                </button>
            </Badge>
        ))}
    </div>
) : (
    <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border/50 text-center">
        <p className="text-xs text-muted-foreground">Aucun élément</p>
    </div>
)}
```

---

### 7. Select Coloré (35s)

```tsx
<Select value={status} onValueChange={setStatus}>
    <SelectTrigger className={cn(
        "h-8 text-xs font-medium",
        status === "publish" && "border-emerald-500/50 bg-emerald-500/5 text-emerald-700",
        status === "draft" && "border-muted-foreground/50 bg-muted/30"
    )}>
        <SelectValue />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="publish" className="text-emerald-700">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Publié
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

---

### 8. Status Dot (25s)

```tsx
<div className="flex items-center gap-2">
    <Checkbox />
    <Tooltip>
        <TooltipTrigger asChild>
            <div className={cn(
                "h-2 w-2 rounded-full",
                status === "synced" && "bg-emerald-500",
                status === "new" && "bg-blue-500",
                status === "modified" && "bg-amber-500"
            )} />
        </TooltipTrigger>
        <TooltipContent>{statusLabels[status]}</TooltipContent>
    </Tooltip>
</div>
```

---

### 9. Input avec Hint (20s)

```tsx
<div className="flex-1 relative">
    <Input
        placeholder="Ajouter (Entrée ou virgule)"
        className="h-9 pr-20 border-border/50 focus-visible:border-primary"
    />
    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
        ↵ ou ,
    </div>
</div>
```

---

### 10. Button Dynamique (15s)

```tsx
<Button
    onClick={handleAdd}
    disabled={!input.trim()}
    className={cn(
        "gap-1.5 transition-all",
        input.trim() && "bg-primary text-primary-foreground shadow-md"
    )}
>
    <Plus className="h-3.5 w-3.5" />
    Ajouter
</Button>
```

---

## 🎨 Couleurs Rapides

### Status
```tsx
// Positif (synced, success, active)
"bg-emerald-500/5 border-emerald-500/30 text-emerald-700"

// Attention (modified, warning)
"bg-amber-500/5 border-amber-500/30 text-amber-700"

// Info (new, information)
"bg-blue-500/5 border-blue-500/30 text-blue-700"

// Erreur (deleted, error)
"bg-red-500/5 border-red-500/30 text-red-700"

// Primary (action)
"bg-primary/10 border-primary/30 text-primary"
```

### Hover States
```tsx
// Card
"hover:shadow-md hover:border-primary/20"

// Button
"hover:bg-primary hover:text-primary-foreground hover:shadow-md"

// Row
"hover:bg-muted/30"

// Image
"hover:border-primary hover:shadow-md hover:scale-105"

// Chip
"hover:border-primary/50"
```

---

## 📏 Sizing Standards

### Heights
```tsx
h-4   // Tiny (badges, dots)
h-7   // Compact buttons
h-8   // Standard buttons, inputs (small)
h-9   // Standard inputs
h-11  // Large icons containers
h-12  // Empty state icons
h-16  // Image previews
```

### Gaps
```tsx
gap-1    // Very tight
gap-1.5  // Tight (chips)
gap-2    // Default (badges, inline elements)
gap-3    // Standard (sections)
gap-4    // Spacious (major sections)
```

### Padding
```tsx
p-3    // Compact containers
p-4    // Standard sections
p-6    // Card content
p-8    // Empty states, large cards

px-3 py-1.5  // Toggles, small containers
```

### Radius
```tsx
rounded-lg    // Buttons, inputs (8px)
rounded-xl    // Cards, containers (12px)
rounded-2xl   // Modals (16px)
rounded-full  // Badges, dots, circles
```

---

## 🎭 Transitions Rapides

```tsx
// Default
"transition-all duration-200"

// Colors only
"transition-colors"

// Opacity
"opacity-0 group-hover:opacity-100 transition-opacity"

// Scale
"hover:scale-105 transition-all"

// Spring (Framer Motion)
transition={motionTokens.transitions.spring}
```

---

## 📋 Checklist 1 Minute

Avant de commit :
- [ ] NO hardcoded colors (text-[#xxx])
- [ ] NO arbitrary sizes (text-[14px])
- [ ] Hover states sur cliquables
- [ ] Labels clairs et visibles
- [ ] Empty states engageants
- [ ] Couleurs sémantiques (emerald/amber/blue)
- [ ] Transitions fluides (200ms)
- [ ] Spacing cohérent (gap-2/3/4)
- [ ] Radius cohérent (rounded-lg/xl)
- [ ] `cn()` pour combiner classes

---

## 🔥 Combo Ultra-Rapide

**Améliorer une Card en 60s :**

```tsx
// AVANT
<Card>
    <CardHeader>
        <CardTitle>Titre</CardTitle>
    </CardHeader>
    <CardContent>...</CardContent>
</Card>

// APRÈS (copier-coller)
<Card className="overflow-hidden">
    <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/50">
        <div className="flex items-center gap-4">
            <motion.div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm text-primary"
                whileHover={{ scale: 1.05 }}
                transition={motionTokens.transitions.spring}
            >
                <Icon className="h-5 w-5" />
            </motion.div>
            <div>
                <CardTitle className="text-lg font-semibold">Titre</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Description</p>
            </div>
        </div>
    </CardHeader>
    <CardContent className="p-6">...</CardContent>
</Card>
```

---

## 💡 Pro Tips

### 1. Status Colors Map
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

### 2. Hover Group Pattern
```tsx
<div className="group">
    <div className="opacity-0 group-hover:opacity-100">
        Actions cachées
    </div>
</div>
```

### 3. Dynamic Class Helper
```tsx
const getStatusClasses = (status: Status) => cn(
    status === "publish" && "border-emerald-500/50 bg-emerald-500/5 text-emerald-700",
    status === "draft" && "border-muted-foreground/50 bg-muted/30"
);
```

---

**Time to upgrade:** 5 minutes
**Impact:** Immediate visual improvement
**Maintenance:** Zero (uses design system)

---

📚 **Full docs:** `docs/design-system/UX_PATTERNS_GUIDE.md`
