'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Plug,
  Trash2,
  Copy,
  Plus,
  Webhook,
  Globe,
  Search,
  ExternalLink,
  CheckCircle2,
  Mail,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSelectedStore as useSelectedStoreContext } from '@/contexts/StoreContext';
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  WEBHOOK_EVENTS,
} from '@/hooks/integrations/useWebhooks';
import { useGscConnection } from '@/hooks/integrations/useGscConnection';
import { useSettingsModal } from '@/contexts/SettingsModalContext';
import { useStoreHeartbeat } from '@/hooks/stores/useStoreHeartbeat';

// ─── Vercel-style Integration Section ─────────────────────────────────────────

interface IntegrationSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function IntegrationSection({
  icon: Icon,
  title,
  description,
  badge,
  action,
  children,
  defaultOpen = false,
}: IntegrationSectionProps) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const hasContent = !!children;

  return (
    <div className="group">
      {/* Header row */}
      <div
        className={cn(
          'flex items-center gap-4 py-4 px-1',
          hasContent && 'cursor-pointer select-none'
        )}
        onClick={() => hasContent && setExpanded((p) => !p)}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
          <Icon className="h-[18px] w-[18px] text-foreground/70" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold text-foreground tracking-tight">{title}</span>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
          {hasContent && (
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
              'hover:bg-muted/80'
            )}>
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground/60 transition-transform',
                  motionTokens.transitions.fast,
                  expanded && 'rotate-90'
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && children && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTokens.transitions.default}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-[56px]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Store Row ────────────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<string, { label: string; dotClass: string }> = {
  healthy: {
    label: 'Connecté',
    dotClass: 'bg-emerald-500',
  },
  degraded: {
    label: 'Dégradé',
    dotClass: 'bg-amber-500',
  },
  unhealthy: {
    label: 'Hors ligne',
    dotClass: 'bg-red-500',
  },
  unknown: {
    label: 'Non vérifié',
    dotClass: 'bg-muted-foreground/30',
  },
};

function StoreHealthList({ stores }: { stores: any[] }) {
  const heartbeat = useStoreHeartbeat();

  const handleTest = (storeId: string) => {
    heartbeat.mutate(storeId);
  };

  return (
    <div className="space-y-0.5">
      {stores.map((store: any) => {
        const health: string = store.platform_connections?.connection_health || 'unknown';
        const config = HEALTH_CONFIG[health] || HEALTH_CONFIG.unknown;
        const platformLabel =
          store.platform === 'woocommerce'
            ? 'WooCommerce'
            : store.platform === 'shopify'
              ? 'Shopify'
              : store.platform;
        const shopUrl = store.platform_connections?.shop_url;
        const isTestingThis = heartbeat.isPending && heartbeat.variables === store.id;

        return (
          <div
            key={store.id}
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2.5',
              'transition-colors hover:bg-muted/40'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
                'bg-muted/60 text-foreground/70 ring-1 ring-border/40'
              )}>
                {platformLabel.charAt(0)}
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">{store.name}</p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                  {shopUrl || platformLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status pill */}
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1',
                  'text-[11px] text-muted-foreground transition-colors',
                  'hover:bg-muted/60 cursor-pointer',
                  isTestingThis && 'pointer-events-none opacity-50'
                )}
                title={health === 'unknown' ? 'Tester la connexion' : `${config.label} — Re-tester`}
                onClick={() => handleTest(store.id)}
                disabled={heartbeat.isPending}
              >
                {isTestingThis ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotClass)} />
                )}
                <span>{isTestingThis ? 'Test…' : config.label}</span>
              </button>

              <span className="text-[11px] text-muted-foreground/60 font-medium">
                {platformLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function ProfileIntegrationsSection() {
  const { stores, isLoading: storesLoading } = useSelectedStoreContext();
  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const {
    connections,
    activeConnection,
    isLoading: gscLoading,
    isConnected,
  } = useGscConnection({ linkedOnly: true });

  const { openSettings } = useSettingsModal();

  const handleCreate = async () => {
    await createWebhook.mutateAsync({ url: newWebhookUrl, events: selectedEvents });
    setShowCreateDialog(false);
    setNewWebhookUrl('');
    setSelectedEvents([]);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copié dans le presse-papier');
  };

  const storeCount = stores?.length || 0;

  return (
    <motion.div
      className="w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Integration list — separated by thin dividers like Vercel */}
      <motion.div
        variants={motionTokens.variants.staggerContainer}
        className="rounded-xl border border-border/40 bg-card divide-y divide-border/40 overflow-hidden relative"
      >
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

        {/* ── Boutiques connectées ─────────────────────────────── */}
        <motion.div variants={motionTokens.variants.staggerItem} className="px-4">
          <IntegrationSection
            icon={ShoppingBag}
            title="Boutiques connectées"
            description="WooCommerce · Shopify"
            badge={
              storeCount > 0 ? (
                <Badge variant="success" size="sm">
                  {storeCount} active{storeCount > 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Aucune
                </Badge>
              )
            }
            defaultOpen={storeCount > 0}
          >
            {storesLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : stores && stores.length > 0 ? (
              <StoreHealthList stores={stores} />
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Aucune boutique connectée</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Connectez votre première boutique depuis les paramètres
                </p>
              </div>
            )}
          </IntegrationSection>
        </motion.div>

        {/* ── Webhooks ─────────────────────────────────────────── */}
        <motion.div variants={motionTokens.variants.staggerItem} className="px-4">
          <IntegrationSection
            icon={Zap}
            title="Webhooks"
            description="Automatisez vos workflows · Zapier, Make, n8n…"
            badge={
              webhooks.length > 0 ? (
                <Badge variant="neutral" size="sm">
                  {webhooks.length}
                </Badge>
              ) : undefined
            }
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent"
                onClick={(e) => { e.stopPropagation(); setShowCreateDialog(true); }}
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </Button>
            }
            defaultOpen={webhooks.length > 0}
          >
            <div className="space-y-3">
              {webhooksLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : webhooks.length > 0 ? (
                <div className="space-y-1">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5',
                        'transition-colors hover:bg-muted/40'
                      )}
                    >
                      <Globe className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{webhook.url}</p>
                        <p className="text-[10px] text-muted-foreground/60 truncate font-mono mt-0.5">
                          {webhook.events.join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className={cn(
                          'h-1.5 w-1.5 rounded-full mr-1',
                          webhook.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                        )} />
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Copier le secret"
                          onClick={() => handleCopySecret(webhook.secret)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Supprimer"
                          onClick={() => deleteWebhook.mutate(webhook.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Aucun webhook configuré</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Ajoutez un endpoint pour automatiser vos workflows
                  </p>
                </div>
              )}

              {/* Events reference */}
              <div className="pt-3 border-t border-border/30">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
                  Événements disponibles
                </p>
                <div className="flex flex-wrap gap-1">
                  {WEBHOOK_EVENTS.map((e) => (
                    <span
                      key={e.value}
                      className="inline-flex items-center rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70"
                    >
                      {e.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </IntegrationSection>
        </motion.div>

        {/* ── Google Search Console ─────────────────────────────── */}
        <motion.div variants={motionTokens.variants.staggerItem} className="px-4">
          <IntegrationSection
            icon={Search}
            title="Google Search Console"
            description="Mots-clés réels · Impressions · Position moyenne"
            badge={
              gscLoading ? undefined : isConnected ? (
                <Badge variant="success" size="sm">
                  {connections.length} site{connections.length > 1 ? 's' : ''} connecté{connections.length > 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Non connecté
                </Badge>
              )
            }
            action={
              !isConnected && !gscLoading ? (
                <Button
                  size="sm"
                  className="h-7 text-[11px] rounded-lg gap-1 font-medium"
                  onClick={(e) => { e.stopPropagation(); window.location.href = '/api/gsc/oauth/authorize'; }}
                >
                  Connecter
                  <ArrowRight className="h-3 w-3" />
                </Button>
              ) : undefined
            }
            defaultOpen={isConnected}
          >
            {gscLoading ? (
              <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
            ) : !isConnected ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {[
                    'Mots-clés réels de votre boutique',
                    'Suggestions IA basées sur les vraies recherches',
                    'Score SEO enrichi avec les données de trafic',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70 shrink-0" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/50">
                  Accès en lecture seule. Nous ne modifions jamais vos données Search Console.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeConnection?.email && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-[11px] text-muted-foreground">Compte</span>
                    <span className="text-[11px] font-medium text-foreground">{activeConnection.email}</span>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground/60">
                  {connections.length} site{connections.length > 1 ? 's' : ''} connecté{connections.length > 1 ? 's' : ''} · Sync automatique toutes les 6h
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1 rounded-lg font-medium border-border/60 hover:bg-accent"
                    onClick={(e) => { e.stopPropagation(); window.location.href = '/api/gsc/oauth/authorize'; }}
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter un compte
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 rounded-lg font-medium text-muted-foreground hover:text-foreground ml-auto"
                    onClick={(e) => { e.stopPropagation(); openSettings('integrations-gsc'); }}
                  >
                    Paramètres
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </IntegrationSection>
        </motion.div>

      </motion.div>

      {/* Create webhook dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setNewWebhookUrl('');
            setSelectedEvents([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-foreground/70" />
              Nouveau webhook
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              Configurez un endpoint pour recevoir des événements FLOWZ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">URL de destination</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="pl-8 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground/60">Doit commencer par https://</p>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[13px] font-medium">Événements</Label>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center gap-2.5">
                    <Checkbox
                      id={event.value}
                      checked={selectedEvents.includes(event.value)}
                      onCheckedChange={() => toggleEvent(event.value)}
                      className="rounded"
                    />
                    <label htmlFor={event.value} className="flex-1 cursor-pointer">
                      <span className="text-[13px] font-medium">{event.label}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground/60">{event.value}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground/70">
              Un secret HMAC sera généré automatiquement pour sécuriser vos webhooks.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-lg border-border/60"
              onClick={() => { setShowCreateDialog(false); setNewWebhookUrl(''); setSelectedEvents([]); }}
            >
              Annuler
            </Button>
            <Button
              className="rounded-lg"
              onClick={handleCreate}
              disabled={!newWebhookUrl || selectedEvents.length === 0 || createWebhook.isPending}
            >
              {createWebhook.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Créer le webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
