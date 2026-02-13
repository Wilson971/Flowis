'use client';

/**
 * Blog Page
 *
 * Main blog management interface with article listing,
 * filtering, bulk actions, and navigation to AI writer
 *
 * Design matches the Products list page layout
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileText, Trash2, Eye, EyeOff, X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BlogPageHeader,
  BlogStatsCards,
  BlogToolbar,
  BlogFilter,
  BlogTable,
  BlogPagination,
} from '@/components/blog';
import { useSelectedStore } from '@/contexts/StoreContext';
import {
  useBlogArticles,
  useBlogStats,
  useCreateBlogArticle,
  useDeleteBlogArticle,
  useDuplicateBlogArticle,
  useBulkDeleteBlogArticles,
  useBulkUpdateStatus,
} from '@/hooks/blog';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { BlogFilters as BlogFiltersType, BlogArticle, ArticleStatus } from '@/types/blog';

// ============================================================================
// SELECTION BAR
// ============================================================================

interface SelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

function SelectionBar({
  selectedCount,
  onClear,
  onPublish,
  onUnpublish,
  onDelete,
  isLoading,
}: SelectionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-4 px-6 py-3 rounded-xl',
        'bg-card/90 backdrop-blur-2xl border border-border/40 shadow-2xl relative overflow-hidden group'
      )}
    >
      {/* Enhanced glassmorphism for selection bar */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none opacity-50" />

      <div className="relative z-10 flex items-center gap-4 w-full">
        <span className="text-sm font-medium">
        {selectedCount} article{selectedCount > 1 ? 's' : ''} sélectionné
        {selectedCount > 1 ? 's' : ''}
      </span>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPublish}
          disabled={isLoading}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Publier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnpublish}
          disabled={isLoading}
          className="gap-2"
        >
          <EyeOff className="h-4 w-4" />
          Dépublier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
          <X className="h-4 w-4" />
          Annuler
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ onCreateNew, onCreateWithAI }: { onCreateNew: () => void; onCreateWithAI: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border border-border">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
            >
              <FileText className="h-10 w-10 text-primary" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-xl font-bold mb-2 text-foreground"
            >
              Aucun article trouvé
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-muted-foreground mb-6 text-sm"
            >
              Commencez par créer votre premier article de blog. Vous pouvez le rédiger
              manuellement ou utiliser l'assistant IA pour générer du contenu optimisé.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <Button variant="outline" onClick={onCreateNew}>
                Créer manuellement
              </Button>
              <Button onClick={onCreateWithAI} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Créer avec l'IA
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BlogPage() {
  const router = useRouter();
  const { selectedStore } = useSelectedStore();
  const storeId = selectedStore?.id;

  // Filters state
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Search state with debounce
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, 300);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BlogArticle | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Build filters object
  const filters: BlogFiltersType = useMemo(() => ({
    status: statusFilter,
    category: categoryFilter,
    search: debouncedSearch,
    sortBy: 'updated_at',
    sortOrder: 'desc',
  }), [statusFilter, categoryFilter, debouncedSearch]);

  // Data fetching
  const { data, isLoading } = useBlogArticles({
    storeId,
    filters,
    page,
    pageSize,
  });

  const { data: stats, isLoading: isLoadingStats } = useBlogStats(storeId);

  // Mutations
  const createArticle = useCreateBlogArticle();
  const deleteArticle = useDeleteBlogArticle();
  const duplicateArticle = useDuplicateBlogArticle();
  const bulkDelete = useBulkDeleteBlogArticles();
  const bulkUpdateStatus = useBulkUpdateStatus();

  // Derived data
  const articles = data?.articles || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasArticles = articles.length > 0;
  const hasSelection = selectedIds.length > 0;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter]);

  // Handlers
  const handleCreateNew = useCallback(() => {
    router.push('/app/blog/flowriter');
  }, [router]);

  const handleCreateWithAI = useCallback(() => {
    router.push('/app/blog/flowriter');
  }, [router]);

  const handleResetFilters = useCallback(() => {
    setStatusFilter('all');
    setCategoryFilter(undefined);
    setLocalSearch('');
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAll = useCallback((selected: boolean) => {
    setSelectedIds(selected ? articles.map((a) => a.id) : []);
  }, [articles]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleDuplicate = useCallback(
    async (article: BlogArticle) => {
      const result = await duplicateArticle.mutateAsync(article.id);
      router.push(`/app/blog/${result.id}`);
    },
    [duplicateArticle, router]
  );

  const handleDelete = useCallback((article: BlogArticle) => {
    setDeleteTarget(article);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteArticle.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteArticle]);

  const handlePublish = useCallback(
    async (article: BlogArticle) => {
      await bulkUpdateStatus.mutateAsync({
        ids: [article.id],
        status: 'published',
      });
    },
    [bulkUpdateStatus]
  );

  const handleUnpublish = useCallback(
    async (article: BlogArticle) => {
      await bulkUpdateStatus.mutateAsync({
        ids: [article.id],
        status: 'draft',
      });
    },
    [bulkUpdateStatus]
  );

  // Bulk actions
  const handleBulkPublish = useCallback(async () => {
    await bulkUpdateStatus.mutateAsync({
      ids: selectedIds,
      status: 'published',
    });
    handleClearSelection();
  }, [selectedIds, bulkUpdateStatus, handleClearSelection]);

  const handleBulkUnpublish = useCallback(async () => {
    await bulkUpdateStatus.mutateAsync({
      ids: selectedIds,
      status: 'draft',
    });
    handleClearSelection();
  }, [selectedIds, bulkUpdateStatus, handleClearSelection]);

  const handleBulkDelete = useCallback(async () => {
    await bulkDelete.mutateAsync(selectedIds);
    handleClearSelection();
    setShowBulkDeleteConfirm(false);
  }, [selectedIds, bulkDelete, handleClearSelection]);

  // No store selected
  if (!selectedStore) {
    return (
      <div className="space-y-6">
        <BlogPageHeader
          title="Blog AI"
          description="Sélectionnez une boutique pour gérer vos articles"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'Blog AI' },
          ]}
        />
        <Card className="border border-border">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Aucune boutique sélectionnée</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Sélectionnez une boutique pour gérer vos articles de blog
              </p>
              <Button className="font-medium">Configurer une boutique</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header with Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BlogPageHeader
          title="Blog AI"
          description={`Gérez les articles de ${selectedStore.name}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'Blog AI' },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNew}
                className="gap-2"
                disabled={createArticle.isPending}
              >
                <Plus className="h-4 w-4" />
                Nouvel article
              </Button>
              <Button
                size="sm"
                onClick={handleCreateWithAI}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Sparkles className="h-4 w-4" />
                Créer avec l'IA
              </Button>
            </>
          }
        />
      </motion.div>

      {/* Modern Stats Cards with Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <BlogStatsCards
          totalArticles={stats?.total || 0}
          publishedCount={stats?.published || 0}
          draftCount={stats?.draft || 0}
          aiGeneratedCount={stats?.aiGenerated || 0}
          isLoading={isLoadingStats}
        />
      </motion.div>

      {/* Modern Toolbar with Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border border-border/50 bg-card/95 backdrop-blur-lg relative overflow-hidden group hover:border-border transition-all duration-500">
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
          {/* Gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/[0.02] via-transparent to-blue-500/[0.02] pointer-events-none" />

          <CardContent className="p-5 relative z-10">
            <BlogToolbar
              searchValue={localSearch}
              onSearchChange={setLocalSearch}
              filterComponent={
                <BlogFilter
                  statusFilter={statusFilter}
                  categoryFilter={categoryFilter}
                  onStatusChange={(val) => setStatusFilter((val as ArticleStatus) || 'all')}
                  onCategoryChange={(val) => setCategoryFilter(val || undefined)}
                  onReset={handleResetFilters}
                />
              }
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Articles Table or Empty State */}
      {!hasArticles ? (
        <EmptyState
          onCreateNew={handleCreateNew}
          onCreateWithAI={handleCreateWithAI}
        />
      ) : (
        <div className="space-y-4">
          <BlogTable
            articles={articles}
            selectedArticles={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
          />

          {/* Pagination with Animation */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border border-border/50 bg-card/95 backdrop-blur-sm relative overflow-hidden group hover:border-border transition-all duration-300">
                {/* Subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.01] via-transparent to-emerald-500/[0.01] pointer-events-none" />

                <CardContent className="p-0 relative z-10">
                  <BlogPagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Selection Bar */}
      <AnimatePresence>
        {hasSelection && (
          <SelectionBar
            selectedCount={selectedIds.length}
            onClear={handleClearSelection}
            onPublish={handleBulkPublish}
            onUnpublish={handleBulkUnpublish}
            onDelete={() => setShowBulkDeleteConfirm(true)}
            isLoading={bulkUpdateStatus.isPending || bulkDelete.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'article ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'article "{deleteTarget?.title}" sera archivé. Cette action peut être
              annulée par un administrateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedIds.length} articles ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les articles sélectionnés seront archivés. Cette action peut être
              annulée par un administrateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
