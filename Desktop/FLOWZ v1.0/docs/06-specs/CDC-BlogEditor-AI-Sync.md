# Cahier des Charges - Éditeur d'Article Standalone avec IA & Synchronisation

**Version:** 1.1
**Date:** 2026-02-02
**Projet:** FLOWZ v1.0

---

## 1. Contexte et Objectifs

### 1.1 Contexte
FLOWZ dispose actuellement de **FloWriter** (wizard de génération IA en 6 étapes) et d'un **BlogEditor** basique.

**Ce cahier des charges concerne un nouvel éditeur STANDALONE**, distinct de FloWriter, permettant de :
- Créer un article from scratch (sans passer par FloWriter)
- Éditer/retravailler un article existant (créé via FloWriter ou manuellement)
- Bénéficier d'actions IA contextuelles pour améliorer le contenu
- Planifier ou publier immédiatement

### 1.2 Positionnement dans l'Application

```
┌─────────────────────────────────────────────────────────────────┐
│                        GESTION BLOG                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ┌─────────────────────┐                            │
│              │   LISTE ARTICLES    │                            │
│              │   (BlogList)        │                            │
│              └─────────┬───────────┘                            │
│                        │                                         │
│         ┌──────────────┼──────────────┐                         │
│         │              │              │                         │
│         ▼              ▼              ▼                         │
│   [+ Nouvel      [Clic sur       [+ Nouvel                     │
│    article IA]    article]        article manuel]               │
│         │              │              │                         │
│         ▼              │              │                         │
│   ┌──────────────┐     │              │                         │
│   │  FLOWRITER   │     │              │                         │
│   │  (Wizard IA) │     │              │                         │
│   │  6 étapes    │     │              │                         │
│   └──────┬───────┘     │              │                         │
│          │             │              │                         │
│          └─────────────┼──────────────┘                         │
│                        ▼                                         │
│          ┌─────────────────────────────┐                        │
│          │   ÉDITEUR STANDALONE        │                        │
│          │   (Ce cahier des charges)   │                        │
│          │                             │                        │
│          │  • Édition articles         │                        │
│          │  • Création manuelle        │                        │
│          │  • Actions IA contextuelles │                        │
│          │  • Synchronisation          │                        │
│          │  • Planification            │                        │
│          └─────────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Flux Utilisateur Principal

```
SCÉNARIO 1: Édition d'un article existant
─────────────────────────────────────────
Liste des articles → Clic sur l'article → Éditeur Standalone (ce formulaire)

SCÉNARIO 2: Création avec FloWriter
─────────────────────────────────────
Liste des articles → [+ Nouvel article IA] → FloWriter (6 étapes)
                   → Sauvegarde brouillon → Retour liste
                   → Clic sur brouillon → Éditeur Standalone (retouches)

SCÉNARIO 3: Création manuelle
─────────────────────────────
Liste des articles → [+ Nouvel article manuel] → Éditeur Standalone (vide)
```

### 1.4 Objectifs Principaux
1. **Formulaire d'édition principal** : Point d'entrée unique quand l'utilisateur clique sur un article depuis la liste
2. **Retravailler les brouillons FloWriter** : Permet de peaufiner les articles générés par IA avant publication
3. **Actions IA intégrées** : Outils IA contextuels pour améliorer, réécrire, simplifier le contenu existant
4. **Synchronisation** : Planifier ou publier immédiatement vers les plateformes connectées (WooCommerce, etc.)
5. **Création manuelle** : Alternative à FloWriter pour ceux qui préfèrent rédiger sans assistant IA

---

## 2. Périmètre Fonctionnel

### 2.1 Cas d'Utilisation

| Cas | Description | Point d'entrée |
|-----|-------------|----------------|
| **Éditer un brouillon FloWriter** | Retravailler un article généré par FloWriter | Clic sur l'article dans BlogList |
| **Éditer un article publié** | Modifier un article déjà en ligne | Clic sur l'article dans BlogList |
| **Créer un article manuellement** | Rédiger un article sans passer par FloWriter | Bouton "+ Nouvel article manuel" |
| **Retravailler avec l'IA** | Utiliser les actions IA pour améliorer le contenu | Toolbar/Bubble menu dans l'éditeur |
| **Planifier une publication** | Définir date/heure de publication future | Onglet Publication |
| **Publier immédiatement** | Publier sur les plateformes connectées | Bouton "Publier" |

**Important** : Cet éditeur est le point d'entrée principal pour **tous les articles existants**, qu'ils aient été créés via FloWriter ou manuellement.

### 2.2 Formulaire d'Édition d'Article

#### 2.2.1 Structure du Formulaire (3 onglets)

**Onglet 1 : Contenu**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `title` | Input | Oui | Titre de l'article (max 200 caractères) |
| `slug` | Input | Oui | URL slug (auto-généré depuis titre, éditable) |
| `content` | TipTap Editor | Oui | Contenu principal avec toolbar IA |
| `excerpt` | Textarea | Non | Extrait/résumé (max 300 caractères) |
| `featured_image` | Image Upload | Non | Image mise en avant |
| `category` | Select | Non | Catégorie de l'article |
| `tags` | Multi-Select | Non | Tags associés |

**Onglet 2 : SEO**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `meta_title` | Input | Non | Titre SEO (max 70 caractères) |
| `meta_description` | Textarea | Non | Description SEO (max 160 caractères) |
| `og_image` | Image Upload | Non | Image Open Graph |
| `canonical_url` | Input | Non | URL canonique |
| `no_index` | Checkbox | Non | Bloquer l'indexation |

**Onglet 3 : Publication**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `status` | Radio | Oui | draft / scheduled / published |
| `publish_mode` | Radio | Oui | Maintenant / Planifié |
| `scheduled_at` | DateTime | Cond. | Date/heure si planifié |
| `platforms` | Checkboxes | Oui | Plateformes de publication |
| `author` | Select | Oui | Auteur (défaut: user connecté) |

---

### 2.3 Actions Intelligentes IA

> **Note** : Ces actions sont disponibles UNIQUEMENT dans l'éditeur standalone, pas dans FloWriter qui a son propre flux.

#### 2.3.1 Toolbar IA (Actions Globales)

Actions applicables sur **tout l'article** :

| Action | Icône | Raccourci | Description |
|--------|-------|-----------|-------------|
| **Améliorer le style** | `Sparkles` | `Ctrl+Alt+S` | Reformule pour un style plus engageant |
| **Simplifier** | `FileDown` | `Ctrl+Alt+I` | Rend le texte plus accessible et concis |
| **Développer** | `FileUp` | `Ctrl+Alt+D` | Enrichit et développe les idées |
| **Corriger** | `SpellCheck` | `Ctrl+Alt+C` | Correction orthographe/grammaire |
| **Changer le ton** | `MessageSquare` | - | Menu : Professionnel / Casual / Persuasif / Informatif |
| **Traduire** | `Languages` | - | Menu : FR / EN / ES / DE |

#### 2.3.2 Bubble Menu IA (Actions Contextuelles)

Actions applicables sur **texte sélectionné** (apparaît au survol de la sélection) :

| Action | Icône | Description |
|--------|-------|-------------|
| **Réécrire** | `RefreshCw` | Reformule le passage sélectionné |
| **Étendre** | `Plus` | Développe le passage (ajoute détails) |
| **Raccourcir** | `Minus` | Condense le passage |
| **Clarifier** | `Lightbulb` | Rend plus clair et précis |
| **Ajouter exemples** | `List` | Insère des exemples pertinents |
| **Changer le ton** | `MessageSquare` | Change le ton du passage uniquement |

#### 2.3.3 Actions de Génération

Boutons dédiés pour **générer du contenu** :

| Action | Emplacement | Description |
|--------|-------------|-------------|
| **Générer introduction** | Début éditeur | Crée une accroche basée sur le contenu |
| **Générer conclusion** | Fin éditeur | Crée une conclusion récapitulative |
| **Suggérer titres** | Près du champ titre | Propose 3-5 variantes de titre |
| **Générer méta-description** | Onglet SEO | Crée une meta description optimisée |
| **Générer excerpt** | Près du champ excerpt | Résume l'article en 2-3 phrases |

#### 2.3.4 Comportement des Actions IA

```
┌─────────────────────────────────────────────────────────────┐
│  FLUX D'UNE ACTION IA                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User clique sur action IA                                │
│           │                                                  │
│           ▼                                                  │
│  2. Loading indicator (skeleton sur zone concernée)          │
│           │                                                  │
│           ▼                                                  │
│  3. Panel de preview s'ouvre (slide-over droite)            │
│     ┌────────────────────────────────┐                      │
│     │  AVANT          │  APRÈS       │                      │
│     │  [Original]     │  [IA Result] │                      │
│     │                 │              │                      │
│     │  [Annuler]      [Appliquer]    │                      │
│     └────────────────────────────────┘                      │
│           │                                                  │
│           ▼                                                  │
│  4a. "Appliquer" → Remplace le contenu                      │
│  4b. "Annuler" → Ferme le panel, rien ne change             │
│           │                                                  │
│           ▼                                                  │
│  5. Action ajoutée à l'historique (Undo disponible)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Règles** :
- Une seule action IA à la fois
- Preview obligatoire avant application (sauf correction ortho)
- Historique conservé pour la session (max 20 actions)
- Rate limit : 50 actions/jour/utilisateur

---

### 2.4 Fonctionnalité de Synchronisation

#### 2.4.1 Options de Publication

| Option | Description |
|--------|-------------|
| **Brouillon** | Sauvegarder sans publier (status: draft) |
| **Publier maintenant** | Publication immédiate sur plateformes sélectionnées |
| **Planifier** | Définir date/heure de publication future |

#### 2.4.2 Interface Onglet Publication

```
┌─────────────────────────────────────────────────────────────────┐
│  📅 PUBLICATION                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STATUT DE L'ARTICLE                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ○ Brouillon    ● Publier    ○ Archiver                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  QUAND PUBLIER ?                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ● Maintenant                                             │    │
│  │ ○ Planifier pour plus tard                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  (Si "Planifier" sélectionné)                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ 📅 15/02/2026        │  │ 🕐 09:00             │            │
│  └──────────────────────┘  └──────────────────────┘            │
│  Fuseau: Europe/Paris (UTC+1)                                   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  OÙ PUBLIER ?                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ☑ FLOWZ Blog (local)               ✓ Connecté           │    │
│  │ ☑ WooCommerce                      ✓ Connecté           │    │
│  │ ☐ WordPress.com                    ⚠ Non connecté       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  AUTEUR                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 👤 Wilson (vous)                                    ▾   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  📊 HISTORIQUE DE SYNCHRONISATION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  (Vide si nouvel article)                                       │
│                                                                  │
│  🟢 FLOWZ Blog    15/01/2026 14:30    Publié                   │
│  🟢 WooCommerce   15/01/2026 14:31    Publié (ID: 456)         │
│  🔴 WordPress     15/01/2026 14:32    Échec: Token expiré      │
│     └─ [🔄 Réessayer]                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.4.3 Statuts de Synchronisation

| Statut | Badge | Description |
|--------|-------|-------------|
| `draft` | ⚪ Brouillon | Non publié |
| `pending` | 🟡 En attente | Planifié, pas encore publié |
| `syncing` | 🔵 En cours | Publication en cours |
| `published` | 🟢 Publié | Publié avec succès |
| `failed` | 🔴 Échec | Erreur de publication |
| `partial` | 🟠 Partiel | Publié sur certaines plateformes uniquement |

---

## 3. Spécifications Techniques

### 3.1 Architecture des Composants

```
src/components/blog-editor-standalone/
├── ArticleEditor.tsx                # Composant principal (entry point)
├── ArticleEditorForm.tsx            # Formulaire React Hook Form
├── tabs/
│   ├── ContentTab.tsx               # Onglet contenu + éditeur IA
│   ├── SeoTab.tsx                   # Onglet SEO
│   └── PublishTab.tsx               # Onglet publication/sync
├── editor/
│   ├── EditorWithAI.tsx             # TipTap + toolbar IA
│   ├── AIToolbar.tsx                # Barre actions IA globales
│   ├── AIBubbleMenu.tsx             # Menu contextuel sur sélection
│   ├── AIPreviewPanel.tsx           # Panel preview résultat
│   └── AIGenerateButtons.tsx        # Boutons génération (intro, conclusion...)
├── publish/
│   ├── PublishOptions.tsx           # Options publier/planifier
│   ├── PlatformSelector.tsx         # Sélection plateformes
│   ├── SchedulePicker.tsx           # Date/heure picker
│   └── SyncHistory.tsx              # Historique synchronisation
└── hooks/
    ├── useArticleForm.ts            # Hook formulaire principal
    ├── useAIEditorActions.ts        # Hook actions IA éditeur
    └── useArticleSync.ts            # Hook synchronisation
```

### 3.2 Routing

```typescript
// src/routes/app/blog/editor/$articleId.tsx  (édition)
// src/routes/app/blog/editor/new.tsx         (création)

// Exemple route TanStack Router
export const Route = createFileRoute('/app/blog/editor/$articleId')({
  component: ArticleEditorPage,
  loader: ({ params }) => fetchArticle(params.articleId),
});
```

### 3.3 Schéma Base de Données (extensions)

```sql
-- Extension table articles existante
ALTER TABLE articles ADD COLUMN IF NOT EXISTS
  scheduled_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'draft',
  last_synced_at TIMESTAMPTZ;

-- Table historique de synchronisation
CREATE TABLE IF NOT EXISTS article_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,  -- 'flowz', 'woocommerce', 'wordpress'
  status TEXT NOT NULL,    -- 'pending', 'syncing', 'synced', 'failed'
  external_id TEXT,        -- ID sur la plateforme externe
  external_url TEXT,       -- URL sur la plateforme externe
  error_message TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table publications planifiées
CREATE TABLE IF NOT EXISTS scheduled_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  platforms JSONB NOT NULL,  -- ["flowz", "woocommerce"]
  status TEXT DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour le job scheduler
CREATE INDEX IF NOT EXISTS idx_scheduled_pending
  ON scheduled_publications(scheduled_at)
  WHERE status = 'pending';
```

### 3.4 Schémas Zod

```typescript
// src/schemas/article-editor.ts

import { z } from 'zod';

// Actions IA disponibles
export const aiEditorActionSchema = z.enum([
  // Actions globales
  'improve_style',
  'simplify',
  'expand',
  'correct',
  'change_tone',
  'translate',
  // Actions contextuelles (sélection)
  'rewrite_selection',
  'expand_selection',
  'shorten_selection',
  'clarify_selection',
  'add_examples',
  // Actions génération
  'generate_intro',
  'generate_conclusion',
  'suggest_titles',
  'generate_meta_description',
  'generate_excerpt'
]);

export const toneSchema = z.enum([
  'professional',
  'casual',
  'persuasive',
  'informative'
]);

export const languageSchema = z.enum(['fr', 'en', 'es', 'de']);

export const platformSchema = z.enum([
  'flowz',
  'woocommerce',
  'wordpress'
]);

export const articleStatusSchema = z.enum([
  'draft',
  'scheduled',
  'published',
  'archived'
]);

export const syncStatusSchema = z.enum([
  'draft',
  'pending',
  'syncing',
  'published',
  'failed',
  'partial'
]);

// Formulaire article complet
export const articleFormSchema = z.object({
  // Contenu
  title: z.string().min(1, 'Titre requis').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  content: z.string().min(1, 'Contenu requis'),
  excerpt: z.string().max(300).optional().nullable(),
  featured_image: z.string().url().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),

  // SEO
  meta_title: z.string().max(70).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  og_image: z.string().url().optional().nullable(),
  canonical_url: z.string().url().optional().nullable(),
  no_index: z.boolean().default(false),

  // Publication
  status: articleStatusSchema.default('draft'),
  author_id: z.string().uuid(),
  publish_mode: z.enum(['now', 'scheduled']).default('now'),
  scheduled_at: z.string().datetime().optional().nullable(),
  platforms: z.array(platformSchema).min(1).default(['flowz'])
});

// Request action IA
export const aiActionRequestSchema = z.object({
  action: aiEditorActionSchema,
  content: z.string().min(1).max(50000),
  selection: z.object({
    from: z.number(),
    to: z.number(),
    text: z.string()
  }).optional(),
  options: z.object({
    tone: toneSchema.optional(),
    language: languageSchema.optional()
  }).optional()
});

export type ArticleForm = z.infer<typeof articleFormSchema>;
export type AIEditorAction = z.infer<typeof aiEditorActionSchema>;
export type AIActionRequest = z.infer<typeof aiActionRequestSchema>;
```

### 3.5 Hooks Principaux

```typescript
// src/hooks/blog/useArticleForm.ts
export function useArticleForm(articleId?: string) {
  return {
    // Data
    article: Article | null,
    isLoading: boolean,
    isNew: boolean,

    // Form
    form: UseFormReturn<ArticleForm>,
    isDirty: boolean,

    // Mutations
    saveDraft: UseMutation,      // Sauvegarder brouillon
    publish: UseMutation,        // Publier maintenant
    schedule: UseMutation,       // Planifier

    // Auto-save
    lastSaved: Date | null,
    isSaving: boolean
  };
}

// src/hooks/blog/useAIEditorActions.ts
export function useAIEditorActions() {
  return {
    // Execute
    executeAction: UseMutation,
    previewAction: UseMutation,

    // State
    isProcessing: boolean,
    currentAction: AIEditorAction | null,
    previewResult: string | null,

    // History
    history: AIActionHistory[],
    undo: () => void,
    canUndo: boolean
  };
}

// src/hooks/blog/useArticleSync.ts
export function useArticleSync(articleId: string) {
  return {
    // Status
    syncStatus: SyncStatus,
    syncLogs: SyncLog[],

    // Actions
    syncNow: UseMutation,
    retryPlatform: UseMutation,
    cancelSchedule: UseMutation,

    // Platforms
    connectedPlatforms: Platform[],
    selectedPlatforms: Platform[]
  };
}
```

---

## 4. User Stories

### 4.1 Création/Édition Article

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-01 | Rédacteur | Créer un nouvel article manuellement | Rédiger sans utiliser FloWriter |
| US-02 | Rédacteur | Éditer un article existant | Modifier le contenu après publication |
| US-03 | Rédacteur | Sauvegarder en brouillon | Continuer plus tard |
| US-04 | Rédacteur | Voir l'auto-save fonctionner | Ne pas perdre mon travail |
| US-05 | Rédacteur | Prévisualiser mon article | Voir le rendu final |

### 4.2 Actions IA

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-10 | Rédacteur | Améliorer le style de mon article | Rendre le contenu plus engageant |
| US-11 | Rédacteur | Sélectionner un paragraphe et le réécrire | Améliorer une section spécifique |
| US-12 | Rédacteur | Prévisualiser le résultat IA | Valider avant d'appliquer |
| US-13 | Rédacteur | Annuler une modification IA | Revenir en arrière |
| US-14 | Rédacteur | Générer une introduction automatiquement | Gagner du temps |
| US-15 | Rédacteur | Changer le ton de mon article | Adapter à mon audience |
| US-16 | Rédacteur | Générer une méta-description SEO | Optimiser le référencement |

### 4.3 Synchronisation

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| US-20 | Rédacteur | Publier immédiatement mon article | Partager rapidement |
| US-21 | Rédacteur | Planifier une publication future | Organiser mon calendrier |
| US-22 | Rédacteur | Choisir les plateformes de publication | Cibler mes canaux |
| US-23 | Rédacteur | Voir le statut de synchronisation | Savoir si ça a marché |
| US-24 | Rédacteur | Réessayer une publication échouée | Corriger les erreurs |
| US-25 | Rédacteur | Annuler une publication planifiée | Changer mes plans |

---

## 5. Wireframes

### 5.1 Vue Principale - Onglet Contenu

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Articles                    Éditeur d'Article               [Sauvegarder]│
│                                                          Auto-save: il y a 2s│
├─────────────────────────────────────────────────────────────────────────────┤
│  [📝 Contenu]    [🔍 SEO]    [📅 Publication]                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TITRE                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Mon article de blog                              [✨ Suggérer titres]  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  URL: flowz.com/blog/ mon-article-de-blog  [✏️]                             │
│                                                                              │
│  CONTENU                                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ [B][I][U] │ [H2][H3] │ [•][1.] │ ["][<>] │ [🔗][📷]                    │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ [✨ Améliorer] [📝 Simplifier] [📈 Développer] [🎭 Ton ▾] [🔧 Plus ▾]  │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  [✨ Générer introduction]                                             │ │
│  │                                                                        │ │
│  │  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do       │ │
│  │  eiusmod tempor incididunt ut labore et dolore magna aliqua.          │ │
│  │                                                                        │ │
│  │  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris   │ │
│  │  nisi ut aliquip ex ea commodo consequat.                             │ │
│  │                                                                        │ │
│  │  [✨ Générer conclusion]                                               │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  EXTRAIT                                                      [✨ Générer]  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Résumé de l'article en quelques lignes...                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────┐   ┌────────────────────────────────────────┐   │
│  │ IMAGE MISE EN AVANT     │   │ CATÉGORIE & TAGS                       │   │
│  │ ┌───────────────────┐   │   │                                        │   │
│  │ │    [📷 Upload]    │   │   │ Catégorie: [Sélectionner ▾]           │   │
│  │ │                   │   │   │                                        │   │
│  │ └───────────────────┘   │   │ Tags: [tag1] [tag2] [+ Ajouter]       │   │
│  └─────────────────────────┘   └────────────────────────────────────────┘   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Brouillon]                               [👁️ Aperçu]  [📅 Planifier ▾]  [🚀]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Bubble Menu IA (sur sélection)

```
                    ┌─────────────────────────────────────┐
                    │ Lorem ipsum dolor sit amet          │
  Texte sélectionné │ ═══════════════════════════════    │
                    │                                     │
                    │  ┌───────────────────────────────┐  │
                    │  │ ✨ Réécrire │ ➕ │ ➖ │ 💡    │  │
                    │  │ 🎭 Ton ▾   │ 📝 Exemples     │  │
                    │  └───────────────────────────────┘  │
                    │                                     │
                    └─────────────────────────────────────┘
```

### 5.3 Panel Preview IA

```
┌──────────────────────────────────────────┐
│  ✨ Résultat IA                    [✕]  │
├──────────────────────────────────────────┤
│  Action: Améliorer le style              │
│  ─────────────────────────────────────── │
│                                          │
│  📄 ORIGINAL                             │
│  ┌──────────────────────────────────┐    │
│  │ Lorem ipsum dolor sit amet,      │    │
│  │ consectetur adipiscing elit.     │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ✨ SUGGESTION IA                        │
│  ┌──────────────────────────────────┐    │
│  │ Découvrez comment lorem ipsum    │    │
│  │ révolutionne votre approche du   │    │
│  │ dolor sit amet au quotidien.     │    │
│  └──────────────────────────────────┘    │
│                                          │
├──────────────────────────────────────────┤
│  [Annuler]              [✓ Appliquer]   │
└──────────────────────────────────────────┘
```

---

## 6. Règles Métier

### 6.1 Actions IA

| # | Règle |
|---|-------|
| R-01 | Une seule action IA peut être en cours à la fois |
| R-02 | Preview obligatoire avant application (sauf "Corriger") |
| R-03 | Historique limité à 20 actions par session |
| R-04 | Rate limit: 50 actions IA / jour / utilisateur |
| R-05 | Contenu original sauvegardé avant chaque modification IA |

### 6.2 Publication

| # | Règle |
|---|-------|
| R-10 | Article doit avoir titre et contenu pour être publié |
| R-11 | Planification minimum 5 minutes dans le futur |
| R-12 | Au moins une plateforme doit être sélectionnée |
| R-13 | Échec sync : 3 retry automatiques, puis manuel |
| R-14 | Modification post-publication ne resynchronise pas auto |

### 6.3 Auto-save

| # | Règle |
|---|-------|
| R-20 | Auto-save toutes les 30 secondes si modifications |
| R-21 | Auto-save au changement d'onglet |
| R-22 | Indicateur visuel du dernier save |

---

## 7. Critères d'Acceptation

### 7.1 Formulaire
- [ ] Création d'un nouvel article depuis zéro
- [ ] Édition d'un article existant (chargement des données)
- [ ] Navigation entre les 3 onglets sans perte de données
- [ ] Auto-save toutes les 30 secondes
- [ ] Validation Zod avec messages d'erreur

### 7.2 Actions IA
- [ ] Toolbar IA visible et fonctionnelle
- [ ] Bubble menu apparaît sur sélection de texte
- [ ] Preview affiche original vs suggestion
- [ ] Appliquer remplace le contenu
- [ ] Annuler ferme sans modification
- [ ] Historique permet undo
- [ ] Génération intro/conclusion/titres fonctionne

### 7.3 Synchronisation
- [ ] Publier maintenant fonctionne sur toutes les plateformes connectées
- [ ] Planifier enregistre la date et crée le job
- [ ] Statut de sync affiché en temps réel
- [ ] Historique de sync visible
- [ ] Retry fonctionne sur plateforme échouée

---

## 8. Points d'Entrée dans l'Application

### 8.1 Accès à l'Éditeur Standalone

**L'éditeur standalone est le formulaire par défaut pour voir/éditer un article.**

```
┌─────────────────────────────────────────────────────────────────┐
│  LISTE DES ARTICLES (BlogList)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Nouvel article ▾]                                           │
│   ├─ ✨ Générer avec IA (FloWriter)  → /app/blog/flowriter      │
│   └─ 📝 Créer manuellement           → /app/blog/editor/new     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📄 Mon brouillon FloWriter          🟡 Brouillon    [⋯] │   │
│  │    └─ Clic n'importe où sur la ligne                    │   │
│  │                    ↓                                     │   │
│  │         → /app/blog/editor/{id}                         │   │
│  │         (Éditeur standalone pour retouches)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📄 Article publié                   🟢 Publié       [⋯] │   │
│  │    └─ Clic sur la ligne                                 │   │
│  │                    ↓                                     │   │
│  │         → /app/blog/editor/{id}                         │   │
│  │         (Éditeur standalone pour modifications)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Comportement au Clic sur un Article

| Source | Action | Destination |
|--------|--------|-------------|
| **Liste articles** | Clic sur une ligne d'article | Éditeur Standalone (`/app/blog/editor/:id`) |
| **Liste articles** | Bouton "+ Nouvel article IA" | FloWriter (`/app/blog/flowriter`) |
| **Liste articles** | Bouton "+ Nouvel article manuel" | Éditeur Standalone vide (`/app/blog/editor/new`) |
| **FloWriter** | Sauvegarde brouillon → Retour liste | Article apparaît dans la liste |
| **FloWriter** | Publication directe | Article publié, visible dans liste |

### 8.3 Routes

| Route | Description |
|-------|-------------|
| `/app/blog` | Liste des articles (BlogList) |
| `/app/blog/editor/new` | Créer un nouvel article manuellement |
| `/app/blog/editor/:id` | Éditer un article existant (brouillon ou publié) |
| `/app/blog/flowriter` | FloWriter - génération IA (wizard 6 étapes) |

---

## 9. Livrables

| # | Livrable | Description |
|---|----------|-------------|
| L-01 | `ArticleEditor.tsx` | Composant principal éditeur standalone |
| L-02 | `EditorWithAI.tsx` | TipTap enrichi avec toolbar IA |
| L-03 | `AIBubbleMenu.tsx` | Menu contextuel actions IA |
| L-04 | `AIPreviewPanel.tsx` | Panel preview résultat IA |
| L-05 | `PublishTab.tsx` | Onglet publication/synchronisation |
| L-06 | `useArticleForm.ts` | Hook formulaire principal |
| L-07 | `useAIEditorActions.ts` | Hook actions IA |
| L-08 | `useArticleSync.ts` | Hook synchronisation |
| L-09 | `article-editor.ts` (schema) | Schémas Zod |
| L-10 | Migrations SQL | Tables sync_logs + scheduled_publications |

---

## 10. Distinction FloWriter vs Éditeur Standalone

| Aspect | FloWriter | Éditeur Standalone |
|--------|-----------|-------------------|
| **Objectif** | Générer un article complet via IA | Créer/éditer/retravailler un article |
| **Accès** | Bouton "+ Nouvel article IA" | Clic sur un article existant OU "+ Nouvel article manuel" |
| **Flux** | Wizard 6 étapes guidées | Formulaire libre avec onglets |
| **IA** | Génération complète du contenu | Actions contextuelles pour améliorer |
| **Cas d'usage** | Création de nouveau contenu assistée | Édition, retouches, publication, création manuelle |
| **Entrée** | Sujet/thème à développer | Article existant OU formulaire vide |
| **Sortie** | Brouillon sauvegardé → Éditeur Standalone | Article publié ou mis à jour |

### Parcours Typique

```
┌─────────────────────────────────────────────────────────────────┐
│  PARCOURS FLOWRITER + ÉDITEUR STANDALONE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User crée un article avec FloWriter (génération IA)         │
│                        │                                         │
│                        ▼                                         │
│  2. FloWriter génère le contenu → Sauvegarde en brouillon       │
│                        │                                         │
│                        ▼                                         │
│  3. User retourne à la liste des articles                       │
│                        │                                         │
│                        ▼                                         │
│  4. User clique sur son brouillon                               │
│                        │                                         │
│                        ▼                                         │
│  5. ÉDITEUR STANDALONE s'ouvre avec le contenu                  │
│     - Retouches manuelles                                        │
│     - Actions IA pour améliorer (réécrire, simplifier...)       │
│     - Configuration SEO                                          │
│     - Planification/Publication                                  │
│                        │                                         │
│                        ▼                                         │
│  6. User publie ou planifie                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*Document créé le 2026-02-02 - FLOWZ v1.0 - Version 1.1*
