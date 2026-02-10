"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type BrandTheme = 'amber' | 'emerald' | 'blue' | 'red'

export interface ThemePalette {
  id: BrandTheme
  name: string
  cssClass: string
  previewColor: string
}

/**
 * Brand Theme Palettes
 * Ces palettes correspondent aux sélecteurs CSS dans _semantic.css
 * .theme-amber, .theme-emerald, .theme-blue, .theme-red
 */
export const THEME_PALETTES: ThemePalette[] = [
  { id: 'amber', name: 'Liquid Gold', cssClass: 'theme-amber', previewColor: '#F59E0B' },
  { id: 'emerald', name: 'Emerald Ledger', cssClass: 'theme-emerald', previewColor: '#10B981' },
  { id: 'blue', name: 'Sapphire Blue', cssClass: 'theme-blue', previewColor: '#3B82F6' },
  { id: 'red', name: 'Ruby Red', cssClass: 'theme-red', previewColor: '#EF4444' },
]

// Liste des classes de thème pour le nettoyage
const THEME_CLASSES = THEME_PALETTES.map(p => p.cssClass)

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  brandTheme: BrandTheme
  setBrandTheme: (brandTheme: BrandTheme) => void
  palette: ThemePalette
  radius: number
  setRadius: (radius: number) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>('amber')
  const [radius, setRadiusState] = useState(12)
  const [mounted, setMounted] = useState(false)

  // Get current palette based on brandTheme
  const palette = THEME_PALETTES.find(p => p.id === brandTheme) || THEME_PALETTES[0]

  // Handle initial theme detection on client-side only
  useEffect(() => {
    const savedTheme = localStorage.getItem('flowiz-theme') as Theme | null
    const savedBrandTheme = localStorage.getItem('flowiz-brand-theme') as BrandTheme | null
    const savedRadius = localStorage.getItem('flowiz-radius')

    // Load saved theme or detect system preference
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setThemeState('light')
    }

    // Load saved brand theme
    if (savedBrandTheme && THEME_PALETTES.some(p => p.id === savedBrandTheme)) {
      setBrandThemeState(savedBrandTheme)
    }

    // Load saved radius
    if (savedRadius) {
      setRadiusState(parseInt(savedRadius))
    }

    setMounted(true)
  }, [])

  // Apply theme classes to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Apply light/dark mode class
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('flowiz-theme', theme)

    // Apply brand theme class (remove all theme classes first)
    THEME_CLASSES.forEach(cls => root.classList.remove(cls))
    const currentPalette = THEME_PALETTES.find(p => p.id === brandTheme)
    if (currentPalette) {
      root.classList.add(currentPalette.cssClass)
    }
    localStorage.setItem('flowiz-brand-theme', brandTheme)

    // Apply radius variable
    root.style.setProperty('--radius', `${radius / 16}rem`)
    localStorage.setItem('flowiz-radius', radius.toString())

  }, [theme, brandTheme, radius, mounted])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const setBrandTheme = (newBrandTheme: BrandTheme) => {
    if (THEME_PALETTES.some(p => p.id === newBrandTheme)) {
      setBrandThemeState(newBrandTheme)
    }
  }

  const setRadius = (newRadius: number) => {
    setRadiusState(newRadius)
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setTheme,
      brandTheme,
      setBrandTheme,
      palette,
      radius,
      setRadius
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
