# Photo Studio UI Restructure + FabricJS v6 — Design Document

**Date**: 2026-03-13
**Status**: Validated
**Approach**: B — Refonte structurée

## Objectifs

1. **Restructurer la hiérarchie des composants** — groupement clair, responsabilités isolées
2. **Améliorer l'UX des mises en scène** — presets catégorisés, prompt builder guidé, favoris
3. **Qualité premium des prompts** — enrichissement automatique + mode expert
4. **Timeline enrichie** — métadonnées tooltips, actions rapides, séparation source/généré
5. **Galerie réordonnnable** — drag & drop depuis le Photo Studio
6. **FabricJS v6** — éditeur image complet (crop, zoom, annotations, filters) remplaçant les outils custom

## Décisions techniques

- **FabricJS v6** (MIT, 28k+ stars, TypeScript) comme moteur canvas — remplace CropTool, AnnotationLayer, EditorCanvas
- **@dnd-kit/sortable** pour le drag & drop de la galerie source
- **Une page éditeur dédiée** (`/app/photo-studio/[productId]`) — remplace SceneStudioDialog + EditorHub
- **Un seul contexte** (StudioEditorContext) scopé à la page éditeur
- **Mode Simple/Expert** — enrichissement invisible vs prompt visible + textarea override

---

## Section 1 — Hiérarchie des composants

```
features/photo-studio/
├── components/
│   ├── list/                          # Page liste produits (existante, nettoyée)
│   │   ├── PhotoStudioPage.tsx
│   │   ├── StudioContentGrid.tsx
│   │   ├── PhotoStudioCard.tsx
│   │   ├── PhotoStudioTable.tsx
│   │   ├── StudioToolbar.tsx
│   │   ├── StudioFilterBar.tsx
│   │   ├── StudioBatchPanel.tsx
│   │   └── StudioStatCard.tsx
│   │
│   ├── editor/                        # Page éditeur individuel (NOUVEAU)
│   │   ├── StudioEditorPage.tsx       # Layout principal
│   │   ├── EditorHeader.tsx
│   │   ├── EditorLayout.tsx           # Conteneur flex sidebar | canvas | panel
│   │   │
│   │   ├── sidebar/
│   │   │   ├── EditorSidebar.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ScenePresetsPanel.tsx  # Onglets catégorisés
│   │   │   ├── PresetCard.tsx
│   │   │   ├── PromptBuilder.tsx      # Blocs combinables + textarea
│   │   │   ├── PromptPreview.tsx      # Mode expert
│   │   │   ├── FavoritesPanel.tsx
│   │   │   └── GenerateButton.tsx
│   │   │
│   │   ├── canvas/
│   │   │   ├── FabricCanvas.tsx       # Wrapper FabricJS v6
│   │   │   ├── FloatingToolbar.tsx
│   │   │   └── useFabricEditor.ts
│   │   │
│   │   ├── adjustments/
│   │   │   └── ImageAdjustmentsPanel.tsx
│   │   │
│   │   └── footer/
│   │       ├── EditorFooter.tsx
│   │       ├── SourceGallery.tsx      # Drag & drop réordonnables
│   │       └── GeneratedTimeline.tsx  # Tooltips metadata + actions rapides
│   │
│   ├── shared/
│   │   ├── PresetGrid.tsx
│   │   ├── PresetRadioCard.tsx
│   │   ├── StudioProgressOverlay.tsx
│   │   └── ValidationBadge.tsx
│   │
│   └── modals/
│       ├── PublishToProductDialog.tsx
│       ├── SettingsModal.tsx
│       └── ImageDetailModal.tsx       # NOUVEAU
│
├── hooks/
│   ├── useFabricEditor.ts            # NOUVEAU
│   ├── usePromptBuilder.ts           # NOUVEAU
│   ├── useFavoritePresets.ts         # NOUVEAU
│   ├── useGalleryReorder.ts          # NOUVEAU
│   ├── useStudioJobs.ts
│   ├── useBatchStudioJobs.ts
│   ├── useStudioImages.ts
│   ├── useStudioSettings.ts
│   └── ...existants
│
├── actions/                           # Inchangé
├── constants/                         # + preset categories
├── monitoring/                        # Inchangé
├── classification/                    # Inchangé
├── context/
│   └── StudioEditorContext.tsx        # REMPLACE StudioContext
└── types/
    └── studio.ts                      # + PromptBlock, FavoritePreset, PresetCategory
```

### Composants supprimés
- `components/PhotoStudioPage.tsx` (ancien doublon)
- `components/editor/EditorHub.tsx` → remplacé par StudioEditorPage
- `components/editor/CropTool.tsx` → FabricJS
- `components/editor/AnnotationLayer.tsx` → FabricJS
- `components/editor/EditorCanvas.tsx` → FabricCanvas
- `components/editor/ActionBar.tsx` → FloatingToolbar
- `components/viewer/` (GalleryView, CompareOverlay, LightTable)
- `SceneStudioDialog`, `SceneStudioLayout`, `SceneStudioLoader`

---

## Section 2 — PromptBuilder + Presets + Favoris

### Presets catégorisés (4 onglets)

| Catégorie | Exemples | Icône |
|-----------|----------|-------|
| Studio | Blanc Pur, Gris Doux, Noir Dramatique, Marbre, Bois | Camera |
| Lifestyle | Salon Moderne, Cuisine, Bureau, Jardin | Home |
| Extérieur | Urbain, Nature, Plage, Industriel | Trees |
| Artistique | Cinematic, Néon, Vintage, Minimaliste | Sparkles |

### PromptBuilder — 4 dimensions combinables (chips)

| Dimension | Options |
|-----------|---------|
| Éclairage | Studio Pro, Lumière Chaude, Naturelle, Dramatique, Néon |
| Angle | Face, 3/4, Plongée, Macro, Vue Large, Contre-plongée |
| Ambiance | Premium, Minimaliste, Luxe, Chaleureux, Épuré, Industriel |
| Surface | Marbre Blanc, Bois Naturel, Béton, Tissu Lin, Métal Brossé |

1 chip par dimension max. Combinaison → prompt technique enrichi.

### Mode Simple vs Expert

- **Simple** (défaut) : chips + preset uniquement. Prompt enrichi généré en arrière-plan (instructions techniques pro invisibles : camera lens, lighting rig, post-processing).
- **Expert** (toggle header) : PromptPreview affiché (lecture seule) + Textarea override en dessous.

### Enrichissement 3 couches

1. Preset → instructions de base (background, setup)
2. Blocs → instructions techniques (lighting rig, lens, mood)
3. Custom text → injecté à la fin, override partiel

### Favoris

- Coeur sur chaque PresetCard → sauvegarde combinaison (preset + blocs + textarea)
- Persisté dans `profiles.studio_settings.favorites` (JSONB)
- FavoritesPanel : liste, clic = applique, CRUD (sauvegarder, renommer, supprimer)

---

## Section 3 — FabricCanvas + Toolbar + Ajustements

### FabricJS v6 — Hook useFabricEditor

```typescript
actions.loadImage(url)
actions.crop() / resetCrop()
actions.zoom(level)           // 25% → 400%
actions.pan(enabled)
actions.rotate(degrees)
actions.flip('horizontal' | 'vertical')
actions.addText(options)
actions.addShape(type)        // arrow, rect, circle
actions.freeDrawing(enabled)
actions.applyFilter(filter)
actions.undo() / redo()
actions.exportImage(format, quality)
```

### FloatingToolbar

Position : centrée bas du canvas, z-30, glassmorphism.
Groupes : Zoom | Undo/Redo | Crop/Flip/Rotate | Draw/Text/Shape | Save/Download

### Badge contextuel

Haut gauche du canvas : "Original" ou "Généré" (+ nom preset en sous-texte).

### ImageAdjustmentsPanel (panneau droit, toggle)

280px, sliders : Luminosité, Contraste, Saturation, Netteté, Température. [-100, +100]. Preview temps réel via FabricJS filters. Bouton Réinitialiser.

---

## Section 4 — EditorFooter : SourceGallery + GeneratedTimeline

### Layout

Zone horizontale fixe ~140px, divisée en 2 par un divider vertical.

### SourceGallery (gauche)

- Thumbnails 80×80, rounded-lg
- Drag & drop réordonnables (@dnd-kit/sortable)
- Handle grip visible au survol
- Bordure primary sur l'image active dans le canvas
- Bouton [+] pour ajouter une image source
- "Sauvegarder l'ordre" → persiste dans working_content.images
- Clic → charge dans FabricCanvas avec badge "Original"

### GeneratedTimeline (droite)

- Thumbnails 80×80, rounded-lg
- Bordures : verte (approved), rouge (rejected), dashed (draft)
- Clic → charge dans FabricCanvas avec badge "Généré"
- Tooltips : preset, blocs prompt, date, latency, coût
- Actions rapides : ✓ Approuver, ✗ Rejeter
- Double-clic → ImageDetailModal (metadata complète + prompt)
- "Appliquer à la galerie →" : migre les images approuvées vers SourceGallery

---

## Section 5 — Routing, State, Migration

### Routing

```
app/app/photo-studio/page.tsx                → PhotoStudioPage (liste)
app/app/photo-studio/[productId]/page.tsx    → StudioEditorPage (NOUVEAU)
```

### StudioEditorContext

```typescript
interface StudioEditorState {
  product: Product
  activePresetId: string | null
  selectedBlocks: {
    lighting: string | null
    angle: string | null
    ambiance: string | null
    surface: string | null
  }
  customPromptText: string
  mode: 'simple' | 'expert'
  activeImageId: string | null
  activeImageType: 'source' | 'generated'
  adjustments: ImageAdjustments
  activeTool: 'select' | 'crop' | 'draw' | 'text' | 'shape' | null
  galleryOrder: string[]
  galleryDirty: boolean
}
```

### Nouveaux hooks

- `useFabricEditor` — init FabricJS, actions canvas
- `usePromptBuilder` — blocs → prompt enrichi 3 couches
- `useFavoritePresets` — CRUD favoris dans profiles.studio_settings
- `useGalleryReorder` — drag & drop + persist order

### Plan de migration (5 phases)

1. **Fondations** : FabricJS install, route [productId], StudioEditorContext, useFabricEditor, FabricCanvas + FloatingToolbar
2. **Sidebar** : ScenePresetsPanel, PromptBuilder, PromptPreview, FavoritesPanel, GenerateButton
3. **Footer** : SourceGallery (dnd-kit), GeneratedTimeline, ImageDetailModal, "Appliquer à la galerie"
4. **Intégration** : Wiring context, mode Simple/Expert, ImageAdjustmentsPanel, PublishToProductDialog
5. **Nettoyage** : Suppression anciens composants, mise à jour exports et routing

### Composants conservés

- `actions/` (registry), `monitoring/`, `classification/`
- Hooks existants (useStudioJobs, useBatchStudioJobs, useStudioImages, useStudioSettings)
- `constants/` (enrichis avec catégories)
- Page liste PhotoStudioPage (nettoyée)
