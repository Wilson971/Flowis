/**
 * Sync Helper Functions
 *
 * Utility functions for product synchronization logic
 */

import type { Product } from '@/types/product';

/**
 * Check if a product should be synchronized to the store
 *
 * A product needs sync if:
 * - It has dirty fields (modified content not yet synced)
 * - It doesn't have pending draft content (drafts must be approved first)
 */
export function shouldSync(product: Product): boolean {
  // Check if there are dirty fields
  const hasDirtyFields =
    product.dirty_fields_content &&
    Array.isArray(product.dirty_fields_content) &&
    product.dirty_fields_content.length > 0;

  // Check if there's pending draft content
  const hasPendingDraft = product.draft_generated_content !== null;

  // Should sync if there are dirty fields AND no pending draft
  return !!hasDirtyFields && !hasPendingDraft;
}

/**
 * Get sync status label
 */
export function getSyncStatusLabel(product: Product): string {
  if (!product.sync_source && !product.last_synced_at) {
    return 'Non synchronisé';
  }

  if (product.sync_source === 'webhook') {
    return 'Webhook';
  }

  if (product.sync_source === 'push') {
    return 'Push manuel';
  }

  if (product.sync_source === 'manual') {
    return 'Manuel';
  }

  return 'Synchronisé';
}

/**
 * Check if product has sync conflicts
 */
export function hasSyncConflicts(product: Product): boolean {
  return (product.sync_conflict_count || 0) > 0;
}

/**
 * Get last sync time in human-readable format
 */
export function getLastSyncTime(product: Product): string {
  if (!product.last_synced_at) return 'Jamais';

  const date = new Date(product.last_synced_at);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays === 1) return 'Hier';
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get dirty fields as human-readable list
 */
export function getDirtyFieldsList(product: Product): string[] {
  if (!product.dirty_fields_content || !Array.isArray(product.dirty_fields_content)) {
    return [];
  }

  const fieldLabels: Record<string, string> = {
    title: 'Titre',
    short_description: 'Description courte',
    description: 'Description',
    seo_title: 'Titre SEO',
    meta_description: 'Meta description',
    price: 'Prix',
    stock: 'Stock',
    sku: 'SKU',
    images: 'Images',
  };

  return product.dirty_fields_content.map(
    (field) => fieldLabels[field] || field
  );
}

/**
 * Check if product can be pushed to store
 */
export function canPushToStore(product: Product): boolean {
  // Can't push if there are pending drafts
  if (product.draft_generated_content !== null) return false;

  // Can't push if there are no changes
  if (!shouldSync(product)) return false;

  return true;
}

/**
 * Get sync source icon name
 */
export function getSyncSourceIcon(source?: string): string {
  const iconMap: Record<string, string> = {
    webhook: 'Webhook',
    push: 'Upload',
    manual: 'Hand',
  };

  return iconMap[source || ''] || 'RefreshCw';
}

/**
 * Calculate sync priority (1-5, 5 being highest)
 */
export function getSyncPriority(product: Product): number {
  let priority = 1;

  // High priority if has dirty fields
  if (shouldSync(product)) priority += 2;

  // Higher priority if has conflicts
  if (hasSyncConflicts(product)) priority += 1;

  // Higher priority if never synced
  if (!product.last_synced_at) priority += 1;

  return Math.min(priority, 5);
}

/**
 * Get sync status variant for Badge component
 */
export function getSyncStatusVariant(
  product: Product
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (hasSyncConflicts(product)) return 'danger';
  if (shouldSync(product)) return 'warning';
  if (product.sync_source) return 'success';
  return 'neutral';
}
