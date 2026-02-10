# Migration Guide: Sync Hooks v1 → v2

## Vue d'ensemble

La nouvelle architecture de synchronisation résout les problèmes suivants:

1. **Souscriptions multiples non coordonnées** → Subscription Manager centralisé
2. **Memory leaks (setTimeout non nettoyés)** → Cleanup automatique via refs
3. **Cascades d'invalidations (8+ queries simultanées)** → Debouncing + batching
4. **États imprévisibles** → State Machine avec transitions définies
5. **Code dupliqué entre hooks** → Architecture unifiée

## Changements Majeurs

### Avant (v1)
```tsx
// Imports multiples
import { useSyncStore } from '@/hooks/sync/useSyncStore';
import { useSyncProgress } from '@/hooks/sync/useSyncProgress';
import { useSyncCompletion } from '@/hooks/sync/useSyncCompletion';

function MyComponent({ storeId }) {
    // Hook 1: Démarrer la sync
    const { sync, progress, isSyncing } = useSyncStore();

    // Hook 2: Suivre la progression (souscription séparée!)
    const { activeJob, logs } = useSyncProgress(storeId);

    // Hook 3: Détecter la completion (autre souscription!)
    useSyncCompletion(storeId, {
        onComplete: (job) => console.log('Done!'),
    });

    return (
        <button onClick={() => sync({ storeId })}>
            {isSyncing ? `${progress?.percent}%` : 'Sync'}
        </button>
    );
}
```

### Après (v2)
```tsx
// Import unique
import { useSyncForStore } from '@/features/sync';

function MyComponent({ storeId }) {
    // Hook unifié - une seule souscription, tout inclus
    const {
        start,
        pause,
        resume,
        cancel,
        isSyncing,
        progress,
        isCompleted,
        isFailed,
        error
    } = useSyncForStore(storeId);

    return (
        <button onClick={() => start()}>
            {isSyncing ? `${progress?.percent}%` : 'Sync'}
        </button>
    );
}
```

## Guide de Migration

### 1. Ajouter le Provider

```tsx
// Dans votre layout dashboard (ex: routes/dashboard.tsx)

import { SyncProvider } from '@/features/sync';

export function DashboardLayout({ children }) {
    return (
        <SyncProvider>
            {children}
        </SyncProvider>
    );
}
```

### 2. Remplacer les Hooks

| Ancien Hook | Nouveau Hook | Notes |
|-------------|--------------|-------|
| `useSyncStore()` | `useSyncActions()` | Actions: start, pause, resume, cancel |
| `useSyncProgress(storeId)` | `useSyncProgress()` ou `useSyncForStore(storeId)` | Via context, pas de storeId nécessaire |
| `useSyncCompletion(storeId, callbacks)` | Callbacks intégrés dans le Provider | Auto-géré |
| `useSyncManager()` | `useStartSync()` | API simplifiée |
| `useSyncJob(jobId)` | `useSyncState().activeJob` | État dans le context |

### 3. Mapping des Props/Returns

#### useSyncStore → useSyncActions + useSyncStatus

```tsx
// Avant
const { sync, progress, isSyncing, clearProgress } = useSyncStore();

// Après
const { startSync, reset } = useSyncActions();
const { isSyncing, progress } = useSyncStatus();

// Ou plus simple
const { start, isSyncing, progress } = useSyncForStore(storeId);
```

#### useSyncProgress → useSyncProgress (context)

```tsx
// Avant
const { activeJob, logs } = useSyncProgress(storeId);

// Après
const { progress, percent, message, phase } = useSyncProgress();
const { activeJob } = useSyncState();

// Note: logs sont maintenant gérés en interne
```

#### useSyncCompletion → Automatique

```tsx
// Avant
useSyncCompletion(storeId, {
    onComplete: (job) => handleComplete(job),
    onFail: (job, error) => handleError(error),
    showToast: true,
});

// Après
// Les toasts sont automatiques dans le SyncProvider
// Pour des callbacks custom, utilisez useEffect:
const { isCompleted, isFailed, state } = useSyncStatus();

useEffect(() => {
    if (isCompleted && state.lastResult) {
        handleComplete(state.lastResult);
    }
}, [isCompleted, state.lastResult]);

useEffect(() => {
    if (isFailed && state.error) {
        handleError(state.error);
    }
}, [isFailed, state.error]);
```

### 4. Composants UI

Utilisez le composant `SyncButton` prêt à l'emploi:

```tsx
import { SyncButton, SyncIconButton } from '@/features/sync/components/SyncButton';

// Bouton complet avec progress
<SyncButton storeId={storeId} showProgress />

// Version icône compacte
<SyncIconButton storeId={storeId} />
```

## Hooks Disponibles

| Hook | Usage | Returns |
|------|-------|---------|
| `useSyncContext()` | Accès complet au context | Tout |
| `useSyncState()` | État brut de la machine | `SyncEngineState` |
| `useSyncStatus()` | Indicateurs booléens | `{ isIdle, isSyncing, ... }` |
| `useSyncActions()` | Actions de contrôle | `{ startSync, pauseSync, ... }` |
| `useSyncProgress()` | Données de progression | `{ progress, percent, message }` |
| `useStartSync()` | API simplifiée pour démarrer | `{ startSync, canStart }` |
| `useSyncForStore(id)` | Tout pour un store spécifique | State + Actions |

## États de la Machine

```
idle ──────► starting ──────► discovering ──────► syncing
  ▲              │                  │                 │
  │              ▼                  ▼                 ▼
  │           failed ◄──────── failed ◄─────────  paused
  │              │                                    │
  └──────────────┴────────── completed ◄──────────────┘
```

Transitions valides:
- `idle` → `starting`
- `starting` → `discovering`, `syncing`, `failed`, `idle`
- `discovering` → `syncing`, `paused`, `failed`, `idle`
- `syncing` → `paused`, `completed`, `failed`, `idle`
- `paused` → `syncing`, `failed`, `idle`
- `completed` → `idle`, `starting`
- `failed` → `idle`, `starting`

## Debugging

```tsx
import { syncSubscriptions, queryInvalidation } from '@/features/sync';

// Voir les channels actifs
console.log(syncSubscriptions.listChannels());

// Voir les invalidations pendantes
console.log(queryInvalidation.getPendingCount());
```

## FAQ

### Q: Les anciens hooks fonctionnent-ils encore?
R: Oui, ils sont toujours dans `@/hooks/sync/`. Vous pouvez migrer progressivement.

### Q: Dois-je migrer tout d'un coup?
R: Non, la migration peut être progressive. Commencez par ajouter le `SyncProvider`, puis migrez composant par composant.

### Q: Comment gérer plusieurs syncs simultanées?
R: La v2 gère une sync à la fois par design (évite les conflits). Pour plusieurs stores, attendez la fin de la sync courante.

### Q: Les toasts sont-ils configurables?
R: Les toasts par défaut utilisent `sonner`. Pour les personnaliser, créez votre propre hook basé sur `useSyncContext` avec des callbacks custom.
