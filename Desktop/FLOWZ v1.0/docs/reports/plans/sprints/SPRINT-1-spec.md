# SPRINT 1 — Remédiation & Quick Wins
**Durée:** 3 jours | **Phase:** 1 — Fondations | **Prérequis:** Aucun

---

## Objectif

Éliminer la dette technique accumulée avant de construire les nouvelles features. Chaque micro-feature est indépendante et peut être implémentée en parallèle.

---

## Feature 1 — Prompt Injection Patterns Consolidés

### État actuel

**DÉJÀ FAIT** : Le fichier `lib/ai/prompt-safety.ts` existe et est importé par les 3 endpoints :
- `app/api/flowriter/stream/route.ts` (line 5) → `detectPromptInjection`, `sanitizeUserInput`
- `app/api/photo-studio/generate/route.ts` (line 5) → `detectPromptInjection`
- `app/api/batch-generation/stream/route.ts` (line 16) → `detectPromptInjection`

### Direction de développement

**Action : Enrichir `lib/ai/prompt-safety.ts` avec les patterns manquants**

```typescript
// Patterns actuels (~10) — compléter avec :
const ADDITIONAL_PATTERNS = [
  // Role switching
  /pretend\s+(to\s+)?be/i,
  /impersonate/i,
  /role\s+override/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(?:a|an|the)\s+/i,

  // Context manipulation
  /forget\s+(everything|all|previous)/i,
  /clear\s+(your\s+)?context/i,
  /reset\s+(your\s+)?prompt/i,
  /disregard\s+(all|your)/i,
  /override\s+(your\s+)?instructions/i,

  // Continuation attacks
  /continue\s+(above|previous|from)/i,
  /from\s+now\s+on/i,
  /new\s+instruction/i,

  // Code execution
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bFunction\s*\(/i,
  /import\s*\(/i,
  /require\s*\(/i,

  // Encoding evasion
  /base64/i,
  /\\u00[0-9a-f]{2}/i,
  /data:text\/html/i,
];
```

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `my-app/src/lib/ai/prompt-safety.ts` | Ajouter 15+ patterns supplémentaires |

### Critère de sortie
- [ ] `grep -c "RegExp\|new RegExp\|\/.*\/i" lib/ai/prompt-safety.ts` → 25+ patterns
- [ ] Les 3 endpoints importent depuis `prompt-safety.ts` (déjà le cas)

---

## Feature 2 — Console.log Purge Client-Side

### État actuel

**RÉSULTAT AUDIT :** 0 console.log en code client-side (hooks/, components/, features/). **~45 console.log restants dans les API routes (server-side).**

### Direction de développement

**Cette feature est DÉJÀ COMPLÉTÉE.** Les console.log client-side ont été supprimés lors de la remédiation précédente.

**Action restante :** Ajouter une règle ESLint pour empêcher les régressions.

```jsonc
// my-app/.eslintrc.json
{
  "rules": {
    "no-console": ["warn", {
      "allow": ["error", "warn"]
    }]
  },
  "overrides": [{
    "files": ["src/app/api/**/*.ts"],
    "rules": {
      "no-console": "off"  // Autoriser côté server
    }
  }]
}
```

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `my-app/eslint.config.mjs` ou `.eslintrc.json` | Ajouter rule `no-console` |

### Critère de sortie
- [ ] `npm run lint` ne retourne aucune erreur console côté client
- [ ] Les API routes sont exclues de la règle

---

## Feature 3 — Landing Page Lazy Loading

### État actuel

**DÉJÀ FAIT** : `my-app/src/components/LandingPage.tsx` utilise `next/dynamic` avec `ssr: false` pour 7 composants below-the-fold. Seuls `Navbar` et `HeroSection` sont importés en statique.

### Direction de développement

**Cette feature est DÉJÀ COMPLÉTÉE.**

Imports actuels :
- **Statiques (above-fold):** `Navbar`, `HeroSection`
- **Lazy (below-fold):** `DashboardPreviewSection`, `MarqueeSection`, `MarketIntelligenceSection`, `FeaturesSection`, `TestimonialsSection`, `PricingSection`, `FooterSection`

### Critère de sortie
- [x] Composants below-fold en `next/dynamic({ ssr: false })`

---

## Feature 4 — staleTime Standardisation

### État actuel

**DÉJÀ FAIT** : Le fichier `lib/query-config.ts` existe avec les 6 constantes standardisées :
```typescript
STALE_TIMES = { POLLING: 1_000, REALTIME: 5_000, LIST: 30_000, DETAIL: 60_000, STATIC: 300_000, ARCHIVE: 600_000 }
```

**58 occurrences** trouvées, toutes utilisant `STALE_TIMES.*` — **SAUF 3 exceptions hardcodées :**

| Fichier | Ligne | Valeur | Action |
|---------|-------|--------|--------|
| `app/providers.tsx` | 18 | `60 * 1000` | → `STALE_TIMES.DETAIL` |
| `contexts/StoreContext.tsx` | 64 | `300000` | → `STALE_TIMES.STATIC` |
| `features/photo-studio/hooks/useProductClassification.ts` | 57 | `24 * 60 * 60 * 1000` (24h) | → Créer `STALE_TIMES.IMMUTABLE: 24 * 60 * 60_000` ou laisser tel quel (cas unique) |

### Direction de développement

Remplacer les 2-3 valeurs hardcodées restantes par les constantes `STALE_TIMES.*`.

### Fichiers à modifier

| Fichier | Ligne | Action |
|---------|-------|--------|
| `my-app/src/app/providers.tsx` | 18 | Importer `STALE_TIMES`, utiliser `STALE_TIMES.DETAIL` |
| `my-app/src/contexts/StoreContext.tsx` | 64 | Importer `STALE_TIMES`, utiliser `STALE_TIMES.STATIC` |

### Critère de sortie
- [ ] `grep -rn "staleTime:" src/ | grep -v "STALE_TIMES" | grep -v "node_modules"` → 0 résultats (hors cas 24h si intentionnel)

---

## Feature 5 — Catch Blocks Vides → Error Handling

### État actuel

**75 empty catch blocks** identifiés dans le codebase. Répartition :

| Contexte | Nombre | Stratégie |
|----------|--------|-----------|
| API routes (server-side) | 25 | `console.error(err)` + réponse HTTP appropriée |
| Hooks (mutations/queries) | 22 | `toast.error()` pour user-facing, `console.warn()` pour internes |
| Components (UI actions) | 18 | `toast.error()` ou `console.warn()` selon visibilité |
| Libs (ssrf, gsc, supabase) | 10 | `console.error()` structuré |

### Direction de développement

**Priorité : Traiter les catch blocks par couche, du plus critique au moins critique.**

#### Stratégie par type de catch :

**1. API Routes (25 blocs) — `console.error` + réponse HTTP sanitisée**
```typescript
// AVANT
} catch {
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
}

// APRÈS
} catch (error) {
  console.error('[API_NAME] Operation failed:', error instanceof Error ? error.message : error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

**2. Hooks Mutations (22 blocs) — `toast.error()` + throw pour TanStack**
```typescript
// AVANT
} catch {
}

// APRÈS
} catch (error) {
  const message = error instanceof Error ? error.message : 'Opération échouée';
  toast.error(message);
  throw error; // Laisser TanStack Query gérer le retry/error state
}
```

**3. Components UI (18 blocs) — `console.warn()` silencieux**
```typescript
// AVANT
} catch {
}

// APRÈS
} catch (error) {
  console.warn('[ComponentName] Non-critical error:', error);
}
```

### Top 10 fichiers prioritaires

| Fichier | Blocs | Priorité |
|---------|-------|----------|
| `hooks/blog/useArticleSync.ts` | 5 | HAUTE (sync WordPress) |
| `hooks/blog/useFlowriterSync.ts` | 4 | HAUTE (sync articles) |
| `hooks/sync/useSyncJob.ts` | 4 | HAUTE (sync produits) |
| `hooks/stores/useDisconnectStore.ts` + siblings | 5 | HAUTE (lifecycle store) |
| `features/photo-studio/context/StudioContext.tsx` | 2 | MEDIUM (batch errors) |
| `components/article-editor/dialogs/*.tsx` | 4 | MEDIUM (user actions) |
| `app/api/gsc/*/route.ts` | 12 | MEDIUM (GSC API) |
| `components/profile/sections/*.tsx` | 3 | LOW (profil) |
| `lib/gsc/client.ts` | 2 | LOW (GSC client) |
| `lib/ssrf.ts` | 1 | LOW (intentionnel) |

### Fichiers à modifier

75 fichiers listés dans l'audit. Voir liste complète dans la section audit ci-dessus.

### Critère de sortie
- [ ] `grep -rn "} catch {" src/ | wc -l` → 0
- [ ] Tous les catch blocks ont un corps (log, toast, ou throw)
- [ ] Aucune info sensible exposée dans les messages d'erreur

---

## Récapitulatif Sprint 1

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 1 | Prompt injection enrichi | 0.5j | Partiel — enrichir patterns |
| 2 | Console.log purge | 0.25j | **FAIT** — juste ESLint rule |
| 3 | Landing lazy loading | 0j | **FAIT** |
| 4 | staleTime standardisation | 0.25j | Quasi-fait — 2-3 hardcoded restants |
| 5 | Catch blocks error handling | 2j | 75 blocs à traiter |

**Effort réel ajusté : ~3 jours** (principalement Feature 5)
