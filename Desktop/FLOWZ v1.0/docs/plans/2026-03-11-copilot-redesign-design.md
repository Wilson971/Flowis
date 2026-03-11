# Copilot IA FLOWZ — Cahier des Charges Redesign Complet

**Date:** 2026-03-11
**Status:** Approved
**Type:** Refonte complète UI + UX

---

## 1. Vision

Transformer le Copilot existant (UI shell avec réponses hardcodées) en un **système IA unifié à 3 modes** : Spotlight + Side Panel + Orbe Proactif. Le Copilot devient le point d'entrée intelligent de toute l'application FLOWZ.

## 2. Décisions de design

| Aspect | Décision |
|--------|----------|
| Style visuel | Conserver le style actuel (dark panel, AIOrb, animations) |
| Réponses | Cartes structurées + boutons d'action intégrés |
| Historique | Conversations + mémoire contextuelle inter-sessions |
| Layout | Side panel + Spotlight (Ctrl+K) |
| Spotlight | Prompt IA + Navigation + Actions rapides |
| Autonomie | Confirmation par défaut, semi-autonome configurable dans settings |
| Proactivité | Badge sur l'orbe + suggestions contextuelles par page |
| Personnalité | Friendly expert par défaut, configurable (concis/détaillé, formel/casual) |
| Architecture | Approche "Unified Shell" — 3 modes interconnectés, même backend |

---

## 3. Mode Spotlight (Ctrl+K)

### Layout

```
┌────────────────────────────────────────────────────────┐
│  🔍  Rechercher, agir ou demander au Copilot...       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  RÉCENTS                                               │
│  ↻ Sneakers Nike Air Max          (produit)           │
│  ↻ Article "Guide tailles"        (article)           │
│  ↻ optimize descriptions          (commande)          │
│                                                        │
│  ── en tapant, les résultats se groupent ──           │
│                                                        │
│  NAVIGATION                                  Ctrl+1   │
│  📦 Sneakers Nike Air Max 90                          │
│  📦 Sneakers Adidas Superstar                         │
│  📄 Article "Les meilleures sneakers 2026"            │
│                                                        │
│  ACTIONS                                     Ctrl+2   │
│  ⚡ Optimiser description "Sneakers Nike..."          │
│  ⚡ Audit SEO page produits                           │
│  ⚡ Push 3 produits en attente                        │
│                                                        │
│  COPILOT                                     Ctrl+3   │
│  💬 Demander au Copilot "sneakers..."  →  ouvre panel │
│                                                        │
├────────────────────────────────────────────────────────┤
│  ↑↓ naviguer   ⏎ sélectionner   esc fermer           │
└────────────────────────────────────────────────────────┘
```

### Comportement

- **Ouverture :** `Ctrl+K` — overlay modal centré avec backdrop blur
- **Recherche fuzzy** — un seul input qui cherche dans produits, articles, pages ET commandes
- **Catégories dynamiques** — se filtrent en temps réel selon la saisie
- **Raccourcis clavier** — `Ctrl+1/2/3` pour filtrer par catégorie, `↑↓` pour naviguer, `⏎` pour sélectionner
- **Récents** — les 3-5 dernières actions/navigations de l'utilisateur
- **Réponse inline rapide** — si le Copilot peut répondre en une ligne, la réponse s'affiche directement dans le Spotlight
- **Promotion vers Panel** — si la réponse est complexe, un clic ouvre le panel avec le contexte pré-rempli

### Sources de données

| Catégorie | Source | Champs indexés |
|-----------|--------|---------------|
| Produits | Supabase `products` | title, sku, status |
| Articles | Supabase `blog_posts` | title, status, tags |
| Pages | Routes statiques de l'app | label, path |
| Actions | Registry de commandes hardcodé | name, aliases, description |

### Suggestions proactives (sans saisie)

| Page | Suggestions |
|------|------------|
| `/products` | "5 descriptions à optimiser", "Push 2 produits en attente" |
| `/blog` | "1 article sans meta description", "3 brouillons en attente" |
| `/seo` | "Score SEO moyen : 62/100 — voir les pires" |
| `/overview` | "Résumé du jour", "3 actions prioritaires" |

### Sans résultats

```
┌────────────────────────────────────┐
│ Aucun résultat pour "xyz"          │
│                                    │
│ 💬 Demander au Copilot "xyz..."   │
└────────────────────────────────────┘
```

### Mobile

- Overlay plein écran (style Linear mobile)
- Ouverture via bouton dans le header (l'orbe)
- Pas de raccourcis clavier

---

## 4. Side Panel (Chat Copilot)

### Vue Chat (default)

```
┌─────────────────────────────────────────┐
│ HEADER                                  │
│ ┌─────┐  Copilot FLOWZ    [+] [≡] [✕] │
│ │ Orb │  ● En ligne        new hist cls │
│ └─────┘                                 │
├─────────────────────────────────────────┤
│ CHAT AREA (ScrollArea)                  │
│                                         │
│ Welcome + suggestions contextuelles     │
│ Messages alternés user/assistant        │
│ Cartes riches + boutons d'action        │
│ Tool indicators animés                  │
│ Typing indicator                        │
│                                         │
├─────────────────────────────────────────┤
│ INPUT                                   │
│ ┌───────────────────────────────┐ [➤]  │
│ │ Message au Copilot...         │      │
│ ├───────────────────────────────┤      │
│ │ 📎  /commandes                │      │
│ └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### Vue Historique (toggle via ≡)

- Conversations groupées par date (Aujourd'hui, Hier, Cette semaine, Plus ancien)
- Chaque item : titre auto-généré, timestamp, nb messages, statut
- Recherche dans l'historique
- Section "Mémoire Copilot" en bas avec résumé et lien "Gérer la mémoire"
- Suppression : hover → icône 🗑️, confirmation requise, soft delete 30 jours

### Types de cartes

| Type | Contenu | Actions |
|------|---------|---------|
| **ProductCard** | Image, titre, score SEO avant/après, description preview | Appliquer, Prévisualiser, Éditer |
| **ArticleCard** | Titre, statut, word count, meta description | Ouvrir éditeur, Publier, Programmer |
| **SeoCard** | Score, top problèmes, recommandations | Lancer audit complet, Voir détails |
| **KpiCard** | Mini-graphique sparkline, valeur, tendance | Voir dashboard, Exporter |
| **BatchProgressCard** | Progress bar, X/Y traités, succès/échecs | Pause, Annuler, Voir détails |
| **ComparisonCard** | Avant/après côte à côte (diff highlight) | Appliquer, Rejeter, Éditer |

### Tool Indicators

Pendant l'exécution de tools Gemini, badge animé avec label contextuel :

- `🔍 Recherche de produits...`
- `⚡ Analyse SEO en cours...`
- `✍️ Réécriture de la description...`
- `📊 Récupération des données GSC...`
- `🚀 Push vers WooCommerce...`

Multi-tool : les indicators s'empilent verticalement, chacun passe en ✅ quand terminé.

### Input enrichi

- **Slash commands** — `/optimize`, `/audit`, `/push`, `/ideas`, `/batch`, `/status`, `/memory`, `/clear`
- **Autocomplétion** — dropdown des commandes quand on tape `/`
- **Mentions** — `@produit-name` pour référencer un produit
- **Auto-expand** — textarea grandit jusqu'à 5 lignes, puis scroll interne
- **Limite** — 2000 caractères
- **Raccourcis** — `Shift+Enter` saut de ligne, `Enter` envoyer

### Bouton Stop

Pendant le streaming, le bouton Send est remplacé par **"■ Stop"**. Abort le SSE, conserve le message partiel avec label "(interrompu)".

### Mémoire inter-sessions

Profil mémoire par tenant :
- Préférences de ton/style détectées
- Contexte boutique (niche, cible, concurrents)
- Actions fréquentes (priorisées dans les suggestions)
- Visible et éditable depuis la vue historique et les settings

### Réponse longue

- Scroll auto vers le bas pendant le streaming
- Bouton "↓" flottant si l'utilisateur remonte dans le chat

### Copier

- Bouton copy au hover de chaque message assistant
- Copy spécifique sur les code blocks
- Copy sur les cartes → copie le contenu texte principal

### Feedback

- 👍/👎 au hover de chaque réponse assistant
- 👎 → mini-input optionnel "Qu'est-ce qui n'allait pas ?"
- Stocké dans `copilot_messages.feedback` (jsonb)
- Alimente la mémoire si pattern récurrent

### Limite de contexte

- Au-delà de 30 messages → résumé automatique par Gemini
- Stocké dans `copilot_conversations.summary`
- Indicateur subtil : "📝 Conversation résumée"

### Hors contexte (fallback)

"Je suis spécialisé dans la gestion de ta boutique e-commerce. Je peux t'aider avec tes produits, articles, SEO et performances. Que veux-tu faire ?"

### Panel largeur fixe

400px desktop. Pas de resize. Suffisant pour les cartes.

### Actions qui naviguent

Le panel reste ouvert, la page change derrière. Exception mobile : le panel se ferme.

---

## 5. Orbe Proactif & Notifications

### 3 états visuels

| État | Animation | Badge |
|------|-----------|-------|
| **Idle** | Respiration lente, couleurs neutres | Aucun |
| **Notification** | Animation légèrement plus vive | Compteur (ex: "3") |
| **Urgent** | Pulse intense, teinte warning | Badge rouge "!" |

### Hover Preview

Tooltip enrichi au hover quand notifications actives :
- Liste des 3-5 suggestions les plus prioritaires
- Label "Cliquer pour ouvrir le panel"

### Sources de notifications

| Trigger | Condition | Message |
|---------|-----------|---------|
| SEO critique | Produits score < 50 | "X produits ont un score SEO critique" |
| Brouillons oubliés | Articles draft > 7 jours | "X brouillons en attente depuis plus d'une semaine" |
| Performance GSC | CTR/position baisse > 10% vs semaine précédente | "CTR en baisse de X% cette semaine" |
| Sync échouée | Jobs sync en erreur | "X produits n'ont pas pu être synchronisés" |
| Batch terminé | Batch optimize/studio terminé | "Batch terminé : X/Y réussis" |
| Produits non publiés | Prêts mais non pushés > 3 jours | "X produits prêts à publier" |

### Fréquence

- Endpoint `GET /api/copilot/notifications` — polling toutes les 5 minutes
- Pause quand onglet inactif (`visibilitychange`)
- Maximum 5 notifications simultanées
- Dismiss → ne revient pas avant 24h
- Toggle ON/OFF dans les settings

### Interaction Orbe → Panel

- Clic simple → ouvre le panel, notifications affichées comme suggestions actionnables, badge disparaît
- Clic quand panel ouvert → ferme le panel

---

## 6. Settings Copilot

**Emplacement :** Sous-section dans la modal Settings existante (pas de page séparée).

### Personnalité

| Setting | Options | Défaut |
|---------|---------|--------|
| Style de réponse | Concis / Équilibré / Détaillé | Équilibré |
| Ton | Formel (vouvoiement) / Friendly (tutoiement) | Friendly |

### Niveau d'autonomie

| Niveau | Actions concernées | Défaut |
|--------|-------------------|--------|
| Légères | Analyser, auditer, récupérer KPIs, suggestions | Exécution directe |
| Moyennes | Réécrire description, générer idées, optimiser meta | Confirmation requise |
| Lourdes | Push to store, batch optimize, publier, programmer | Confirmation requise |
| Verrouillées | Supprimer données, push prod, batch delete | Confirmation toujours obligatoire (non configurable) |

Chaque niveau (sauf verrouillé) est configurable : "Toujours demander confirmation" ou "Exécuter directement".

### Notifications proactives

- Toggle global ON/OFF
- Checkboxes par type de notification (SEO critique, brouillons oubliés, performance GSC, sync échouées, batch terminés, produits non publiés)

### Raccourcis

| Raccourci | Action |
|-----------|--------|
| `Ctrl+K` | Ouvrir/fermer Spotlight |
| `Ctrl+Shift+K` | Ouvrir/fermer Panel |
| `Ctrl+Shift+N` | Nouvelle conversation |
| `Esc` | Fermer Spotlight ou Panel |

### Mémoire

- Liste des éléments mémorisés (éditable, supprimable)
- Bouton "Tout effacer"

### Données

- Compteur conversations
- Exporter l'historique
- Supprimer tout l'historique

---

## 7. Transitions entre les 3 modes

### Spotlight → Panel (promotion)

1. User tape une question complexe dans Spotlight
2. Clique "💬 Demander au Copilot"
3. Spotlight se ferme (fade out)
4. Panel s'ouvre (slide in)
5. Input pré-rempli + message envoyé automatiquement

### Panel → Spotlight (raccourci)

1. Panel ouvert + user tape Ctrl+K
2. Spotlight s'ouvre par-dessus (overlay)
3. Panel reste visible derrière le backdrop
4. Navigation choisie → Spotlight ferme, panel reste
5. Question Copilot → Spotlight ferme, question envoyée dans le panel

### Orbe → Panel (notification)

1. User clique l'orbe avec badge
2. Panel s'ouvre
3. Welcome message affiche les notifications comme suggestions
4. Badge disparaît

---

## 8. Architecture des composants

### Arbre

```
AppLayout
├── CopilotProvider (contexte unifié)
│   ├── TopHeader
│   │   └── AIOrb (notifications badge)
│   │       └── OrbHoverPreview
│   │
│   ├── SpotlightModal (Ctrl+K)
│   │   ├── SpotlightInput
│   │   ├── SpotlightRecents
│   │   ├── SpotlightResults
│   │   │   ├── SpotlightNavSection
│   │   │   ├── SpotlightActionSection
│   │   │   └── SpotlightCopilotSection
│   │   └── SpotlightInlineAnswer
│   │
│   ├── CopilotPanel
│   │   ├── CopilotHeader
│   │   ├── CopilotChatView
│   │   │   ├── CopilotWelcome
│   │   │   ├── CopilotMessageList
│   │   │   │   ├── UserMessage
│   │   │   │   ├── AssistantMessage
│   │   │   │   │   ├── MarkdownRenderer
│   │   │   │   │   ├── ToolIndicator
│   │   │   │   │   └── ResponseCard (variant)
│   │   │   │   │       ├── ProductCard
│   │   │   │   │       ├── ArticleCard
│   │   │   │   │       ├── SeoCard
│   │   │   │   │       ├── KpiCard
│   │   │   │   │       ├── BatchProgressCard
│   │   │   │   │       └── ComparisonCard
│   │   │   │   └── TypingIndicator
│   │   │   └── CopilotInput
│   │   │       ├── SlashCommandDropdown
│   │   │       └── MentionAutocomplete
│   │   └── CopilotHistoryView
│   │       ├── ConversationList
│   │       ├── ConversationSearch
│   │       └── MemorySummary
│   │
│   └── SettingsModal (existant)
│       └── CopilotSettingsSection
```

### Structure des fichiers

```
my-app/src/
├── components/copilot/
│   ├── CopilotPanel.tsx              ← refacto existant
│   ├── CopilotHeader.tsx
│   ├── CopilotChatView.tsx
│   ├── CopilotHistoryView.tsx
│   ├── CopilotWelcome.tsx
│   ├── CopilotInput.tsx
│   ├── CopilotMessageList.tsx
│   ├── messages/
│   │   ├── UserMessage.tsx
│   │   ├── AssistantMessage.tsx
│   │   ├── ToolIndicator.tsx
│   │   └── TypingIndicator.tsx
│   ├── cards/
│   │   ├── ResponseCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── SeoCard.tsx
│   │   ├── KpiCard.tsx
│   │   ├── BatchProgressCard.tsx
│   │   └── ComparisonCard.tsx
│   ├── spotlight/
│   │   ├── SpotlightModal.tsx
│   │   ├── SpotlightInput.tsx
│   │   ├── SpotlightResults.tsx
│   │   ├── SpotlightRecents.tsx
│   │   └── SpotlightInlineAnswer.tsx
│   ├── settings/
│   │   └── CopilotSettingsSection.tsx
│   └── orb/
│       └── OrbHoverPreview.tsx
│
├── contexts/
│   └── CopilotContext.tsx            ← enrichi
│
├── hooks/copilot/
│   ├── useChat.ts
│   ├── useConversations.ts
│   ├── useCopilotMemory.ts
│   ├── useCopilotNotifications.ts
│   ├── useCopilotSettings.ts
│   ├── useSpotlightSearch.ts
│   └── useSlashCommands.ts
│
├── types/copilot.ts
├── schemas/copilot.ts
│
└── app/api/copilot/
    ├── stream/route.ts
    └── notifications/route.ts
```

### Data Flow

```
FRONTEND:
  Spotlight/Panel → useChat() → POST /api/copilot/stream → SSE events
  useSpotlightSearch() → Supabase direct (products, blog_posts)
  useCopilotNotifications() → GET /api/copilot/notifications (poll 5min)
  AIOrb badge ← notifications count

BACKEND /api/copilot/stream:
  1. Auth + rate limit
  2. Load conversation history (Supabase)
  3. Load copilot_settings (personality, autonomy)
  4. Inject context (page, tenant, KPIs)
  5. Build system prompt + messages
  6. Gemini 2.5 Pro generateContentStream()
  7. Handle tool calls (execute → return to Gemini)
  8. Stream response via SSE
  9. Save messages to Supabase

BACKEND /api/copilot/notifications:
  1. Auth
  2. Query aggregated stats
  3. Apply notification rules + user prefs
  4. Return top 5 notifications
```

---

## 9. Interactions & Micro-UX

### Confirmation d'actions

**Mode confirmation :**
- Copilot affiche le résultat (diff avant/après, scores)
- Boutons : Appliquer / Modifier / Rejeter

**Mode semi-autonome (actions légères) :**
- Copilot exécute directement et affiche le résultat
- Pas de confirmation demandée

### Slash Commands

| Commande | Action | Niveau |
|----------|--------|--------|
| `/optimize [produit]` | Optimise la description | Moyen |
| `/audit` | Audit SEO page courante | Léger |
| `/push [produit]` | Push vers la boutique | Lourd |
| `/ideas [thème]` | Génère idées d'articles | Léger |
| `/batch optimize` | Batch optimize descriptions faibles | Lourd |
| `/status` | Résumé KPIs du jour | Léger |
| `/memory` | Affiche la mémoire Copilot | Léger |
| `/clear` | Nouvelle conversation | — |

### Raccourcis clavier globaux

| Raccourci | Action |
|-----------|--------|
| `Ctrl+K` | Ouvrir/fermer Spotlight |
| `Ctrl+Shift+K` | Ouvrir/fermer Panel |
| `Ctrl+Shift+N` | Nouvelle conversation |
| `Esc` | Fermer Spotlight ou Panel |
| `↑↓` (Spotlight) | Naviguer résultats |
| `Enter` (Spotlight) | Sélectionner |
| `Enter` (Panel) | Envoyer message |
| `Shift+Enter` (Panel) | Saut de ligne |

### États de chargement

| État | Affichage |
|------|-----------|
| Envoi message | Input désactivé, bouton → spinner |
| Tool en cours | ToolIndicator animé + label contextuel |
| Streaming réponse | Typewriter token par token |
| Chargement historique | Skeleton cards |
| Recherche Spotlight | Skeleton lines |
| Erreur réseau | Toast + bouton retry dans le message |
| Rate limited | "Trop de requêtes, réessaie dans Xs" |

### Gestion d'erreurs

- Erreur API : message inline avec bouton Réessayer
- Offline : détection `navigator.onLine` + SSE error, retry auto exponential backoff (3 tentatives)
- Échec total : "Connexion impossible. [Réessayer]"

### Multi-onglets

- Conversation liée à la session serveur (Supabase), pas localStorage
- Chaque onglet peut avoir sa propre conversation active
- État open/close du panel synchro via localStorage

---

## 10. Supabase Schema

### Nouvelles tables

```sql
-- Conversations
copilot_conversations (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES profiles(tenant_id),
  title text,
  summary text,                    -- résumé auto pour conversations longues
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz           -- soft delete
)

-- Messages
copilot_messages (
  id uuid PK DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tool_calls jsonb,                -- tools appelés par Gemini
  feedback jsonb,                  -- {rating: 'up'|'down', comment?: string}
  created_at timestamptz DEFAULT now()
)

-- Settings
copilot_settings (
  tenant_id uuid PK REFERENCES profiles(tenant_id),
  personality jsonb DEFAULT '{"style": "balanced", "tone": "friendly"}',
  autonomy jsonb DEFAULT '{"light": "auto", "medium": "confirm", "heavy": "confirm"}',
  notifications jsonb DEFAULT '{"enabled": true, "types": {"seo_critical": true, "drafts_forgotten": true, "gsc_performance": true, "sync_failed": true, "batch_complete": true, "products_unpublished": false}}',
  updated_at timestamptz DEFAULT now()
)

-- Mémoire
copilot_memory (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES profiles(tenant_id),
  content text NOT NULL,           -- élément mémorisé
  source text,                     -- 'auto' | 'user' | 'feedback'
  created_at timestamptz DEFAULT now()
)
```

RLS policies sur `tenant_id` (pattern standard FLOWZ) pour toutes les tables.

---

## 11. Existant conservé

- **AIOrb** (`components/ui/ai-orb.tsx`) — conservé tel quel, enrichi avec badge
- **CopilotContext** (`contexts/CopilotContext.tsx`) — enrichi avec settings, notifications, mémoire
- **CopilotPanel** (`components/copilot/CopilotPanel.tsx`) — refactoré et décomposé en sous-composants
- **AppLayout integration** — conservée, ajout du SpotlightModal
- **TopHeader toggle** — conservé, enrichi avec badge notifications

---

## 12. Hors scope (v1)

- Pièce jointe image (📎) — future: analyse visuelle
- Voice input (🎤)
- Export conversations en PDF
- Copilot multi-utilisateurs (collaboration)
- Intégration Slack/email pour notifications externes
