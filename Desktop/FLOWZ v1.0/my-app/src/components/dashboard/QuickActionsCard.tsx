/**
 * QuickActionsCard - Carte d'actions rapides
 */

import Link from "next/link";
import { cn } from "../../lib/utils";
import {
    Sparkles,
    FileText,
    TrendingUp,
    Camera,
    ArrowRight,
    Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import {
    cardAnimationVariants,
} from "../../lib/design-system/tokens/cards";

// ============================================
// TYPES
// ============================================

type QuickAction = {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
    badgeVariant?: "popular" | "new" | "beta";
};

// ============================================
// DATA
// ============================================

const quickActions: QuickAction[] = [
    {
        id: "generate-description",
        title: "Générer description",
        description: "Création automatique pour vos produits",
        icon: Sparkles,
        href: "/app/products",
        badge: "Populaire",
        badgeVariant: "popular",
    },
    {
        id: "create-blog",
        title: "Créer article de blog",
        description: "Optimisé pour le SEO longue traîne",
        icon: FileText,
        href: "/app/blog",
    },
    {
        id: "optimize-seo",
        title: "Optimiser SEO",
        description: "Analyse et suggestion de mots-clés",
        icon: TrendingUp,
        href: "/app/products",
        badge: "Pro",
        badgeVariant: "new",
    },
    {
        id: "photo-studio",
        title: "Photo Studio",
        description: "Retouche et détourage automatique",
        icon: Camera,
        href: "/app/photo-studio",
        badge: "Beta",
        badgeVariant: "beta",
    },
];

// ============================================
// HELPERS - Badge styles using semantic tokens
// ============================================

const getBadgeStyles = (variant?: "popular" | "new" | "beta") => {
    switch (variant) {
        case "popular":
            // Primary color for featured
            return "bg-primary text-primary-foreground border-0";
        case "new":
            // Success semantic for "Pro" features
            return "bg-green-100 text-green-800 border border-green-200";
        case "beta":
            // Neutral for beta
            return "bg-muted text-foreground border border-border relative overflow-hidden before:absolute before:top-0 before:bottom-0 before:left-0 before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shimmer";
        default:
            return "";
    }
};

// ============================================
// COMPONENT
// ============================================

export const QuickActionsCard = () => {
    return (
        <div className="p-3">
            {/* Header - utilise PRIMARY */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                    <Zap className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                        Actions
                    </p>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">Actions rapides</h3>
                </div>
            </div>
            <p className="text-[13px] text-muted-foreground mb-4 ml-[44px]">
                Accédez directement aux fonctionnalités principales
            </p>

            {/* Actions Grid - Contraste via NEUTRALS */}
            <div className="space-y-3">
                {quickActions.map((action, index) => {
                    const Icon = action.icon;

                    return (
                        <motion.div
                            key={action.id}
                            custom={index}
                            variants={cardAnimationVariants.staggeredSlideIn}
                            initial="hidden"
                            animate="visible"
                        >
                            <Link
                                href={action.href}
                                className={cn(
                                    // Base layout
                                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                    // CONTRASTE via NEUTRALS (pas de couleurs variées)
                                    "bg-muted/50",
                                    "border border-border",
                                    // Ombre pour la profondeur
                                    "shadow-sm",
                                    // Hover - bordure
                                    "hover:bg-background",
                                    "hover:shadow-md", // Standard shadow, no color
                                    "hover:-translate-y-0.5",
                                    // Transition
                                    "transition-all duration-200 ease-out",
                                )}
                            >
                                {/* Icône - UNIQUEMENT PRIMARY */}
                                <div
                                    className={cn(
                                        "flex-shrink-0 p-2 rounded-lg transition-all duration-200",
                                        "bg-muted border border-border text-muted-foreground",
                                        "group-hover:scale-110 group-hover:text-primary group-hover:bg-primary/5",
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                                            {action.title}
                                        </h4>
                                        {action.badge && (
                                            <Badge
                                                className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide",
                                                    getBadgeStyles(action.badgeVariant),
                                                )}
                                            >
                                                {action.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {action.description}
                                    </p>
                                </div>

                                {/* Flèche - neutral par défaut, PRIMARY au hover */}
                                <div className="flex-shrink-0 p-2 rounded-lg bg-muted border border-border group-hover:bg-primary group-hover:border-primary group-hover:shadow-md transition-all duration-200">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200" />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
