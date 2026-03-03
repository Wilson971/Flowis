'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Clock,
  Save,
  Sparkles,
  RotateCcw,
  Undo2,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import {
  useProductVersionManager,
  type ProductVersion,
  type ProductVersionTrigger,
} from '@/hooks/products/useProductVersions';
import { ProductVersionHistoryDialog } from '../ProductVersionHistoryDialog';

// ============================================================================
// TYPES
// ============================================================================

interface VersionHistoryCardV2Props {
  productId: string;
  className?: string;
  onVersionRestored?: (formData: ProductVersion['form_data']) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getTriggerInfo(trigger: ProductVersionTrigger): {
  icon: typeof Clock;
  label: string;
} {
  switch (trigger) {
    case 'auto_save':
      return { icon: Clock, label: 'Auto-save' };
    case 'manual_save':
      return { icon: Save, label: 'Sauvegarde' };
    case 'ai_approval':
      return { icon: Sparkles, label: 'IA approuvée' };
    case 'restore':
      return { icon: RotateCcw, label: 'Restauration' };
    default:
      return { icon: History, label: 'Version' };
  }
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VersionHistoryCardV2({
  productId,
  className,
  onVersionRestored,
}: VersionHistoryCardV2Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const {
    versions,
    isLoading,
    versionCount,
    restoreVersion,
    refetch,
  } = useProductVersionManager({ productId, enabled: !!productId });

  const recentVersions = versions.slice(0, 5);

  const handleRestore = async (version: ProductVersion) => {
    setRestoringVersionId(version.id);
    try {
      await restoreVersion({ versionId: version.id, productId });
      onVersionRestored?.(version.form_data);
    } finally {
      setRestoringVersionId(null);
    }
  };

  if (!productId) return null;

  return (
    <>
      <motion.div
        {...motionTokens.variants.fadeIn}
        transition={motionTokens.transitions.default}
        className={className}
      >
        <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center shrink-0">
                    <History className="h-5 w-5 text-foreground/70" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                      Historique
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {versionCount} version{versionCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                </Button>
              </div>
            </div>

            <div className="border-t border-border/30" />

            {/* Content */}
            <div className="p-6 pt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentVersions.length === 0 ? (
                <div className="text-center py-6">
                  <History className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-[13px] text-muted-foreground/60">
                    Aucune version enregistrée
                  </p>
                  <p className="text-xs text-muted-foreground/40 mt-1">
                    Les versions seront créées lors des sauvegardes
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentVersions.map((version, index) => {
                    const triggerInfo = getTriggerInfo(version.trigger_type);
                    const TriggerIcon = triggerInfo.icon;
                    const isLatest = index === 0;

                    return (
                      <div
                        key={version.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40 group/item',
                          isLatest && 'bg-primary/5'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg ring-1 shrink-0',
                            isLatest
                              ? 'bg-primary/10 ring-primary/20'
                              : 'bg-muted/60 ring-border/40'
                          )}>
                            <TriggerIcon className={cn(
                              'h-4 w-4',
                              isLatest ? 'text-primary' : 'text-foreground/70'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold tracking-tight text-foreground">
                                v{version.version_number}
                              </span>
                              {isLatest && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 h-4 bg-primary/10 text-primary border-primary/20 font-medium"
                                >
                                  Actuelle
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground/60">
                              {triggerInfo.label} &bull; {formatRelativeTime(version.created_at)}
                            </p>
                          </div>
                        </div>

                        {!isLatest && (
                          <button
                            type="button"
                            onClick={() => handleRestore(version)}
                            disabled={restoringVersionId === version.id}
                            className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-opacity"
                            aria-label="Restaurer cette version"
                          >
                            {restoringVersionId === version.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Undo2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View All Button */}
              {versionCount > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(true)}
                  className="w-full mt-3 h-8 text-xs font-semibold tracking-tight justify-between text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted transition-colors"
                >
                  <span>Voir tout l&apos;historique</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full History Dialog */}
      <ProductVersionHistoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        onVersionRestored={onVersionRestored}
      />
    </>
  );
}
