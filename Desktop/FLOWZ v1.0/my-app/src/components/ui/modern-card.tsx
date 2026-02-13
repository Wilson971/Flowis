/**
 * Modern Card Component - 2026 Design Trends
 *
 * Démontre toutes les techniques modernes :
 * - Glassmorphism sélectif
 * - Gradient borders avec glow
 * - Micro-interactions fluides
 * - Gradient accents subtils
 * - Hover effects premium
 */

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

export interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante du style de card
   * - standard: Card classique avec bordure
   * - glass: Effet glassmorphism
   * - gradient: Bordure avec gradient animé
   * - glow: Effet de glow au hover
   * - premium: Tous les effets combinés
   */
  variant?: "standard" | "glass" | "gradient" | "glow" | "premium";

  /**
   * Couleur d'accent pour les gradients
   */
  accentColor?: "primary" | "success" | "warning" | "violet" | "blue" | "emerald";

  /**
   * Active l'animation au hover
   */
  interactive?: boolean;

  /**
   * Active l'effet de lift au hover
   */
  lift?: boolean;
}

const accentGradients = {
  primary: "from-primary/8 via-transparent to-primary/4",
  success: "from-emerald-500/8 via-transparent to-emerald-500/4",
  warning: "from-orange-500/8 via-transparent to-orange-500/4",
  violet: "from-violet-500/8 via-transparent to-violet-500/4",
  blue: "from-blue-500/8 via-transparent to-blue-500/4",
  emerald: "from-emerald-500/8 via-transparent to-emerald-500/4",
};

const glowColors = {
  primary: "shadow-primary/10",
  success: "shadow-emerald-500/10",
  warning: "shadow-orange-500/10",
  violet: "shadow-violet-500/10",
  blue: "shadow-blue-500/10",
  emerald: "shadow-emerald-500/10",
};

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({
    className,
    variant = "standard",
    accentColor = "primary",
    interactive = false,
    lift = false,
    children,
    ...props
  }, ref) => {
    // Variantes de style
    const isGlass = variant === "glass" || variant === "premium";
    const hasGradient = variant === "gradient" || variant === "premium";
    const hasGlow = variant === "glow" || variant === "premium";
    const isPremium = variant === "premium";

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl relative overflow-hidden group",
          // Base styling
          isGlass
            ? "bg-card/90 backdrop-blur-xl border border-border/40"
            : "bg-card border border-border/50",
          // Interactive states
          interactive && "cursor-pointer",
          // Transitions
          "transition-all duration-500",
          // Hover effects
          lift && "hover:scale-[1.01]",
          hasGlow && `hover:shadow-glow-md ${glowColors[accentColor]}`,
          className
        )}
        whileHover={interactive ? { scale: lift ? 1.01 : 1 } : undefined}
        whileTap={interactive ? motionTokens.variants.tap : undefined}
        {...props}
      >
        {/* Glass reflection (glassmorphism) */}
        {isGlass && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent pointer-events-none opacity-50" />
          </>
        )}

        {/* Gradient accent overlay */}
        {(hasGradient || isPremium) && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-700",
              accentGradients[accentColor]
            )}
          />
        )}

        {/* Animated gradient border (premium only) */}
        {hasGradient && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-r opacity-50",
              accentColor === "primary" && "from-primary/30 via-primary/10 to-primary/30",
              accentColor === "success" && "from-emerald-500/30 via-emerald-500/10 to-emerald-500/30",
              accentColor === "violet" && "from-violet-500/30 via-violet-500/10 to-violet-500/30",
            )} style={{
              padding: '1px',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)'
            }} />
          </div>
        )}

        {/* Radial glow effect (premium) */}
        {isPremium && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl",
              accentColor === "primary" && "bg-primary/15",
              accentColor === "success" && "bg-emerald-500/15",
              accentColor === "violet" && "bg-violet-500/15",
            )} />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

ModernCard.displayName = "ModernCard";

// Sub-components pour cohérence avec shadcn Card
const ModernCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
ModernCardHeader.displayName = "ModernCardHeader";

const ModernCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ModernCardTitle.displayName = "ModernCardTitle";

const ModernCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ModernCardDescription.displayName = "ModernCardDescription";

const ModernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
ModernCardContent.displayName = "ModernCardContent";

const ModernCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
ModernCardFooter.displayName = "ModernCardFooter";

export {
  ModernCard,
  ModernCardHeader,
  ModernCardTitle,
  ModernCardDescription,
  ModernCardContent,
  ModernCardFooter,
};
