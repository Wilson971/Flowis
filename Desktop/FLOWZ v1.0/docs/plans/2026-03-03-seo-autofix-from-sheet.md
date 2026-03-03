# Spec: SEO Auto-Fix — Corrections IA depuis le Sheet

**Date:** 2026-03-03
**Status:** Draft — En attente d'approbation
**Depends on:** `2026-03-03-seo-sidebar-actionable-insights.md` (implemented)

---

## 1. Probleme

Le Sheet SEO affiche les problemes et recommandations mais n'offre aucune action corrective. L'utilisateur doit fermer le Sheet, naviguer vers le champ, puis chercher comment l'ameliorer manuellement. Frein majeur a l'adoption.

## 2. Objectif

Permettre a l'utilisateur de corriger chaque issue SEO en 1 clic depuis le Sheet :
- **Champs texte** : bouton "Corriger avec l'IA" → appel Gemini → preview inline → Accepter/Rejeter
- **Non-texte (alt, CTA)** : suggestions IA adaptees (alt text, reecriture meta desc avec CTA)
- **Batch** : bouton "Tout corriger" en haut pour generer toutes les corrections en parallele
- **Score live** : recalcul instantane apres chaque correction acceptee

## 3. Perimetre

### In-scope
- **Modifier** `SeoDetailSheet.tsx` — ajouter boutons "Corriger avec l'IA" par issue, bouton "Tout corriger", preview inline, logique d'appel API
- **Modifier** `SeoDetailSheet.tsx` — le score se recalcule en temps reel (deja reactif via `useSeoAnalysis` qui watch le form)

### Out-of-scope
- Creation de nouveaux endpoints API (on reutilise `/api/seo/suggest`)
- Modification du scoring SEO (`analyzer.ts`)
- Modification du `SeoSidebarWidget.tsx` (deja fait)
- Modification du `ProductEditContext`

## 4. Architecture

### API existante reutilisee

```
POST /api/seo/suggest
Request: { field, current_value, product_title, product_description?, focus_keyword?, store_name?, gsc_keywords? }
Response: { suggestions: [{ text, rationale }], field }
```

- 3 suggestions par champ, avec rationale
- Gemini 2.0 Flash, temperature 0.8
- Rate-limited, auth required, prompt injection detection

### Data Flow

```
SeoDetailSheet
  ├── "Tout corriger" button
  │     └── Pour chaque issue: fetch /api/seo/suggest en parallele
  │           └── Affiche preview inline par issue
  │
  ├── Issue card [meta_title]
  │     ├── "Corriger avec l'IA" → fetch /api/seo/suggest { field: "meta_title", ... }
  │     ├── Preview inline: 3 suggestions radio + score projete
  │     ├── "Accepter" → form.setValue("meta_title", suggestion) → score recalcule
  │     └── "Rejeter" → ferme la preview
  │
  └── Score par champ (reactif via useWatch → useSeoAnalysis)
        └── Se met a jour automatiquement quand form.setValue est appele
```

### Score live — Pourquoi ca marche deja

`useSeoAnalysis` dans `ProductEditContext` utilise `useWatch` sur tous les champs du form.
Quand `form.setValue("meta_title", ...)` est appele depuis le Sheet, le hook detecte le changement,
recalcule le score, et met a jour `seoAnalysis` dans le context. Le Sheet consomme `seoAnalysis`
via `useProductEditContext()` → les barres de score et le score global se mettent a jour automatiquement.

## 5. Design

### 5.1 Bouton "Tout corriger" (nouveau)

```
┌──────────────────────────────────────────┐
│  ✕   Analyse SEO detaillee     73/100    │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ ✨ Tout corriger avec l'IA      │    │
│  └──────────────────────────────────┘    │
│                                          │
│  SCORE PAR CHAMP                         │
│  ...                                     │
```

- Bouton pleine largeur, style primary/outline avec icone Sparkles
- Disabled pendant le loading
- Genere les suggestions pour TOUTES les issues en parallele
- Chaque issue passe en etat "preview" au fur et a mesure des reponses

### 5.2 Issue card avec correction IA (modifiee)

**Etat initial :**
```
┌────────────────────────────────────┐
│ ⚠ Titre SEO trop court            │
│   13 caracteres — minimum : 30    │
│   Enrichissez pour atteindre      │
│   50-60 caracteres.               │
│                                    │
│   [✨ Corriger]    [→ Voir champ] │
└────────────────────────────────────┘
```

**Etat loading :**
```
┌────────────────────────────────────┐
│ ⚠ Titre SEO trop court            │
│   13 caracteres — minimum : 30    │
│                                    │
│   ┌──────────────────────────┐    │
│   │ ████░░░░░░ Generation... │    │
│   └──────────────────────────┘    │
└────────────────────────────────────┘
```

**Etat preview (suggestions recues) :**
```
┌────────────────────────────────────────┐
│ ⚠ Titre SEO trop court                │
│                                        │
│   Choisissez une suggestion :          │
│                                        │
│   ○ "Volant Sport Racing Clio 3 —     │
│      Grip Ergonomique Premium"         │
│      Score projete: 85/100 (+36)       │
│      → Plus descriptif, mots-cles     │
│                                        │
│   ● "Volant Sport Clio 3 Haute        │
│      Performance Blanc Bleu Jaune"     │
│      Score projete: 92/100 (+43)       │
│      → Inclut les variantes couleur   │
│                                        │
│   ○ "Volant Racing Ergonomique pour   │
│      Renault Clio 3 — Look Sport"     │
│      Score projete: 78/100 (+29)       │
│      → Cible la marque vehicule       │
│                                        │
│   [✓ Accepter]    [✕ Rejeter]         │
└────────────────────────────────────────┘
```

**Etat accepted :**
```
┌────────────────────────────────────┐
│ ✓ Titre SEO                  92   │
│   Correction appliquee             │
└────────────────────────────────────┘
```

### 5.3 Mapping issue → API call

| Issue field | API field param | current_value source | Champs speciaux |
|---|---|---|---|
| `meta_title` | `"meta_title"` | `form.getValues("meta_title")` | — |
| `meta_description` | `"meta_description"` | `form.getValues("meta_description")` | Pour CTA: meme champ, le prompt gere deja les CTA |
| `title` | `"title"` | `form.getValues("title")` | — |
| `short_description` | `"short_description"` | `form.getValues("short_description")` | Strip HTML avant envoi |
| `description` | `"description"` | `form.getValues("description")` | Strip HTML avant envoi |
| `slug` | `"slug"` | `form.getValues("slug")` | — |
| `alt_text` | N/A | — | Pas via /api/seo/suggest. Redirige vers "Voir le champ" (alt text gere par le modal existant dans MediaTab) |
| `images` | N/A | — | Pas de fix IA possible. "Voir le champ" seulement |
| `cta_detection` | `"meta_description"` | `form.getValues("meta_description")` | Meme endpoint, le prompt inclut deja les CTA |
| `keyword_presence` | N/A | — | Necessite un focus_keyword. "Voir le champ" seulement |

**Champs non-fixables par IA** (conservent "Voir le champ" uniquement) :
- `images` — necessite upload manuel
- `alt_text` — gere par le modal existant dans MediaTabV2
- `keyword_presence` — necessite que l'user definisse un focus_keyword
- `gsc_traffic_signal` — donnees externes, pas modifiable

### 5.4 Score projete par suggestion

Chaque suggestion affiche un score projete calcule cote client :

```typescript
// Pour chaque suggestion, on simule le score "what-if"
const projectedScore = calculateProductSeoScore({
    ...currentProductSeoInput,
    [issue.field]: suggestion.text, // Remplace le champ par la suggestion
});
const delta = projectedScore.fieldScores[issue.field] - currentFieldScore;
```

On reutilise `calculateProductSeoScore` de `@/lib/seo/analyzer.ts` (deja utilise dans SeoAISuggestionModal).

## 6. Implementation

### 6.1 Types a ajouter (dans SeoDetailSheet)

```typescript
type IssueSuggestionState = {
    status: 'idle' | 'loading' | 'loaded' | 'accepted' | 'error';
    suggestions?: Array<{ text: string; rationale: string }>;
    selectedIndex?: number;
    error?: string;
};
```

### 6.2 State management (dans SeoDetailSheet)

```typescript
// Map issue.field → suggestion state
const [suggestionStates, setSuggestionStates] = useState<Record<string, IssueSuggestionState>>({});

// Batch loading state
const [isBatchFixing, setIsBatchFixing] = useState(false);
```

### 6.3 Hook pour acceder au form

Le Sheet a besoin d'acceder au form pour :
1. Lire les valeurs courantes (`getValues`)
2. Ecrire les corrections (`setValue`)

Le form est accessible via `useFormContext` car le Sheet est rendu a l'interieur du `<form>` (dans ProductEditorContainerV2).

```typescript
const { getValues, setValue } = useFormContext<ProductFormValues>();
```

### 6.4 Fonction fetchSuggestion (par issue)

```typescript
const fetchSuggestion = async (field: SeoFieldType) => {
    // Set loading
    setSuggestionStates(prev => ({
        ...prev,
        [field]: { status: 'loading' }
    }));

    const apiField = field === 'cta_detection' ? 'meta_description' : field;
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

    const currentValue = getValues(apiField as keyof ProductFormValues) || '';
    const productTitle = getValues('title') || '';
    const description = stripHtml(String(getValues('description') || ''));

    try {
        const res = await fetch('/api/seo/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field: apiField,
                current_value: typeof currentValue === 'string' ? currentValue : '',
                product_title: productTitle,
                product_description: description.substring(0, 500),
                store_name: selectedStore?.name,
            }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setSuggestionStates(prev => ({
            ...prev,
            [field]: { status: 'loaded', suggestions: data.suggestions, selectedIndex: 0 }
        }));
    } catch (error) {
        setSuggestionStates(prev => ({
            ...prev,
            [field]: { status: 'error', error: 'Erreur de generation' }
        }));
    }
};
```

### 6.5 Fonction "Tout corriger"

```typescript
const fixAll = async () => {
    setIsBatchFixing(true);
    const fixableIssues = sortedIssues.filter(i => FIXABLE_FIELDS.includes(i.field));

    // Deduplicate by field (multiple issues can target same field)
    const uniqueFields = [...new Set(fixableIssues.map(i => i.field))];

    await Promise.allSettled(uniqueFields.map(field => fetchSuggestion(field)));
    setIsBatchFixing(false);
};
```

### 6.6 Fonction "Accepter"

```typescript
const acceptSuggestion = (field: SeoFieldType) => {
    const state = suggestionStates[field];
    if (!state?.suggestions || state.selectedIndex === undefined) return;

    const suggestion = state.suggestions[state.selectedIndex];
    const formField = field === 'cta_detection' ? 'meta_description' : field;

    setValue(formField as keyof ProductFormValues, suggestion.text, { shouldDirty: true });

    setSuggestionStates(prev => ({
        ...prev,
        [field]: { ...prev[field], status: 'accepted' }
    }));
};
```

### 6.7 Champs fixables

```typescript
const FIXABLE_FIELDS: SeoFieldType[] = [
    'meta_title',
    'meta_description',
    'title',
    'short_description',
    'description',
    'slug',
    'cta_detection', // Mapped to meta_description
];

const isFixable = (field: SeoFieldType) => FIXABLE_FIELDS.includes(field);
```

## 7. Fichiers modifies

| Fichier | Action | Details |
|---------|--------|---------|
| `SeoDetailSheet.tsx` | **Modifie** | Ajout: bouton "Tout corriger", bouton "Corriger" par issue, preview inline avec suggestions, accept/reject, score projete, useFormContext |

**1 seul fichier modifie.** Toute la logique est contenue dans le Sheet.

## 8. Sequence d'implementation

1. Ajouter `useFormContext` + imports necessaires dans SeoDetailSheet
2. Ajouter les types `IssueSuggestionState` et constantes `FIXABLE_FIELDS`
3. Implementer `fetchSuggestion`, `fixAll`, `acceptSuggestion`, `rejectSuggestion`
4. Ajouter le bouton "Tout corriger avec l'IA" en haut du Sheet
5. Modifier chaque issue card : ajouter bouton "Corriger" + rendu conditionnel selon `suggestionState.status`
6. Implementer le rendu preview inline (radio suggestions + score projete + accept/reject)
7. Implementer l'etat "accepted" (card collapsed verte)
8. Score projete via `calculateProductSeoScore` — import + ProductSeoInput construction
9. Test manuel complet

## 9. UX States par issue

| State | Rendu |
|-------|-------|
| `idle` | Card issue classique + bouton "Corriger" + bouton "Voir le champ" |
| `loading` | Skeleton/spinner dans la card, boutons disabled |
| `loaded` | 3 suggestions radio avec score projete + delta, boutons Accepter/Rejeter |
| `accepted` | Card collapsed verte "Correction appliquee" avec score |
| `error` | Message d'erreur + bouton "Reessayer" |

## 10. Dependances

- `/api/seo/suggest` — endpoint existant, aucune modification
- `calculateProductSeoScore` — fonction existante dans `@/lib/seo/analyzer.ts`
- `useFormContext` — deja disponible (le Sheet est dans le form)
- `selectedStore` — accessible via `useProductEditContext`

## 11. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rate limit atteint avec "Tout corriger" (multiple appels simultanes) | 429 sur certains champs | Afficher erreur par issue, user peut reessayer individuellement |
| Score projete incorrect si HTML dans le champ | Score fausse | Strip HTML avant calcul (deja fait dans analyzer) |
| `useFormContext` null si Sheet rendu hors form | Crash | Le Sheet est rendu dans SeoSidebarWidget qui est dans ProductSidebar, lui-meme dans le form — pas de risque |
| Suggestion IA de mauvaise qualite | UX decevante | Preview obligatoire avant application, user peut rejeter |
