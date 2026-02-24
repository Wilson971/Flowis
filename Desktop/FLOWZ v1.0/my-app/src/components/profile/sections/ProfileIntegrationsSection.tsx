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
import { motion } from 'framer-motion';
import {
  Loader2,
  Plug,
  Trash2,
  Copy,
  Plus,
  Webhook,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSelectedStore as useSelectedStoreContext } from '@/contexts/StoreContext';
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  WEBHOOK_EVENTS,
} from '@/hooks/integrations/useWebhooks';
import GscIntegrationSection from '@/components/settings/integrations/GscIntegrationSection';

export function ProfileIntegrationsSection() {
  const { stores, isLoading: storesLoading } = useSelectedStoreContext();
  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleCreate = async () => {
    await createWebhook.mutateAsync({ url: newWebhookUrl, events: selectedEvents });
    setShowCreateDialog(false);
    setNewWebhookUrl('');
    setSelectedEvents([]);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copié dans le presse-papier');
  };

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Intégrations</h2>
        <p className={styles.text.bodyMuted}>Vos plateformes e-commerce et connecteurs externes.</p>
      </motion.div>

      {/* Connected stores */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Plug className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className={styles.text.h4}>Boutiques connectées</h3>
            <p className={styles.text.bodySmall}>{stores?.length || 0} connexion{(stores?.length || 0) > 1 ? 's' : ''} active{(stores?.length || 0) > 1 ? 's' : ''}</p>
          </div>
        </div>

        {storesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stores && stores.length > 0 ? (
          <div className="divide-y divide-border/40">
            {stores.map((store: any) => {
              const health = store.platform_connections?.connection_health || 'unknown';
              const healthColor = health === 'healthy' ? 'bg-emerald-500' : health === 'unhealthy' ? 'bg-destructive' : 'bg-muted-foreground';
              const healthLabel = health === 'healthy' ? 'Connecté' : health === 'unhealthy' ? 'Erreur' : 'Inconnu';
              const platformLabel = store.platform === 'woocommerce' ? 'WooCommerce' : store.platform === 'shopify' ? 'Shopify' : store.platform;
              const shopUrl = store.platform_connections?.shop_url;

              return (
                <div key={store.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold',
                      store.platform === 'woocommerce' ? 'bg-purple-500/10 text-purple-600' : 'bg-emerald-500/10 text-emerald-600'
                    )}>
                      {platformLabel.charAt(0)}
                    </div>
                    <div>
                      <p className={cn(styles.text.label, 'text-sm')}>{store.name}</p>
                      <p className={cn(styles.text.bodySmall, 'text-xs truncate max-w-[200px]')}>
                        {shopUrl || platformLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', healthColor)} />
                    <span className={cn(styles.text.bodySmall, 'text-xs')}>{healthLabel}</span>
                    <Badge variant="outline" className="text-[10px] ml-1">{platformLabel}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center">
            <Plug className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className={styles.text.bodyMuted}>Aucune boutique connectée</p>
          </div>
        )}
      </motion.div>

      {/* Webhooks */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Webhook className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className={styles.text.h4}>Webhooks</h3>
            <p className={styles.text.bodySmall}>Recevez des notifications sur vos endpoints (Zapier, Make, n8n…)</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg shrink-0"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>

        {webhooksLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />)}
          </div>
        ) : webhooks.length > 0 ? (
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
              >
                <div className={cn(styles.iconContainer.sm, 'bg-muted/60 shrink-0')}>
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(styles.text.label, 'text-sm truncate')}>{webhook.url}</p>
                  <p className={cn(styles.text.bodySmall, 'text-xs truncate text-muted-foreground')}>
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
                    title="Supprimer le webhook"
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
            <Webhook className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className={styles.text.bodyMuted}>Aucun webhook configuré</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Ajoutez un endpoint pour automatiser vos workflows</p>
          </div>
        )}

        {/* Events reference */}
        <div className="pt-3 border-t border-border/40 space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Événements disponibles</p>
          <div className="flex flex-wrap gap-1.5">
            {WEBHOOK_EVENTS.map(e => (
              <Badge key={e.value} variant="outline" className="text-[10px] font-mono">{e.value}</Badge>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Create webhook dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setNewWebhookUrl(''); setSelectedEvents([]); } }}>
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
                  onChange={e => setNewWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="pl-8 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">Doit commencer par https://</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Événements</Label>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map(event => (
                  <div key={event.value} className="flex items-center gap-2.5">
                    <Checkbox
                      id={event.value}
                      checked={selectedEvents.includes(event.value)}
                      onCheckedChange={() => toggleEvent(event.value)}
                      className="rounded"
                    />
                    <label htmlFor={event.value} className="flex-1 cursor-pointer">
                      <span className="text-sm font-medium">{event.label}</span>
                      <span className={cn(styles.text.bodySmall, 'block font-mono text-[10px]')}>{event.value}</span>
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
              {createWebhook.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Créer le webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Search Console */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <GscIntegrationSection />
      </motion.div>
    </motion.div>
  );
}
