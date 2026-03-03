'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, PenLine, RefreshCw, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { motionTokens } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface DraftFieldComparisonProps {
  fieldName: string;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
  onAccept: (editedValue?: string) => void;
  onReject: () => void;
  onRegenerate?: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isRegenerating?: boolean;
}

interface DiffToken {
  text: string;
  type: 'unchanged' | 'added' | 'removed';
}

function computeWordDiff(oldText: string, newText: string): { oldTokens: DiffToken[]; newTokens: DiffToken[] } {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const oldSet = new Set(oldWords);
  const newSet = new Set(newWords);

  const oldTokens: DiffToken[] = oldWords.map((word) => ({
    text: word,
    type: word.trim() === '' ? 'unchanged' : newSet.has(word) ? 'unchanged' : 'removed',
  }));

  const newTokens: DiffToken[] = newWords.map((word) => ({
    text: word,
    type: word.trim() === '' ? 'unchanged' : oldSet.has(word) ? 'unchanged' : 'added',
  }));

  return { oldTokens, newTokens };
}

function DiffDisplay({ tokens }: { tokens: DiffToken[] }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {tokens.map((token, i) => (
        <span
          key={i}
          className={cn(
            token.type === 'removed' && 'rounded-sm bg-destructive/15 text-destructive line-through',
            token.type === 'added' && 'rounded-sm bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          )}
        >
          {token.text}
        </span>
      ))}
    </p>
  );
}

export function DraftFieldComparison({
  fieldName,
  fieldLabel,
  currentValue,
  proposedValue,
  onAccept,
  onReject,
  onRegenerate,
  isAccepting = false,
  isRejecting = false,
  isRegenerating = false,
}: DraftFieldComparisonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(proposedValue);
  const isLoading = isAccepting || isRejecting || isRegenerating;

  const { oldTokens, newTokens } = useMemo(
    () => computeWordDiff(currentValue, isEditing ? editedValue : proposedValue),
    [currentValue, proposedValue, editedValue, isEditing]
  );

  function handleAccept() {
    const finalValue = isEditing && editedValue !== proposedValue ? editedValue : undefined;
    onAccept(finalValue);
  }

  return (
    <motion.div
      variants={motionTokens.variants.slideUp}
      initial="hidden"
      animate="visible"
    >
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            {fieldLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Current value */}
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actuel
              </span>
              <div className="rounded-lg bg-muted p-4">
                <DiffDisplay tokens={oldTokens} />
              </div>
            </div>

            {/* Proposed value */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Proposition IA
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 rounded-lg px-2 text-xs"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    if (!isEditing) setEditedValue(proposedValue);
                  }}
                >
                  <PenLine className="mr-1 h-3 w-3" />
                  {isEditing ? 'Aperçu' : 'Modifier'}
                </Button>
              </div>
              <div className="rounded-lg bg-primary/5 p-4">
                {isEditing ? (
                  <Textarea
                    value={editedValue}
                    onChange={(e) => setEditedValue(e.target.value)}
                    className="min-h-[80px] rounded-lg border-primary/20 bg-transparent text-sm"
                  />
                ) : (
                  <DiffDisplay tokens={newTokens} />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                disabled={isLoading}
                className="rounded-lg"
              >
                {isRegenerating ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Régénérer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={isLoading}
              className="rounded-lg"
            >
              {isRejecting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1.5 h-3.5 w-3.5" />
              )}
              Rejeter
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
              className="rounded-lg"
            >
              {isAccepting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Accepter
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
