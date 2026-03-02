'use client';

import { useState } from 'react';
import {
  History,
  Clock,
  Save,
  Sparkles,
  RotateCcw,
  Undo2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
      return { icon: Sparkles, label: 'IA approuvee' };
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

  if (diffMins < 1) return "A l'instant";
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
    isRestoring,
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
      <Card className={cn('rounded-xl border-border/40 bg-card relative overflow-hidden', className)}>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-background/20 pointer-events-none" />

        <CardHeader className="pb-3 px-4 pt-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                <Clock className="h-4.5 w-4.5 text-foreground/70" />
              </div>
              <div>
                <h4 className="text-[15px] font-semibold tracking-tight text-foreground">
                  Historique
                </h4>
                <p className="text-[11px] text-muted-foreground/60">
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
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0 relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentVersions.length === 0 ? (
            <div className="text-center py-6">
              <History className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-[13px] text-muted-foreground/60">
                Aucune version enregistree
              </p>
              <p className="text-[11px] text-muted-foreground/40 mt-1">
                Les versions seront creees lors des sauvegardes
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
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/40 shrink-0">
                        <TriggerIcon className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">
                          {triggerInfo.label}
                          {isLatest && (
                            <span className="ml-1.5 text-[10px] text-primary font-normal">
                              (actuelle)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">
                          v{version.version_number} &bull; {formatRelativeTime(version.created_at)}
                        </p>
                      </div>
                    </div>
                    {!isLatest && (
                      <button
                        type="button"
                        onClick={() => handleRestore(version)}
                        disabled={restoringVersionId === version.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-opacity"
                        aria-label="Restaurer"
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
              className="w-full mt-2 h-7 text-[11px] text-muted-foreground/60 hover:text-foreground"
            >
              Voir tout l&apos;historique
            </Button>
          )}
        </CardContent>
      </Card>

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
