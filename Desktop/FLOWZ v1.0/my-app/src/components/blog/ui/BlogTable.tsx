"use client";

/**
 * Blog Table Component
 *
 * Modern table for blog articles using DataTable (matches Products page design)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Edit,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import type { BlogArticle, ArticleStatus } from "@/types/blog";

// Status configuration
const statusConfig: Record<
  ArticleStatus,
  { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  published: { label: 'Publié', variant: 'success' },
  publish: { label: 'Publié', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'warning' },
  auto_draft: { label: 'Auto-save', variant: 'neutral' },
  scheduled: { label: 'Planifié', variant: 'info' },
  future: { label: 'Planifié', variant: 'info' },
  ai_generated: { label: 'Généré IA', variant: 'info' },
  pending: { label: 'En attente', variant: 'neutral' },
  private: { label: 'Privé', variant: 'neutral' },
  archived: { label: 'Archivé', variant: 'neutral' },
};

// Article Row Actions Component
interface ArticleRowActionsProps {
  article: BlogArticle;
  onDuplicate?: (article: BlogArticle) => void;
  onDelete?: (article: BlogArticle) => void;
  onPublish?: (article: BlogArticle) => void;
  onUnpublish?: (article: BlogArticle) => void;
}

const ArticleRowActions = ({
  article,
  onDuplicate,
  onDelete,
  onPublish,
  onUnpublish,
}: ArticleRowActionsProps) => {
  const router = useRouter();
  const isPublished = article.status === 'published' || article.status === 'publish';

  const handleEdit = () => {
    router.push(`/app/blog/editor/${article.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-medium">Éditer l'article</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-none shadow-xl bg-popover/95 backdrop-blur-sm">
          <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleEdit}
            className="text-xs font-medium"
          >
            <Edit className="mr-2 h-3.5 w-3.5" />
            Éditer
          </DropdownMenuItem>
          {onDuplicate && (
            <DropdownMenuItem
              onClick={() => onDuplicate(article)}
              className="text-xs font-medium"
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              Dupliquer
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isPublished ? (
            onUnpublish && (
              <DropdownMenuItem
                onClick={() => onUnpublish(article)}
                className="text-xs font-medium"
              >
                <EyeOff className="mr-2 h-3.5 w-3.5" />
                Dépublier
              </DropdownMenuItem>
            )
          ) : (
            onPublish && (
              <DropdownMenuItem
                onClick={() => onPublish(article)}
                className="text-xs font-medium"
              >
                <Eye className="mr-2 h-3.5 w-3.5" />
                Publier
              </DropdownMenuItem>
            )
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(article)}
                className="text-destructive text-xs font-medium"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Supprimer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

// SEO Score Cell
const SeoScoreCell = ({ score }: { score?: number }) => {
  if (score === undefined || score === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const color =
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('text-sm font-semibold', color)}>
            {score}%
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Score SEO: {score >= 80 ? 'Excellent' : score >= 50 ? 'Moyen' : 'À améliorer'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface BlogTableProps {
  articles: BlogArticle[];
  selectedArticles: string[];
  onToggleSelect: (articleId: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  onDuplicate?: (article: BlogArticle) => void;
  onDelete?: (article: BlogArticle) => void;
  onPublish?: (article: BlogArticle) => void;
  onUnpublish?: (article: BlogArticle) => void;
  onTableReady?: (table: any) => void;
}

export const BlogTable = ({
  articles,
  selectedArticles,
  onToggleSelect,
  onToggleSelectAll,
  onDuplicate,
  onDelete,
  onPublish,
  onUnpublish,
  onTableReady,
}: BlogTableProps) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const columns: ColumnDef<BlogArticle>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={selectedArticles.length === articles.length && articles.length > 0}
          onCheckedChange={(value) => onToggleSelectAll(!!value)}
          aria-label="Sélectionner tout"
          className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => {
        const isSelected = selectedArticles.includes(row.original.id);
        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(row.original.id)}
            aria-label={`Sélectionner ${row.original.title}`}
            className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "featured_image_url",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Image</span>,
      cell: ({ row }) => {
        const article = row.original;
        const imageUrl = article.featured_image_url || article.cover_image_url;

        if (!imageUrl) {
          return (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-12 w-16 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} className="cursor-pointer">
                  <div className="h-12 w-16 relative rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={imageUrl}
                      alt={article.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right" className="p-2 max-w-none">
                <img
                  src={imageUrl}
                  alt={article.title}
                  className="w-64 h-40 object-cover rounded-lg"
                />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Titre / Extrait</span>,
      cell: ({ row }) => {
        const article = row.original;
        return (
          <div className="flex flex-col min-w-0 max-w-[300px] gap-0.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/app/blog/editor/${article.id}`)}
                className="text-sm font-semibold leading-snug text-left hover:text-primary transition-colors line-clamp-2 text-foreground"
              >
                {article.title}
              </button>
              {article.ai_generated && (
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              )}
            </div>
            {article.excerpt && (
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              {article.category && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {article.category}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Statut</span>,
      cell: ({ row }) => {
        const article = row.original;
        const config = statusConfig[article.status] || statusConfig.draft;

        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                config.variant === "success" && "bg-success",
                config.variant === "warning" && "bg-warning",
                config.variant === "info" && "bg-info",
                config.variant === "neutral" && "bg-muted-foreground/30"
              )}
            />
            <span className="text-sm text-muted-foreground font-medium">
              {config.label}
            </span>
          </div>
        );
      },
    },
    {
      id: "seo",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">SEO</span>,
      cell: ({ row }) => <SeoScoreCell score={row.original.seo_score} />,
      enableSorting: false,
    },
    {
      accessorKey: "updated_at",
      header: () => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Modifié</span>
        </div>
      ),
      cell: ({ row }) => {
        const article = row.original;
        const date = new Date(article.updated_at);
        const formattedDate = date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        return (
          <span className="text-xs text-muted-foreground font-medium">
            {formattedDate}
          </span>
        );
      },
    },
    {
      id: "readTime",
      header: () => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Lecture</span>
        </div>
      ),
      cell: ({ row }) => {
        const article = row.original;
        const wordCount = article.content?.split(/\s+/).length || 0;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        return (
          <span className="text-xs text-muted-foreground font-medium">
            {readTime} min
          </span>
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <div className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest text-right px-2">Actions</div>,
      cell: ({ row }) => (
        <ArticleRowActions
          article={row.original}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
        />
      ),
      enableSorting: false,
    },
  ];

  if (!isClient) {
    return (
      <Card className="border border-border">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Chargement du tableau...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border border-border">
        <DataTable
          columns={columns}
          data={articles}
          enableColumnVisibility={false}
          enablePagination={false}
          onTableReady={onTableReady}
        />
      </Card>
    </motion.div>
  );
};
