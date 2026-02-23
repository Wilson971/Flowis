'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSelectedStore } from '@/contexts/StoreContext'
import { useUpdateStore } from '@/hooks/stores/useStores'
import { useReconnectStore } from '@/hooks/stores/useReconnectStore'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { styles, motionTokens } from '@/lib/design-system'
import { toast } from 'sonner'

const storeGeneralSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  description: z.string().max(500).optional(),
})

const credentialsSchema = z.object({
  shop_url: z.string().url('URL invalide').min(1, 'URL requise'),
  api_key: z.string().min(1, 'Consumer Key requis'),
  api_secret: z.string().min(1, 'Consumer Secret requis'),
})

type StoreGeneralFormValues = z.infer<typeof storeGeneralSchema>
type CredentialsFormValues = z.infer<typeof credentialsSchema>

export default function StoreGeneralSection() {
  const { selectedStore, isLoading: storeLoading } = useSelectedStore()
  const updateStore = useUpdateStore()
  const reconnectStore = useReconnectStore()

  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const form = useForm<StoreGeneralFormValues>({
    resolver: zodResolver(storeGeneralSchema),
    defaultValues: { name: '', description: '' },
  })

  const credForm = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { shop_url: '', api_key: '', api_secret: '' },
  })

  useEffect(() => {
    if (selectedStore) {
      form.reset({
        name: selectedStore.name || '',
        description: (selectedStore as any).description || '',
      })
      credForm.reset({
        shop_url: selectedStore.platform_connections?.shop_url || '',
        api_key: '',    // Never pre-fill secrets
        api_secret: '',
      })
      setTestResult(null)
    }
  }, [selectedStore?.id])

  const onSubmit = (data: StoreGeneralFormValues) => {
    if (!selectedStore) return
    updateStore.mutate({
      id: selectedStore.id,
      name: data.name,
      description: data.description || null,
    })
  }

  const handleTestConnection = async () => {
    if (!selectedStore) return
    const values = credForm.getValues()
    setIsTestingConnection(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/stores/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_url: values.shop_url || selectedStore.platform_connections?.shop_url,
          api_key: values.api_key,
          api_secret: values.api_secret,
          platform: selectedStore.platform,
        }),
      })
      const result = await res.json()
      setTestResult(result)
    } catch {
      setTestResult({ success: false, message: 'Impossible de joindre le serveur.' })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleReconnect = async (data: CredentialsFormValues) => {
    if (!selectedStore) return
    setTestResult(null)
    reconnectStore.mutate({
      storeId: selectedStore.id,
      credentials: {
        shop_url: data.shop_url,
        api_key: data.api_key,
        api_secret: data.api_secret,
      },
    })
  }

  const isDirty = form.formState.isDirty
  const health = (selectedStore as any)?.platform_connections?.connection_health

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedStore) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-16 space-y-3"
        variants={motionTokens.variants.fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Store className="h-10 w-10 text-muted-foreground/40" />
        <p className={styles.text.bodyMuted}>Sélectionnez une boutique dans la barre latérale</p>
      </motion.div>
    )
  }

  const platformLabel = selectedStore.platform === 'woocommerce' ? 'WooCommerce' : 'Shopify'
  const shopUrl = selectedStore.platform_connections?.shop_url
  const healthOk = health === 'healthy'
  const healthBad = health === 'unhealthy'

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Boutique</h2>
        <p className={styles.text.bodyMuted}>Paramètres généraux de {selectedStore.name}</p>
      </motion.div>

      {/* ── Info card ──────────────────────────────── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <motion.div
            variants={motionTokens.variants.staggerItem}
            className={cn(styles.card.glass, 'p-6 space-y-5')}
          >
            <div className="flex items-center gap-3">
              <div className={cn(styles.iconContainer.sm, styles.iconContainer.muted, 'bg-primary/10')}>
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className={styles.text.h4}>Informations</h3>
                <p className={styles.text.bodySmall}>Identité de la boutique</p>
              </div>
              <Badge variant="outline" className="text-xs">{platformLabel}</Badge>
            </div>

            {/* Shop URL (read-only) */}
            {shopUrl && (
              <div className="space-y-1.5">
                <p className={styles.text.label}>URL de la boutique</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className={cn(styles.text.bodySmall, 'truncate')}>{shopUrl}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-lg"
                    onClick={() => window.open(shopUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la boutique</FormLabel>
                  <FormControl>
                    <Input placeholder="Ma Boutique" {...field} />
                  </FormControl>
                  <FormDescription>Nom affiché dans FLOWZ</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description optionnelle de la boutique..."
                      className="resize-none min-h-[80px] rounded-lg"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Save footer */}
          <motion.div
            variants={motionTokens.variants.staggerItem}
            className="flex items-center justify-between pt-3 border-t border-border/40"
          >
            <div className="flex items-center gap-2">
              {isDirty ? (
                <>
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-xs text-warning font-medium">Modifications non sauvegardées</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Boutique à jour</span>
                </>
              )}
            </div>
            <Button type="submit" disabled={updateStore.isPending} className="rounded-lg">
              {updateStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {updateStore.isPending ? 'Enregistrement...' : 'Mettre à jour'}
            </Button>
          </motion.div>
        </form>
      </Form>

      {/* ── Connection / Credentials card ──────────── */}
      <Form {...credForm}>
        <form onSubmit={credForm.handleSubmit(handleReconnect)}>
          <motion.div
            variants={motionTokens.variants.staggerItem}
            className={cn(
              styles.card.glass,
              'p-6 space-y-5',
              healthBad && 'border-destructive/40 bg-destructive/5'
            )}
          >
            {/* Card header */}
            <div className="flex items-center gap-3">
              <div className={cn(
                styles.iconContainer.sm,
                healthOk ? 'bg-emerald-500/10' : healthBad ? 'bg-destructive/10' : 'bg-muted/60'
              )}>
                <Key className={cn('h-4 w-4', healthOk ? 'text-emerald-600' : healthBad ? 'text-destructive' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1">
                <h3 className={styles.text.h4}>Connexion API</h3>
                <p className={styles.text.bodySmall}>Credentials {platformLabel}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {healthOk ? (
                  <><Wifi className="h-3.5 w-3.5 text-emerald-600" /><span className="text-xs text-emerald-600 font-medium">Connecté</span></>
                ) : healthBad ? (
                  <><WifiOff className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-destructive font-medium">Déconnecté</span></>
                ) : (
                  <span className="text-xs text-muted-foreground">Statut inconnu</span>
                )}
              </div>
            </div>

            {healthBad && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive/90">
                  La connexion est interrompue. Mettez à jour vos credentials pour rétablir la synchronisation.
                </p>
              </div>
            )}

            {/* Shop URL */}
            <FormField
              name="shop_url"
              control={credForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la boutique</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="https://votreboutique.com" className="pl-8 rounded-lg" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Consumer Key */}
            <FormField
              name="api_key"
              control={credForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={selectedStore.platform_connections?.api_key ? '••••••••' + (selectedStore.platform_connections.api_key.slice(-4) || '') : 'ck_...'}
                        className="pr-10 rounded-lg font-mono text-sm"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowApiKey(!showApiKey)}
                        tabIndex={-1}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Consumer Secret */}
            <FormField
              name="api_secret"
              control={credForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumer Secret</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiSecret ? 'text' : 'password'}
                        placeholder="cs_..."
                        className="pr-10 rounded-lg font-mono text-sm"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        tabIndex={-1}
                      >
                        {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Test result feedback */}
            {testResult && (
              <div className={cn(
                'flex items-start gap-2 rounded-lg p-3 text-sm',
                testResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              )}>
                {testResult.success
                  ? <Wifi className="h-4 w-4 shrink-0 mt-0.5" />
                  : <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
                }
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                disabled={isTestingConnection}
                onClick={handleTestConnection}
              >
                {isTestingConnection
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <RefreshCw className="mr-2 h-4 w-4" />
                }
                Tester la connexion
              </Button>
              <Button
                type="submit"
                className="rounded-lg ml-auto"
                disabled={reconnectStore.isPending}
              >
                {reconnectStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reconnecter la boutique
              </Button>
            </div>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  )
}
