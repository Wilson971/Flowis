'use client'

import { useCallback } from 'react'
import { useStudioSettings } from './useStudioSettings'
import type { FavoritePreset, SelectedBlocks } from '../types/studio'

interface SaveFavoriteParams {
  name: string
  presetId: string | null
  selectedBlocks: SelectedBlocks
  customPromptText: string
}

export function useFavoritePresets() {
  const { settings, updateSettings } = useStudioSettings()

  // Settings may contain favorites as an extended field
  const favorites: FavoritePreset[] =
    (settings as Record<string, unknown>).favorites as FavoritePreset[] ?? []

  const saveFavorite = useCallback(
    (params: SaveFavoriteParams) => {
      const newFavorite: FavoritePreset = {
        id: crypto.randomUUID(),
        name: params.name,
        presetId: params.presetId,
        selectedBlocks: params.selectedBlocks,
        customPromptText: params.customPromptText,
        createdAt: new Date().toISOString(),
      }
      const updated = [...favorites, newFavorite]
      updateSettings.mutate({ favorites: updated } as Record<string, unknown>)
    },
    [favorites, updateSettings]
  )

  const removeFavorite = useCallback(
    (id: string) => {
      const updated = favorites.filter((f) => f.id !== id)
      updateSettings.mutate({ favorites: updated } as Record<string, unknown>)
    },
    [favorites, updateSettings]
  )

  const renameFavorite = useCallback(
    (id: string, newName: string) => {
      const updated = favorites.map((f) =>
        f.id === id ? { ...f, name: newName } : f
      )
      updateSettings.mutate({ favorites: updated } as Record<string, unknown>)
    },
    [favorites, updateSettings]
  )

  return { favorites, saveFavorite, removeFavorite, renameFavorite }
}
