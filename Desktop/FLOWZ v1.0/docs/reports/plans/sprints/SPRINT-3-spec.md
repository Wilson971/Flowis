# SPRINT 3 — Sync Avancée & Stores
**Durée:** 5 jours | **Phase:** 2 — Core Features | **Prérequis:** Sprint 2

---

## Objectif

Système de synchronisation production-ready avec lifecycle complet des stores, heartbeat, et détection de conflits.

---

## Feature 11 — Store Lifecycle Hooks

### État actuel

**DÉJÀ FAIT** : Tous les hooks lifecycle existent dans `hooks/stores/` :
- `useDisconnectStore.ts` (79 lignes) — Sets `store.active=false`, checks `active_jobs_running`
- `useReconnectStore.ts` (78 lignes) — Updates `credentials_encrypted`, resets health to `unknown`
- `useScheduleStoreDeletion.ts` (34 lignes) — Schedules soft delete
- `usePermanentDeleteStore.ts` (25 lignes) — Hard delete
- `useCancelStoreDeletion.ts` (25 lignes) — Cancel scheduled delete
- `useStores.ts` (313 lignes) — CRUD complet (create, update, delete, list, single, active)

### Direction de développement

**Les hooks existent mais ont des catch blocks vides** (identifiés Sprint 1 Feature 5). Ajouter le error handling propre.

**Enrichissement des hooks :**

```typescript
// useDisconnectStore.ts — Ajouter confirmation dialog + toast
onMutate: () => { /* optimistic update: store.active = false */ },
onError: (error) => {
  if (error.message?.includes('active_jobs_running')) {
    toast.error('Impossible de déconnecter : synchronisation en cours');
  } else {
    toast.error('Erreur lors de la déconnexion');
  }
},
onSuccess: () => {
  toast.success('Boutique déconnectée');
  queryClient.invalidateQueries({ queryKey: ['stores'] });
}
```

### Fichiers à modifier

| Fichier | Ligne | Action |
|---------|-------|--------|
| `hooks/stores/useDisconnectStore.ts` | 26 | Ajouter error handling |
| `hooks/stores/useReconnectStore.ts` | 26 | Ajouter error handling |
| `hooks/stores/useScheduleStoreDeletion.ts` | 34 | Ajouter error handling |
| `hooks/stores/usePermanentDeleteStore.ts` | 25 | Ajouter error handling |
| `hooks/stores/useCancelStoreDeletion.ts` | 25 | Ajouter error handling |

### Critère de sortie
- [x] Tous les hooks lifecycle existent
- [ ] Tous les catch blocks ont du error handling (pas vides)
- [ ] Toast feedback pour chaque opération

---

## Feature 12 — Store Settings UI

### État actuel

**PARTIELLEMENT FAIT** :
- `useStoreSyncSettings.ts` (130 lignes) existe avec defaults merge
- `useWatermarkSettings.ts` (225 lignes) existe avec upload
- `StoreGeneralSection.tsx` existe dans `components/settings/store/`

### Direction de développement

**Créer les composants UI manquants :**

```
components/settings/store/
├── StoreGeneralSection.tsx     ✅ Existe
├── StoreSyncSettingsSection.tsx  ← CRÉER
├── StoreCredentialsTab.tsx       ← CRÉER
├── StoreWatermarkSection.tsx     ← CRÉER (wrapper useWatermarkSettings)
├── DeleteStoreDialog.tsx         ← CRÉER
└── DisconnectStoreDialog.tsx     ← CRÉER
```

#### StoreSyncSettingsSection.tsx — Spec

```typescript
interface StoreSyncSettingsSectionProps {
  storeId: string;
}

// Utilise useStoreSyncSettings(storeId)
// Affiche :
// - Toggle auto_sync_enabled
// - Select sync_interval_hours (1, 6, 12, 24)
// - Checkboxes : sync_products, sync_categories, sync_variations, sync_posts
// - Bouton "Sauvegarder" → useUpdateStoreSyncSettings()
```

#### StoreCredentialsTab.tsx — Spec

```typescript
// Affiche les credentials masquées de platform_connections
// - WooCommerce : consumer_key (ck_***), consumer_secret (cs_***)
// - Shopify : access_token (shpat_***)
// - Bouton "Reconnecter" → useReconnectStore() avec nouveau formulaire
// - Bouton "Tester la connexion" → API /api/stores/test-connection
```

#### DeleteStoreDialog.tsx — Spec

```typescript
// AlertDialog de confirmation avec 2 étapes :
// 1. Schedule deletion (30 jours de grâce) → useScheduleStoreDeletion()
// 2. Confirmation texte "SUPPRIMER" pour delete immédiat → usePermanentDeleteStore()
// - Affiche les données qui seront perdues (X produits, Y articles)
// - Bouton "Annuler la suppression" pendant période de grâce
```

### Fichiers à créer

| Fichier | LOC estimées | Priorité |
|---------|-------------|----------|
| `components/settings/store/StoreSyncSettingsSection.tsx` | ~120 | HAUTE |
| `components/settings/store/StoreCredentialsTab.tsx` | ~150 | HAUTE |
| `components/settings/store/DeleteStoreDialog.tsx` | ~100 | MOYENNE |
| `components/settings/store/DisconnectStoreDialog.tsx` | ~80 | MOYENNE |

### Critère de sortie
- [ ] Page settings store avec 4 sections (General, Sync, Credentials, Danger)
- [ ] Toggle auto-sync fonctionnel
- [ ] Credentials masquées avec option reconnexion
- [ ] Dialog delete avec période de grâce

---

## Feature 13 — Store Heartbeat Système

### État actuel

**DÉJÀ FAIT** :
- `useStoreHeartbeat.ts` (211 lignes) — Mutation calling `store-heartbeat` edge function
- `useConnectionHealth(storeId)` — Query fetch `connection_health`, `last_heartbeat_at`
- `useHeartbeatLogs(storeId)` — Query with realtime subscription
- Helpers: `getHealthColor()`, `getHealthBgColor()`, `getHealthLabel()`

### Direction de développement

**Le hook est complet.** Vérifier que l'edge function `store-heartbeat` est déployée et que le cron pg_cron est configuré.

**Améliorations possibles :**
1. Afficher le badge de santé dans le sidebar store selector
2. Notification automatique quand un store passe `unhealthy`
3. Retry automatique après X heartbeats failed

### Critère de sortie
- [x] Heartbeat hook fonctionnel
- [ ] Badge santé visible dans l'UI (sidebar)
- [ ] Notification pour stores unhealthy

---

## Feature 14 — Sync State Machine v2

### État actuel

**DÉJÀ FAIT** : `features/sync/machine.ts` (338 lignes) avec :
- 7 états : `idle, starting, discovering, syncing, paused, completed, failed`
- 9 types d'événements : `START, PROGRESS, JOB_UPDATE, PAUSE, RESUME, CANCEL, COMPLETE, ERROR, RESET`
- Transitions validées via `canTransition()`
- Selectors : `isIdle, isSyncing, isPaused, canStart, canPause, canResume, canCancel`

### Direction de développement

**La state machine est complète.** Ajouts possibles :

1. **État `recovering`** — Pour les reprises après timeout edge function
2. **État `partial`** — Pour les sync qui finissent avec des erreurs partielles
3. **Logging des transitions** — Émettre des events pour debugging

```typescript
// Nouvelles transitions suggérées
const validTransitions = {
  // ... existant
  syncing: ['paused', 'completed', 'failed', 'idle', 'recovering'], // + recovering
  recovering: ['syncing', 'failed', 'idle'], // nouveau
};

// Nouvel événement
case 'RECOVER': {
  return { ...state, machineState: 'recovering', updatedAt: now };
}
```

### Critère de sortie
- [x] State machine 7 états fonctionnelle
- [ ] (Optionnel) État `recovering` pour edge function timeout resume

---

## Feature 15 — Sync Progress Realtime

### État actuel

**DÉJÀ FAIT** :
- `useSyncProgress.ts` (99 lignes) — Realtime subscriptions via Supabase channels
- Écoute INSERT/UPDATE sur `sync_jobs` filtré par `store_id`
- Écoute INSERT sur `sync_logs` filtré par `job_id`
- `ACTIVE_STATUSES: ['pending', 'discovering', 'syncing', 'products', 'variations', 'categories']`

### Direction de développement

**Le hook est complet.** Peut être enrichi avec :
- Estimation temps restant (basé sur vitesse actuelle)
- Détail par phase (categories: X/Y, products: X/Y, variations: X/Y)

### Critère de sortie
- [x] Realtime progress via Supabase channels
- [x] Logs en temps réel

---

## Feature 16 — Sync Reports & History

### État actuel

**PARTIELLEMENT FAIT** :
- `useSyncJob.ts` (421 lignes) — `useSyncJobs(storeId, limit=10)` liste les jobs récents
- `SyncHistoryCard.tsx` existe dans `features/products/components/edit/`
- `useSyncHistory.ts` existe dans `hooks/products/`

### Direction de développement

**Créer un composant SyncDashboard dédié** (page `/app/settings/sync`) :

```typescript
// components/sync/SyncDashboard.tsx
interface SyncDashboardProps {
  storeId: string;
}

// Sections :
// 1. Stats globales (jobs total, success rate, avg duration)
// 2. Historique des 20 derniers jobs avec status, durée, items synced
// 3. Logs détaillés du dernier job (expandable)
// 4. Boutons actions : Start Full Sync, Start Incremental, Cancel Active
```

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `components/sync/SyncDashboard.tsx` | CRÉER |
| `components/sync/SyncJobRow.tsx` | CRÉER |
| `components/sync/SyncLogViewer.tsx` | CRÉER |

### Critère de sortie
- [ ] Page/section historique des sync visible
- [ ] Stats success rate + durée moyenne
- [ ] Logs expandables par job

---

## Feature 17 — Conflict Detection

### État actuel

**DÉJÀ FAIT** :
- `useConflictDetection.ts` (199 lignes) dans `hooks/products/`
- `ConflictResolutionDialog` intégré dans `ProductEditorContainer.tsx`
- `conflictData` passé comme prop au composant
- `staleTime: STALE_TIMES.LIST` pour le polling

### Direction de développement

**Le hook et le dialog existent.** Enrichissements :

1. **Field-level diff view** — Montrer côte à côte la valeur locale vs distante
2. **Merge strategy** — Choix par champ (garder local / garder distant / merge)
3. **Auto-detection** — Comparer `working_content_updated_at` vs `store_content_updated_at`

### Critère de sortie
- [x] Détection de conflits fonctionne
- [ ] (Optionnel) Diff view par champ avec choix merge

---

## Récapitulatif Sprint 3

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 11 | Store lifecycle hooks | 0.5j | **FAIT** — enrichir error handling |
| 12 | Store settings UI | 2j | PARTIEL — 4 composants à créer |
| 13 | Store heartbeat | 0.25j | **FAIT** — badge UI à ajouter |
| 14 | Sync state machine v2 | 0.25j | **FAIT** — optionnel: état recovering |
| 15 | Sync progress realtime | 0j | **FAIT** |
| 16 | Sync reports & history | 1j | PARTIEL — dashboard à créer |
| 17 | Conflict detection | 0j | **FAIT** |

**Effort réel ajusté : ~4 jours** (principalement Feature 12 + 16)
