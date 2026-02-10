"use client";

import React from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ProductFormValues } from "../../hooks/useProductForm";
import { useProductEditContext } from "../../context/ProductEditContext";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// New SEO components
import { SERPPreview } from "@/components/seo/SERPPreview";
import { SeoFieldEditor } from "@/components/seo/SeoFieldEditor";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Globe, Smartphone } from "lucide-react";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";

export const ProductSeoTab = () => {
    const { register, control, setValue } = useFormContext<ProductFormValues>();
    const { selectedStore, dirtyFieldsData } = useProductEditContext();
    const isDirtyField = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);

    // Hybrid SEO Analysis Hook (From Context)
    const { seoAnalysis, runSeoAnalysis, remainingProposals, draftActions } = useProductEditContext();
    const { overallScore, fieldScores, issues, isAnalyzing } = seoAnalysis || {
        overallScore: 0, fieldScores: {}, issues: [], isAnalyzing: false
    };

    // Get status to handle draft logic
    const status = useWatch({ control, name: "status" });
    const isDraft = status === 'draft';
    const isPublished = status === 'publish' || status === 'active';

    // Slug lock state
    const [isSlugLocked, setIsSlugLocked] = React.useState(false);
    const [showSlugWarning, setShowSlugWarning] = React.useState(false);


    // Initial lock state effect
    React.useEffect(() => {
        if (isPublished) {
            setIsSlugLocked(true);
        } else {
            setIsSlugLocked(false);
        }
    }, [isPublished]);

    // Auto-clean slug if it contains a full URL (from initial import or paste)
    // Only runs once per product load to avoid interfering with user edits
    const currentSlug = useWatch({ control, name: "slug" });
    const slugCleanedRef = React.useRef(false);

    React.useEffect(() => {
        // Reset the ref when the slug changes externally (product reload)
        slugCleanedRef.current = false;
    }, []);

    React.useEffect(() => {
        if (!currentSlug || slugCleanedRef.current) return;

        // Only clean if it looks like a real URL (starts with http:// or https:// or www.)
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
                setValue("slug", pathSegments[pathSegments.length - 1], { shouldDirty: false });
            }
        } catch {
            // Not a valid URL, leave as-is
        }
    }, [currentSlug, setValue]);

    // Extract domain from store URL
    const shopUrl = selectedStore?.platform_connections?.shop_url || "www.votre-boutique.com";
    const domain = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Also try to get favicon/site_icon from platform_connections
    // Fallback to Google Favicon service if not found in DB
    const favicon = selectedStore?.platform_connections?.site_icon ||
        selectedStore?.platform_connections?.site_icon_url ||
        selectedStore?.platform_connections?.favicon ||
        selectedStore?.platform_connections?.logo_url ||
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    const metaTitle = useWatch({ control, name: "meta_title" }) || "";
    const metaDescription = useWatch({ control, name: "meta_description" }) || "";
    const slug = useWatch({ control, name: "slug" }) || "";

    // Fallbacks for preview if empty
    const productTitle = useWatch({ control, name: "title" }) || "";
    // User requested detailed description fallback first
    const shortDescription = useWatch({ control, name: "short_description" });
    const description = useWatch({ control, name: "description" });
    const productDesc = description || shortDescription || "";

    // Clean description for preview (remove HTML)
    const previewDesc = (metaDescription || productDesc).replace(/<[^>]*>/g, '').substring(0, 160);
    const previewTitle = metaTitle || productTitle;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm card-elevated">
                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Visibilité Web
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Référencement (SEO)
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="edit" className="w-full">
                        <div className="px-6 pt-4 bg-muted/20">
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b-0 rounded-none gap-6">
                                <TabsTrigger
                                    value="edit"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 font-medium"
                                >
                                    Édition
                                </TabsTrigger>
                                <TabsTrigger
                                    value="preview"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-2 py-3 font-medium"
                                >
                                    Aperçu Google
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="edit" className="mt-0 space-y-8 animate-in fade-in-50 duration-300">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <Label className="flex items-center gap-1.5">
                                            Meta Titre
                                            <FieldStatusBadge isDirty={isDirtyField("meta_title") || isDirtyField("seo.title")} />
                                        </Label>
                                        {remainingProposals.includes("seo.title") && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-indigo-600 font-medium animate-pulse">Suggestion IA disponible</span>
                                                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => draftActions.handleAcceptField("seo.title")}>Accepter</Button>
                                                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => draftActions.handleRejectField("seo.title")}>Rejeter</Button>
                                            </div>
                                        )}
                                    </div>
                                    <Controller
                                        name="meta_title"
                                        control={control}
                                        render={({ field }) => (
                                            <SeoFieldEditor
                                                id="meta_title"
                                                label="" // Label handled above
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                idealLength={60}
                                                score={fieldScores['meta_title']}
                                                placeholder="Titre optimisé pour Google..."
                                                helperText="Le titre bleu cliquable dans les résultats de recherche."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <Label className="flex items-center gap-1.5">
                                            Meta Description
                                            <FieldStatusBadge isDirty={isDirtyField("meta_description") || isDirtyField("seo.description")} />
                                        </Label>
                                        {remainingProposals.includes("seo.description") && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-indigo-600 font-medium animate-pulse">Suggestion IA disponible</span>
                                                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => draftActions.handleAcceptField("seo.description")}>Accepter</Button>
                                                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => draftActions.handleRejectField("seo.description")}>Rejeter</Button>
                                            </div>
                                        )}
                                    </div>
                                    <Controller
                                        name="meta_description"
                                        control={control}
                                        render={({ field }) => (
                                            <SeoFieldEditor
                                                id="meta_description"
                                                label="" // Label handled above
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                idealLength={160}
                                                multiline
                                                score={fieldScores['meta_description']}
                                                placeholder="Description courte et attractive..."
                                                helperText="Le texte gris sous le titre. Doit inciter au clic."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="slug" className="text-sm font-semibold flex items-center gap-1.5">
                                            Slug URL
                                            <FieldStatusBadge isDirty={isDirtyField("slug")} />
                                        </Label>
                                        {isDraft && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 px-2 py-0.5 rounded font-medium">
                                                Mode Brouillon
                                            </span>
                                        )}
                                    </div>
                                    <div className={cn("flex items-center gap-2", isDraft && "opacity-60")}>
                                        <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 shrink-0" title={domain ? `https://${domain}/produit/` : '/produit/'}>
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
                                            : "L'identifiant unique de la page dans l'URL. Utilisez des tirets."
                                        }
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="mt-0 animate-in fade-in-50 duration-300">
                                <div className="space-y-6 max-w-3xl mx-auto">
                                    <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                                        <Tabs defaultValue="desktop" className="w-full">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Simulation de résultat</h3>
                                                <TabsList className="grid w-[200px] grid-cols-2">
                                                    <TabsTrigger value="desktop">Desktop</TabsTrigger>
                                                    <TabsTrigger value="mobile">
                                                        <Smartphone className="h-4 w-4 mr-2" />
                                                        Mobile
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>
                                            <TabsContent value="desktop">
                                                <SERPPreview
                                                    title={previewTitle}
                                                    description={previewDesc}
                                                    slug={isDraft ? "" : slug}
                                                    domain={domain}
                                                    favicon={favicon}
                                                />
                                            </TabsContent>
                                            <TabsContent value="mobile">
                                                <div className="max-w-[375px] mx-auto border-x border-t border-border/50 rounded-t-xl bg-surface p-4 min-h-[300px] shadow-sm">
                                                    <SERPPreview
                                                        title={previewTitle}
                                                        description={previewDesc}
                                                        slug={isDraft ? "" : slug}
                                                        className="border-0 shadow-none bg-transparent p-0"
                                                        domain={domain}
                                                        favicon={favicon}
                                                    />
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>

                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            💡 Conseils d&apos;optimisation
                                        </h4>
                                        <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                                            <li>Incluez le mot-clé principal au début du titre.</li>
                                            <li>La description doit contenir un appel à l&apos;action (CTA).</li>
                                            <li>Évitez le bourrage de mots-clés (keyword stuffing).</li>
                                            <li>Utilisez des tirets (-) pour séparer les mots dans l&apos;URL.</li>
                                        </ul>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    );
};
