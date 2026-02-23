'use client';

/**
 * VersionHistoryDialog Component
 *
 * Full version history dialog with:
 * - List of all versions
 * - Version preview
 * - Restore capability
 * - Filter by trigger type
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Clock,
  Save,
  Rocket,
  RotateCcw,
  X,
  Search,
  Filter,
  Eye,
  Loader2,
  FileText,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useVersionManager,
  useArticleVersion,
  type ArticleVersion,
  type VersionTrigger,
} from '@/hooks/blog/useArticleVersions';

// ============================================================================
// TYPES
// ============================================================================

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  currentContent?: string;
  currentTitle?: string;
  onVersionRestored?: () => void;
}

type FilterType = 'all' | VersionTrigger;

// ============================================================================
// HELPERS
// ============================================================================

function getTriggerInfo(trigger: VersionTrigger): {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
} {
  switch (trigger) {
    case 'auto_save':
      return {
        icon: <Clock className="w-4 h-4" />,
        label: 'Auto-save',
        color: 'text-slate-500',
        bgColor: 'bg-slate-100',
      };
    case 'manual_save':
      return {
        icon: <Save className="w-4 h-4" />,
        label: 'Sauvegarde manuelle',
        color: 'text-primary',
        bgColor: 'bg-blue-100',
      };
    case 'publish':
      return {
        icon: <Rocket className="w-4 h-4" />,
        label: 'Publication',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100',
      };
    case 'restore':
      return {
        icon: <RotateCcw className="w-4 h-4" />,
        label: 'Restauration',
        color: 'text-amber-500',
        bgColor: 'bg-amber-100',
      };
    default:
      return {
        icon: <History className="w-4 h-4" />,
        label: 'Version',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
      };
  }
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWordCount(content: string): number {
  return content
    .replace(/[#*`>\[\]]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// ============================================================================
// VERSION LIST ITEM
// ============================================================================

interface VersionListItemProps {
  version: ArticleVersion;
  isLatest: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function VersionListItem({ version, isLatest, isSelected, onClick }: VersionListItemProps) {
  const triggerInfo = getTriggerInfo(version.trigger_type);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left',
        isSelected
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-background border-border/50 hover:bg-muted/50 hover:border-border',
        isLatest && !isSelected && 'border-emerald-200 bg-emerald-50/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          triggerInfo.bgColor
        )}
      >
        <span className={triggerInfo.color}>{triggerInfo.icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-foreground">Version {version.version_number}</span>
          {isLatest && (
            <Badge variant="outline" className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200">
              Actuelle
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mb-1">{version.title}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{triggerInfo.label}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>{formatDateTime(version.created_at)}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          <span>{getWordCount(version.content)} mots</span>
        </div>
      </div>

      <ChevronRight
        className={cn(
          'w-4 h-4 mt-3 shrink-0 transition-transform',
          isSelected ? 'text-primary rotate-90' : 'text-muted-foreground'
        )}
      />
    </button>
  );
}

// ============================================================================
// VERSION PREVIEW
// ============================================================================

interface VersionPreviewProps {
  versionId: string;
  articleId: string;
  isLatest: boolean;
  onRestore: () => void;
  onClose: () => void;
  isRestoring: boolean;
}

function VersionPreview({
  versionId,
  articleId,
  isLatest,
  onRestore,
  onClose,
  isRestoring,
}: VersionPreviewProps) {
  const { data: version, isLoading } = useArticleVersion(versionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!version) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Version introuvable</p>
      </div>
    );
  }

  const triggerInfo = getTriggerInfo(version.trigger_type);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 lg:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-bold text-lg">Version {version.version_number}</h3>
            {isLatest && (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Actuelle
              </Badge>
            )}
          </div>
          {!isLatest && (
            <Button
              onClick={onRestore}
              disabled={isRestoring}
              className="gap-2"
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Restaurer
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className={triggerInfo.color}>{triggerInfo.icon}</span>
            <span>{triggerInfo.label}</span>
          </div>
          <span>{formatDateTime(version.created_at)}</span>
          <span>{getWordCount(version.content)} mots</span>
        </div>
      </div>

      {/* Content Preview */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Titre
            </p>
            <h4 className="text-lg font-bold">{version.title}</h4>
          </div>

          {/* Excerpt */}
          {version.excerpt && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Extrait
              </p>
              <p className="text-sm text-muted-foreground">{version.excerpt}</p>
            </div>
          )}

          {/* Content */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Contenu
            </p>
            <div className="prose prose-sm max-w-none rounded-lg bg-muted/30 p-4 border border-border/50">
              <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/80">
                {version.content.slice(0, 2000)}
                {version.content.length > 2000 && '...'}
              </pre>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VersionHistoryDialog({
  open,
  onOpenChange,
  articleId,
  currentContent,
  currentTitle,
  onVersionRestored,
}: VersionHistoryDialogProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const { versions, isLoading, restoreVersion, refetch } = useVersionManager({
    articleId,
    enabled: open && !!articleId,
  });

  // Filter versions
  const filteredVersions = useMemo(() => {
    let filtered = versions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((v) => v.trigger_type === filterType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.content.toLowerCase().includes(query) ||
          v.version_number.toString().includes(query)
      );
    }

    return filtered;
  }, [versions, filterType, searchQuery]);

  const handleRestore = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      await restoreVersion({ versionId, articleId });
      onVersionRestored?.();
      onOpenChange(false);
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleClose = () => {
    setSelectedVersionId(null);
    setFilterType('all');
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Historique des versions
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {versions.length} version{versions.length > 1 ? 's' : ''} enregistree{versions.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Version List */}
          <div
            className={cn(
              'w-full lg:w-[380px] border-r border-border flex flex-col',
              selectedVersionId && 'hidden lg:flex'
            )}
          >
            {/* Filters */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="h-9">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Filtrer par type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="auto_save">Auto-saves</SelectItem>
                  <SelectItem value="manual_save">Sauvegardes manuelles</SelectItem>
                  <SelectItem value="publish">Publications</SelectItem>
                  <SelectItem value="restore">Restaurations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredVersions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || filterType !== 'all'
                        ? 'Aucune version correspondante'
                        : 'Aucune version'}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredVersions.map((version, index) => (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <VersionListItem
                          version={version}
                          isLatest={index === 0 && filterType === 'all' && !searchQuery}
                          isSelected={selectedVersionId === version.id}
                          onClick={() => setSelectedVersionId(version.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Preview */}
          <div
            className={cn(
              'flex-1 bg-muted/20',
              !selectedVersionId && 'hidden lg:flex'
            )}
          >
            {selectedVersionId ? (
              <VersionPreview
                versionId={selectedVersionId}
                articleId={articleId}
                isLatest={filteredVersions[0]?.id === selectedVersionId}
                onRestore={() => handleRestore(selectedVersionId)}
                onClose={() => setSelectedVersionId(null)}
                isRestoring={restoringVersionId === selectedVersionId}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Selectionnez une version pour la previsualiser
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VersionHistoryDialog;
