'use client';

/**
 * FeaturedImageCard - Featured image upload sidebar card
 * Uses ArticleEditContext for state management
 */

import React, { useState, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { ImagePlus, Trash2, Upload, Link, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useArticleEditContext } from '../context';
import { cn } from '@/lib/utils';

export function FeaturedImageCard() {
  const { form, isFieldModified } = useArticleEditContext();
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlDialog, setShowUrlDialog] = useState(false);

  const featuredImage = form.watch('featured_image_url');
  const featuredImageAlt = form.watch('featured_image_alt');

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      // TODO: Implement actual file upload to storage
      // For now, create a local URL
      try {
        const localUrl = URL.createObjectURL(file);
        form.setValue('featured_image_url', localUrl, { shouldDirty: true });
        form.setValue('featured_image_alt', file.name.replace(/\.[^/.]+$/, ''), {
          shouldDirty: true,
        });
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [form]
  );

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      form.setValue('featured_image_url', urlInput.trim(), { shouldDirty: true });
      setUrlInput('');
      setShowUrlDialog(false);
    }
  }, [urlInput, form]);

  const handleRemoveImage = useCallback(() => {
    form.setValue('featured_image_url', '', { shouldDirty: true });
    form.setValue('featured_image_alt', '', { shouldDirty: true });
  }, [form]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
      <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Visuel
            </p>
            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
              Image vedette
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 space-y-3">
        {featuredImage ? (
          <>
            {/* Image Preview */}
            <div className="relative group">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted">
                <img
                  src={featuredImage}
                  alt={featuredImageAlt || 'Featured image'}
                  className="w-full h-full object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-8 px-3 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>

            {/* Alt Text */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Texte alternatif
              </Label>
              <Controller
                control={form.control}
                name="featured_image_alt"
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Description de l'image"
                    className="h-8 text-xs bg-background/50 border-border/50"
                  />
                )}
              />
            </div>
          </>
        ) : (
          <>
            {/* Upload Area */}
            <div
              className={cn(
                'relative border-2 border-dashed border-border/50 rounded-lg p-6 text-center',
                'hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer',
                isUploading && 'pointer-events-none opacity-50'
              )}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Envoi en cours...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Glisser-déposer ou cliquer</p>
                    <p className="text-[10px] text-muted-foreground">
                      PNG, JPG, WebP jusqu'à 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alternative Actions */}
            <div className="flex gap-2">
              <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 border-border/50"
                  >
                    <Link className="h-3.5 w-3.5" />
                    URL
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Ajouter une image par URL</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://exemple.com/image.jpg"
                      className="flex-1"
                    />
                    <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 border-border/50"
                disabled
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Générer IA
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
