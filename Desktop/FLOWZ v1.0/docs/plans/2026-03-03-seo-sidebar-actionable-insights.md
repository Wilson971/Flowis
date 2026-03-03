# Spec: SEO Score Card — Actionable Insights Sheet

**Date:** 2026-03-03
**Status:** Draft — En attente d'approbation
**Scope:** Product Editor Sidebar → SEO Score Widget

---

## 1. Problème

La card "Score SEO" dans la sidebar du product editor affiche un message vague ("2 améliorations possibles") sans aucun détail ni action. L'utilisateur ne sait pas **quoi** améliorer, **pourquoi**, ni **comment**. Le bouton "Détails & Analyse" relance une sauvegarde + analyse complète, ce qui n'est pas l'intention.

## 2. Objectif

Transformer la card SEO en point d'entrée actionnable : un clic ouvre un **Sheet (drawer latéral droit)** qui présente le détail complet de l'analyse avec des recommandations et des actions directes vers les champs concernés.

## 3. Périmètre

### In-scope
- **Modifier** `SeoSidebarWidget.tsx` — rendre le résumé d'issues cliquable, supprimer le bouton "Détails & Analyse"
- **Créer** `SeoDetailSheet.tsx` — nouveau composant Sheet avec le détail SEO
- **Ajouter** des `id` sur les champs éditables (titre, desc courte, desc longue, slug, meta) pour le scroll-to-field

### Out-of-scope
- Modification de la logique d'analyse SEO (`analyzer.ts`, `constants.ts`)
- Modification du `SeoTabV2` (section SEO dans le contenu principal)
- Modification du `ProductEditContext` (le sheet utilise les données déjà disponibles)

## 4. Design

### 4.1 Card Sidebar (modifiée)

```
┌─────────────────────────────────────┐
│ Aa  RÉFÉRENCEMENT                   │
│     Score SEO              73/100   │
├─────────────────────────────────────┤
│                                     │
│          ╭──── 73 ────╮             │
│          │   (gauge)   │             │
│          ╰─────────────╯             │
│                                     │
│  ┌─ warning clickable ───────── →┐  │
│  │ 2  améliorations possibles    │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Changements :**
- Le résumé d'issues (critique/warning) devient un `<button>` cliquable
- Micro-interaction hover : flèche `→` slide-in + fond légèrement plus intense
- **Suppression** du bouton "Détails & Analyse"
- Si `issues.length === 0` et `overallScore > 0` : message "Excellent travail" reste (non cliquable)

### 4.2 Sheet SEO Detail (nouveau)

```
┌──────────────────────────────────────────┐
│  ✕   Analyse SEO détaillée     73/100    │
├──────────────────────────────────────────┤
│                                          │
│  SCORE PAR CHAMP                         │
│  ┌────────────────────────────────────┐  │
│  │ Titre              13ch   20/100   │  │
│  │ ████░░░░░░░░░░░░░░░░  FAIBLE      │  │
│  ├────────────────────────────────────┤  │
│  │ Description courte 228ch  40/100   │  │
│  │ ████████░░░░░░░░░░░░  MOYEN       │  │
│  ├────────────────────────────────────┤  │
│  │ Description        2197ch 20/100   │  │
│  │ ████░░░░░░░░░░░░░░░░  FAIBLE      │  │
│  ├────────────────────────────────────┤  │
│  │ Meta titre         —      0/100    │  │
│  │ ░░░░░░░░░░░░░░░░░░░░  CRITIQUE    │  │
│  ├────────────────────────────────────┤  │
│  │ Meta description   —      0/100    │  │
│  │ ░░░░░░░░░░░░░░░░░░░░  CRITIQUE    │  │
│  ├────────────────────────────────────┤  │
│  │ Slug              ok      85/100   │  │
│  │ █████████████████░░░  BON          │  │
│  ├────────────────────────────────────┤  │
│  │ Images            3       85/100   │  │
│  │ █████████████████░░░  BON          │  │
│  ├────────────────────────────────────┤  │
│  │ Texte alt         2/3    65/100    │  │
│  │ █████████████░░░░░░░  MOYEN       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  PROBLÈMES À CORRIGER                   │
│  ┌────────────────────────────────────┐  │
│  │ 🔴 Titre trop court               │  │
│  │    Le titre fait 13 caractères.    │  │
│  │    Visez 30-60 caractères pour     │  │
│  │    un meilleur référencement.      │  │
│  │                    [Voir le champ] │  │
│  ├────────────────────────────────────┤  │
│  │ 🟡 Description trop longue        │  │
│  │    2197 caractères détectés.       │  │
│  │    L'idéal est entre 400-800       │  │
│  │    caractères.                     │  │
│  │                    [Voir le champ] │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

**Comportement "Voir le champ" :**
1. Ferme le Sheet
2. Scroll smooth vers le champ concerné (via `document.getElementById()`)
3. Flash highlight temporaire (ring pulse 1s) sur le champ cible

## 5. Data Flow

```
SeoSidebarWidget
  └── onClick résumé → open Sheet (local state useState)
        └── SeoDetailSheet
              ├── props: seoAnalysis (from useProductEditContext)
              ├── fieldScores → barre de progression par champ
              ├── issues → liste groupée par sévérité
              └── "Voir le champ" → onClose + scrollToField(issue.field)
```

**Mapping field → DOM id :**

| SeoFieldType | DOM id cible | Composant parent |
|---|---|---|
| `title` | `#field-title` | GeneralTabV2 |
| `short_description` | `#field-short-description` | GeneralTabV2 |
| `description` | `#field-description` | GeneralTabV2 |
| `meta_title` | `#field-meta-title` | SeoTabV2 |
| `meta_description` | `#field-meta-description` | SeoTabV2 |
| `slug` | `#field-slug` | SeoTabV2 |
| `images` | `#field-images` | MediaTabV2 |
| `alt_text` | `#field-images` | MediaTabV2 (même section) |

## 6. Composants

### 6.1 `SeoSidebarWidget.tsx` (modifié)

**Changements :**
- Importer `useState` + `SeoDetailSheet`
- Ajouter state `const [sheetOpen, setSheetOpen] = useState(false)`
- Résumé critique/warning → `<button onClick={() => setSheetOpen(true)}>` avec hover micro-interaction (ArrowRight slide-in)
- Supprimer le `<Button>` "Détails & Analyse"
- Rendre `<SeoDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} />`

### 6.2 `SeoDetailSheet.tsx` (nouveau)

**Location :** `my-app/src/features/products/components/edit/SeoDetailSheet.tsx`

**Props :**
```typescript
interface SeoDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Composants utilisés :**
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` (shadcn/ui)
- `SeoScoreGauge` (existant, size="sm")
- `Progress` (shadcn/ui) pour les barres par champ
- `Badge` pour les niveaux (Excellent, Bon, Moyen, Faible, Critique)
- `Button` variant ghost pour "Voir le champ"
- `ScrollArea` (shadcn/ui) pour le contenu scrollable

**Sections :**
1. **Header** — Titre "Analyse SEO détaillée" + badge score global
2. **Score par champ** — Liste des 8 champs base avec barre de progression + label niveau + nombre de chars
3. **Issues** — Groupées par sévérité (critical d'abord, puis warning), chaque issue avec :
   - Icône sévérité (cercle rouge/orange)
   - `issue.title` en gras
   - `issue.description` en muted
   - `issue.recommendation` si présent
   - Bouton "Voir le champ" (si le champ a un id DOM mappable)

**Fonction scroll-to-field :**
```typescript
const scrollToField = (field: SeoFieldType) => {
  onOpenChange(false); // Fermer le sheet
  // Petit délai pour laisser le sheet se fermer
  setTimeout(() => {
    const el = document.getElementById(`field-${field.replace('_', '-')}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
      el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 1500);
    }
  }, 300);
};
```

### 6.3 Champs éditables (ajout d'id)

Ajouter `id="field-{name}"` sur les wrappers des champs dans :
- `GeneralTabV2.tsx` — titre, description courte, description longue
- `SeoTabV2.tsx` / `ProductSeoTab.tsx` — meta_title, meta_description, slug
- `MediaTabV2.tsx` — section images

## 7. Labels & Traductions

**Champs (FR) :**
| field | Label FR |
|---|---|
| `title` | Titre |
| `short_description` | Description courte |
| `description` | Description longue |
| `meta_title` | Meta titre |
| `meta_description` | Meta description |
| `slug` | URL (slug) |
| `images` | Images |
| `alt_text` | Texte alternatif |
| `keyword_presence` | Mot-clé principal |
| `cta_detection` | Appel à l'action |
| `gsc_traffic_signal` | Signal trafic GSC |

**Niveaux (FR) :**
| level | Label |
|---|---|
| `excellent` | Excellent |
| `good` | Bon |
| `average` | Moyen |
| `poor` | Faible |
| `critical` | Critique |

## 8. Séquence d'implémentation

1. **Ajouter les `id` sur les champs** — GeneralTabV2, SeoTabV2/ProductSeoTab, MediaTabV2
2. **Créer `SeoDetailSheet.tsx`** — Nouveau composant avec Sheet + contenu détaillé
3. **Modifier `SeoSidebarWidget.tsx`** — Résumé cliquable + suppression bouton + intégration Sheet
4. **Test manuel** — Vérifier scroll-to-field, fermeture sheet, highlight, responsive

## 9. Dépendances

- shadcn/ui `Sheet` (déjà installé ? à vérifier)
- shadcn/ui `Progress` (déjà installé ? à vérifier)
- shadcn/ui `ScrollArea` (déjà installé ? à vérifier)
- Aucune nouvelle dépendance npm

## 10. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Sheet non installé dans shadcn | Bloquant | Installer via `npx shadcn@latest add sheet` |
| Champs sans id causent scroll raté | UX dégradée | Fallback silencieux (pas de scroll si id absent) |
| Sheet trop lourd sur mobile | Performance | ScrollArea + lazy content |
