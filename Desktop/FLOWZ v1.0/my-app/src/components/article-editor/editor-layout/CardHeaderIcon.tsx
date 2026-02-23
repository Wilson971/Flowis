'use client';

import React from 'react';
import { CardHeader } from '@/components/ui/card';

interface CardHeaderIconProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  action?: React.ReactNode;
}

export function CardHeaderIcon({ icon, label, title, action }: CardHeaderIconProps) {
  return (
    <CardHeader className="pb-4 border-b border-border/10 mb-0 px-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
        </div>
        {action}
      </div>
    </CardHeader>
  );
}
