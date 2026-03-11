"use client"

import { motion } from "framer-motion"
import {
  TrendingUp, Package, FileText, Search, BarChart3, Zap,
} from "lucide-react"
import { AIOrb } from "@/components/ui/ai-orb"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"
import { usePathname } from "next/navigation"

type QuickSuggestion = { icon: React.ReactNode; label: string; prompt: string }

const getContextualSuggestions = (pathname: string): QuickSuggestion[] => {
  if (pathname.includes("/products")) return [
    { icon: <Package className="w-3.5 h-3.5" />, label: "Optimiser les descriptions", prompt: "Quels produits ont des descriptions incompl\u00e8tes ?" },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Analyse SEO produits", prompt: "Analyse le score SEO de mes produits et sugg\u00e8re des am\u00e9liorations." },
    { icon: <Zap className="w-3.5 h-3.5" />, label: "G\u00e9n\u00e9rer en lot", prompt: "G\u00e9n\u00e8re des descriptions pour les produits sans contenu." },
  ]
  if (pathname.includes("/blog")) return [
    { icon: <FileText className="w-3.5 h-3.5" />, label: "Id\u00e9es d'articles", prompt: "Sugg\u00e8re des id\u00e9es d'articles bas\u00e9es sur mes produits." },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Tendances du moment", prompt: "Quelles sont les tendances actuelles dans mon secteur ?" },
    { icon: <Search className="w-3.5 h-3.5" />, label: "Mots-cl\u00e9s \u00e0 cibler", prompt: "Quels mots-cl\u00e9s devrais-je cibler pour mon prochain article ?" },
  ]
  if (pathname.includes("/seo")) return [
    { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Audit rapide", prompt: "Fais un audit SEO rapide de mon site." },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Opportunit\u00e9s", prompt: "Quelles sont mes meilleures opportunit\u00e9s SEO ?" },
    { icon: <Search className="w-3.5 h-3.5" />, label: "Erreurs critiques", prompt: "Y a-t-il des erreurs SEO critiques \u00e0 corriger ?" },
  ]
  return [
    { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "R\u00e9sum\u00e9 du jour", prompt: "Donne-moi un r\u00e9sum\u00e9 de l'activit\u00e9 de ma boutique aujourd'hui." },
    { icon: <Zap className="w-3.5 h-3.5" />, label: "Actions prioritaires", prompt: "Quelles sont les actions prioritaires \u00e0 faire aujourd'hui ?" },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Performance globale", prompt: "Comment se porte ma boutique cette semaine ?" },
  ]
}

const getWelcomeMessage = (pathname: string): string => {
  if (pathname.includes("/products")) return "Je suis votre assistant produits. Je peux optimiser vos descriptions, analyser le SEO, ou g\u00e9n\u00e9rer du contenu en lot."
  if (pathname.includes("/blog")) return "Je suis votre assistant r\u00e9daction. Je peux vous aider \u00e0 trouver des id\u00e9es, optimiser vos articles, ou planifier votre calendrier \u00e9ditorial."
  if (pathname.includes("/seo")) return "Je suis votre assistant SEO. Je peux auditer votre site, identifier des opportunit\u00e9s, et vous guider pour am\u00e9liorer votre r\u00e9f\u00e9rencement."
  return "Bonjour ! Je suis votre Copilot FLOWZ. Comment puis-je vous aider aujourd'hui ?"
}

interface CopilotWelcomeProps {
  onSend: (prompt: string) => void
}

export function CopilotWelcome({ onSend }: CopilotWelcomeProps) {
  const pathname = usePathname()
  const suggestions = getContextualSuggestions(pathname)
  const welcomeMessage = getWelcomeMessage(pathname)

  return (
    <motion.div
      variants={motionTokens.variants.fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AIOrb size={15} active />
        </div>
        <div className="flex-1">
          <p className="text-xs text-foreground/90 leading-relaxed">{welcomeMessage}</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
          Suggestions
        </p>
        <div className="space-y-1.5">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              custom={i}
              variants={motionTokens.variants.staggeredSlideLeft}
              initial="hidden"
              animate="visible"
              onClick={() => onSend(s.prompt)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                "bg-muted/40 hover:bg-muted/70 border border-border/10 hover:border-border/20",
                "transition-colors text-left group"
              )}
            >
              <div className="h-7 w-7 rounded-lg bg-background/80 ring-1 ring-border/20 flex items-center justify-center flex-shrink-0 group-hover:ring-border/40 transition-colors">
                {s.icon}
              </div>
              <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {s.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
