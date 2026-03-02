'use client'

/**
 * StoreSettingsModal — Vercel-style SaaS settings
 *
 * Sections: Général / Identifiants / Synchronisation / Zone de danger
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import {
    Eye,
    EyeOff,
    Loader2,
    Key,
    Settings,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Globe,
    Clock,
    Unplug,
    Trash2,
    Copy,
    Shield,
    Zap,
    Info,
    Upload,
    Image as ImageIcon,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useUpdateStore, useDeleteStore } from '@/hooks/stores/useStores'
import { useReconnectStore } from '@/hooks/stores/useReconnectStore'
import { useStoreHeartbeat } from '@/hooks/stores/useStoreHeartbeat'
import { useStoreSyncSettings, useUpdateStoreSyncSettings } from '@/hooks/stores/useStoreSyncSettings'
import { useDisconnectStore } from '@/hooks/stores/useDisconnectStore'
import { useScheduleStoreDeletion } from '@/hooks/stores/useScheduleStoreDeletion'
import type { Store } from '@/types/store'
import type { ConnectionHealth } from '@/types/store'

// ============================================================================
// SCHEMAS
// ============================================================================

const generalSchema = z.object({
    name: z.string().min(1).max(64),
    logo_url: z.string().url().optional().or(z.literal('')),
    currency: z.string().length(3).optional().or(z.literal('')),
    primary_language: z.string().min(2).max(5).optional().or(z.literal('')),
    country_code: z.string().length(2).optional().or(z.literal('')),
})

const wooSchema = z.object({
    shop_url: z.string().url('URL invalide').min(1),
    consumer_key: z.string().min(1, 'Consumer Key requis'),
    consumer_secret: z.string().min(1, 'Consumer Secret requis'),
})

const wpSchema = z.object({
    wp_username: z.string().min(1, 'Nom d\'utilisateur requis'),
    wp_app_password: z.string().min(1, 'Mot de passe d\'application requis'),
})

type GeneralForm = z.infer<typeof generalSchema>
type WooForm = z.infer<typeof wooSchema>
type WpForm = z.infer<typeof wpSchema>

type Section = 'general' | 'credentials' | 'sync' | 'danger'

// ============================================================================
// NAV ITEMS
// ============================================================================

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'credentials', label: 'Identifiants', icon: Key },
    { id: 'sync', label: 'Synchronisation', icon: RefreshCw },
    { id: 'danger', label: 'Zone de danger', icon: AlertTriangle },
]

// ============================================================================
// HELPERS
// ============================================================================

function PasswordInput({ id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string }) {
    const [visible, setVisible] = useState(false)
    return (
        <div className="relative">
            <Input
                id={id}
                type={visible ? 'text' : 'password'}
                className="pr-10 font-mono text-xs"
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
            >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    )
}

function HealthBadge({ health }: { health: ConnectionHealth | undefined }) {
    if (!health || health === 'unknown') {
        return (
            <Badge variant="outline" className="text-[10px] gap-1 font-normal text-muted-foreground">
                <Clock className="w-3 h-3" /> Non vérifié
            </Badge>
        )
    }
    if (health === 'healthy') {
        return (
            <Badge variant="outline" className="text-[10px] gap-1 font-normal text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Connecté
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className="text-[10px] gap-1 font-normal text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
            <XCircle className="w-3 h-3" /> Hors ligne
        </Badge>
    )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="space-y-1 mb-6">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
    )
}

function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-xl border border-border bg-card p-4 space-y-4', className)}>
            {children}
        </div>
    )
}

// ============================================================================
// GENERAL TAB
// ============================================================================

function GeneralSection({ store, onClose }: { store: Store; onClose: () => void }) {
    const { mutate: updateStore, isPending } = useUpdateStore()
    const { mutate: checkHealth, isPending: isChecking } = useStoreHeartbeat()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const s = store as unknown as Record<string, unknown>
    const connectionHealth = store.platform_connections?.connection_health as ConnectionHealth | undefined
    const shopUrl = store.platform_connections?.shop_url

    const form = useForm<GeneralForm>({
        resolver: zodResolver(generalSchema),
        defaultValues: {
            name: store.name ?? '',
            logo_url: (s.logo_url as string) ?? '',
            currency: (s.currency as string) ?? '',
            primary_language: (s.primary_language as string) ?? '',
            country_code: (s.country_code as string) ?? '',
        },
    })

    const logoUrl = form.watch('logo_url')

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Fichier invalide', { description: 'Veuillez sélectionner une image.' })
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Fichier trop volumineux', { description: 'Taille maximale : 2 Mo.' })
            return
        }

        setIsUploading(true)
        try {
            const supabase = createClient()
            const ext = file.name.split('.').pop() ?? 'png'
            const filePath = `${store.id}/logo-${Date.now()}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('store-logos')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('store-logos')
                .getPublicUrl(filePath)

            form.setValue('logo_url', publicUrl, { shouldDirty: true })
            toast.success('Logo uploadé')
        } catch (err) {
            toast.error('Erreur d\'upload', { description: (err as Error).message })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleSubmit = form.handleSubmit((data) => {
        updateStore(
            {
                id: store.id,
                name: data.name,
                logo_url: data.logo_url || undefined,
                currency: data.currency ? data.currency.toUpperCase() : undefined,
                primary_language: data.primary_language || undefined,
                country_code: data.country_code ? data.country_code.toUpperCase() : undefined,
            },
            { onSuccess: onClose }
        )
    })

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Informations générales"
                description="Identité de votre boutique et paramètres régionaux."
            />

            {/* Connection Status Card */}
            <FieldGroup>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-foreground">Statut de connexion</p>
                            {shopUrl && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{shopUrl}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <HealthBadge health={connectionHealth} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => checkHealth(store.id)}
                            disabled={isChecking}
                        >
                            {isChecking ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </div>
                </div>
            </FieldGroup>

            {/* Store Identity Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <FieldGroup>
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs">Nom de la boutique</Label>
                        <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Ma Boutique"
                            maxLength={64}
                        />
                        {form.formState.errors.name && (
                            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    {/* Logo upload */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Logo de la boutique</Label>
                        <div className="flex items-center gap-4">
                            {/* Preview */}
                            <div className="flex items-center justify-center w-14 h-14 rounded-xl border border-border bg-muted overflow-hidden shrink-0">
                                {logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {isUploading ? 'Upload...' : 'Choisir une image'}
                                </Button>
                                <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG — max 2 Mo</p>
                            </div>
                        </div>
                    </div>
                </FieldGroup>

                <FieldGroup>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">Paramètres régionaux</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" className="w-64 text-xs space-y-1.5 p-3">
                                <p className="font-medium text-foreground">Codes standards</p>
                                <p className="text-muted-foreground leading-relaxed">
                                    <strong>Devise :</strong> Code ISO 4217 (EUR, USD, GBP…)<br />
                                    <strong>Langue :</strong> Code ISO 639 (fr, en, es…)<br />
                                    <strong>Pays :</strong> Code ISO 3166-1 alpha-2 (FR, US, GB…)
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                    Ces paramètres affectent l'affichage des prix et la langue du contenu généré par l'IA.
                                </p>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="currency" className="text-[10px] text-muted-foreground uppercase tracking-wider">Devise</Label>
                            <Input
                                id="currency"
                                {...form.register('currency')}
                                placeholder="EUR"
                                maxLength={3}
                                className="uppercase text-center"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="primary_language" className="text-[10px] text-muted-foreground uppercase tracking-wider">Langue</Label>
                            <Input
                                id="primary_language"
                                {...form.register('primary_language')}
                                placeholder="fr"
                                maxLength={5}
                                className="text-center"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="country_code" className="text-[10px] text-muted-foreground uppercase tracking-wider">Pays</Label>
                            <Input
                                id="country_code"
                                {...form.register('country_code')}
                                placeholder="FR"
                                maxLength={2}
                                className="uppercase text-center"
                            />
                        </div>
                    </div>
                </FieldGroup>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} size="sm">
                        Annuler
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                        {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        Enregistrer
                    </Button>
                </div>
            </form>
        </div>
    )
}

// ============================================================================
// CREDENTIALS SECTION
// ============================================================================

function CredentialsSection({ store }: { store: Store }) {
    const { mutate: reconnect, isPending: wooLoading } = useReconnectStore()
    const { mutate: checkHealth, isPending: isTesting } = useStoreHeartbeat()
    const [wpTestLoading, setWpTestLoading] = useState(false)
    const [wpSaving, setWpSaving] = useState(false)

    const s = store as unknown as Record<string, unknown>
    const pc = s.platform_connections as Record<string, unknown> | null | undefined
    const existingUrl = (pc?.shop_url as string) ?? ''
    const existingCreds = (pc?.credentials_encrypted as Record<string, unknown>) ?? {}

    const wooDefaults = {
        shop_url: existingUrl,
        consumer_key: (existingCreds.consumer_key as string) ?? '',
        consumer_secret: (existingCreds.consumer_secret as string) ?? '',
    }

    const wooForm = useForm<WooForm>({
        resolver: zodResolver(wooSchema),
        defaultValues: wooDefaults,
    })

    // Reset form when store data changes
    useEffect(() => {
        wooForm.reset(wooDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingUrl, existingCreds.consumer_key, existingCreds.consumer_secret])

    const wpConfig = (s.metadata as Record<string, unknown> | null)?.wordpress_blog as Record<string, unknown> | undefined

    const wpDefaults = {
        wp_username: (wpConfig?.wp_username as string) ?? '',
        wp_app_password: (wpConfig?.wp_app_password as string) ?? '',
    }

    const wpForm = useForm<WpForm>({
        resolver: zodResolver(wpSchema),
        defaultValues: wpDefaults,
    })

    // Reset form when store data changes (e.g. after save + refetch)
    useEffect(() => {
        wpForm.reset(wpDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wpConfig?.wp_username, wpConfig?.wp_app_password])

    const handleWoo = wooForm.handleSubmit((data) => {
        reconnect({
            storeId: store.id,
            credentials: {
                consumer_key: data.consumer_key,
                consumer_secret: data.consumer_secret,
            },
        })
    })

    const handleWp = wpForm.handleSubmit(async (data) => {
        setWpSaving(true)
        try {
            const supabase = createClient()
            const currentMeta = (s.metadata as Record<string, unknown>) ?? {}
            const currentWp = (currentMeta.wordpress_blog as Record<string, unknown>) ?? {}
            const { error } = await supabase
                .from('stores')
                .update({
                    metadata: {
                        ...currentMeta,
                        wordpress_blog: {
                            default_status: 'draft',
                            default_category_id: null,
                            sync_featured_images: true,
                            sync_categories: true,
                            sync_tags: true,
                            last_sync_at: null,
                            last_error: null,
                            ...currentWp,
                            wp_username: data.wp_username,
                            wp_app_password: data.wp_app_password,
                        },
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', store.id)
            if (error) throw error
            toast.success('WordPress mis à jour', {
                description: 'Identifiants WordPress enregistrés.',
            })
        } catch (err) {
            toast.error('Erreur de mise à jour', {
                description: (err as Error).message,
            })
        } finally {
            setWpSaving(false)
        }
    })

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Identifiants API"
                description="Clés d'accès pour la connexion WooCommerce et WordPress."
            />

            {/* WooCommerce */}
            <FieldGroup>
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/40">
                        <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">WooCommerce REST API</span>
                </div>
                <form onSubmit={handleWoo} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="shop_url" className="text-xs">URL de la boutique</Label>
                        <Input
                            id="shop_url"
                            {...wooForm.register('shop_url')}
                            placeholder="https://ma-boutique.com"
                            type="url"
                        />
                        {wooForm.formState.errors.shop_url && (
                            <p className="text-xs text-destructive">{wooForm.formState.errors.shop_url.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="consumer_key" className="text-xs">Consumer Key</Label>
                        <PasswordInput
                            id="consumer_key"
                            {...wooForm.register('consumer_key')}
                            placeholder="ck_xxxxxxxxxxxx"
                            autoComplete="off"
                        />
                        {wooForm.formState.errors.consumer_key && (
                            <p className="text-xs text-destructive">{wooForm.formState.errors.consumer_key.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="consumer_secret" className="text-xs">Consumer Secret</Label>
                        <PasswordInput
                            id="consumer_secret"
                            {...wooForm.register('consumer_secret')}
                            placeholder="cs_xxxxxxxxxxxx"
                            autoComplete="off"
                        />
                        {wooForm.formState.errors.consumer_secret && (
                            <p className="text-xs text-destructive">{wooForm.formState.errors.consumer_secret.message}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={wooLoading} className="flex-1">
                            {wooLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Mettre à jour
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => checkHealth(store.id)}
                            disabled={isTesting}
                        >
                            {isTesting ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Zap className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Tester
                        </Button>
                    </div>
                </form>
            </FieldGroup>

            {/* WordPress */}
            <FieldGroup>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/40">
                            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">WordPress Blog</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-normal">Application Password</Badge>
                </div>
                <form onSubmit={handleWp} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="wp_username" className="text-xs">Nom d'utilisateur</Label>
                        <Input
                            id="wp_username"
                            {...wpForm.register('wp_username')}
                            placeholder="admin"
                            autoComplete="off"
                        />
                        {wpForm.formState.errors.wp_username && (
                            <p className="text-xs text-destructive">{wpForm.formState.errors.wp_username.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="wp_app_password" className="text-xs">Mot de passe d'application</Label>
                        <PasswordInput
                            id="wp_app_password"
                            {...wpForm.register('wp_app_password')}
                            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                            autoComplete="off"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            WordPress → Utilisateurs → Profil → Mots de passe d'application.
                        </p>
                        {wpForm.formState.errors.wp_app_password && (
                            <p className="text-xs text-destructive">{wpForm.formState.errors.wp_app_password.message}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={wpSaving} className="flex-1">
                            {wpSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Mettre à jour
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={wpTestLoading}
                            onClick={async () => {
                                const shopUrl = store.platform_connections?.shop_url
                                const username = wpForm.getValues('wp_username')
                                const password = wpForm.getValues('wp_app_password')
                                if (!shopUrl || !username || !password) {
                                    toast.error('Champs manquants', { description: 'Remplissez tous les champs WordPress.' })
                                    return
                                }
                                setWpTestLoading(true)
                                try {
                                    const base = shopUrl.replace(/\/+$/, '')
                                    const res = await fetch(`${base}/wp-json/wp/v2/users/me`, {
                                        headers: {
                                            'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
                                        },
                                    })
                                    if (res.ok) {
                                        toast.success('WordPress — Connecté', { description: 'Identifiants valides.' })
                                    } else {
                                        toast.error('WordPress — Échec', { description: `Statut ${res.status}` })
                                    }
                                } catch (err) {
                                    toast.error('WordPress — Erreur', { description: (err as Error).message })
                                } finally {
                                    setWpTestLoading(false)
                                }
                            }}
                        >
                            {wpTestLoading ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Zap className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Tester
                        </Button>
                    </div>
                </form>
            </FieldGroup>
        </div>
    )
}

// ============================================================================
// SYNC SECTION
// ============================================================================

function SyncSection({ store }: { store: Store }) {
    const { data: syncSettings, isLoading } = useStoreSyncSettings(store.id)
    const { mutate: updateSync, isPending } = useUpdateStoreSyncSettings()

    const handleToggle = useCallback(
        (key: keyof NonNullable<typeof syncSettings>, value: boolean) => {
            updateSync({ storeId: store.id, settings: { [key]: value } })
        },
        [store.id, updateSync]
    )

    const handleIntervalChange = useCallback(
        (hours: number) => {
            updateSync({ storeId: store.id, settings: { sync_interval_hours: hours } })
        },
        [store.id, updateSync]
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const intervals = [
        { value: 6, label: '6h' },
        { value: 12, label: '12h' },
        { value: 24, label: '24h' },
        { value: 168, label: '7j' },
    ]

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Synchronisation"
                description="Contrôlez la fréquence et le contenu de la synchronisation avec votre boutique."
            />

            {/* Auto-sync toggle */}
            <FieldGroup>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-foreground">Synchronisation automatique</p>
                            <p className="text-[10px] text-muted-foreground">Importer les changements périodiquement</p>
                        </div>
                    </div>
                    <Switch
                        checked={syncSettings?.auto_sync_enabled ?? false}
                        onCheckedChange={(v) => handleToggle('auto_sync_enabled', v)}
                        disabled={isPending}
                    />
                </div>

                {syncSettings?.auto_sync_enabled && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fréquence</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {intervals.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleIntervalChange(value)}
                                        disabled={isPending}
                                        className={cn(
                                            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                            syncSettings.sync_interval_hours === value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </FieldGroup>

            {/* Sync entities */}
            <FieldGroup>
                <p className="text-xs font-medium text-foreground mb-3">Contenu synchronisé</p>
                {[
                    { key: 'sync_products' as const, label: 'Produits', desc: 'Titres, descriptions, prix, images' },
                    { key: 'sync_categories' as const, label: 'Catégories', desc: 'Arborescence des catégories' },
                    { key: 'sync_variations' as const, label: 'Variations', desc: 'Tailles, couleurs, déclinaisons' },
                    { key: 'sync_posts' as const, label: 'Articles de blog', desc: 'Articles WordPress' },
                ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-2">
                        <div>
                            <p className="text-xs font-medium text-foreground">{label}</p>
                            <p className="text-[10px] text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                            checked={syncSettings?.[key] ?? false}
                            onCheckedChange={(v) => handleToggle(key, v)}
                            disabled={isPending}
                        />
                    </div>
                ))}
            </FieldGroup>

            {/* Notifications */}
            <FieldGroup>
                <p className="text-xs font-medium text-foreground mb-3">Notifications</p>
                {[
                    { key: 'notify_on_complete' as const, label: 'Sync réussie', desc: 'Notification à chaque sync terminée' },
                    { key: 'notify_on_error' as const, label: 'Erreurs', desc: 'Alerte en cas d\'échec de sync' },
                ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-2">
                        <div>
                            <p className="text-xs font-medium text-foreground">{label}</p>
                            <p className="text-[10px] text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                            checked={syncSettings?.[key] ?? false}
                            onCheckedChange={(v) => handleToggle(key, v)}
                            disabled={isPending}
                        />
                    </div>
                ))}
            </FieldGroup>
        </div>
    )
}

// ============================================================================
// DANGER ZONE SECTION
// ============================================================================

function DangerSection({ store, onClose }: { store: Store; onClose: () => void }) {
    const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectStore()
    const { mutate: scheduleDeletion, isPending: isScheduling } = useScheduleStoreDeletion()
    const { mutate: deleteStore, isPending: isDeleting } = useDeleteStore()
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [immediateConfirm, setImmediateConfirm] = useState('')

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Zone de danger"
                description="Actions irréversibles qui affectent votre boutique et ses données."
            />

            {/* Disconnect */}
            <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 shrink-0 mt-0.5">
                        <Unplug className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">Déconnecter la boutique</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            Désactive toutes les synchronisations. Les données restent intactes. Vous pourrez reconnecter plus tard.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect({ storeId: store.id })}
                    disabled={isDisconnecting}
                    className="w-full border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                >
                    {isDisconnecting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    <Unplug className="w-3.5 h-3.5 mr-1.5" />
                    Déconnecter
                </Button>
            </div>

            {/* Delete */}
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">Supprimer la boutique</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            Planifie la suppression sous 7 jours. Tous les produits, articles et historiques seront supprimés définitivement.
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground">
                        Tapez <span className="font-mono font-bold text-red-600 dark:text-red-400">SUPPRIMER</span> pour confirmer
                    </Label>
                    <Input
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="SUPPRIMER"
                        className="font-mono text-xs border-red-200 dark:border-red-800"
                    />
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        scheduleDeletion(
                            { storeId: store.id, confirmation: deleteConfirm },
                            { onSuccess: onClose }
                        )
                    }}
                    disabled={deleteConfirm !== 'SUPPRIMER' || isScheduling}
                    className="w-full"
                >
                    {isScheduling && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Planifier la suppression
                </Button>
            </div>

            {/* Immediate Delete */}
            <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-100/50 dark:bg-red-950/40 p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-200 dark:bg-red-900/60 shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-300" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">Supprimer immédiatement</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            Supprime la boutique et toutes ses données <strong>maintenant</strong>, sans délai de grâce. Cette action est irréversible.
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground">
                        Tapez <span className="font-mono font-bold text-red-600 dark:text-red-400">SUPPRIMER</span> pour confirmer
                    </Label>
                    <Input
                        value={immediateConfirm}
                        onChange={(e) => setImmediateConfirm(e.target.value)}
                        placeholder="SUPPRIMER"
                        className="font-mono text-xs border-red-300 dark:border-red-700"
                    />
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        deleteStore(store.id, { onSuccess: onClose })
                    }}
                    disabled={immediateConfirm !== 'SUPPRIMER' || isDeleting}
                    className="w-full"
                >
                    {isDeleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Supprimer immédiatement
                </Button>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN MODAL
// ============================================================================

interface StoreSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    store: Store
}

export function StoreSettingsModal({ open, onOpenChange, store }: StoreSettingsModalProps) {
    const [activeSection, setActiveSection] = useState<Section>('general')

    const handleClose = () => {
        onOpenChange(false)
        setTimeout(() => setActiveSection('general'), 200)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] p-0 gap-0 overflow-hidden">
                <div className="flex h-full max-h-[85vh]">
                    {/* Sidebar Nav */}
                    <div className="w-[180px] shrink-0 border-r border-border bg-muted/30 p-4 space-y-1">
                        <DialogHeader className="pb-3">
                            <DialogTitle className="text-sm font-bold truncate">
                                {store.name}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] text-muted-foreground">
                                Paramètres
                            </DialogDescription>
                        </DialogHeader>

                        <Separator className="mb-2" />

                        <nav className="space-y-0.5">
                            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveSection(id)}
                                    className={cn(
                                        'w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left',
                                        activeSection === id
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                                        id === 'danger' && activeSection === id && 'text-red-600 dark:text-red-400'
                                    )}
                                >
                                    <Icon className={cn(
                                        'w-3.5 h-3.5 shrink-0',
                                        id === 'danger' && 'text-red-500'
                                    )} />
                                    {label}
                                </button>
                            ))}
                        </nav>

                        {/* Store ID copy */}
                        <div className="pt-4 mt-auto">
                            <Separator className="mb-3" />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(store.id)
                                    toast.success('ID copié')
                                }}
                                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full group"
                                title="Copier l'ID"
                            >
                                <Copy className="w-3 h-3 shrink-0" />
                                <span className="font-mono break-all text-left leading-relaxed">{store.id}</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeSection === 'general' && (
                            <GeneralSection store={store} onClose={handleClose} />
                        )}
                        {activeSection === 'credentials' && (
                            <CredentialsSection store={store} />
                        )}
                        {activeSection === 'sync' && (
                            <SyncSection store={store} />
                        )}
                        {activeSection === 'danger' && (
                            <DangerSection store={store} onClose={handleClose} />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
