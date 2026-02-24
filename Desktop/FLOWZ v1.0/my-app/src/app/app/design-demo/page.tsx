"use client";

/**
 * Design Demo Page - Showcase 2026 UI Trends
 *
 * Cette page démontre tous les styles modernes implémentés dans FLOWZ :
 * - Glassmorphism
 * - Gradient borders
 * - Glow effects
 * - Micro-interactions
 * - Bento grids
 */

import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Palette,
  Layers,
  Code2,
  BarChart2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ModernCard,
  ModernCardHeader,
  ModernCardTitle,
  ModernCardDescription,
  ModernCardContent,
} from "@/components/ui/modern-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motionTokens, styles } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export default function DesignDemoPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTokens.transitions.default}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          <h1 className={styles.text.h1}>Design System 2026</h1>
          <Badge variant="outline" className="ml-2">Démo</Badge>
        </div>
        <p className={styles.text.bodyMuted}>
          Découvrez toutes les tendances UI/UX modernes implémentées dans FLOWZ
        </p>
      </motion.div>

      {/* ── Featured Demos ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <h2 className={styles.text.h2}>Demos interactives</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/app/design-demo/ai-artifact-chart">
            <motion.div
              whileHover={motionTokens.variants.hoverLift}
              whileTap={motionTokens.variants.tap}
            >
              <Card className="p-6 cursor-pointer border-border hover:border-primary/40 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                    <BarChart2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(styles.text.h4, "leading-none")}>
                        AI Artifact Chart
                      </h3>
                      <Badge variant="outline" className="text-[10px]">
                        Nouveau
                      </Badge>
                    </div>
                    <p className={cn(styles.text.bodyMuted, "text-xs mt-1.5")}>
                      Chat IA + visualisations Recharts générées à la demande.
                      Inspiré de{" "}
                      <code className="font-mono text-[10px]">
                        @cult-ui-pro
                      </code>
                      .
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Chat streaming", "Recharts", "Framer Motion", "Split panel"].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </Card>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Section 1: Card Variants Comparison */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h2 className={styles.text.h2}>Variantes de Cards</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Standard Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Standard
              </CardTitle>
              <CardDescription>Card classique shadcn/ui</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Opaque, avec bordure standard. Parfait pour le contenu principal.
              </p>
              <div className="mt-4">
                <Badge>bg-card</Badge>
                <Badge variant="outline" className="ml-2">border-border</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Glass Card */}
          <ModernCard variant="glass">
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Glassmorphism
              </ModernCardTitle>
              <ModernCardDescription>Effet verre dépoli</ModernCardDescription>
            </ModernCardHeader>
            <ModernCardContent>
              <p className="text-sm text-muted-foreground">
                Semi-transparent avec backdrop-blur. Idéal pour overlays et panels.
              </p>
              <div className="mt-4">
                <Badge>bg-card/90</Badge>
                <Badge variant="outline" className="ml-2">backdrop-blur-xl</Badge>
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Premium Card */}
          <ModernCard variant="premium" accentColor="violet" interactive lift>
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Premium
              </ModernCardTitle>
              <ModernCardDescription>Tous les effets combinés</ModernCardDescription>
            </ModernCardHeader>
            <ModernCardContent>
              <p className="text-sm text-muted-foreground">
                Glass + Gradient + Glow + Animations. Pour les cards hero.
              </p>
              <div className="mt-4 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">Glass</Badge>
                <Badge variant="secondary" className="text-[10px]">Gradient</Badge>
                <Badge variant="secondary" className="text-[10px]">Glow</Badge>
                <Badge variant="secondary" className="text-[10px]">Interactive</Badge>
              </div>
            </ModernCardContent>
          </ModernCard>
        </div>
      </section>

      {/* Section 2: Gradient Accents */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <h2 className={styles.text.h2}>Gradient Accents</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernCard variant="gradient" accentColor="primary" interactive>
            <ModernCardHeader>
              <ModernCardTitle>Primary</ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent>
              <div className="h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5" />
            </ModernCardContent>
          </ModernCard>

          <ModernCard variant="gradient" accentColor="success" interactive>
            <ModernCardHeader>
              <ModernCardTitle>Success</ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent>
              <div className="h-20 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5" />
            </ModernCardContent>
          </ModernCard>

          <ModernCard variant="gradient" accentColor="violet" interactive>
            <ModernCardHeader>
              <ModernCardTitle>Violet</ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent>
              <div className="h-20 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5" />
            </ModernCardContent>
          </ModernCard>

          <ModernCard variant="gradient" accentColor="blue" interactive>
            <ModernCardHeader>
              <ModernCardTitle>Blue</ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent>
              <div className="h-20 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5" />
            </ModernCardContent>
          </ModernCard>
        </div>
      </section>

      {/* Section 3: Interactive States */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className={styles.text.h2}>États Interactifs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Glow Effect */}
          <ModernCard variant="glow" accentColor="primary" interactive>
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Glow on Hover
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Survolez pour voir l'effet de glow
              </p>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-block"
                >
                  ✨
                </motion.div>
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Lift Effect */}
          <ModernCard variant="glass" interactive lift>
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Lift on Hover
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                La card se soulève au survol
              </p>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <motion.div
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-block"
                >
                  ⬆️
                </motion.div>
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Combined */}
          <ModernCard variant="premium" accentColor="success" interactive lift>
            <ModernCardHeader>
              <ModernCardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Combiné
              </ModernCardTitle>
            </ModernCardHeader>
            <ModernCardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Glow + Lift + Glass + Gradient
              </p>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="inline-block"
                >
                  🌟
                </motion.div>
              </div>
            </ModernCardContent>
          </ModernCard>
        </div>
      </section>

      {/* Section 4: Code Examples */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-muted-foreground" />
          <h2 className={styles.text.h2}>Exemples de Code</h2>
        </div>

        <ModernCard variant="glass">
          <ModernCardHeader>
            <ModernCardTitle>Utilisation</ModernCardTitle>
            <ModernCardDescription>
              Comment utiliser les ModernCard dans votre code
            </ModernCardDescription>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-foreground">{`// Card standard
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
</Card>

// Card avec glassmorphism
<ModernCard variant="glass">
  <ModernCardHeader>
    <ModernCardTitle>Hero Card</ModernCardTitle>
  </ModernCardHeader>
</ModernCard>

// Card premium interactive
<ModernCard
  variant="premium"
  accentColor="violet"
  interactive
  lift
>
  <ModernCardHeader>
    <ModernCardTitle>Premium Card</ModernCardTitle>
  </ModernCardHeader>
</ModernCard>`}</pre>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Copier
                </Button>
                <Button size="sm" variant="outline">
                  Voir la doc
                </Button>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>
      </section>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={cn(
          "p-4 rounded-xl border border-border/50 bg-card/50",
          "text-center text-sm text-muted-foreground"
        )}
      >
        <p>
          🎨 Design System FLOWZ v1.0 • Tendances 2026 •
          <span className="text-primary font-medium ml-1">
            Glassmorphism + Bento Grids + Micro-interactions
          </span>
        </p>
      </motion.div>
    </div>
  );
}
