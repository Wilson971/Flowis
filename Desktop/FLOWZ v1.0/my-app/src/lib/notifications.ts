/**
 * Notifications Utility
 *
 * Helper functions to create notifications for various system events
 */

import { createClient } from '@/lib/supabase/client';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationParams {
  title: string;
  message?: string;
  type?: NotificationType;
  link?: string;
  userId?: string; // If not provided, will use current user
}

/**
 * Create a notification for the current user
 */
export async function createNotification({
  title,
  message,
  type = 'info',
  link,
  userId,
}: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Get current user if userId not provided
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    targetUserId = user.id;
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: targetUserId,
    title,
    message,
    type,
    link,
  });

  if (error) {
    console.error('Failed to create notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create an approval notification
 */
export async function createApprovalNotification({
  productId,
  productName,
  action,
  field,
}: {
  productId: string;
  productName: string;
  action: 'accept' | 'reject';
  field?: string;
}): Promise<void> {
  const isAccept = action === 'accept';
  const fieldLabel = field ? ` (${field})` : '';

  await createNotification({
    title: isAccept ? 'Contenu approuvé' : 'Contenu rejeté',
    message: `${productName}${fieldLabel} a été ${isAccept ? 'approuvé' : 'rejeté'}.`,
    type: isAccept ? 'success' : 'warning',
    link: `/app/products/${productId}/edit`,
  });
}

/**
 * Create a sync notification
 */
export async function createSyncNotification({
  storeId,
  storeName,
  status,
  productsCount,
}: {
  storeId: string;
  storeName: string;
  status: 'started' | 'completed' | 'failed';
  productsCount?: number;
}): Promise<void> {
  const titles: Record<string, string> = {
    started: 'Synchronisation démarrée',
    completed: 'Synchronisation terminée',
    failed: 'Synchronisation échouée',
  };

  const messages: Record<string, string> = {
    started: `La synchronisation de ${storeName} a démarré.`,
    completed: `${productsCount || 0} produits synchronisés pour ${storeName}.`,
    failed: `La synchronisation de ${storeName} a échoué.`,
  };

  const types: Record<string, NotificationType> = {
    started: 'info',
    completed: 'success',
    failed: 'error',
  };

  await createNotification({
    title: titles[status],
    message: messages[status],
    type: types[status],
    link: `/app/stores`,
  });
}

/**
 * Create a batch generation notification
 */
export async function createBatchNotification({
  batchId,
  status,
  totalProducts,
  completedProducts,
}: {
  batchId: string;
  status: 'started' | 'completed' | 'failed' | 'partial';
  totalProducts: number;
  completedProducts?: number;
}): Promise<void> {
  const titles: Record<string, string> = {
    started: 'Génération batch démarrée',
    completed: 'Génération batch terminée',
    failed: 'Génération batch échouée',
    partial: 'Génération batch partielle',
  };

  const messages: Record<string, string> = {
    started: `Génération de contenu pour ${totalProducts} produits en cours.`,
    completed: `Contenu généré pour ${completedProducts || totalProducts} produits.`,
    failed: `La génération batch a échoué. Veuillez réessayer.`,
    partial: `${completedProducts}/${totalProducts} produits générés avec succès.`,
  };

  const types: Record<string, NotificationType> = {
    started: 'info',
    completed: 'success',
    failed: 'error',
    partial: 'warning',
  };

  await createNotification({
    title: titles[status],
    message: messages[status],
    type: types[status],
    link: `/app/products`,
  });
}

/**
 * Create a FloWriter article notification
 */
export async function createArticleNotification({
  articleId,
  articleTitle,
  status,
}: {
  articleId: string;
  articleTitle: string;
  status: 'draft' | 'published' | 'scheduled';
}): Promise<void> {
  const titles: Record<string, string> = {
    draft: 'Brouillon sauvegardé',
    published: 'Article publié',
    scheduled: 'Article programmé',
  };

  const messages: Record<string, string> = {
    draft: `"${articleTitle}" a été sauvegardé comme brouillon.`,
    published: `"${articleTitle}" a été publié avec succès.`,
    scheduled: `"${articleTitle}" a été programmé pour publication.`,
  };

  const types: Record<string, NotificationType> = {
    draft: 'info',
    published: 'success',
    scheduled: 'info',
  };

  await createNotification({
    title: titles[status],
    message: messages[status],
    type: types[status],
    link: `/app/blog/${articleId}`,
  });
}
