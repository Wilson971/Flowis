"use client"

import { useMemo, useCallback } from "react"
import type { SlashCommand } from "@/types/copilot"

const COMMANDS: SlashCommand[] = [
  {
    name: "optimize",
    aliases: ["opt"],
    description: "Optimiser les descriptions produits",
    level: "medium",
    execute: (args) => `Optimise les descriptions des produits${args ? ` suivants: ${args}` : " selectionnes"}.`,
  },
  {
    name: "audit",
    aliases: ["seo"],
    description: "Lancer un audit SEO",
    level: "light",
    execute: (args) => `Lance un audit SEO${args ? ` sur: ${args}` : " complet"}.`,
  },
  {
    name: "push",
    aliases: ["sync"],
    description: "Pousser vers la boutique",
    level: "heavy",
    execute: (args) => `Pousse vers la boutique${args ? `: ${args}` : " les produits modifies"}.`,
  },
  {
    name: "ideas",
    aliases: ["idees"],
    description: "Generer des idees d'articles",
    level: "light",
    execute: (args) => `Genere des idees d'articles${args ? ` sur le theme: ${args}` : " pour le blog"}.`,
  },
  {
    name: "batch",
    aliases: ["lot"],
    description: "Traitement par lot",
    level: "heavy",
    execute: (args) => `Lance un traitement par lot${args ? `: ${args}` : ""}.`,
  },
  {
    name: "status",
    aliases: ["kpi"],
    description: "Voir les KPIs et le statut",
    level: "light",
    execute: () => "Donne-moi un resume des KPIs et du statut actuel.",
  },
  {
    name: "memory",
    aliases: ["mem"],
    description: "Gerer la memoire du copilot",
    level: "light",
    execute: (args) => args ? `Memorise ceci: ${args}` : "Affiche ce que tu as memorise sur moi.",
  },
  {
    name: "clear",
    aliases: ["new"],
    description: "Nouvelle conversation",
    level: "light",
    execute: () => "__clear__",
  },
]

export function useSlashCommands() {
  const commands = useMemo(() => COMMANDS, [])

  const matchCommand = useCallback((input: string): { command: SlashCommand; args: string } | null => {
    const trimmed = input.trim()
    if (!trimmed.startsWith("/")) return null

    const parts = trimmed.slice(1).split(/\s+/)
    const name = parts[0]?.toLowerCase()
    if (!name) return null

    const cmd = COMMANDS.find(
      (c) => c.name === name || c.aliases.includes(name)
    )
    if (!cmd) return null

    return { command: cmd, args: parts.slice(1).join(" ") }
  }, [])

  const filterCommands = useCallback((partial: string): SlashCommand[] => {
    const term = partial.replace(/^\//, "").toLowerCase()
    if (!term) return COMMANDS

    return COMMANDS.filter(
      (c) =>
        c.name.startsWith(term) ||
        c.aliases.some((a) => a.startsWith(term)) ||
        c.description.toLowerCase().includes(term)
    )
  }, [])

  const formatCommandMessage = useCallback((input: string): string | null => {
    const match = matchCommand(input)
    if (!match) return null
    return match.command.execute(match.args)
  }, [matchCommand])

  return {
    commands,
    matchCommand,
    filterCommands,
    formatCommandMessage,
  }
}
