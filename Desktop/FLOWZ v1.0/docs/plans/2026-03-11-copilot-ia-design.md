# Copilot IA FLOWZ - Design

**Date:** 2026-03-11
**Status:** Approved

## Objectif

Transformer le Copilot existant (UI shell avec réponses hardcodées) en un assistant IA hybride : conversation en langage naturel + exécution d'actions concrètes sur les données FLOWZ.

## Décisions

- **AI Provider:** Google GenAI - Gemini 2.5 Pro
- **Streaming:** SSE (même pattern que FloWriter)
- **Données:** Hybride — contexte de base injecté + function calling Gemini pour requêtes spécifiques
- **Persistance:** Supabase (conversations + messages)
- **Rate limiting:** Simple (pattern existant `lib/rate-limit.ts`), pas de quota journalier

## Architecture

```
Client (CopilotPanel)
  → SSE POST /api/copilot/stream
    → Charge contexte de base (page, KPIs)
    → Construit prompt système + historique
    → Appelle Gemini 2.5 Pro avec tools déclarés
    → Gemini peut appeler des tools (get_products, get_seo_stats, etc.)
    → API exécute les tools, renvoie résultats à Gemini
    → Stream la réponse finale en SSE
    → Sauvegarde conversation en base
```

## Tools Gemini (function calling)

### Produits
| Tool | Description | Données |
|------|-------------|---------|
| `get_products` | Liste/recherche produits | Titre, prix, stock, statut SEO |
| `get_product_detail` | Détail d'un produit | Description, variations, images, scores SEO |
| `optimize_description` | Réécrit une description produit | Nouvelle description optimisée |
| `batch_optimize` | Optimise N descriptions en lot | Status + résultats par produit |
| `push_to_store` | Push produit vers WooCommerce/Shopify | Statut sync |

### Blog
| Tool | Description | Données |
|------|-------------|---------|
| `get_blog_posts` | Liste les articles | Titre, statut, date |
| `generate_article_ideas` | Génère des idées d'articles | Liste d'idées avec mots-clés |
| `launch_flowriter` | Redirige vers FloWriter avec pré-remplissage | URL de redirection |
| `analyze_article` | Résume/analyse un article existant | Résumé, stats, suggestions |

### SEO / GSC
| Tool | Description | Données |
|------|-------------|---------|
| `seo_audit` | Audit SEO rapide | Top problèmes, scores, recommandations |
| `keyword_suggestions` | Suggestions mots-clés | Liste de KW avec volume/difficulté |
| `get_gsc_performance` | Données Google Search Console | Clics, impressions, position, CTR |

### Dashboard
| Tool | Description | Données |
|------|-------------|---------|
| `get_dashboard_kpis` | KPIs globaux du jour | Ventes, trafic, alertes |
| `get_priority_actions` | Actions recommandées | Liste priorisée d'actions |

## Contexte injecté automatiquement

Avant chaque appel Gemini, l'API injecte :
- **Page courante** de l'utilisateur (products, blog, seo, overview)
- **Tenant info** (nom boutique, plateformes connectées)
- **KPIs de base** (nb produits, nb articles, score SEO global)

## Persistance (Supabase)

```sql
copilot_conversations (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES profiles(tenant_id),
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

copilot_messages (
  id uuid PK DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tool_calls jsonb,
  created_at timestamptz DEFAULT now()
)
```

RLS policies sur `tenant_id` (pattern standard FLOWZ).

## Streaming SSE

Events :
- `connected` — Connexion établie
- `chunk` — Token de texte
- `tool_call` — Gemini appelle un tool (afficher indicateur dans UI)
- `tool_result` — Résultat du tool (données intermédiaires)
- `complete` — Réponse terminée
- `error` — Erreur
- `heartbeat` — Keep-alive

## UI Enrichi

- **Indicateurs d'action** — Badge animé quand Gemini appelle un tool ("Analyse SEO en cours...")
- **Cartes de résultats** — Réponses structurées (tableau produits, carte KPI)
- **Historique** — Liste des conversations passées dans le panel
- **Nouvelle conversation** — Bouton pour démarrer un nouveau fil

## Sécurité

- Rate limiting via `lib/rate-limit.ts`
- Validation Zod des inputs
- Prompt injection prevention (patterns FloWriter)
- Tools exécutés côté serveur avec RLS (tenant_id vérifié)
