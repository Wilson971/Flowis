'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Rocket,
  Loader2,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { AutoSaveStatus } from './AutoSaveStatus';
import { SyncStatusBadge } from '../SyncStatusBadge';
import { itemVariants } from './motion-variants';
import { cn } from '@/lib/utils';

interface EditorHeaderProps {
  isNew: boolean;
  isSaving: boolean;
  isDirty: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  title: string;
  hasWCConnection: boolean;
  wcSyncStatus: 'synced' | 'pending' | 'failed' | 'not_synced';
  articleSync: {
    retrySync?: (platform: string) => void;
  } | null;
  livePreview: {
    isOpen: boolean;
    toggle: () => void;
  };
  onSaveDraft: () => void;
  onPublishNow: () => void;
  onOpenWcPanel: () => void;
}

export function EditorHeader({
  isNew,
  isSaving,
  isDirty,
  autoSaveStatus,
  lastSavedAt,
  title,
  hasWCConnection,
  wcSyncStatus,
  articleSync,
  livePreview,
  onSaveDraft,
  onPublishNow,
  onOpenWcPanel,
}: EditorHeaderProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.push('/app/blog');
  }, [router]);

  return (
    <motion.header
      variants={itemVariants}
      className="sticky top-0 z-10 border-b border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-lg bg-muted/50 hover:bg-muted flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <h1 className="text-xl font-extrabold truncate">
                {isNew ? 'Nouvel article' : title || 'Sans titre'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <AutoSaveStatus status={autoSaveStatus} lastSavedAt={lastSavedAt} />
                {!isNew && hasWCConnection && (
                  <SyncStatusBadge
                    status={wcSyncStatus}
                    onRetry={wcSyncStatus === 'failed' && articleSync
                      ? () => articleSync.retrySync?.('woocommerce')
                      : undefined}
                  />
                )}
                {isDirty && (
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-warning/10 text-warning border-warning/30">
                    Non sauvegardé
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Live Preview Toggle */}
            <Button
              variant={livePreview.isOpen ? 'secondary' : 'outline'}
              onClick={livePreview.toggle}
              className={cn(
                'h-10 px-4 font-bold text-xs uppercase tracking-widest border-border/50',
                livePreview.isOpen
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'hover:bg-muted/50'
              )}
            >
              <Eye className="h-4 w-4 mr-2" />
              Apercu
            </Button>

            {/* WC Publish Button (only when store connected & article saved) */}
            {hasWCConnection && !isNew && (
              <Button
                variant="outline"
                onClick={onOpenWcPanel}
                className="h-10 px-4 font-bold text-xs uppercase tracking-widest border-border/50 hover:bg-muted/50"
              >
                <Store className="h-4 w-4 mr-2" />
                WooCommerce
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSaving || (!isDirty && !isNew)}
              className="h-10 px-6 font-bold text-xs uppercase tracking-widest border-border/50 hover:bg-muted/50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Brouillon
            </Button>

            <Button
              onClick={onPublishNow}
              disabled={isSaving}
              className="h-10 px-8 font-extrabold text-xs uppercase tracking-widest min-w-[140px] shadow-[0_0_20px_-5px_var(--primary)]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
