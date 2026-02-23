'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepIndicatorProps } from './types';

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full px-6 py-5 border-b border-border/60">
      <div className="relative flex items-center justify-between max-w-3xl mx-auto">
        {/* Connection Line */}
        <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-[1px] bg-border -z-0"></div>

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2.5 relative z-10 group">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                  isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/10"
                    : isCompleted
                      ? "bg-primary text-primary-foreground ring-4 ring-background"
                      : "bg-background text-muted-foreground ring-4 ring-background border border-border"
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
