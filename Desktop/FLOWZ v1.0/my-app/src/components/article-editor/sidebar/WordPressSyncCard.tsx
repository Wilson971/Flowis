'use client';

/**
 * WordPressSyncCard Component
 *
 * Sidebar card for WordPress sync:
 * - Shows sync status
 * - Quick push button
 * - Link to WordPress post
 * - Config status indicator
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  Check,
  AlertCircle,
  Loader2,
  Settings,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useWordPressSync,
  type WordPressSyncStatus,
} from '@/hooks/blog/useWordPressSync';
import { WordPressSyncDialog } from '../dialogs/WordPressSyncDialog';

// ============================================================================
// TYPES
// ============================================================================

interface WordPressSyncCardProps {
  articleId: string;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusInfo(status: WordPressSyncStatus | null): {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'synced':
      return {
        icon: <Check className="w-4 h-4" />,
        label: 'Synchronise',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
      };
    case 'pending':
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'En cours...',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
      };
    case 'failed':
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Echec',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      };
    case 'conflict':
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Conflit',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      };
    case 'draft':
      return {
        icon: <Cloud className="w-4 h-4" />,
        label: 'Brouillon WP',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    default:
      return {
        icon: <CloudOff className="w-4 h-4" />,
        label: 'Non sync',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
      };
  }
}

function formatLastSync(date: string | null): string {
  if (!date) return 'Jamais';

  const now = new Date();
  const syncDate = new Date(date);
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  return syncDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WordPressSyncCard({ articleId, className }: WordPressSyncCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    config,
    siteUrl,
    siteName,
    isConfigured,
    isLoadingConfig,
    articleSyncStatus,
    wordpressPostId,
    lastSyncedAt,
    isSynced,
    pushToWordPress,
    isPushing,
  } = useWordPressSync({ articleId });

  const statusInfo = getStatusInfo(articleSyncStatus);

  const handleQuickPush = async () => {
    if (!articleId) return;

    try {
      await pushToWordPress({
        articleId,
        status: config?.default_status || 'draft',
        categoryId: config?.default_category_id || undefined,
      });
    } catch {
      // Error handled by hook
    }
  };

  const wordpressUrl = wordpressPostId && siteUrl
    ? `${siteUrl}/wp-admin/post.php?post=${wordpressPostId}&action=edit`
    : null;

  return (
    <>
      <Card className={cn('border-border/50', className)}>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', statusInfo.bgColor)}>
                <span className={statusInfo.color}>{statusInfo.icon}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">WordPress</h4>
                <p className="text-[10px] text-muted-foreground">
                  {isConfigured ? siteName : siteUrl ? 'Identifiants requis' : 'Non configure'}
                </p>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDialogOpen(true)}
                    className="h-7 w-7"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Configurer WordPress</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-2">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !isConfigured ? (
            <div className="text-center py-4">
              <CloudOff className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground mb-3">
                Connectez votre blog WordPress
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="w-full text-xs"
              >
                <Settings className="w-3.5 h-3.5 mr-2" />
                Configurer
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Status */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] font-bold',
                      statusInfo.bgColor,
                      statusInfo.color,
                      'border-transparent'
                    )}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatLastSync(lastSyncedAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant={isSynced ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleQuickPush}
                  disabled={isPushing}
                  className="flex-1 text-xs"
                >
                  {isPushing ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  )}
                  {isSynced ? 'Resync' : 'Pousser'}
                </Button>

                {wordpressUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(wordpressUrl, '_blank')}
                          className="h-8 w-8"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Voir sur WordPress</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* More Options */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="w-full text-xs text-muted-foreground justify-start"
              >
                Plus d'options...
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* WordPress Sync Dialog */}
      <WordPressSyncDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        articleId={articleId}
      />
    </>
  );
}

export default WordPressSyncCard;
