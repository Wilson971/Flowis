'use client'

import { useState } from 'react'
import { useWorkspace, useWorkspacePlan } from '@/hooks/workspace'
import { useAuth } from '@/lib/auth/AuthContext'
import { PLAN_DEFINITIONS } from '@/constants/plans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  SettingsCard,
  SettingsHeader,
} from '@/components/settings/ui/SettingsCard'
import {
  Package,
  FileText,
  Store,
  Sparkles,
  Loader2,
  Check,
  Crown,
  Zap,
  ArrowUpRight,
  Mail,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-system'
import { toast } from 'sonner'

const USAGE_ITEMS = [
  { key: 'products' as const, label: 'Produits', icon: Package, limitKey: 'max_products' as const },
  { key: 'articles' as const, label: 'Articles', icon: FileText, limitKey: 'max_articles' as const },
  { key: 'stores' as const, label: 'Boutiques', icon: Store, limitKey: 'max_stores' as const },
  { key: 'ai_credits' as const, label: 'Crédits AI', icon: Sparkles, limitKey: 'max_ai_credits' as const },
]

const PLAN_BADGE_STYLES: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-foreground/10 text-foreground',
  enterprise: 'bg-amber-500/10 text-amber-600',
}

type PlanDef = (typeof PLAN_DEFINITIONS)[number]

export default function WorkspacePlansSection() {
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: planData, isLoading: planLoading } = useWorkspacePlan(workspace?.id)
  const { user } = useAuth()

  const [upgradeTarget, setUpgradeTarget] = useState<PlanDef | null>(null)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const isLoading = wsLoading || planLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPlan = planData?.planDefinition || PLAN_DEFINITIONS[0]

  const handleUpgradeClick = (plan: PlanDef) => {
    setUpgradeMessage('')
    setUpgradeTarget(plan)
  }

  const handleSendRequest = () => {
    if (!upgradeTarget) return
    const subject = encodeURIComponent(`Demande d'upgrade — Plan ${upgradeTarget.name}`)
    const body = encodeURIComponent(
      [
        `Bonjour,`,
        ``,
        `Je souhaite passer au plan ${upgradeTarget.name} (${upgradeTarget.price}).`,
        ``,
        `Email: ${user?.email || ''}`,
        ``,
        upgradeMessage ? `Message: ${upgradeMessage}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    )
    window.open(`mailto:contact@flowz.io?subject=${subject}&body=${body}`, '_blank')
    toast.success('Client email ouvert', { description: 'Envoyez l\'email pour finaliser votre demande.' })
    setUpgradeTarget(null)
  }

  return (
    <>
      <motion.div
        className="space-y-4 w-full"
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Current plan card */}
        <motion.div variants={motionTokens.variants.staggerItem}>
          <SettingsCard className="space-y-4">
            <SettingsHeader
              icon={Crown}
              title="Plan actuel"
              description={currentPlan.description}
            >
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={cn('h-5 rounded-full px-2 text-[10px] font-medium border-0', PLAN_BADGE_STYLES[currentPlan.id])}>
                  {currentPlan.name}
                </Badge>
                <span className="text-[13px] font-medium text-foreground">{currentPlan.price}</span>
              </div>
            </SettingsHeader>

            {/* Usage gauges */}
            <div className="space-y-3 pt-2">
              {USAGE_ITEMS.map((item) => {
                const current = (planData?.usage as any)?.[item.key] ?? 0
                const max = currentPlan.limits[item.limitKey]
                const percentage = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
                const isNearLimit = percentage >= 80
                const Icon = item.icon

                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                      </div>
                      <span className={cn(
                        'text-xs text-muted-foreground',
                        isNearLimit ? 'text-warning font-medium' : ''
                      )}>
                        {current} / {max}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={cn('h-2', isNearLimit ? '[&>div]:bg-warning' : '')}
                    />
                  </div>
                )
              })}
            </div>
          </SettingsCard>
        </motion.div>

        {/* Plans comparison grid */}
        <motion.div variants={motionTokens.variants.staggerItem} className="space-y-3">
          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            Tous les plans
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAN_DEFINITIONS.map((plan) => {
              const isCurrent = plan.id === currentPlan.id
              const isHighlighted = plan.highlighted

              return (
                <SettingsCard
                  key={plan.id}
                  className={cn(
                    'space-y-4',
                    isCurrent
                      ? 'border-primary ring-1 ring-primary/20 bg-primary/5'
                      : isHighlighted
                        ? 'border-primary/30'
                        : ''
                  )}
                >
                  {/* Plan header */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-medium text-foreground">{plan.name}</h4>
                      {isCurrent && (
                        <Badge className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted text-muted-foreground">
                          Actuel
                        </Badge>
                      )}
                      {isHighlighted && !isCurrent && (
                        <Badge className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-primary text-primary-foreground">
                          Populaire
                        </Badge>
                      )}
                    </div>
                    <p className="text-[15px] font-semibold tracking-tight text-foreground">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-foreground/70 shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full h-8 text-[11px] rounded-lg font-medium border-border/60"
                      disabled
                    >
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        'w-full h-8 text-[11px] rounded-lg gap-1.5 font-medium',
                        !isHighlighted && 'border-border/60 hover:bg-accent'
                      )}
                      variant={isHighlighted ? 'default' : 'outline'}
                      onClick={() => handleUpgradeClick(plan)}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Passer à {plan.name}
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  )}
                </SettingsCard>
              )
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Upgrade Request Dialog */}
      <Dialog open={!!upgradeTarget} onOpenChange={(open) => { if (!open) setUpgradeTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-foreground/70" />
              Passer au plan {upgradeTarget?.name}
            </DialogTitle>
            <DialogDescription>
              {upgradeTarget?.price} — {upgradeTarget?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-foreground/70" />
              <span>
                Email de contact pré-rempli avec{' '}
                <span className="font-medium text-foreground">{user?.email}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-foreground">Message optionnel</Label>
              <Textarea
                value={upgradeMessage}
                onChange={(e) => setUpgradeMessage(e.target.value)}
                placeholder="Décrivez votre cas d'usage, le nombre de produits attendu, vos questions..."
                className="resize-none rounded-xl min-h-[90px]"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              En cliquant sur « Envoyer la demande », votre client email s&apos;ouvrira avec un email pré-rempli.
              Notre équipe vous répondra sous 24h.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="h-8 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent"
              onClick={() => setUpgradeTarget(null)}
            >
              Annuler
            </Button>
            <Button
              className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
              onClick={handleSendRequest}
            >
              <Mail className="h-3.5 w-3.5" />
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
