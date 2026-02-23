"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FileText,
  TrendingUp,
  Camera,
  ArrowRight,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { motionTokens, styles } from "@/lib/design-system";

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
  badgeVariant?: "popular" | "pro" | "beta";
};

// ============================================
// DATA
// ============================================

const quickActions: QuickAction[] = [
  {
    id: "generate-description",
    title: "Générer descriptions",
    description: "Création automatique IA",
    icon: Sparkles,
    href: "/app/products",
    badge: "Populaire",
    badgeVariant: "popular",
  },
  {
    id: "create-blog",
    title: "Créer un article",
    description: "Contenu SEO optimisé",
    icon: FileText,
    href: "/app/blog",
  },
  {
    id: "optimize-seo",
    title: "Optimiser SEO",
    description: "Analyse et mots-clés",
    icon: TrendingUp,
    href: "/app/products",
    badge: "Pro",
    badgeVariant: "pro",
  },
  {
    id: "photo-studio",
    title: "Photo Studio",
    description: "Retouche automatique",
    icon: Camera,
    href: "/app/photo-studio",
    badge: "Beta",
    badgeVariant: "beta",
  },
];

// ============================================
// BADGE STYLES (semantic tokens only)
// ============================================

const getBadgeStyles = (variant?: "popular" | "pro" | "beta") => {
  switch (variant) {
    case "popular":
      return "bg-primary text-primary-foreground border-transparent";
    case "pro":
      return "bg-signal-success/15 text-signal-success border-signal-success/30";
    case "beta":
      return cn(
        "bg-muted text-foreground border-border",
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent before:animate-shimmer"
      );
    default:
      return "";
  }
};

// ============================================
// COMPONENT
// ============================================

export const QuickActionsCard = () => {
  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className={styles.text.labelSmall}>
            Raccourcis
          </p>
          <h3 className={styles.text.h4}>
            Actions rapides
          </h3>
        </div>
      </div>

      {/* Actions list */}
      <div className="space-y-1 flex-1">
        {quickActions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTokens.durations.normal,
                delay: 0.3 + index * motionTokens.staggerDelays.normal,
                ease: motionTokens.easings.smooth,
              }}
            >
              <Link
                href={action.href}
                className={cn(
                  "group/action relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl",
                  "bg-muted/30 border border-border/50",
                  "hover:bg-muted/60 hover:border-border",
                  "hover:-translate-y-0.5 hover:shadow-sm",
                  "transition-all duration-200 ease-out"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                    "bg-muted/50 border border-border/50 text-muted-foreground",
                    "group-hover/action:text-primary group-hover/action:bg-primary/10 group-hover/action:border-primary/20"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground group-hover/action:text-primary transition-colors duration-200 truncate">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
                          getBadgeStyles(action.badgeVariant)
                        )}
                      >
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center bg-transparent group-hover/action:bg-primary group-hover/action:shadow-sm transition-all duration-200">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover/action:text-primary-foreground transition-colors duration-200" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
