'use client';

import { Lock, Unlock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';

interface FieldLockToggleProps {
  fieldName: string;
  isLocked: boolean;
  onToggle: (fieldName: string, locked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const iconSize = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const;

export function FieldLockToggle({
  fieldName,
  isLocked,
  onToggle,
  disabled = false,
  size = 'sm',
}: FieldLockToggleProps) {
  const Icon = isLocked ? Lock : Unlock;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggle(fieldName, !isLocked)}
            className={cn(
              'inline-flex items-center justify-center rounded-lg transition-opacity',
              'hover:opacity-80 disabled:pointer-events-none disabled:opacity-30'
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isLocked ? 'locked' : 'unlocked'}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={motionTokens.transitions.fast}
              >
                <Icon
                  className={cn(
                    iconSize[size],
                    isLocked
                      ? 'text-amber-500'
                      : 'text-muted-foreground/40'
                  )}
                />
              </motion.div>
            </AnimatePresence>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {isLocked
            ? "Ce champ est verrouillé — il ne sera pas écrasé par l'IA ou la sync"
            : 'Cliquer pour verrouiller ce champ'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
