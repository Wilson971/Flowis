"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { motion } from "framer-motion";
import { Shuffle, Layers, Star, PanelRight, Maximize2, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motionTokens, styles } from "@/lib/design-system";
import { cn } from "@/lib/utils";

import type { ProductFormValues } from "@/features/products/schemas/product-schema";
import type { EditableVariation } from "@/features/products/hooks/useVariationManager";
import { MOCK_VARIATIONS, MOCK_FORM_DEFAULTS } from "@/features/products/components/edit/demo/mock-data";

import { ProposalA_Collapsible } from "@/features/products/components/edit/demo/ProposalA_Collapsible";
import { ProposalB_Dialog } from "@/features/products/components/edit/demo/ProposalB_Dialog";
import { ProposalC_Sheet } from "@/features/products/components/edit/demo/ProposalC_Sheet";
import { ProposalD_Fullscreen } from "@/features/products/components/edit/demo/ProposalD_Fullscreen";

// ============================================================================
// PAGE
// ============================================================================

export default function VariationsModalDemoPage() {
    const form = useForm<ProductFormValues>({
        defaultValues: MOCK_FORM_DEFAULTS,
    });

    const [variations, setVariations] = useState<EditableVariation[]>(MOCK_VARIATIONS);

    const handleUpdateField = useCallback(
        (localId: string, field: keyof EditableVariation, value: unknown) => {
            setVariations((prev) =>
                prev.map((v) =>
                    v._localId === localId
                        ? { ...v, [field]: value, _status: v._status === "new" ? "new" : "modified" }
                        : v
                )
            );
        },
        []
    );

    const handleDelete = useCallback((localId: string) => {
        setVariations((prev) =>
            prev.map((v) =>
                v._localId === localId ? { ...v, _status: "deleted" as const } : v
            )
        );
    }, []);

    const activeVariations = variations.filter((v) => v._status !== "deleted");

    return (
        <FormProvider {...form}>
            <div className="container mx-auto p-6 max-w-6xl space-y-8">
                {/* Header */}
                <motion.div
                    variants={motionTokens.variants.slideUp}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                >
                    <div className="flex items-center gap-2">
                        <Shuffle className="h-6 w-6 text-primary" />
                        <h1 className={styles.text.h1}>Variations UI - Comparatif</h1>
                        <Badge variant="outline" className="ml-2">
                            Démo
                        </Badge>
                    </div>
                    <p className={styles.text.bodyMuted}>
                        4 propositions pour alléger le formulaire produit. Chaque onglet est interactif.
                    </p>
                </motion.div>

                {/* Tabs */}
                <Tabs defaultValue="a" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                        <TabsTrigger value="a" className="gap-1.5 py-2 text-xs sm:text-sm">
                            <ChevronsUpDown className="h-3.5 w-3.5 hidden sm:block" />
                            A. Collapsible
                        </TabsTrigger>
                        <TabsTrigger value="b" className="gap-1.5 py-2 text-xs sm:text-sm">
                            <Star className="h-3.5 w-3.5 hidden sm:block" />
                            B. Dialog
                        </TabsTrigger>
                        <TabsTrigger value="c" className="gap-1.5 py-2 text-xs sm:text-sm">
                            <PanelRight className="h-3.5 w-3.5 hidden sm:block" />
                            C. Sheet
                        </TabsTrigger>
                        <TabsTrigger value="d" className="gap-1.5 py-2 text-xs sm:text-sm">
                            <Maximize2 className="h-3.5 w-3.5 hidden sm:block" />
                            D. Fullscreen
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab A */}
                    <TabsContent value="a" className="space-y-4">
                        <ProposalInfo
                            title="Proposition A : Collapsible"
                            description="Les attributs se replient dans un Collapsible. La grille reste inline avec une hauteur dynamique."
                            spaceSaved="47-65%"
                            complexity="Basse"
                        />
                        <ProposalA_Collapsible
                            variations={activeVariations}
                            onUpdateField={handleUpdateField}
                            onDelete={handleDelete}
                        />
                    </TabsContent>

                    {/* Tab B */}
                    <TabsContent value="b" className="space-y-4">
                        <ProposalInfo
                            title="Proposition B : Dialog Attributs"
                            description="Les attributs sont configurés dans un Dialog centré. La grille reste inline. Meilleur ratio effort/bénéfice."
                            spaceSaved="45-61%"
                            complexity="Moyenne"
                            recommended
                        />
                        <ProposalB_Dialog
                            variations={activeVariations}
                            onUpdateField={handleUpdateField}
                            onDelete={handleDelete}
                        />
                    </TabsContent>

                    {/* Tab C */}
                    <TabsContent value="c" className="space-y-4">
                        <ProposalInfo
                            title="Proposition C : Sheet Manager"
                            description="Tout le contenu variations est déplacé dans un Sheet latéral de 700px. Le formulaire affiche une carte résumé compacte."
                            spaceSaved="84-89%"
                            complexity="Haute"
                        />
                        <ProposalC_Sheet
                            variations={activeVariations}
                            onUpdateField={handleUpdateField}
                            onDelete={handleDelete}
                        />
                    </TabsContent>

                    {/* Tab D */}
                    <TabsContent value="d" className="space-y-4">
                        <ProposalInfo
                            title="Proposition D : Fullscreen Studio"
                            description="Interface plein écran avec 3 panneaux (attributs, grille, détail). Idéal pour les power-users avec 50+ variations."
                            spaceSaved="84-89%"
                            complexity="Haute"
                        />
                        <ProposalD_Fullscreen
                            variations={activeVariations}
                            onUpdateField={handleUpdateField}
                            onDelete={handleDelete}
                        />
                    </TabsContent>
                </Tabs>

                {/* Comparison Table */}
                <motion.div
                    variants={motionTokens.variants.fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-muted-foreground" />
                        <h2 className={styles.text.h2}>Tableau comparatif</h2>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="text-left p-3 font-medium">Critère</th>
                                    <th className="text-center p-3 font-medium">A. Collapsible</th>
                                    <th className="text-center p-3 font-medium">
                                        B. Dialog
                                        <Badge className="ml-1 text-[10px]" variant="secondary">
                                            Recommandé
                                        </Badge>
                                    </th>
                                    <th className="text-center p-3 font-medium">C. Sheet</th>
                                    <th className="text-center p-3 font-medium">D. Fullscreen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                <ComparisonRow
                                    label="Espace gagné"
                                    values={["47-65%", "45-61%", "84-89%", "84-89%"]}
                                />
                                <ComparisonRow
                                    label="Clics supplémentaires"
                                    values={["0", "1", "1", "1"]}
                                />
                                <ComparisonRow
                                    label="Grille visible"
                                    values={["Oui", "Oui", "Non", "Non"]}
                                    highlights={[true, true, false, false]}
                                />
                                <ComparisonRow
                                    label="Complexité"
                                    values={["Basse", "Moyenne", "Haute", "Haute"]}
                                    highlights={[true, true, false, false]}
                                />
                                <ComparisonRow
                                    label="Power-user (50+)"
                                    values={["Non", "Non", "Oui", "Oui"]}
                                    highlights={[false, false, true, true]}
                                />
                                <ComparisonRow
                                    label="Risque technique"
                                    values={["Très bas", "Bas", "Moyen", "Moyen"]}
                                    highlights={[true, true, false, false]}
                                />
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </FormProvider>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ProposalInfo({
    title,
    description,
    spaceSaved,
    complexity,
    recommended,
}: {
    title: string;
    description: string;
    spaceSaved: string;
    complexity: string;
    recommended?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border p-4 flex items-start gap-4",
                recommended
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-muted/20"
            )}
        >
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    {recommended && (
                        <Badge className="text-[10px]" variant="default">
                            Recommandé
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                    <p className="text-lg font-bold text-primary">{spaceSaved}</p>
                    <p className="text-[10px] text-muted-foreground">espace gagné</p>
                </div>
                <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                        {complexity}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">complexité</p>
                </div>
            </div>
        </div>
    );
}

function ComparisonRow({
    label,
    values,
    highlights,
}: {
    label: string;
    values: string[];
    highlights?: boolean[];
}) {
    return (
        <tr>
            <td className="p-3 text-muted-foreground">{label}</td>
            {values.map((val, i) => (
                <td
                    key={i}
                    className={cn(
                        "p-3 text-center",
                        highlights?.[i] ? "text-primary font-medium" : "text-foreground"
                    )}
                >
                    {val}
                </td>
            ))}
        </tr>
    );
}
