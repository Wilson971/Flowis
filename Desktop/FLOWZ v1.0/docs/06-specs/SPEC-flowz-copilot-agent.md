# FLOWZ Copilot — Agent IA E-commerce Hybride

**Version :** 1.1 | **Date :** 6 mars 2026 | **Statut :** Proposition

---

## 1. La Vision — En termes simples

### Qu'est-ce que le Copilot ?

Aujourd'hui dans FLOWZ, **c'est toi qui fais tout** : tu cliques pour générer du contenu, tu vérifies les scores SEO, tu lances les syncs, tu corriges les fiches produits une par une.

Le **Copilot**, c'est un **assistant IA intégré dans FLOWZ** qui travaille à côté de toi. Comme un employé ultra-compétent qui :

- **Observe** ton catalogue en permanence (scores SEO, stocks, performances)
- **Propose** des actions ("3 produits ont un score SEO < 40, je peux les corriger")
- **Exécute** les tâches que tu approuves (correction SEO, sync, mise à jour)
- **Apprend** tes préférences (ton de marque, style, produits prioritaires)

### L'analogie

| Sans Copilot (aujourd'hui) | Avec Copilot (demain) |
|---|---|
| Tu conduis la voiture toi-même | Tu as un GPS intelligent qui propose des itinéraires ET peut conduire certains trajets simples |
| Tu cherches les problèmes | Le Copilot te signale les problèmes |
| Tu exécutes chaque action | Le Copilot exécute quand tu dis "OK" |
| 1 tâche à la fois | Le Copilot gère plusieurs tâches en parallèle |

### Le principe fondamental : **Toi + IA = meilleur que l'un ou l'autre seul**

```
┌─────────────────────────────────────────────────────┐
│                    FLOWZ COPILOT                     │
│                                                      │
│   Le marchand décide  ←→  L'IA propose et exécute   │
│                                                      │
│   "Corrige le SEO"    →  L'IA corrige               │
│   "Montre-moi"        →  L'IA montre un aperçu      │
│   "Non, pas comme ça" →  L'IA ajuste                 │
│   Zone verte: auto    →  L'IA fait seule             │
└─────────────────────────────────────────────────────┘
```

---

## 2. Les 3 Modes d'Interaction

### Mode 1 — Le Chat (conversation directe)

Un panneau de discussion, comme WhatsApp, intégré dans FLOWZ. Tu parles au Copilot en langage naturel :

> **Toi :** "Quels produits ont le pire score SEO ?"
> **Copilot :** "J'ai trouvé 12 produits avec un score < 40. Voici le top 5 les plus urgents : [liste]. Tu veux que je corrige leurs meta descriptions ?"
> **Toi :** "Oui, fais-le"
> **Copilot :** "C'est fait ! J'ai optimisé 12 meta descriptions. Voici un avant/après pour vérifier : [aperçu]"

**Exemples de commandes possibles :**
- "Combien de produits n'ont pas de description ?"
- "Génère les fiches pour mes 20 nouveaux produits"
- "Synchronise ma boutique"
- "Quel est mon meilleur produit ce mois-ci ?"
- "Prépare un article de blog sur [sujet]"
- "Optimise le SEO de toute la catégorie Chaussures"

### Mode 2 — Les Suggestions Proactives (notifications intelligentes)

Le Copilot surveille ton catalogue et te propose des actions :

```
┌────────────────────────────────────────────┐
│ 💡 Suggestion du Copilot                    │
│                                             │
│ 8 produits ont été modifiés sur WooCommerce │
│ mais pas encore synchronisés dans FLOWZ.    │
│                                             │
│ [Synchroniser maintenant]  [Plus tard]      │
│ [Voir les détails]                          │
└────────────────────────────────────────────┘
```

Autres exemples de suggestions :
- "Le score SEO moyen a baissé de 5 points cette semaine"
- "3 produits n'ont pas de photo — tu veux utiliser le Photo Studio ?"
- "Tu as 5 brouillons FloWriter en attente de publication"
- "Tes concurrents utilisent des mots-clés que tu n'as pas"

### Mode 3 — Les Actions Autonomes (zone verte)

Certaines tâches sont **tellement routinières** que le Copilot peut les faire seul, sans te demander :

| Zone | Couleur | Description | Exemples |
|------|---------|-------------|----------|
| **Verte** | Automatique | Aucun risque, le Copilot fait seul | Calcul de scores SEO, alertes stock, rapports |
| **Orange** | Avec aperçu | Le Copilot propose + montre, tu approuves | Génération de contenu, corrections SEO, sync vers WooCommerce |
| **Rouge** | Confirmation explicite | Action sensible, double confirmation | Suppression de produits, modification de prix, publication massive |

---

## 3. Ce que le Copilot sait faire (capacités)

### 3.1 — Analyse et Monitoring

| Capacité | Description | Zone |
|----------|-------------|------|
| Audit SEO catalogue | Scanne tous les produits et identifie les points faibles | Verte |
| Suivi de positions GSC | Surveille les positions Google et alerte sur les baisses | Verte |
| Détection d'anomalies | Repère les produits sans description, sans image, avec des erreurs | Verte |
| Rapport hebdomadaire | Résumé automatique des performances de la semaine | Verte |
| Veille concurrentielle | Compare tes mots-clés avec ceux des concurrents (GSC) | Verte |

### 3.2 — Génération de Contenu

| Capacité | Description | Zone |
|----------|-------------|------|
| Optimisation SEO batch | Corrige les meta descriptions, titres SEO, alt texts en masse | Orange |
| Rédaction de fiches produit | Génère les descriptions complètes pour les nouveaux produits | Orange |
| Articles de blog | Propose des sujets + rédige via FloWriter | Orange |
| Traduction catalogue | Traduit les fiches dans d'autres langues | Orange |
| Suggestions de mots-clés | Propose des mots-clés basés sur les données GSC | Verte |

### 3.3 — Actions sur la Boutique (via MCP WooCommerce)

| Capacité | Description | Zone |
|----------|-------------|------|
| Sync produits | Pousse les modifications vers WooCommerce | Orange |
| Mise à jour de stock | Met à jour les quantités | Rouge |
| Publication de produits | Publie ou dépublie des produits | Rouge |
| Gestion des catégories | Organise les catégories sur la boutique | Orange |
| Publication d'articles | Publie les articles de blog sur WordPress | Orange |

---

## 4. Architecture Technique — Comment ça fonctionne sous le capot

### 4.1 — Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        FLOWZ (Next.js)                       │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Chat UI  │  │ Notifications │  │ Panneau Copilot      │   │
│  │ (panneau │  │ (suggestions  │  │ (actions autonomes   │   │
│  │  latéral)│  │  proactives)  │  │  + historique)       │   │
│  └────┬─────┘  └──────┬───────┘  └──────────┬───────────┘   │
│       │               │                      │                │
│       └───────────────┼──────────────────────┘                │
│                       │                                       │
│              ┌────────▼────────┐                              │
│              │  COPILOT ENGINE │  ← Le cerveau                │
│              │  (API Route)    │                              │
│              └────────┬────────┘                              │
│                       │                                       │
│         ┌─────────────┼─────────────┐                        │
│         │             │             │                         │
│    ┌────▼───┐   ┌─────▼────┐  ┌────▼────────┐               │
│    │ Outils │   │ Outils   │  │ Outils      │               │
│    │ FLOWZ  │   │ IA       │  │ WooCommerce │               │
│    │ (DB)   │   │ (Gemini) │  │ (MCP)       │               │
│    └────────┘   └──────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

**En termes simples :**
1. Tu parles au Chat UI (ou le Copilot te notifie)
2. Le message arrive au **Copilot Engine** (le cerveau)
3. Le cerveau décide quels **outils** utiliser pour répondre
4. Il utilise les **outils FLOWZ** (lire la base de données), les **outils IA** (générer du contenu), ou les **outils WooCommerce MCP** (agir sur la boutique)
5. Il te renvoie le résultat

### 4.2 — Le Copilot Engine (le cerveau)

Le cerveau du Copilot est un **modèle IA (Claude ou Gemini)** qui a accès à des **outils**. C'est le concept "function calling" — l'IA ne fait pas que parler, elle peut **agir**.

**Comment ça marche :**

```
Toi: "Optimise le SEO de mes 10 pires produits"

Le cerveau réfléchit:
1. D'abord, je dois trouver les 10 pires → OUTIL: requête base de données
2. Pour chacun, je vais générer un nouveau contenu → OUTIL: IA génération
3. Je sauvegarde les résultats → OUTIL: mise à jour base de données
4. Je montre un aperçu à l'utilisateur → OUTIL: affichage avant/après

Résultat: "Voici les 10 produits optimisés. Score moyen passé de 32 à 78."
```

### 4.3 — Les Outils du Copilot

Le Copilot a accès à des "outils" — des actions qu'il peut déclencher :

**Outils internes FLOWZ (base de données Supabase) :**
- `search_products` — Chercher des produits par nom, catégorie, score SEO
- `get_product_details` — Lire les détails complets d'un produit
- `update_product_content` — Modifier le contenu d'un produit (draft)
- `get_seo_scores` — Obtenir les scores SEO du catalogue
- `get_dashboard_kpis` — Lire les métriques du tableau de bord
- `search_articles` — Chercher dans les articles de blog
- `get_gsc_data` — Lire les données Google Search Console
- `get_sync_status` — Vérifier l'état de la synchronisation

**Outils IA (génération de contenu) :**
- `generate_product_content` — Générer titre, description, meta (Gemini)
- `generate_seo_fix` — Corriger un champ SEO spécifique
- `generate_article_outline` — Créer un plan d'article
- `analyze_seo` — Analyser le SEO d'un produit ou d'une page

**Outils WooCommerce (via MCP) :**
- `woo_list_products` — Lister les produits de la boutique
- `woo_update_product` — Modifier un produit sur la boutique
- `woo_list_categories` — Lister les catégories
- `woo_create_post` — Publier un article WordPress
- `woo_get_orders` — Lire les commandes récentes

### 4.4 — MCP WooCommerce — Le pont vers la boutique

**C'est quoi le MCP dans cette architecture ?**

MCP (Model Context Protocol) est la **prise standardisée** entre le Copilot et la boutique WooCommerce du marchand.

```
Sans MCP (aujourd'hui):
  FLOWZ → code REST API sur mesure → WooCommerce
  (fragile, à maintenir, chaque opération = du code)

Avec MCP (demain):
  Copilot → protocole MCP standard → WooCommerce MCP Server
  (standardisé, auto-découverte des capacités, permissions intégrées)
```

**Concrètement, le MCP permet au Copilot de :**
1. Demander à WooCommerce "qu'est-ce que tu sais faire ?" (auto-découverte)
2. Exécuter des opérations via un protocole unique (pas besoin de coder chaque endpoint)
3. Respecter automatiquement les permissions de l'utilisateur WooCommerce

**Comment ça se branche :**

```
FLOWZ (serveur Next.js)
  │
  ├── Le Copilot Engine tourne côté serveur (API route)
  │
  ├── Quand il doit agir sur WooCommerce:
  │     │
  │     ▼
  │   Package @automattic/mcp-wordpress-remote
  │     │
  │     ▼ (HTTPS, authentifié avec les clés API WooCommerce du store)
  │
  └── WooCommerce MCP Server (plugin activé sur la boutique du marchand)
        │
        └── Exécute l'action (modifier produit, publier article, etc.)
```

**Important :** Le MCP ne remplace pas la base de données FLOWZ. FLOWZ reste la "source de vérité" pour les contenus en cours d'édition. Le MCP est utilisé uniquement pour **pousser les modifications finales** vers la boutique ou **lire des données fraîches** depuis WooCommerce.

---

## 5. L'Expérience Utilisateur — Ce que tu vois à l'écran

### 5.1 — Le panneau Chat (côté droit)

```
┌──────────────────────────────────────────────────────────┐
│ FLOWZ                             [🔔 3]  [🤖 Copilot] │
├──────────────────────────────┬───────────────────────────┤
│                              │  COPILOT                  │
│                              │                           │
│   (ta page FLOWZ actuelle)   │  💬 Bonjour ! J'ai       │
│                              │  analysé ton catalogue    │
│   Dashboard / Produits /     │  ce matin.                │
│   Blog / etc.                │                           │
│                              │  📊 3 alertes:            │
│                              │  • 8 produits sans meta   │
│                              │  • Score SEO moyen: 62    │
│                              │  • 5 articles en draft    │
│                              │                           │
│                              │  Tu veux qu'on s'occupe   │
│                              │  des meta descriptions ?  │
│                              │                           │
│                              │  [Oui, optimise] [Détails]│
│                              │                           │
│                              │  ┌─────────────────────┐  │
│                              │  │ Écris ton message... │  │
│                              │  └─────────────────────┘  │
└──────────────────────────────┴───────────────────────────┘
```

### 5.2 — Les cartes d'action (inline dans les pages)

Quand tu es sur la page Produits, le Copilot peut ajouter des **cartes contextuelles** :

```
┌─────────────────────────────────────────────┐
│ 🤖 Suggestion Copilot                       │
│                                              │
│ Ces 5 produits ont un score SEO critique:    │
│                                              │
│ ☐ Chaussure Running Pro    SEO: 18/100      │
│ ☐ T-shirt Classic          SEO: 22/100      │
│ ☐ Sac à dos Urban          SEO: 25/100      │
│ ☐ Montre Sport Digital     SEO: 28/100      │
│ ☐ Casquette Vintage        SEO: 31/100      │
│                                              │
│ [✨ Optimiser la sélection] [Tout sélect.]   │
│ [❌ Ignorer]                                 │
└─────────────────────────────────────────────┘
```

### 5.3 — L'aperçu avant validation (zone orange)

Pour toute action zone orange, le Copilot montre un **avant/après** :

```
┌──────────────────────────────────────────────────────────┐
│ 🤖 Aperçu des modifications — Meta Description           │
│                                                           │
│ Produit: Chaussure Running Pro                            │
│                                                           │
│ AVANT:                                                    │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Chaussure de running pour homme                       │ │
│ │ Score SEO: 18/100                                     │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                           │
│ APRÈS:                                                    │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Chaussure running homme légère - Amorti premium pour  │ │
│ │ vos entraînements quotidiens. Semelle Boost, mesh     │ │
│ │ respirant. Livraison gratuite dès 50€.                │ │
│ │ Score SEO: 82/100  (+64 points)                       │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                           │
│ [✅ Appliquer] [✏️ Modifier] [❌ Rejeter] [➡️ Suivant]    │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Roadmap d'implémentation — Par où on commence

### Phase 1 — Le Chat Basique (2-3 semaines)

**Objectif : Le Copilot peut répondre à des questions sur ton catalogue.**

Ce qu'on construit :
- Panneau chat latéral dans FLOWZ
- Connexion à l'API Claude ou Gemini avec function calling
- 5 outils de lecture (search_products, get_seo_scores, get_dashboard_kpis, search_articles, get_gsc_data)
- Historique des conversations en base de données

Ce que tu peux faire :
- "Combien de produits ont un score SEO > 70 ?"
- "Quels sont mes 5 meilleurs articles ?"
- "Quel est le score SEO moyen de la catégorie Chaussures ?"

**Fichiers à créer :**
```
src/
├── app/api/copilot/
│   ├── chat/route.ts          ← API SSE pour le chat
│   └── tools/                 ← Définitions des outils
│       ├── search-products.ts
│       ├── get-seo-scores.ts
│       ├── get-dashboard-kpis.ts
│       ├── search-articles.ts
│       └── get-gsc-data.ts
├── components/copilot/
│   ├── CopilotPanel.tsx       ← Panneau latéral
│   ├── ChatMessage.tsx        ← Bulle de message
│   ├── ChatInput.tsx          ← Zone de saisie
│   └── ToolResultCard.tsx     ← Affichage des résultats d'outils
├── hooks/copilot/
│   ├── useCopilotChat.ts      ← Hook principal du chat
│   └── useCopilotHistory.ts   ← Historique des conversations
└── contexts/
    └── CopilotContext.tsx      ← État global du Copilot
```

**Tables Supabase :**
```sql
-- Conversations du Copilot
CREATE TABLE copilot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE copilot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES copilot_conversations(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content TEXT NOT NULL,
    tool_calls JSONB,          -- Outils appelés par l'IA
    tool_results JSONB,        -- Résultats des outils
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 2 — Les Actions IA (2-3 semaines)

**Objectif : Le Copilot peut modifier du contenu avec ton approbation.**

Ce qu'on ajoute :
- 4 outils d'écriture (update_product_content, generate_product_content, generate_seo_fix, analyze_seo)
- Système de zone orange : aperçu avant/après + approbation
- Batch actions (corriger plusieurs produits d'un coup)
- File d'attente des tâches en cours

Ce que tu peux faire :
- "Optimise le SEO de mes 10 pires produits" → Aperçu → Approuver
- "Génère les descriptions pour mes produits sans contenu" → Aperçu → Approuver
- "Corrige la meta description de [produit X]" → Aperçu → Approuver

### Phase 3 — Suggestions Proactives (2 semaines)

**Objectif : Le Copilot te notifie quand il détecte un problème.**

Ce qu'on ajoute :
- Tâche CRON (toutes les heures) qui analyse le catalogue
- Système de notifications intelligentes (pas de spam)
- Cartes de suggestion contextuelles dans les pages
- Tableau de bord Copilot (historique des actions, stats)

Ce que ça fait :
- Notification si le score SEO moyen baisse
- Alerte si des produits n'ont pas été synchronisés depuis X jours
- Suggestion de sujets d'articles basée sur les tendances GSC
- Rapport hebdomadaire automatique

### Phase 4 — MCP WooCommerce (2-3 semaines)

**Objectif : Le Copilot peut agir directement sur la boutique WooCommerce.**

Ce qu'on ajoute :
- Intégration `@automattic/mcp-wordpress-remote`
- 5 outils WooCommerce MCP (woo_list_products, woo_update_product, woo_list_categories, woo_create_post, woo_get_orders)
- Système zone rouge pour les actions sensibles
- Fallback REST API pour les boutiques sans MCP

**Prérequis côté marchand :**
- WooCommerce 10.3+ avec MCP Beta activé
- Ou : on utilise la REST API classique comme fallback

Ce que tu peux faire :
- "Pousse mes modifications SEO sur la boutique" → Zone orange
- "Publie cet article sur WordPress" → Zone orange
- "Mets à jour le stock du produit X à 50" → Zone rouge (confirmation)

### Phase 5 — Mode Agent Avancé (3-4 semaines)

**Objectif : Le Copilot gère des workflows complexes de bout en bout.**

Ce qu'on ajoute :
- Workflows multi-étapes ("Crée un article SEO, attends ma validation, publie-le sur WordPress, sync les produits mentionnés")
- Mémoire persistante (le Copilot se souvient de tes préférences)
- Planification ("Tous les lundis, envoie-moi un rapport SEO")
- Intégration avec les commandes WooCommerce pour les insights business

---

## 7. Stratégie Dual-Mode : MCP + REST API

### Pourquoi les deux ?

Tous les marchands ne seront pas à jour sur WooCommerce 10.3+. Il faut donc une approche **compatible avec tout le monde** :

```
Le Copilot veut modifier un produit sur la boutique
       │
       ▼
Le store a MCP activé ?
       │
    ┌──┴──┐
    │     │
   OUI   NON
    │     │
    ▼     ▼
   MCP   REST API
 (standard, (ancien système
  rapide)   FLOWZ, toujours
            fonctionnel)
```

**En pratique :** Pendant la Phase 4, on ajoute le MCP comme canal préféré, mais l'ancien système de sync REST reste en place comme fallback. Le marchand ne voit aucune différence — c'est transparent.

---

## 8. Sécurité et Permissions

### Principes de base

1. **Le Copilot n'a jamais plus de droits que l'utilisateur** — Si tu n'as pas le droit de supprimer un produit, le Copilot non plus.

2. **Toute action zone orange/rouge est tracée** — Historique complet de qui a demandé quoi, ce que le Copilot a fait, et le résultat.

3. **Rate limiting** — Le Copilot ne peut pas envoyer 1000 requêtes par seconde. Limites par utilisateur par heure.

4. **Prompt safety** — Le système existant de détection d'injection (62 patterns) protège aussi le Copilot. Les entrées utilisateur sont sanitisées avant d'être envoyées à l'IA.

5. **Isolation multi-tenant** — Chaque marchand a son propre espace. Le Copilot de Boutique A ne voit jamais les données de Boutique B (garanti par RLS Supabase).

### Permissions par zone

| Zone | Permission requise | Validation |
|------|-------------------|------------|
| Verte | Aucune (lecture seule) | Automatique |
| Orange | Utilisateur connecté | Clic sur "Approuver" |
| Rouge | Admin du store | Double confirmation + mot de passe |

---

## 9. Modèle IA — Quel cerveau pour le Copilot ?

### Option recommandée : Architecture hybride

| Tâche | Modèle | Pourquoi |
|-------|--------|----------|
| Chat conversationnel | **Claude** (Anthropic) | Meilleur en compréhension de contexte et raisonnement |
| Génération de contenu produit | **Gemini 2.0 Flash** (Google) | Déjà intégré dans FLOWZ, rapide et économique |
| Analyse SEO | **Gemini** ou règles | Le scoring SEO est déjà fait par des règles (analyzer.ts) |

**Pourquoi Claude pour le chat ?**
- Claude excelle dans le "tool use" (function calling) — exactement ce dont le Copilot a besoin
- Meilleur en français que GPT pour le contexte e-commerce
- Le MCP est un protocole créé par Anthropic (les créateurs de Claude) — intégration native

**Pourquoi garder Gemini pour le contenu ?**
- Déjà intégré et testé dans FLOWZ (FloWriter + Batch Generation)
- Plus économique pour la génération de texte en masse
- Vision intégrée pour l'analyse d'images produit

---

## 10. Ce que ça change pour le Business

### Valeur ajoutée immédiate

| Métrique | Sans Copilot | Avec Copilot | Gain |
|----------|-------------|--------------|------|
| Temps pour optimiser 100 produits | ~8h (manuel) | ~15min (batch + validation) | **32x plus rapide** |
| Score SEO moyen catalogue | Dépend de l'effort du marchand | Maintenu > 70 automatiquement | **Constant** |
| Détection de problèmes | Quand le marchand regarde | En temps réel | **Instantané** |
| Articles de blog/mois | 2-4 (effort manuel) | 8-12 (Copilot assiste) | **3x plus** |
| Sync WooCommerce | Manuel, oublis fréquents | Suggestions automatiques | **0 oubli** |

### Positionnement concurrentiel

Aucun outil e-commerce n'offre actuellement un **copilote IA intégré** qui combine :
- Génération de contenu
- Analyse SEO en temps réel
- Action directe sur la boutique via MCP
- Mode hybride (l'utilisateur reste aux commandes)

C'est un **différenciateur majeur** pour FLOWZ.

---

## 11. Coûts estimés

### Coûts API par marchand/mois (estimation)

| Usage | Modèle | Coût estimé |
|-------|--------|-------------|
| Chat (50 conversations/mois) | Claude | ~2-5€ |
| Batch SEO (200 produits/mois) | Gemini Flash | ~1-3€ |
| Suggestions proactives (analyse quotidienne) | Gemini Flash | ~0.50€ |
| **Total par marchand** | | **~3-8€/mois** |

Pour un SaaS à 49-99€/mois, c'est une marge confortable.

### Coûts infra

- Supabase : déjà en place (pas de surcoût significatif)
- MCP : pas de coût (protocole ouvert, plugin WooCommerce gratuit)
- Vercel : les API routes Copilot utilisent le même hébergement

---

## 12. Résumé des prochaines étapes

```
Phase 1 (Mars-Avril)     Phase 2 (Avril)         Phase 3 (Mai)
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ Chat basique│    →     │ Actions IA  │    →     │ Suggestions │
│ + lecture   │          │ + écriture  │          │ proactives  │
│ catalogue   │          │ + aperçu    │          │ + CRON      │
└─────────────┘          └─────────────┘          └─────────────┘

Phase 4 (Mai-Juin)        Phase 5 (Juin-Juillet)
┌─────────────┐          ┌─────────────┐
│ MCP WooC.   │    →     │ Mode agent  │
│ + actions   │          │ avancé      │
│ boutique    │          │ + workflows │
└─────────────┘          └─────────────┘
```

**Budget temps total : ~12-15 semaines**
**Livrable Phase 1 (MVP) : ~2-3 semaines**

Le MVP (Phase 1) permet déjà de montrer la valeur : un chat qui comprend ton catalogue et répond à tes questions. C'est suffisant pour un premier "wow effect" et pour itérer avec les retours utilisateurs.

---

## ANNEXE A — Détails Techniques MCP WooCommerce

> Cette section est technique. Elle est destinée au développeur qui implémentera le Copilot.

### A.1 — Opérations MCP WooCommerce disponibles (beta)

Le MCP WooCommerce (depuis v10.3) expose ces opérations via le WordPress Abilities API :

| Ability ID | Description | Zone Copilot |
|---|---|---|
| `woocommerce/products-list` | Lister les produits avec filtres/pagination | Verte |
| `woocommerce/products-get` | Détails d'un produit | Verte |
| `woocommerce/products-create` | Créer un nouveau produit | Rouge |
| `woocommerce/products-update` | Modifier un produit existant | Orange |
| `woocommerce/products-delete` | Supprimer un produit | Rouge |
| `woocommerce/orders-list` | Lister les commandes | Verte |
| `woocommerce/orders-get` | Détails d'une commande | Verte |
| `woocommerce/orders-create` | Créer une commande | Rouge |
| `woocommerce/orders-update` | Modifier une commande | Rouge |

### A.2 — Trois approches d'implémentation MCP Client

#### Approche A : Anthropic `mcp_servers` (la plus simple)

Anthropic gère toute la connexion MCP côté serveur. FLOWZ envoie juste l'URL du serveur MCP dans l'appel API.

```typescript
// /api/copilot/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const response = await client.beta.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{ role: "user", content: userMessage }],
  mcp_servers: [{
    type: "url",
    url: "https://boutique-du-marchand.com/wp-json/mcp/mcp-adapter-default-server",
    name: "woocommerce",
    authorization_token: `Bearer ${storeOAuthToken}`
  }],
  extra_headers: { "anthropic-beta": "mcp-client-2025-04-04" }
});
```

**Avantage :** Zéro code MCP client, Anthropic gère la connexion.
**Inconvénient :** Le site WooCommerce doit être accessible publiquement.

#### Approche B : Anthropic SDK + MCP Client local (plus de contrôle)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { mcpTools } from '@anthropic-ai/sdk/helpers/beta/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Connexion MCP au WooCommerce du marchand
const mcpClient = new Client({ name: "flowz-copilot", version: "1.0.0" });
await mcpClient.connect(
  new StreamableHTTPClientTransport(
    new URL("https://boutique.com/wp-json/mcp/mcp-adapter-default-server")
  )
);

const anthropic = new Anthropic();
const tools = await mcpTools(mcpClient);

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  tools,
  messages: [{ role: "user", content: userMessage }],
});
```

**Avantage :** Contrôle total, supporte prompts/resources MCP.
**Inconvénient :** Gestion du cycle de vie de la connexion MCP.

#### Approche C : Vercel AI SDK + MCP (idéal pour Next.js)

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { experimental_createMCPClient } from 'ai';

const mcpClient = await experimental_createMCPClient({
  transport: {
    type: 'sse',
    url: 'https://boutique.com/wp-json/mcp/mcp-adapter-default-server'
  }
});

const tools = await mcpClient.tools();
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools,
  messages,
});
```

**Avantage :** S'intègre naturellement dans l'écosystème Next.js/Vercel.

### A.3 — Prérequis côté boutique marchand

Pour que le MCP fonctionne, la boutique du marchand doit avoir :

| Composant | Version minimum | Statut |
|-----------|----------------|--------|
| WordPress | 6.9+ | Abilities API en core |
| WooCommerce | 10.3+ | MCP beta inclus |
| MCP Adapter plugin | `wordpress/mcp-adapter` | À installer (gratuit) |
| Authentification | Application passwords ou OAuth 2.1 | Natif WordPress |

**Activation :** `WooCommerce → Settings → Advanced → Features → Enable MCP Beta`

### A.4 — Recommandation d'implémentation

Pour la Phase 4 (MCP), on recommande :

1. **Commencer par l'Approche A** (`mcp_servers` parameter) — le plus simple, zéro code MCP
2. **Fallback REST API** pour les boutiques sans MCP (système actuel FLOWZ via edge functions)
3. **Stocker les tokens OAuth** dans la table `stores` existante (colonne `mcp_token` à ajouter)
4. **Log audit** de chaque opération MCP dans Supabase (table `copilot_messages.tool_results`)

### A.5 — Packages NPM à ajouter

| Package | Usage | Phase |
|---------|-------|-------|
| `@anthropic-ai/sdk` | Chat Copilot (Claude) | Phase 1 |
| `ai` + `@ai-sdk/anthropic` | Streaming + outils | Phase 1 (alt) |
| `@modelcontextprotocol/sdk` | Client MCP | Phase 4 |
| `@automattic/mcp-wordpress-remote` | Proxy MCP WooCommerce (optionnel) | Phase 4 |

### A.6 — Concurrents et écosystème

| Projet | Approche | Pertinence pour FLOWZ |
|--------|----------|----------------------|
| StifLi Flex MCP (plugin WP) | 117+ outils MCP dans un plugin | Concurrent potentiel, mais pas orienté contenu IA |
| woo-mcp.com | MCP read-only (sécurisé) | Inspiration pour le mode lecture seule |
| StoreAgent | Chatbot client-facing | Différent — orienté acheteur, pas marchand |
| InstaWP MCP Server | Full WordPress operations | Inspiration technique |

**Différenciateur FLOWZ :** Aucun concurrent ne combine **génération de contenu IA + analyse SEO + actions MCP sur boutique** dans un seul copilote hybride.

---

## ANNEXE B — Ce qui existe déjà dans FLOWZ (réutilisable)

| Composant existant | Lignes | Réutilisation Copilot |
|---|---|---|
| `lib/ai/prompt-safety.ts` | 101L | Protection injection pour le chat |
| `lib/ai/product-prompts.ts` | 551L | Outils de génération contenu produit |
| `lib/ai/prompts.ts` | 560L | Outils de génération articles |
| `lib/seo/analyzer.ts` | 918L | Outil d'analyse SEO |
| `lib/rate-limit.ts` | ~80L | Rate limiting des appels Copilot |
| `features/sync/machine.ts` | 337L | État de synchronisation |
| `hooks/sync/*.ts` | 11 hooks | Push/pull vers WooCommerce |
| `app/api/batch-generation/stream/route.ts` | 845L | Pattern SSE streaming réutilisable |
| `app/api/flowriter/stream/route.ts` | 715L | Pattern SSE streaming réutilisable |
| `hooks/notifications/useNotifications.ts` | 110L | Système de notifications existant |
| Supabase Edge Functions (13) | 9,599L | Sync WooCommerce actuel (fallback) |

**Total réutilisable : ~13,800+ lignes de code existant**

Le Copilot ne repart pas de zéro — il se branche sur l'infrastructure FLOWZ existante.
