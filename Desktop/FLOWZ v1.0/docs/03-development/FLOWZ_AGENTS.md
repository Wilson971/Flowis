# FLOWZ Agents - Guide de Référence

Ce document liste tous les agents FLOWZ disponibles et comment les invoquer.

## Liste des Agents

| Commande | Agent | Spécialité |
|----------|-------|------------|
| `/flowzplan` | FlowzPlan | Planification intelligente de features |
| `/flowz-review` | FlowzReview | Code Review adversarial |
| `/flowz-frontend` | FlowzFrontend | Frontend Next.js/React |
| `/flowz-supabase` | FlowzSupabase | Backend Supabase |
| `/flowz-architect` | FlowzArchitect | Architecture technique |
| `/flowz-ai` | FlowzAI | Intégration AI |
| `/flowz-sync` | FlowzSync | Synchronisation multi-plateforme |
| `/flowz-ux` | FlowzUX | Design UX/UI |
| `/flowz-perf` | FlowzPerf | Performance |
| `/flowz-test` | FlowzTest | Testing TDD |

---

## Détail des Agents

### `/flowzplan` - Planification Intelligente

**Quand l'utiliser :** Avant de coder une nouvelle feature

**Ce qu'il fait :**
1. Pose des questions jusqu'à clarté totale
2. Scanne le codebase pour des patterns existants
3. Consulte Context7 pour la documentation à jour
4. Valide la compréhension avec des analogies
5. Découpe en features atomiques si nécessaire
6. Crée un plan détaillé prêt pour l'implémentation

**Exemple :**
```
/flowzplan

Je veux ajouter un système de notifications push pour les syncs produits.
```

---

### `/flowz-review` - Code Review Adversarial

**Quand l'utiliser :** Après avoir écrit du code, avant de commit

**Ce qu'il fait :**
- Trouve **3-10 problèmes minimum** dans chaque review
- Vérifie : Sécurité, Performance, Qualité, Tests, Architecture
- Ne dit jamais "looks good" - cherche toujours des améliorations
- Peut auto-fix avec approbation

**Exemple :**
```
/flowz-review

Revois le code que je viens d'écrire dans src/hooks/blog/useArticleSync.ts
```

---

### `/flowz-frontend` - Frontend Expert

**Quand l'utiliser :** Pour implémenter des composants et hooks

**Ce qu'il fait :**
- Components Server/Client avec shadcn/ui
- Hooks par domaine (blog/, products/, sync/)
- Data fetching avec TanStack Query
- Forms avec React Hook Form + Zod
- Intégration Supabase

**Stack :** Next.js 16, React 19, Tailwind v4, shadcn/ui

**Exemple :**
```
/flowz-frontend

Crée un composant ProductCard avec les actions edit/delete/sync.
```

---

### `/flowz-supabase` - Backend Supabase

**Quand l'utiliser :** Pour le backend, migrations, RLS

**Ce qu'il fait :**
- Migrations PostgreSQL
- Row Level Security (RLS) policies
- Edge Functions en Deno
- Génération des types TypeScript
- Audit de sécurité

**Exemple :**
```
/flowz-supabase

Crée une migration pour ajouter une table notifications avec RLS.
```

---

### `/flowz-architect` - Architecture Technique

**Quand l'utiliser :** Pour des décisions techniques importantes

**Ce qu'il fait :**
- Analyse du codebase et patterns existants
- Design d'architecture pour features
- Documentation des décisions (ADRs)
- Consultation Context7 pour best practices
- Présentation des trade-offs

**Exemple :**
```
/flowz-architect

Quelle architecture pour un système de cache côté client?
```

---

### `/flowz-ai` - Intégration AI

**Quand l'utiliser :** Pour tout ce qui touche à l'AI/GenAI

**Ce qu'il fait :**
- Google GenAI integration (Server Actions)
- Edge Functions AI dans Supabase
- Prompt engineering et optimisation
- Custom hooks AI avec rate limiting
- FloWriter wizard

**Exemple :**
```
/flowz-ai

Ajoute une action AI pour résumer automatiquement les descriptions produits.
```

---

### `/flowz-sync` - Multi-platform Sync

**Quand l'utiliser :** Pour la synchronisation e-commerce

**Ce qu'il fait :**
- WooCommerce API REST v3
- Shopify Admin API
- Mappers de conversion entre plateformes
- Edge Functions (push-to-store, sync-manager)
- Debug de problèmes de sync

**Plateformes :** WooCommerce, Shopify

**Exemple :**
```
/flowz-sync

Debug pourquoi les images produits ne se synchronisent pas vers WooCommerce.
```

---

### `/flowz-ux` - Design UX/UI

**Quand l'utiliser :** Pour l'interface utilisateur et le design

**Ce qu'il fait :**
- Cohérence visuelle (tokens, couleurs, typography)
- Accessibilité WCAG 2.1 AA minimum
- Composants shadcn/ui (New York style)
- Animations Framer Motion
- Design responsive mobile-first

**Exemple :**
```
/flowz-ux

Améliore l'UX du formulaire de connexion de store WooCommerce.
```

---

### `/flowz-perf` - Performance

**Quand l'utiliser :** Pour optimiser la performance

**Ce qu'il fait :**
- Core Web Vitals (LCP, FID, CLS)
- Analyse et réduction du bundle
- Optimisation React (re-renders, memoization)
- Images avec next/image
- Loading avec Streaming et Suspense

**Exemple :**
```
/flowz-perf

Optimise la page products qui charge lentement avec 500+ produits.
```

---

### `/flowz-test` - Testing TDD

**Quand l'utiliser :** Pour écrire et gérer les tests

**Ce qu'il fait :**
- Unit Tests avec Vitest + Testing Library
- E2E Tests avec Playwright multi-browser
- Cycle TDD Red-Green-Refactor
- Analyse et amélioration de la coverage
- Mocking Supabase et APIs externes

**Exemple :**
```
/flowz-test

Écris les tests unitaires pour useArticleSync hook.
```

---

## Workflow Recommandé

```
1. /flowzplan      → Planifier la feature
2. /flowz-architect → Valider l'architecture (si complexe)
3. /flowz-frontend  → Implémenter le frontend
   /flowz-supabase  → Implémenter le backend
   /flowz-ai        → Implémenter l'AI (si applicable)
4. /flowz-test      → Écrire les tests
5. /flowz-review    → Review du code
6. /flowz-perf      → Optimiser (si nécessaire)
```

---

## Notes

- Chaque agent est spécialisé dans son domaine
- Les agents consultent Context7 pour la documentation à jour
- Les agents respectent les patterns existants du projet
- Aucun code n'est écrit sans validation explicite
