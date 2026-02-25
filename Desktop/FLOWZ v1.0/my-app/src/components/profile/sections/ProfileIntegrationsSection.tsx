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
import { styles, motionTokens } from '@/lib/design-system';
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
  ChevronDown,
  ArrowRight,
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

// ─── Integration Card shell ───────────────────────────────────────────────────

interface IntegrationCardProps {
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function IntegrationCard({
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  title,
  description,
  badge,
  action,
  children,
  defaultOpen = false,
}: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(defaultOpen);

  const hasContent = !!children;

  return (
    <div className={cn(styles.card.base, 'overflow-hidden')}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          hasContent && 'cursor-pointer select-none'
        )}
        onClick={() => hasContent && setExpanded((p) => !p)}
      >
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('h-4.5 w-4.5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
          {hasContent && (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                expanded && 'rotate-180'
              )}
            />
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
            <div className="px-4 pb-4 pt-0 border-t border-border/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      className="space-y-6 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Intégrations</h2>
        <p className={styles.text.bodyMuted}>Vos plateformes e-commerce et connecteurs externes.</p>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        variants={motionTokens.variants.staggerContainer}
        className="grid grid-cols-1 gap-3"
      >

        {/* ── Boutiques connectées ─────────────────────────────── */}
        <motion.div variants={motionTokens.variants.staggerItem}>
          <IntegrationCard
            icon={Plug}
            iconColor="text-violet-500"
            iconBg="bg-violet-500/10"
            title="Boutiques connectées"
            description="WooCommerce · Shopify"
            badge={
              storeCount > 0 ? (
                <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20">
                  {storeCount} active{storeCount > 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Aucune</Badge>
              )
            }
            defaultOpen={storeCount > 0}
          >
            {storesLoading ? (
              <div className="space-y-2 pt-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="divide-y divide-border/30 pt-3">
                {stores.map((store: any) => {
                  const health = store.platform_connections?.connection_health || 'unknown';
                  const healthColor =
                    health === 'healthy'
                      ? 'bg-emerald-500'
                      : health === 'unhealthy'
                        ? 'bg-destructive'
                        : 'bg-muted-foreground';
                  const healthLabel =
                    health === 'healthy' ? 'Connecté' : health === 'unhealthy' ? 'Erreur' : 'Inconnu';
                  const platformLabel =
                    store.platform === 'woocommerce'
                      ? 'WooCommerce'
                      : store.platform === 'shopify'
                        ? 'Shopify'
                        : store.platform;
                  const shopUrl = store.platform_connections?.shop_url;
                  return (
                    <div key={store.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold',
                            store.platform === 'woocommerce'
                              ? 'bg-purple-500/10 text-purple-600'
                              : 'bg-emerald-500/10 text-emerald-600'
                          )}
                        >
                          {platformLabel.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{store.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {shopUrl || platformLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', healthColor)} />
                        <span className="text-xs text-muted-foreground">{healthLabel}</span>
                        <Badge variant="outline" className="text-[10px]">{platformLabel}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center">
                <Plug className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className={styles.text.bodyMuted}>Aucune boutique connectée</p>
              </div>
            )}
          </IntegrationCard>
        </motion.div>

        {/* ── Webhooks ─────────────────────────────────────────── */}
        <motion.div variants={motionTokens.variants.staggerItem}>
          <IntegrationCard
            icon={Webhook}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
            title="Webhooks"
            description="Automatisez vos workflows · Zapier, Make, n8n…"
            badge={
              webhooks.length > 0 ? (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {webhooks.length} endpoint{webhooks.length > 1 ? 's' : ''}
                </Badge>
              ) : undefined
            }
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs rounded-lg gap-1.5"
                onClick={(e) => { e.stopPropagation(); setShowCreateDialog(true); }}
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </Button>
            }
            defaultOpen={webhooks.length > 0}
          >
            <div className="pt-3 space-y-3">
              {webhooksLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : webhooks.length > 0 ? (
                <div className="space-y-2">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-card/50"
                    >
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{webhook.url}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                          {webhook.events.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={cn('h-2 w-2 rounded-full', webhook.active ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                          title="Copier le secret"
                          onClick={() => handleCopySecret(webhook.secret)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
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
                <div className="py-3 text-center">
                  <Webhook className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                  <p className="text-sm text-muted-foreground">Aucun webhook configuré</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Ajoutez un endpoint pour automatiser vos workflows</p>
                </div>
              )}

              {/* Events reference */}
              <div className="pt-2 border-t border-border/30 space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Événements disponibles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {WEBHOOK_EVENTS.map((e) => (
                    <Badge key={e.value} variant="outline" className="text-[10px] font-mono">
                      {e.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </IntegrationCard>
        </motion.div>

        {/* ── Google Search Console ─────────────────────────────── */}
        <motion.div variants={motionTokens.variants.staggerItem}>
          <IntegrationCard
            icon={Search}
            iconColor={isConnected ? 'text-emerald-500' : 'text-primary'}
            iconBg={isConnected ? 'bg-emerald-500/10' : 'bg-primary/10'}
            title="Google Search Console"
            description="Mots-clés réels · Impressions · Position moyenne"
            badge={
              gscLoading ? undefined : isConnected ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {connections.length} site{connections.length > 1 ? 's' : ''} connecté{connections.length > 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">Non connecté</Badge>
              )
            }
            action={
              !isConnected && !gscLoading ? (
                <Button
                  size="sm"
                  className="h-7 text-xs rounded-lg gap-1.5"
                  onClick={(e) => { e.stopPropagation(); window.location.href = '/api/gsc/oauth/authorize'; }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Connecter
                </Button>
              ) : undefined
            }
            defaultOpen={isConnected}
          >
            {gscLoading ? (
              <div className="pt-3 h-10 bg-muted/30 rounded-lg animate-pulse" />
            ) : !isConnected ? (
              <div className="pt-3 space-y-3">
                <div className="flex flex-col gap-1.5">
                  {[
                    'Mots-clés réels de votre boutique',
                    'Suggestions IA basées sur les vraies recherches',
                    'Score SEO enrichi avec les données de trafic',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  Accès en lecture seule. Nous ne modifions jamais vos données Search Console.
                </p>
              </div>
            ) : (
              <div className="pt-3 space-y-3">
                {activeConnection?.email && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">Compte :</span>
                    <span className="text-xs font-medium">{activeConnection.email}</span>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {connections.length} site{connections.length > 1 ? 's' : ''} connecté{connections.length > 1 ? 's' : ''} · Sync toutes les 6h
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 rounded-lg"
                    onClick={(e) => { e.stopPropagation(); window.location.href = '/api/gsc/oauth/authorize'; }}
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter un compte
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5 rounded-lg ml-auto"
                    onClick={(e) => { e.stopPropagation(); openSettings('integrations-gsc'); }}
                  >
                    Voir les paramètres
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </IntegrationCard>
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
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Nouveau webhook
            </DialogTitle>
            <DialogDescription>
              Configurez un endpoint pour recevoir des événements FLOWZ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">URL de destination</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="pl-8 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">Doit commencer par https://</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Événements</Label>
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
                      <span className="text-sm font-medium">{event.label}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground">{event.value}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Un secret HMAC sera généré automatiquement pour sécuriser vos webhooks.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-lg"
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
