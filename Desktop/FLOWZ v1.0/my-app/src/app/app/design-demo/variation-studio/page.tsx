"use client";

import { motion } from "framer-motion";
import { Maximize2, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motionTokens, styles } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";

const proposals = [
    {
        id: "d",
        title: "Proposition D : Fullscreen Studio",
        description: "Interface plein écran avec sidebar + details + tableau fixe",
        icon: Maximize2,
        spaceSaved: "84-89%",
        complexity: "Haute",
        recommended: true,
        features: ["Idéal pour 50+ variations", "Header tableau fixe", "Navigation fluide", "Sidebar collapsible", "Alignement parfait"],
    },
];

export default function VariationStudioIndexPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-6 max-w-7xl space-y-8">
                {/* Header */}
                <motion.div
                    variants={motionTokens.variants.slideUp}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    <Link href="/app/design-demo">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Retour aux demos
                        </Button>
                    </Link>

                    <div className="space-y-2">
                        <h1 className={styles.text.h1}>Variation Studio - 4 Propositions</h1>
                        <p className={styles.text.bodyMuted}>
                            Choisissez une proposition pour tester l'interface en mode fullscreen.
                            Chaque version est entièrement interactive.
                        </p>
                    </div>
                </motion.div>

                {/* Single Card */}
                <motion.div
                    variants={motionTokens.variants.staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto"
                >
                    {proposals.map((proposal, index) => {
                        const Icon = proposal.icon;
                        return (
                            <motion.div
                                key={proposal.id}
                                variants={motionTokens.variants.staggerItem}
                                custom={index}
                            >
                                <Link href={`/app/design-demo/variation-studio/${proposal.id}`}>
                                    <Card
                                        className={cn(
                                            "h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
                                            proposal.recommended && "border-primary/50 bg-primary/5"
                                        )}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base">
                                                            {proposal.title}
                                                        </CardTitle>
                                                        {proposal.recommended && (
                                                            <Badge className="mt-1 text-[10px]" variant="default">
                                                                Recommandé
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                            </div>
                                            <CardDescription className="mt-2">
                                                {proposal.description}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            {/* Metrics */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-primary">
                                                        {proposal.spaceSaved}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        espace gagné
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <Badge variant="outline" className="text-xs">
                                                        {proposal.complexity}
                                                    </Badge>
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        complexité
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Features */}
                                            <ul className="space-y-1.5">
                                                {proposal.features.map((feature, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="text-xs text-muted-foreground flex items-center gap-2"
                                                    >
                                                        <div className="h-1 w-1 rounded-full bg-primary" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Footer */}
                <motion.div
                    variants={motionTokens.variants.fadeIn}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <Link href="/app/design-demo/variations-modal-demo">
                        <Button variant="outline" size="lg" className="gap-2">
                            Voir le comparatif complet
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
