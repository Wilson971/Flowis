"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { motionTokens } from '@/lib/design-system';

interface SceneStudioLoaderProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

export const SceneStudioLoader = ({
  isLoading,
  message = "Initialisation du Studio",
  subMessage = "Preparation de votre espace de creation..."
}: SceneStudioLoaderProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={motionTokens.variants.fadeIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <motion.div
            variants={motionTokens.variants.fadeInScale}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative flex flex-col items-center gap-6 p-8 rounded-xl bg-card border border-border/50 shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-primary/60 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-primary/5 rounded-full" />
              <div className="absolute inset-2 border-4 border-b-primary/40 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin [animation-direction:reverse]" />
              <div className="relative z-10 bg-background rounded-full p-4 shadow-sm border border-border/50">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{message}</h3>
              <p className="text-sm text-muted-foreground">{subMessage}</p>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: motionTokens.durations.slow * 4, ease: motionTokens.easings.smooth }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Chargement des ressources...</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
