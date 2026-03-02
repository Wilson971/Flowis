'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workspaceGeneralSchema, type WorkspaceGeneralFormValues } from '@/schemas/workspace'
import { useWorkspace } from '@/hooks/workspace'
import { CURRENCIES, LANGUAGES, TIMEZONES } from '@/constants/plans'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  SettingsCard,
  SettingsHeader,
} from '@/components/settings/ui/SettingsCard'
import { Loader2, Camera, Building2, Globe, Clock, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-system'

export default function WorkspaceGeneralSection() {
  const { workspace, isLoading, updateWorkspace, uploadLogo } = useWorkspace()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<WorkspaceGeneralFormValues>({
    resolver: zodResolver(workspaceGeneralSchema),
    defaultValues: {
      name: '',
      currency: 'EUR',
      default_language: 'fr',
      timezone: 'Europe/Paris',
    },
  })

  useEffect(() => {
    if (workspace) {
      form.reset({
        name: workspace.name || '',
        currency: workspace.currency || 'EUR',
        default_language: workspace.default_language as 'fr' | 'en' | 'es' | 'de' || 'fr',
        timezone: workspace.timezone || 'Europe/Paris',
      })
    }
  }, [workspace, form])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo")
      return
    }
    uploadLogo.mutate(file)
  }

  const onSubmit = (data: WorkspaceGeneralFormValues) => {
    updateWorkspace.mutate(data)
  }

  const isDirty = form.formState.isDirty

  const initials = workspace?.name
    ? workspace.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('')
    : 'W'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* CARD 1 : Identité du workspace */}
          <motion.div variants={motionTokens.variants.staggerItem}>
            <SettingsCard className="space-y-5">
              <SettingsHeader
                icon={Building2}
                title="Identité"
                description="Nom et logo de votre workspace"
              />

              {/* Logo */}
              <div className="flex items-center gap-5">
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-foreground/20 via-foreground/10 to-transparent opacity-50 blur-md group-hover:opacity-80 transition-opacity duration-300" />
                  <Avatar className="relative w-16 h-16 rounded-xl ring-2 ring-background">
                    <AvatarImage src={workspace?.logo_url || undefined} alt="Logo" className="rounded-xl" />
                    <AvatarFallback className="text-lg font-semibold bg-muted/60 text-foreground rounded-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {uploadLogo.isPending ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-foreground">Logo du workspace</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG — max 2 Mo</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLogo.isPending}
                    className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent"
                  >
                    {uploadLogo.isPending ? 'Envoi...' : 'Changer le logo'}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              {/* Name */}
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-foreground">Nom du workspace</FormLabel>
                    <FormControl>
                      <Input placeholder="Mon Workspace" {...field} />
                    </FormControl>
                    <FormDescription>
                      Visible par tous les membres de l&apos;équipe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsCard>
          </motion.div>

          {/* CARD 2 : Localisation & Devise */}
          <motion.div variants={motionTokens.variants.staggerItem}>
            <SettingsCard className="space-y-5">
              <SettingsHeader
                icon={Globe}
                title="Localisation & Devise"
                description="Paramètres régionaux par défaut"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  name="currency"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60" />
                        Devise
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une devise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="default_language"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                        Langue par défaut
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une langue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name="timezone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                      Fuseau horaire
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un fuseau horaire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsCard>
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
                  <span className="text-xs text-muted-foreground">Workspace à jour</span>
                </>
              )}
            </div>
            <Button
              type="submit"
              disabled={updateWorkspace.isPending}
              className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
            >
              {updateWorkspace.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {updateWorkspace.isPending ? 'Enregistrement...' : 'Mettre à jour'}
            </Button>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  )
}
