# Plan : Vue Tableur (react-datasheet-grid) pour l'Editeur de Variations

## Contexte

L'editeur de variations actuel (`VariationGrid.tsx`) fonctionne bien mais manque de features "spreadsheet" : pas de copy/paste Excel, pas de navigation clavier (Tab/Enter/Arrows), pas de fill handle. Les outils leaders 2026 (WP Sheet Editor, Setary, Ablestar) offrent tous une UX type Google Sheets. L'objectif est d'**ajouter** une vue "Tableur" a cote de la vue "Grille" existante, sans rien supprimer.

## Architecture

```
ProductVariationsTab (orchestrateur, owns viewMode state)
  |
  +-- viewMode toggle: "Grille" | "Tableur"
  +-- BulkVariationToolbar (identique pour les 2 vues)
  +-- [viewMode === "grid"]        --> VariationGrid (existant, INCHANGE)
  +-- [viewMode === "spreadsheet"] --> VariationSpreadsheet (NOUVEAU)
  +-- VariationDetailSheet (identique pour les 2 vues)
  |
  +-- useVariationManager (source unique de verite, INCHANGE)
```

Les 2 vues consomment le meme `useVariationManager`. Le BulkVariationToolbar et le VariationDetailSheet restent identiques et fonctionnent avec les 2 vues.

## Fichiers a creer

| # | Fichier | Role |
|---|---------|------|
| 1 | `spreadsheet/dsg-theme.css` | Variables CSS `--dsg-*` mappees aux tokens FLOWZ |
| 2 | `spreadsheet/useSpreadsheetBridge.ts` | Hook bridge entre DSG onChange et manager.updateVariationField |
| 3 | `spreadsheet/cells/SelectCell.tsx` | Cellule dropdown generique (status, backorders, taxStatus, stockStatus) |
| 4 | `spreadsheet/cells/ImageCell.tsx` | Cellule image thumbnail (read-only, click ouvre detail sheet) |
| 5 | `spreadsheet/cells/AttributeCell.tsx` | Cellule read-only pour afficher l'attribut d'une variation |
| 6 | `spreadsheet/columns.ts` | Factory `buildDsgColumns()` mappant EditableVariation -> colonnes DSG |
| 7 | `VariationSpreadsheet.tsx` | Composant principal DataSheetGrid |

Tous dans `my-app/src/features/products/components/edit/`.

## Fichiers a modifier

| Fichier | Changement |
|---------|------------|
| `ProductVariationsTab.tsx` | Ajouter `viewMode` state + toggle UI + conditional render |
| `my-app/package.json` | Ajouter `react-datasheet-grid` |

## Fichiers INCHANGES

- `VariationGrid.tsx` - Vue existante conservee telle quelle
- `useVariationManager.ts` - API suffisante, aucun changement
- `BulkVariationToolbar.tsx` - Deja view-agnostic
- `VariationDetailSheet.tsx` - Deja view-agnostic

---

## Etapes d'implementation

### Etape 1 : Installer react-datasheet-grid

```bash
cd my-app && npm install react-datasheet-grid --legacy-peer-deps
```

Ajouter override dans package.json si besoin pour React 19 :
```json
"overrides": {
  "react-datasheet-grid": { "react": "$react", "react-dom": "$react-dom" }
}
```

### Etape 2 : Creer le theme CSS DSG

**Fichier :** `spreadsheet/dsg-theme.css`

Mapper les variables `--dsg-*` vers les CSS vars FLOWZ (`--background`, `--foreground`, `--border`, `--primary`, `--muted`). Ajouter les classes de status row :
- `.row-synced` : border-left vert (emerald)
- `.row-new` : border-left bleu
- `.row-modified` : border-left amber
- `.row-deleted` : border-left rouge + opacity 0.4

### Etape 3 : Creer le hook useSpreadsheetBridge

**Fichier :** `spreadsheet/useSpreadsheetBridge.ts`

**Probleme :** DSG fournit `onChange(newArray, operations)` avec remplacement total du tableau. Le manager attend des appels individuels `updateVariationField(localId, field, value)`.

**Solution :** Diff-based bridge :
1. Un `useRef<EditableVariation[]>` stocke le snapshot precedent
2. Sur `onChange`, pour chaque operation `UPDATE`, parcourir les lignes affectees
3. Comparer chaque champ modifiable contre le snapshot precedent
4. Appeler `manager.updateVariationField()` uniquement pour les champs qui ont change
5. Synchroniser le ref quand `manager.variations` change (updates externes depuis toolbar/detail sheet)

Champs a diffuser : `sku`, `regularPrice`, `salePrice`, `stockQuantity`, `manageStock`, `stockStatus`, `weight`, `description`, `status`, `virtual`, `downloadable`, `globalUniqueId`, `backorders`, `taxStatus`, `taxClass`, `dateOnSaleFrom`, `dateOnSaleTo`

### Etape 4 : Creer les cellules custom

**SelectCell** (`cells/SelectCell.tsx`) :
- Factory function : `selectColumn(choices)` retourne un `Column<string | null>`
- Composant React.memo avec `<select>` natif style FLOWZ
- Gere `focus`, `active`, `stopEditing`
- `copyValue` retourne le label, `pasteValue` resout depuis le label

Utilise pour : status (publish/private/draft), backorders (no/notify/yes), taxStatus (taxable/shipping/none), stockStatus (instock/outofstock/onbackorder)

**ImageCell** (`cells/ImageCell.tsx`) :
- Thumbnail 28x28 ou placeholder icon
- Click appelle `onOpenDetail(localId)` via `columnData`
- `disabled: true` (pas d'edition inline)
- Copy retourne l'URL image

**AttributeCell** (`cells/AttributeCell.tsx`) :
- Read-only, affiche l'option de l'attribut pour cette variation
- `disabled: true`
- Une colonne par attribut unique (Color, Size, etc.)

### Etape 5 : Creer le builder de colonnes DSG

**Fichier :** `spreadsheet/columns.ts`

```ts
function buildDsgColumns(options: {
  visibleColumns: Set<string>;
  attrNames: string[];
  onOpenDetail: (localId: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (localId: string) => void;
}): Column<EditableVariation>[]
```

Mapping des colonnes :

| Cle Grid | Champ EditableVariation | Type DSG |
|----------|------------------------|----------|
| checkbox | (selection) | Custom checkbox lie a selectedIds |
| image | image | Custom ImageCell (read-only) |
| attr_* | attributes[n].option | Custom AttributeCell (read-only) |
| sku | sku | keyColumn('sku', textColumn) |
| prix | regularPrice | keyColumn('regularPrice', textColumn) |
| promo | salePrice | keyColumn('salePrice', textColumn) |
| stock | stockQuantity | keyColumn('stockQuantity', intColumn) |
| weight | weight | keyColumn('weight', textColumn) |
| dimensions | dimensions | Custom read-only "LxWxH" |
| gtin | globalUniqueId | keyColumn('globalUniqueId', textColumn) |
| manageStock | manageStock | keyColumn('manageStock', checkboxColumn) |
| backorders | backorders | selectColumn(no/notify/yes) |
| taxStatus | taxStatus | selectColumn(taxable/shipping/none) |
| taxClass | taxClass | keyColumn('taxClass', textColumn) |
| dateOnSaleFrom | dateOnSaleFrom | keyColumn('dateOnSaleFrom', textColumn) |
| dateOnSaleTo | dateOnSaleTo | keyColumn('dateOnSaleTo', textColumn) |
| description | description | keyColumn('description', textColumn) |
| statut | status | selectColumn(publish/private/draft) |
| actions | (stickyRightColumn) | Boutons Expand + Delete |

Filtrage dynamique selon `visibleColumns` (meme Set<string> que la Grid existante).

### Etape 6 : Creer VariationSpreadsheet

**Fichier :** `VariationSpreadsheet.tsx`

Props identiques a VariationGrid pour interchangeabilite :
```ts
interface VariationSpreadsheetProps {
  variations: EditableVariation[];
  selectedIds: Set<string>;
  onToggleSelect: (localId: string) => void;
  onToggleSelectAll: () => void;
  onUpdateField: (localId: string, field: keyof EditableVariation, value: unknown) => void;
  onDelete: (localId: string) => void;
  onOpenDetail: (localId: string) => void;
  onImageUpload?: (localId: string, file: File) => void;
  isLoading?: boolean;
  changeCounter?: number;
  uploadingVariationId?: string | null;
}
```

Props DSG cles :
- `value={variations}` - donnees du manager
- `onChange={handleDsgChange}` - via useSpreadsheetBridge
- `columns={dsgColumns}` - via buildDsgColumns, memoize
- `lockRows` - empeche ajout/suppression via DSG
- `rowKey="_localId"` - identite stable des lignes
- `stickyRightColumn` - boutons detail + delete
- `rowClassName` - retourne `row-synced`, `row-new`, etc.
- `disableContextMenu` - on utilise nos propres actions
- `height={600}` - coherent avec la grid existante
- Dynamic import via `next/dynamic({ ssr: false })` pour eviter les erreurs SSR

Inclut une barre header avec compteur de variations + ColumnSelector (meme pattern que VariationGrid).

### Etape 7 : Modifier ProductVariationsTab

**Fichier :** `ProductVariationsTab.tsx`

Changements :
1. Ajouter `const [viewMode, setViewMode] = useState<"grid" | "spreadsheet">("grid")`
2. Ajouter le toggle dans le header (entre les badges et le bouton "Generer") :

```tsx
<div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/50">
  <button onClick={() => setViewMode("grid")} className={cn(
    "flex items-center h-8 px-3 rounded-lg text-xs gap-1.5 transition-all",
    viewMode === "grid"
      ? "bg-background text-foreground border border-border shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  )}>
    <LayoutGrid className="h-3.5 w-3.5" /> Grille
  </button>
  <button onClick={() => setViewMode("spreadsheet")} className={cn(...)}>
    <Sheet className="h-3.5 w-3.5" /> Tableur
  </button>
</div>
```

3. Conditional render (lignes 233-246 actuelles) :
```tsx
{viewMode === "grid" && <VariationGrid {...gridProps} />}
{viewMode === "spreadsheet" && <VariationSpreadsheet {...gridProps} />}
```

Les props sont identiques pour les 2 composants.

---

## Features obtenues gratuitement avec DSG

| Feature | Details |
|---------|---------|
| Copy/Paste Excel | Ctrl+C/V compatible Excel et Google Sheets |
| Keyboard Navigation | Tab, Enter, Arrow keys, Escape |
| Fill Handle | Drag le coin pour etendre les valeurs |
| Cell Range Selection | Click+drag pour selectionner un bloc |
| Virtual Scrolling | Performances fluides avec 500+ variations |
| Delete/Cut | Suppr/Backspace efface le contenu de la cellule |

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| React 19 compat | `--legacy-peer-deps` + overrides. APIs standard utilisees. Fallback: defaultView = "grid" |
| SSR crash | Dynamic import avec `ssr: false` |
| Conflit @tanstack/react-virtual | DSG utilise `^3.0.0-beta` ; verifier pas de conflit avec react-query |
| Performance diff bridge | Le diff ne parcourt que les lignes dans `operations[].fromRowIndex..toRowIndex`, pas tout le tableau |
| Dark mode | Variables CSS `--dsg-*` mappees aux tokens FLOWZ = dark mode automatique |

## Verification

1. `npm run build` - pas d'erreur de compilation
2. `npm run dev` - naviguer vers un produit variable avec variations
3. Basculer entre "Grille" et "Tableur" - donnees identiques
4. Editer un champ dans le Tableur (SKU, prix, stock) - verifier que la valeur persiste quand on bascule en Grille
5. Copy/Paste : copier une cellule, coller dans une autre - verifier l'update
6. Keyboard : Tab entre cellules, Enter pour valider, Arrows pour naviguer
7. Selection + Bulk : cocher des variations dans le Tableur, utiliser le BulkVariationToolbar
8. Detail Sheet : cliquer sur le bouton Expand dans le stickyRightColumn, modifier un champ, fermer - verifier la mise a jour dans le Tableur
9. Dark mode : verifier que toutes les couleurs DSG s'adaptent
10. Generer variations : cliquer "Generer les variations" en mode Tableur - verifier l'apparition des nouvelles lignes
11. Sauvegarder : modifier des champs, cliquer "ENREGISTRER" - verifier la persistence en base
