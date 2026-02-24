"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { ProductFormValues } from "../../../hooks/useProductForm";

export const SlugFieldSection = ({
    isDirtyField,
    domain,
}: {
    isDirtyField: (field: string) => boolean | undefined;
    domain: string;
}) => {
    const { register, control, resetField } = useFormContext<ProductFormValues>();

    const status = useWatch({ control, name: "status" });
    const isDraft = status === 'draft';
    const isPublished = status === 'publish' || status === 'active';
    const [isSlugLocked, setIsSlugLocked] = React.useState(isPublished);
    const [showSlugWarning, setShowSlugWarning] = React.useState(false);

    React.useEffect(() => {
        setIsSlugLocked(isPublished);
    }, [isPublished]);

    // Auto-clean slug if full URL
    const currentSlug = useWatch({ control, name: "slug" });
    const slugCleanedRef = React.useRef(false);

    React.useEffect(() => {
        if (!currentSlug || slugCleanedRef.current) return;
        const isFullUrl = currentSlug.startsWith('http://') || currentSlug.startsWith('https://') || currentSlug.startsWith('www.');
        if (!isFullUrl) return;
        slugCleanedRef.current = true;
        try {
            const urlStr = currentSlug.startsWith('http') ? currentSlug : `https://${currentSlug}`;
            const url = new URL(urlStr);
            const pathSegments = url.pathname.split('/').filter(
                p => p && p.length > 0 && p !== 'product' && p !== 'produit'
            );
            if (pathSegments.length > 0) {
                resetField("slug", { defaultValue: pathSegments[pathSegments.length - 1] });
            }
        } catch {
            // Not a valid URL, leave as-is
        }
    }, [currentSlug, resetField]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="slug" className="text-sm font-semibold flex items-center gap-1.5">
                    Slug URL
                    <FieldStatusBadge isDirty={isDirtyField("slug")} />
                </Label>
                {isDraft && (
                    <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg font-medium border border-amber-500/10">
                        Mode Brouillon
                    </span>
                )}
            </div>
            <div className={cn("flex items-center gap-2", isDraft && "opacity-60")}>
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-lg border border-r-0 shrink-0" title={domain ? `https://${domain}/produit/` : '/produit/'}>
                    {domain ? `https://${domain}/produit/` : '/produit/'}
                </span>
                <div className="relative flex-1">
                    <Input
                        id="slug"
                        {...register("slug")}
                        placeholder={isDraft ? "Généré automatiquement..." : "url-du-produit"}
                        className="rounded-l-none border-l-0 pr-10"
                        disabled={isDraft}
                        readOnly={isSlugLocked}
                        onClick={() => {
                            if (isSlugLocked && isPublished) {
                                setShowSlugWarning(true);
                            }
                        }}
                    />
                    {isPublished && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {isSlugLocked ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                    onClick={() => setShowSlugWarning(true)}
                                >
                                    <Lock className="h-3 w-3" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                    onClick={() => setIsSlugLocked(true)}
                                >
                                    <Unlock className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={showSlugWarning} onOpenChange={setShowSlugWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Attention : Modification d&apos;URL</AlertDialogTitle>
                        <AlertDialogDescription>
                            Modifier l&apos;URL d&apos;une page publiée est une action avancée. Si cette page est déjà indexée par Google, cela cassera les liens existants et pourrait impacter négativement votre référencement (SEO).
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
            <p className="text-xs text-muted-foreground">
                {isDraft
                    ? "Le slug sera généré automatiquement lors de la publication."
                    : "L'identifiant unique de la page dans l'URL. Utilisez des tirets, 3-5 mots idéalement."
                }
            </p>
        </div>
    );
};
