/**
 * FLOWZ Hooks - Export centralisé
 *
 * Hooks organisés par domaine:
 * - products/  : CRUD produits, SEO, variations, batch, table filters
 * - stores/    : Gestion boutiques, health, KPIs, watermark
 * - sync/      : Sync queue V2, jobs, progress, cancel
 * - dashboard/ : KPIs dashboard
 * - blog/      : Articles, FloWriter
 * - auth/      : Authentification
 * - analytics/ : Stats SEO
 */

// Utility hooks (generiques, reutilisables partout)
export { useCounterAnimation } from './useCounterAnimation';
export { useMinLoadTime } from './useMinLoadTime';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';

// Auth hooks
export { useRequireAuth } from './auth/useRequireAuth';

// Domain module exports
export * from './products';
export * from './stores';
export * from './sync';
export * from './dashboard';
