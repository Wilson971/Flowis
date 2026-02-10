'use client';

/**
 * SeoScoreCard - SEO score visualization sidebar card
 * Uses ArticleEditContext for state management
 */

import React from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArticleEditContext } from '../context';
import { cn } from '@/lib/utils';

export function SeoScoreCard() {
  const { seoScore = 0, seoChecks = [] } = useArticleEditContext();

  const criticalIssues = seoChecks.filter((c) => !c.passed && c.severity === 'critical').length;
  const warningIssues = seoChecks.filter((c) => !c.passed && c.severity === 'warning').length;

  // Score color
  const scoreColor = seoScore >= 80 ? 'text-emerald-500' : seoScore >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
      <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Optimisation
              </p>
              <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                Score SEO
              </h3>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 space-y-4">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/20"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(seoScore / 100) * 176} 176`}
                className={scoreColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-lg font-extrabold', scoreColor)}>
                {seoScore}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-sm font-semibold">
              {seoScore >= 80 ? 'Excellent' : seoScore >= 50 ? 'À améliorer' : 'Insuffisant'}
            </div>
            <div className="flex items-center gap-3 text-xs">
              {criticalIssues > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-3 w-3" />
                  {criticalIssues} critique{criticalIssues > 1 ? 's' : ''}
                </span>
              )}
              {warningIssues > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="h-3 w-3" />
                  {warningIssues} avertissement{warningIssues > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Checklist */}
        <div className="space-y-2">
          {seoChecks.map((check, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {check.passed ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              ) : check.severity === 'critical' ? (
                <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              )}
              <span className={cn(
                check.passed ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
