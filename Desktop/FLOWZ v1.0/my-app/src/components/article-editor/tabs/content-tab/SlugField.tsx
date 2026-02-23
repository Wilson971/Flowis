'use client';

import React from 'react';
import {
  Lock,
  Unlock,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
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
import { Label } from '@/components/ui/label';

import type { UseFormReturn } from 'react-hook-form';

interface SlugFieldProps {
  form: UseFormReturn<any>;
  isDraft: boolean;
  isPublished: boolean;
  isSlugLocked: boolean;
  setIsSlugLocked: (v: boolean) => void;
  showSlugWarning: boolean;
  setShowSlugWarning: (v: boolean) => void;
  generateSlugFromTitle: () => void;
}

const DOMAIN = 'flowz.com';

export function SlugField({
  form,
  isDraft,
  isPublished,
  isSlugLocked,
  setIsSlugLocked,
  showSlugWarning,
  setShowSlugWarning,
  generateSlugFromTitle,
}: SlugFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="slug" className="text-sm font-semibold flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          URL de l'article
        </Label>
        <div className="flex items-center gap-2">
          {isDraft && (
            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-amber-500 px-2 py-0.5 rounded font-medium">
              Brouillon
            </span>
          )}
          {isPublished && (
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500 px-2 py-0.5 rounded font-medium">
              Publié
            </span>
          )}
        </div>
      </div>
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-0">
              <span className="text-sm text-muted-foreground bg-muted px-3 py-2.5 rounded-l-md border border-r-0 border-border shrink-0">
                {DOMAIN}/blog/
              </span>
              <div className="relative flex-1">
                <FormControl>
                  <Input
                    {...field}
                    id="slug"
                    placeholder={isDraft ? "genere-automatiquement" : "url-de-larticle"}
                    className="rounded-l-none border-l-0 pr-16"
                    readOnly={isSlugLocked}
                    onClick={() => {
                      if (isSlugLocked && isPublished) {
                        setShowSlugWarning(true);
                      }
                    }}
                  />
                </FormControl>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isPublished && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => isSlugLocked ? setShowSlugWarning(true) : setIsSlugLocked(true)}
                    >
                      {isSlugLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={generateSlugFromTitle}
                    disabled={isSlugLocked}
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <p className="text-xs text-muted-foreground">
        {isPublished
          ? "L'URL est verrouillée car l'article est publié. Modifier l'URL pourrait casser les liens existants."
          : "L'identifiant unique de l'article dans l'URL. Utilisez des tirets pour séparer les mots."
        }
      </p>

      {/* Slug Warning Dialog */}
      <AlertDialog open={showSlugWarning} onOpenChange={setShowSlugWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Attention : Modification d'URL</AlertDialogTitle>
            <AlertDialogDescription>
              Modifier l'URL d'un article publié est une action avancée. Si cet article est déjà indexé par Google, cela cassera les liens existants et pourrait impacter négativement votre référencement (SEO).
              <br /><br />
              Êtes-vous sûr de vouloir déverrouiller ce champ ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsSlugLocked(false);
              setShowSlugWarning(false);
            }}>
              Déverrouiller
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
