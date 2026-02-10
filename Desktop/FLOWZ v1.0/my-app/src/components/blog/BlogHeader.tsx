'use client';

/**
 * BlogHeader Component
 *
 * Header section for the blog management page
 * Includes title, description, stats cards, and action buttons
 */

import { motion } from 'framer-motion';
import { Plus, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { styles, motionTokens } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import type { BlogStats } from '@/types/blog';

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
  delay?: number;
}

const colorStyles = {
  primary: 'from-primary/20 to-primary/5 border-primary/20',
  success: 'from-success/20 to-success/5 border-success/20',
  warning: 'from-warning/20 to-warning/5 border-warning/20',
  info: 'from-info/20 to-info/5 border-info/20',
};

const iconColorStyles = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
};

function StatCard({ label, value, icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4',
        'bg-gradient-to-br',
        colorStyles[color]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(styles.text.labelSmall, 'mb-1')}>{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg bg-background/50', iconColorStyles[color])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BLOG HEADER
// ============================================================================

interface BlogHeaderProps {
  stats?: BlogStats;
  isLoadingStats?: boolean;
  onCreateNew?: () => void;
  onCreateWithAI?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function BlogHeader({
  stats,
  isLoadingStats,
  onCreateNew,
  onCreateWithAI,
  onSync,
  isSyncing,
}: BlogHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Title Row */}
      <div className={cn(styles.layout.flexBetween, 'flex-wrap gap-4')}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className={cn(styles.text.h1, 'mb-1')}>Blog AI</h1>
          <p className={styles.text.bodyMuted}>
            Créez et gérez vos articles de blog avec l'aide de l'IA
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {onSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNew}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvel article
          </Button>

          <Button
            size="sm"
            onClick={onCreateWithAI}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Sparkles className="h-4 w-4" />
            Créer avec l'IA
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className={styles.layout.gridCols4}>
        <StatCard
          label="Total articles"
          value={stats?.total ?? 0}
          icon={<FileText className="h-5 w-5" />}
          color="primary"
          delay={0.1}
        />
        <StatCard
          label="Publiés"
          value={stats?.published ?? 0}
          icon={<FileText className="h-5 w-5" />}
          color="success"
          delay={0.15}
        />
        <StatCard
          label="Brouillons"
          value={stats?.draft ?? 0}
          icon={<FileText className="h-5 w-5" />}
          color="warning"
          delay={0.2}
        />
        <StatCard
          label="Générés par IA"
          value={stats?.aiGenerated ?? 0}
          icon={<Sparkles className="h-5 w-5" />}
          color="info"
          delay={0.25}
        />
      </div>
    </div>
  );
}
