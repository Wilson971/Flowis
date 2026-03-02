/**
 * ThemedCard Component
 *
 * Card avec thème coloré automatique basé sur le design system.
 * Remplace le hardcoding des couleurs par un système centralisé.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { type CardThemeKey, cardThemes, getCardThemeClasses } from "@/lib/design-system/card-themes";

export interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Thème de couleur à appliquer
   * @default "neutral"
   */
  theme?: CardThemeKey;

  /**
   * Active l'animation d'entrée
   * @default false
   */
  animated?: boolean;

  /**
   * Délai de l'animation (en secondes)
   * @default 0
   */
  animationDelay?: number;
}

const ThemedCard = React.forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ className, theme = "neutral", animated = false, animationDelay = 0, children, ...props }, ref) => {
    const themeConfig = cardThemes[theme];

    const cardContent = (
      <div
        ref={ref}
        className={cn(
          "border-border/40 bg-card/90 backdrop-blur-lg overflow-hidden relative group",
          "hover:border-border themed-card-glow transition-all duration-300",
          className
        )}
        {...props}
        style={{ '--glow-rgba': themeConfig.glowRgba, ...props.style } as React.CSSProperties}
      >
        {/* Glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* Gradient accent - utilise les couleurs du thème */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none",
            "opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          )}
          style={{
            backgroundImage: `linear-gradient(to bottom right,
              hsl(var(--${themeConfig.gradientFrom}) / 0.02),
              transparent,
              hsl(var(--${themeConfig.gradientTo}) / 0.02)
            )`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );

    if (animated) {
      return (
        <motion.div
          variants={motionTokens.variants.slideUp}
          initial="hidden"
          animate="visible"
          transition={{ ...motionTokens.transitions.default, delay: animationDelay }}
        >
          {cardContent}
        </motion.div>
      );
    }

    return cardContent;
  }
);

ThemedCard.displayName = "ThemedCard";

// Sub-components

const ThemedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { theme?: CardThemeKey }
>(({ className, theme = "neutral", children, ...props }, ref) => {
  const themeConfig = cardThemes[theme];

  return (
    <div
      ref={ref}
      className={cn("pb-4 border-b border-border/10 mb-2 px-6 relative z-10", className)}
      {...props}
    >
      {children}
    </div>
  );
});
ThemedCardHeader.displayName = "ThemedCardHeader";

interface ThemedCardIconProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardThemeKey;
  icon: React.ReactNode;
}

const ThemedCardIcon = React.forwardRef<HTMLDivElement, ThemedCardIconProps>(
  ({ className, theme = "neutral", icon, ...props }, ref) => {
    const themeClasses = getCardThemeClasses(theme);

    return (
      <div
        ref={ref}
        className={cn(themeClasses.iconContainer, className)}
        {...props}
      >
        {icon}
      </div>
    );
  }
);
ThemedCardIcon.displayName = "ThemedCardIcon";

const ThemedCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-extrabold tracking-tight text-foreground", className)}
    {...props}
  />
));
ThemedCardTitle.displayName = "ThemedCardTitle";

const ThemedCardLabel = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5",
      className
    )}
    {...props}
  />
));
ThemedCardLabel.displayName = "ThemedCardLabel";

const ThemedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-3 relative z-10", className)} {...props} />
));
ThemedCardContent.displayName = "ThemedCardContent";

export {
  ThemedCard,
  ThemedCardHeader,
  ThemedCardIcon,
  ThemedCardTitle,
  ThemedCardLabel,
  ThemedCardContent,
};
