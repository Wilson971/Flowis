'use client';

import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Cloud, CloudOff } from 'lucide-react';

export function AutoSaveStatus({
  status,
  lastSavedAt,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
}) {
  if (status === 'saving') {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-warning/10 text-warning border-warning/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        Sauvegarde...
      </Badge>
    );
  }

  if (status === 'saved') {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
        <Cloud className="h-3 w-3" />
        Sauvegardé
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-destructive/10 text-destructive border-destructive/30">
        <CloudOff className="h-3 w-3" />
        Erreur
      </Badge>
    );
  }

  if (lastSavedAt) {
    return (
      <Badge variant="outline" className="gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Check className="h-3 w-3" />
        Sauvé à {lastSavedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Badge>
    );
  }

  return null;
}
