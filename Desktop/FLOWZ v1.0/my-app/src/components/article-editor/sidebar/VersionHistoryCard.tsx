'use client';

/**
 * VersionHistoryCard Component
 *
 * Sidebar card showing recent article versions:
 * - Latest 5 versions with trigger type icons
 * - Quick restore button
 * - Link to full history dialog
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Clock,
  Save,
  Rocket,
  RotateCcw,
  ChevronRight,
  Loader2,
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
import { useVersionManager, type ArticleVersion, type VersionTrigger } from '@/hooks/blog/useArticleVersions';
import { VersionHistoryDialog } from '../dialogs/VersionHistoryDialog';

// ============================================================================
// TYPES
// ============================================================================

interface VersionHistoryCardProps {
  articleId: string;
  currentContent?: string;
  currentTitle?: string;
  className?: string;
  onVersionRestored?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getTriggerInfo(trigger: VersionTrigger): {
  icon: React.ReactNode;
  label: string;
  color: string;
} {
  switch (trigger) {
    case 'auto_save':
      return {
        icon: <Clock className="w-3 h-3" />,
        label: 'Auto-save',
        color: 'text-muted-foreground',
      };
    case 'manual_save':
      return {
        icon: <Save className="w-3 h-3" />,
        label: 'Sauvegarde',
        color: 'text-blue-500',
      };
    case 'publish':
      return {
        icon: <Rocket className="w-3 h-3" />,
        label: 'Publication',
        color: 'text-emerald-500',
      };
    case 'restore':
      return {
        icon: <RotateCcw className="w-3 h-3" />,
        label: 'Restauration',
        color: 'text-amber-500',
      };
    default:
      return {
        icon: <History className="w-3 h-3" />,
        label: 'Version',
        color: 'text-muted-foreground',
      };
  }
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================================================
// VERSION ITEM
// ============================================================================

interface VersionItemProps {
  version: ArticleVersion;
  isLatest?: boolean;
  onRestore?: () => void;
  isRestoring?: boolean;
}

function VersionItem({ version, isLatest, onRestore, isRestoring }: VersionItemProps) {
  const triggerInfo = getTriggerInfo(version.trigger_type);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-2 rounded-lg transition-colors',
        'hover:bg-muted/50',
        isLatest && 'bg-primary/5 border border-primary/10'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
          isLatest ? 'bg-primary/10' : 'bg-muted'
        )}
      >
        <span className={triggerInfo.color}>{triggerInfo.icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground truncate">
            v{version.version_number}
          </span>
          {isLatest && (
            <Badge
              variant="outline"
              className="text-[9px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20"
            >
              Actuelle
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {triggerInfo.label} • {formatRelativeTime(version.created_at)}
        </p>
      </div>

      {/* Restore Button (hidden for latest) */}
      {!isLatest && onRestore && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRestore}
                disabled={isRestoring}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isRestoring ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Restaurer cette version</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VersionHistoryCard({
  articleId,
  currentContent,
  currentTitle,
  className,
  onVersionRestored,
}: VersionHistoryCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const {
    versions,
    isLoading,
    versionCount,
    restoreVersion,
    isRestoring,
    refetch,
  } = useVersionManager({ articleId, enabled: !!articleId });

  // Show only last 5 versions in card
  const recentVersions = versions.slice(0, 5);

  const handleRestore = async (version: ArticleVersion) => {
    setRestoringVersionId(version.id);
    try {
      await restoreVersion({ versionId: version.id, articleId });
      onVersionRestored?.();
    } finally {
      setRestoringVersionId(null);
    }
  };

  if (!articleId) return null;

  return (
    <>
      <Card className={cn('border-border/50', className)}>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Historique</h4>
                <p className="text-[10px] text-muted-foreground">
                  {versionCount} version{versionCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-7 w-7"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentVersions.length === 0 ? (
            <div className="text-center py-6">
              <History className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                Aucune version enregistree
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              {recentVersions.map((version, index) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isLatest={index === 0}
                  onRestore={() => handleRestore(version)}
                  isRestoring={restoringVersionId === version.id}
                />
              ))}
            </motion.div>
          )}

          {/* View All Button */}
          {versionCount > 5 && (
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(true)}
              className="w-full mt-3 h-8 text-xs font-semibold justify-between hover:bg-muted/50"
            >
              <span>Voir tout l'historique</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Full History Dialog */}
      <VersionHistoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        articleId={articleId}
        currentContent={currentContent}
        currentTitle={currentTitle}
        onVersionRestored={onVersionRestored}
      />
    </>
  );
}

export default VersionHistoryCard;
