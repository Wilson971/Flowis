'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileGeneralSchema, ProfileGeneralFormData } from './schemas';
import { useUserProfile, UserProfile } from '@/hooks/profile/useUserProfile';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Globe, Loader2, Camera, User, Briefcase, AtSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import { SettingsCard, SettingsHeader } from '@/components/settings/ui/SettingsCard';

const COUNTRIES = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'CH', name: 'Suisse' },
    { code: 'CA', name: 'Canada' },
    { code: 'US', name: 'États-Unis' },
    { code: 'GB', name: 'Royaume-Uni' },
    { code: 'DE', name: 'Allemagne' },
    { code: 'ES', name: 'Espagne' },
    { code: 'IT', name: 'Italie' },
];

const LANGUAGES = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
];

interface Props {
    profile: UserProfile;
}

export default function ProfileGeneralSection({ profile }: Props) {
    const { updateProfile, updateAvatar } = useUserProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileGeneralFormData>({
        resolver: zodResolver(profileGeneralSchema),
        defaultValues: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            username: profile.username || '',
            country: profile.country || 'FR',
            timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: (profile.language as any) || 'fr',
            phone: profile.phone || '',
            job_title: profile.job_title || '',
            company: profile.company || '',
            bio: profile.bio || '',
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                username: profile.username || '',
                country: profile.country || 'FR',
                timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: (profile.language as any) || 'fr',
                phone: profile.phone || '',
                job_title: profile.job_title || '',
                company: profile.company || '',
                bio: profile.bio || '',
            });
        }
    }, [profile, form]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("L'image ne doit pas dépasser 2 Mo");
            return;
        }
        updateAvatar.mutate(file);
    };

    const initials = [
        form.watch('first_name') || profile.first_name || '',
        form.watch('last_name') || profile.last_name || '',
    ]
        .map((n) => n.charAt(0).toUpperCase())
        .join('') || (profile.email?.charAt(0).toUpperCase() ?? '?');

    const handleAutoDetectTimezone = () => {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        form.setValue('timezone', detected);
    };

    const onSubmit = (data: ProfileGeneralFormData) => {
        updateProfile.mutate(
            {
                first_name: data.first_name,
                last_name: data.last_name,
                username: data.username || null,
                country: data.country || null,
                timezone: data.timezone || null,
                language: data.language || null,
                phone: data.phone || null,
                job_title: data.job_title || null,
                company: data.company || null,
                bio: data.bio || null,
                full_name: `${data.first_name} ${data.last_name}`.trim(),
            },
            { onSuccess: () => {} }
        );
    };

    const isDirty = form.formState.isDirty;

    return (
        <motion.div
            className="space-y-4 w-full"
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    {/* ── CARD 1 : Identité ────────────────────── */}
                    <motion.div variants={motionTokens.variants.staggerItem}>
                        <SettingsCard className="space-y-5">
                            <SettingsHeader
                                icon={User}
                                title="Identité"
                                description="Votre profil public"
                            />

                            {/* Avatar */}
                            <div className="flex items-center gap-5">
                                <div
                                    className="relative group cursor-pointer shrink-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {/* Glow ring — monochrome */}
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-foreground/20 via-foreground/10 to-transparent opacity-50 blur-md group-hover:opacity-80 transition-opacity duration-300" />
                                    <Avatar className="relative w-20 h-20 ring-2 ring-background">
                                        <AvatarImage src={profile.avatar_url || undefined} alt="Avatar" />
                                        <AvatarFallback className="text-lg font-semibold bg-muted/60 text-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {updateAvatar.isPending
                                            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            : <Camera className="w-5 h-5 text-white" />
                                        }
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[13px] font-medium text-foreground">Photo de profil</p>
                                    <p className="text-xs text-muted-foreground">JPG, PNG — max 2 Mo</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={updateAvatar.isPending}
                                        className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent"
                                    >
                                        {updateAvatar.isPending ? 'Envoi...' : 'Changer la photo'}
                                    </Button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            {/* First + Last name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    name="first_name"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prénom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="last_name"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Username */}
                            <FormField
                                name="username"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                                            Nom d&apos;utilisateur
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="john_doe" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormDescription>
                                            Visible publiquement. Lettres, chiffres, - et _ uniquement.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Bio */}
                            <FormField
                                name="bio"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio / Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Quelques mots à propos de vous..."
                                                className="resize-none min-h-[80px] rounded-lg"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </SettingsCard>
                    </motion.div>

                    {/* ── CARD 2 : Contact & Professionnel ─────── */}
                    <motion.div variants={motionTokens.variants.staggerItem}>
                        <SettingsCard className="space-y-5">
                            <SettingsHeader
                                icon={Briefcase}
                                title="Contact & Professionnel"
                                description="Informations de contact et emploi"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email — read-only */}
                                <FormField
                                    name="email"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        value={profile.email || ''}
                                                        disabled
                                                        className="bg-muted/50 cursor-not-allowed pr-20"
                                                    />
                                                    <Badge
                                                        variant="secondary"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 rounded-full px-2 text-[10px] font-medium border-0 pointer-events-none"
                                                    >
                                                        Fixé
                                                    </Badge>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="phone"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Téléphone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+33 6 12 34 56 78" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    name="job_title"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Poste / Fonction</FormLabel>
                                            <FormControl>
                                                <Input placeholder="E-commerce Manager" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="company"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entreprise</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ma Boutique" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </SettingsCard>
                    </motion.div>

                    {/* ── CARD 3 : Localisation & Langue ────────── */}
                    <motion.div variants={motionTokens.variants.staggerItem}>
                        <SettingsCard className="space-y-5">
                            <SettingsHeader
                                icon={Globe}
                                title="Localisation & Langue"
                                description="Région, fuseau horaire et langue d'interface"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    name="country"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                Pays
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un pays" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country.code} value={country.code}>
                                                            {country.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="language"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                Langue de l&apos;interface
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || 'fr'}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner une langue" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {LANGUAGES.map((lang) => (
                                                        <SelectItem key={lang.code} value={lang.code}>
                                                            {lang.name}
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
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            Fuseau horaire
                                        </FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input {...field} placeholder="Europe/Paris" value={field.value || ''} />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleAutoDetectTimezone}
                                                className="shrink-0 h-7 text-[11px] rounded-lg gap-1.5 font-medium"
                                            >
                                                Auto
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            Détecté automatiquement : {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </SettingsCard>
                    </motion.div>

                    {/* ── Save footer ───────────────────────────── */}
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
                                    <span className="text-xs text-muted-foreground">Profil à jour</span>
                                </>
                            )}
                        </div>
                        <Button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
                        >
                            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updateProfile.isPending ? 'Enregistrement...' : 'Mettre à jour'}
                        </Button>
                    </motion.div>
                </form>
            </Form>
        </motion.div>
    );
}
