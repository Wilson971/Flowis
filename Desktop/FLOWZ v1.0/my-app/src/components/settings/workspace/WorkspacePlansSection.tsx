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
import { styles, motionTokens } from '@/lib/design-system'
import { toast } from 'sonner'

const USAGE_ITEMS = [
  { key: 'products' as const, label: 'Produits', icon: Package, limitKey: 'max_products' as const },
  { key: 'articles' as const, label: 'Articles', icon: FileText, limitKey: 'max_articles' as const },
  { key: 'stores' as const, label: 'Boutiques', icon: Store, limitKey: 'max_stores' as const },
  { key: 'ai_credits' as const, label: 'Crédits AI', icon: Sparkles, limitKey: 'max_ai_credits' as const },
]

const PLAN_BADGE_STYLES: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary border-primary/20',
  enterprise: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
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
        {/* Header */}
        <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
          <h2 className={styles.text.h2}>Plan & Utilisation</h2>
          <p className={styles.text.bodyMuted}>Gérez votre abonnement et suivez votre consommation</p>
        </motion.div>

        {/* Current plan card */}
        <motion.div
          variants={motionTokens.variants.staggerItem}
          className={cn(styles.card.glass, 'p-6 space-y-4')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(styles.iconContainer.sm, styles.iconContainer.muted, 'bg-primary/10')}>
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className={styles.text.h4}>Plan actuel</h3>
                <p className={styles.text.bodySmall}>{currentPlan.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('text-sm px-3 py-1', PLAN_BADGE_STYLES[currentPlan.id])}>
                {currentPlan.name}
              </Badge>
              <span className={cn(styles.text.label, 'text-lg')}>{currentPlan.price}</span>
            </div>
          </div>

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
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={cn(styles.text.bodySmall, 'font-medium')}>{item.label}</span>
                    </div>
                    <span className={cn(
                      styles.text.bodySmall,
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
        </motion.div>

        {/* Plans comparison grid */}
        <motion.div variants={motionTokens.variants.staggerItem} className="space-y-3">
          <h3 className={styles.text.h4}>Tous les plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAN_DEFINITIONS.map((plan) => {
              const isCurrent = plan.id === currentPlan.id
              const isHighlighted = plan.highlighted

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-xl border p-4 space-y-4 transition-all',
                    isCurrent
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : isHighlighted
                        ? 'border-primary/30 bg-card'
                        : 'border-border bg-card'
                  )}
                >
                  {/* Plan header */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(styles.text.label, 'text-base')}>{plan.name}</h4>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          Actuel
                        </Badge>
                      )}
                      {isHighlighted && !isCurrent && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">
                          Populaire
                        </Badge>
                      )}
                    </div>
                    <p className={cn(styles.text.h3, 'text-lg')}>{plan.price}</p>
                    <p className={cn(styles.text.bodySmall)}>{plan.description}</p>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className={styles.text.bodySmall}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <Button variant="outline" className="w-full rounded-lg" disabled>
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-lg"
                      variant={isHighlighted ? 'default' : 'outline'}
                      onClick={() => handleUpgradeClick(plan)}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Passer à {plan.name}
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
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
              <Zap className="h-5 w-5 text-primary" />
              Passer au plan {upgradeTarget?.name}
            </DialogTitle>
            <DialogDescription>
              {upgradeTarget?.price} — {upgradeTarget?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Email de contact pré-rempli avec{' '}
                <span className="font-medium text-foreground">{user?.email}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Message optionnel</Label>
              <Textarea
                value={upgradeMessage}
                onChange={(e) => setUpgradeMessage(e.target.value)}
                placeholder="Décrivez votre cas d'usage, le nombre de produits attendu, vos questions..."
                className="resize-none rounded-lg min-h-[90px]"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              En cliquant sur « Envoyer la demande », votre client email s'ouvrira avec un email pré-rempli.
              Notre équipe vous répondra sous 24h.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setUpgradeTarget(null)}>
              Annuler
            </Button>
            <Button className="rounded-lg" onClick={handleSendRequest}>
              <Mail className="mr-2 h-4 w-4" />
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
