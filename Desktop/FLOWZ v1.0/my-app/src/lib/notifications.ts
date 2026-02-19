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

  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: targetUserId,
      title,
      message,
      type,
      link,
    });

    if (error) {
      // Silently fail if notifications table doesn't exist yet
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return { success: false, error: 'Notifications table not configured' };
      }
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    // Silently fail — notifications are non-critical
    return { success: false, error: 'Notification service unavailable' };
  }
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

