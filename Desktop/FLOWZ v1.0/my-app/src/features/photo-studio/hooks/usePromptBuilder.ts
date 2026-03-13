'use client'

import { useMemo } from 'react'
import type { SelectedBlocks, EditorMode, PromptDimension } from '../types/studio'
import { ALL_PROMPT_BLOCKS } from '../constants/promptBlocks'

// ─── Constants ───────────────────────────────────────────────
const BASE_QUALITY_PROMPT =
  'Ultra high resolution, professional product photography, sharp focus, clean composition, commercial quality, 8K detail.'

interface UsePromptBuilderParams {
  presetPrompt: string
  blocks: SelectedBlocks
  customText: string
  mode: EditorMode
  productName?: string
  productCategory?: string
}

interface PromptBuilderResult {
  finalPrompt: string
  displayPrompt: string
  blockSummary: string
}

// ─── Helpers ─────────────────────────────────────────────────
function findBlock(dimension: PromptDimension, blockId: string | null) {
  if (!blockId) return null
  return ALL_PROMPT_BLOCKS[dimension].find((b) => b.id === blockId) ?? null
}

export function usePromptBuilder({
  presetPrompt,
  blocks,
  customText,
  mode,
  productName,
  productCategory,
}: UsePromptBuilderParams): PromptBuilderResult {
  return useMemo(() => {
    const dimensions: PromptDimension[] = ['lighting', 'angle', 'ambiance', 'surface']

    const selectedBlocks = dimensions
      .map((dim) => findBlock(dim, blocks[dim]))
      .filter(Boolean)

    // ── Layer 1: Base quality (always hidden from display) ──
    const layer1 = BASE_QUALITY_PROMPT

    // ── Layer 2: Product context + preset + block prompts ──
    const productContext = [
      productName && `Product: ${productName}.`,
      productCategory && `Category: ${productCategory}.`,
    ]
      .filter(Boolean)
      .join(' ')

    const technicalParts = selectedBlocks.map((b) => b!.technicalPrompt)
    const fragmentParts = selectedBlocks.map((b) => b!.promptFragment)

    const layer2Technical = [productContext, presetPrompt, ...technicalParts]
      .filter(Boolean)
      .join(' ')

    const layer2Display = [productContext, presetPrompt, ...fragmentParts]
      .filter(Boolean)
      .join(' ')

    // ── Layer 3: Custom text ──
    const layer3 = customText.trim()

    // ── Assemble ──
    const finalPrompt = [layer1, layer2Technical, layer3].filter(Boolean).join('\n\n')

    // displayPrompt excludes the hidden base quality layer
    const displayPrompt = [layer2Display, layer3].filter(Boolean).join('\n\n')

    const blockSummary = selectedBlocks.map((b) => b!.label).join(' • ')

    return { finalPrompt, displayPrompt, blockSummary }
  }, [presetPrompt, blocks, customText, mode, productName, productCategory])
}
