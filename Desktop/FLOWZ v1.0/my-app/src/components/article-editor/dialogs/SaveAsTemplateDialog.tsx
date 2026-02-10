'use client';

/**
 * SaveAsTemplateDialog Component
 *
 * Dialog to save current article as a reusable template:
 * - Name and description
 * - Category selection
 * - Quick save
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutTemplate,
  Save,
  Loader2,
  FolderOpen,
  Tag,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useSaveArticleAsTemplate,
  useTemplateCategories,
} from '@/hooks/blog/useArticleTemplates';

// ============================================================================
// TYPES
// ============================================================================

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  defaultName?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  articleId,
  defaultName = '',
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Hooks
  const { data: categories } = useTemplateCategories();
  const saveAsTemplate = useSaveArticleAsTemplate();

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      await saveAsTemplate.mutateAsync({
        articleId,
        name: name.trim(),
        description: description.trim() || undefined,
        category: showNewCategory ? newCategory.trim() : category || undefined,
      });
      onOpenChange(false);
      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setNewCategory('');
      setShowNewCategory(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setName(defaultName);
    setDescription('');
    setCategory('');
    setNewCategory('');
    setShowNewCategory(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <DialogTitle>Sauvegarder comme template</DialogTitle>
              <DialogDescription className="text-xs">
                Creez un template reutilisable depuis cet article
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="template-name" className="text-xs font-bold">
              Nom du template <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Article de blog standard"
              className="h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="template-description" className="text-xs font-bold">
              Description
            </Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez l'utilisation de ce template..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              Categorie
            </Label>

            {!showNewCategory ? (
              <div className="flex items-center gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Choisir une categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune categorie</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCategory(true)}
                  className="shrink-0"
                >
                  <Tag className="w-3.5 h-3.5 mr-1" />
                  Nouvelle
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nouvelle categorie..."
                  className="h-9"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategory('');
                  }}
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Le contenu actuel de l'article sera sauvegarde dans le template. Vous pourrez
              ensuite l'appliquer a d'autres articles.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || saveAsTemplate.isPending}
            >
              {saveAsTemplate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default SaveAsTemplateDialog;
