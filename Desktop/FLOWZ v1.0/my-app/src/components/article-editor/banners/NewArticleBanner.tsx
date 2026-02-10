'use client';

/**
 * NewArticleBanner Component
 *
 * Displays a contextual banner when an article was just created.
 * Shows different messages based on the source (FloWriter, template, manual).
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type ArticleSource = 'flowriter' | 'template' | 'manual' | 'import' | 'wordpress';

export interface NewArticleBannerProps {
  /** Source of the article creation */
  source: ArticleSource;
  /** When the article was created */
  createdAt: Date;
  /** Auto-dismiss after this many seconds (0 = never) */
  autoDismissAfter?: number;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getSourceInfo(source: ArticleSource): {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
} {
  switch (source) {
    case 'flowriter':
      return {
        icon: <Sparkles className="w-5 h-5" />,
        title: 'Créé avec FloWriter',
        description: 'Cet article a été généré par l\'assistant IA. Vous pouvez maintenant le peaufiner dans l\'éditeur.',
        color: 'from-violet-500/10 to-purple-500/10 border-violet-500/20',
      };
    case 'template':
      return {
        icon: <FileText className="w-5 h-5" />,
        title: 'Créé depuis un template',
        description: 'Cet article a été créé à partir d\'un modèle. Personnalisez le contenu selon vos besoins.',
        color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
      };
    case 'import':
      return {
        icon: <Download className="w-5 h-5" />,
        title: 'Article importé',
        description: 'Cet article a été importé. Vérifiez le formatage et les métadonnées.',
        color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
      };
    case 'wordpress':
      return {
        icon: <Download className="w-5 h-5" />,
        title: 'Importé depuis WordPress',
        description: 'Cet article a été synchronisé depuis votre blog WordPress.',
        color: 'from-blue-600/10 to-blue-400/10 border-blue-500/20',
      };
    case 'manual':
    default:
      return {
        icon: <Info className="w-5 h-5" />,
        title: 'Nouvel article',
        description: 'Commencez à rédiger votre contenu dans l\'éditeur ci-dessous.',
        color: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
      };
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NewArticleBanner({
  source,
  createdAt,
  autoDismissAfter = 0,
  onDismiss,
  className,
}: NewArticleBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(createdAt));

  // Update time ago every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(createdAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [createdAt]);

  // Auto-dismiss after specified time
  useEffect(() => {
    if (autoDismissAfter > 0) {
      const timeout = setTimeout(() => {
        handleDismiss();
      }, autoDismissAfter * 1000);

      return () => clearTimeout(timeout);
    }
  }, [autoDismissAfter]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const sourceInfo = getSourceInfo(source);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('overflow-hidden', className)}
        >
          <div
            className={cn(
              'relative flex items-start gap-4 p-4 rounded-xl border bg-gradient-to-r',
              sourceInfo.color
            )}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center text-foreground shrink-0">
              {sourceInfo.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">{sourceInfo.title}</h4>
                <span className="text-xs text-muted-foreground">• {timeAgo}</span>
              </div>
              <p className="text-sm text-muted-foreground">{sourceInfo.description}</p>
            </div>

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="shrink-0 h-8 w-8 rounded-full hover:bg-background/80"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default NewArticleBanner;
