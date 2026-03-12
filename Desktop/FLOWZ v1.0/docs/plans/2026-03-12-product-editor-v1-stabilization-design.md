# Product Editor V1 Stabilization — Design Document

**Date:** 2026-03-12
**Objectif:** Stabiliser le flow d'édition de produit pour une mise en production avec clients payants.
**Approche:** Par priorité de risque (sécurité → intégrité → robustesse → performance)
**Scope:** ~20 fixes en 4 phases séquentielles

---

## Contexte

Le flow d'édition de produit est fonctionnellement complet (editor, tabs, variations, SEO, drafts AI, undo/redo, auto-save, conflict detection, version history, sync). L'audit du 2026-02-14 a identifié 47 issues (12 CRITICAL, 18 IMPORTANT, 17 MODERATE). Une re-vérification au 2026-03-12 montre que 7/12 CRITICAL sont fixés, mais des problèmes de sécurité et de robustesse subsistent.

### Décisions clés

- **Pas de migration V1→V2** — on stabilise la V1 existante
- **Production-grade** — sécurité, perf, error handling doivent être blindés
- **Pas de tests dans ce scope** — chantier séparé

---

## Phase 1 : Sécurité (CRITICAL)

### 1.1 XSS Sanitization

**Problème:** Descriptions HTML (WooCommerce/TipTap) jamais sanitisées. Injection `<script>` possible via produit synchronisé.

**Fix:**
- Installer `DOMPurify` + `@types/dompurify`
- Créer `lib/sanitize.ts` wrapping DOMPurify
- Sanitiser à 2 points :
  - **Entrée:** `useProductForm.ts` lors de la lecture de `metadata.description` / `metadata.short_description`
  - **Sortie:** `useProductSave.ts` avant écriture en DB

**Fichiers:** `lib/sanitize.ts` (nouveau), `features/products/hooks/useProductForm.ts`, `hooks/products/useProductSave.ts`

### 1.2 RLS Verification

**Problème:** Vérifier que `products` a bien RLS enabled + policies tenant_id.

**Fix:** Lire `supabase/migrations/20260222100001_fix_rls_critical.sql`. Si pas couvert, ajouter migration.

**Fichiers:** `supabase/migrations/`

### 1.3 Error Info Disclosure

**Problème:** `error.message` brut exposé au client dans les catch blocks.

**Fix:** Messages génériques côté client, log détaillé côté serveur uniquement.

**Fichiers:** `hooks/products/useProductSave.ts`, `features/products/hooks/useProductActions.ts`

### 1.4 Input Sanitization

**Problème:** `focus_keyword` et champs texte libres sans validation.

**Fix:** Strip HTML + longueur max dans le schema Zod `product-schema.ts`.

**Fichiers:** `features/products/schemas/product-schema.ts`

---

## Phase 2 : Intégrité des données (HIGH)

### 2.1 Race condition auto-save vs manual save

**Problème:** `cancelAutoSave()` existe mais intégration dans ProductEditorContainer non vérifiée.

**Fix:**
- Vérifier que `cancelAutoSave()` est appelé avant chaque save manuel
- Ajouter `saveLockRef` mutex — si un save est en cours, le suivant est ignoré

**Fichiers:** `features/products/components/ProductEditorContainer.tsx`, `hooks/products/useAutoSaveProduct.ts`

### 2.2 Double-save prevention

**Problème:** Submit pendant fetch peut déclencher deux saves.

**Fix:** Guard `if (isSaving) return` au début de `handleManualSave`.

**Fichiers:** `features/products/components/ProductEditorContainer.tsx`

### 2.3 Save-before-publish (UX fix)

**Problème:** Le guard existe (bouton disabled + toast) mais l'UX crée une friction. L'utilisateur s'attend à ce que "Publier" sauvegarde d'abord automatiquement.

**Fix:** Modifier `handlePublish` pour enchaîner save → push automatiquement si `isDirty`. Flow : clic Publier → save → puis push. Seamless.

**Fichiers:** `features/products/components/ProductEditorContainer.tsx`

### 2.4 Version history race avec auto-save

**Problème:** `createVersion()` après save peut confliter avec le prochain auto-save.

**Fix:** Appeler `cancelAutoSave()` avant `createVersion()`, relancer le timer après.

**Fichiers:** `features/products/components/ProductEditorContainer.tsx`

---

## Phase 3 : Robustesse (HIGH)

### 3.1 Polling visibility — useConflictDetection

**Problème:** Poll sans check `document.hidden`.

**Fix:** Ajouter `if (document.hidden) return false` dans `refetchInterval`.

**Fichiers:** `hooks/products/useConflictDetection.ts`

### 3.2 Stale conflict data

**Problème:** `staleTime: STALE_TIMES.LIST` (~30s+) trop lent pour conflict detection.

**Fix:** Réduire à `staleTime: 5_000`.

**Fichiers:** `hooks/products/useConflictDetection.ts`

### 3.3 Retry sur mutations Supabase

**Problème:** Aucun retry configuré sur les mutations TanStack Query.

**Fix:** `retry: 1` sur `useProductSave` et `useConflictDetection`.

**Fichiers:** `hooks/products/useProductSave.ts`, `hooks/products/useConflictDetection.ts`

### 3.4 Error messages enrichis

**Problème:** Toasts génériques "Erreur de sauvegarde" sans contexte.

**Fix:**
- `StaleDataError` → "Produit modifié ailleurs — rechargez"
- `DuplicateSkuError` → "SKU déjà utilisé par {product}"
- Network error → "Connexion perdue — réessayez"
- Autre → "Erreur inattendue"

**Fichiers:** `features/products/components/ProductEditorContainer.tsx`, `hooks/products/useProductSave.ts`

### 3.5 Silent NaN dans transformFormToSaveData

**Problème:** `coerceNumber()` convertit "10,99" en `NaN` silencieusement.

**Fix:** Détecter format européen (virgule → point). Retourner `undefined` plutôt que `NaN`.

**Fichiers:** `features/products/utils/transformFormToSaveData.ts`

### 3.6 Accessibility — aria-labels

**Problème:** Boutons undo/redo/save sans aria-labels.

**Fix:** Ajouter `aria-label` et `title` sur tous les boutons d'action du header.

**Fichiers:** `features/products/components/edit/ProductEditorHeader.tsx`

---

## Phase 4 : Performance & Polish (MEDIUM)

### 4.1 Memory optimization — useFormHistory

**Problème:** 50 snapshots × ~50KB = 2.5MB.

**Fix:** Réduire `maxSnapshots` de 50 à 30.

**Fichiers:** `features/products/hooks/useFormHistory.ts`

### 4.2 useMemo dependencies

**Problème:** `contextValue` useMemo invalide à chaque render car `methods` change de ref.

**Fix:** Extraire les valeurs stables de `methods` individuellement comme dépendances.

**Fichiers:** `features/products/components/ProductEditorContainer.tsx`

### 4.3 Centralized editor config

**Problème:** Timings hardcodés partout (auto-save 5s, cooldown 15s, polling intervals).

**Fix:** Créer `features/products/constants/editor-config.ts` centralisant tous les timings.

**Fichiers:** `features/products/constants/editor-config.ts` (nouveau), tous les hooks qui utilisent des timings

### 4.4 Console.log cleanup

**Problème:** Console.log dans le flow product editor.

**Fix:** Supprimer les console.log du scope product editor uniquement.

**Fichiers:** Tous fichiers dans `features/products/` et `hooks/products/`

---

## Hors scope (explicitement exclus)

- Migration V1→V2 des composants
- Tests unitaires/E2E (0% → 80%)
- Telemetry/analytics
- DB index sur `dirty_fields_content`
- Images validation min 1 pour WooCommerce
- JSDoc sur tous les hooks
- Refactor TypeScript loose `any` types
- Console.log hors du scope product editor
