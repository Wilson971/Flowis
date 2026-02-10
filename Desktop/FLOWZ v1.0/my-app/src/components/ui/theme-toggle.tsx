"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from './button'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg header-btn">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative h-9 w-9 rounded-lg header-btn"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <motion.div
            initial={false}
            animate={{
              scale: theme === 'dark' ? 1 : 0,
              rotate: theme === 'dark' ? 0 : 180,
              opacity: theme === 'dark' ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-4 w-4 text-foreground" strokeWidth={2} />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              scale: theme === 'light' ? 1 : 0,
              rotate: theme === 'light' ? 0 : -180,
              opacity: theme === 'light' ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-4 w-4 text-amber-500" strokeWidth={2} />
          </motion.div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Mode {theme === 'dark' ? 'sombre' : 'clair'} actif</p>
      </TooltipContent>
    </Tooltip>
  )
}
