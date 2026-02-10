'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileGeneralSchema, ProfileGeneralFormData } from './schemas';
import { useUserProfile, UserProfile } from '@/hooks/profile/useUserProfile';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Globe, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

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
    const { updateProfile } = useUserProfile();

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

    // Reset form when profile data changes (e.g. initial load)
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
                // Also update full_name for backward compatibility or display
                full_name: `${data.first_name} ${data.last_name}`.trim(),
            },
            {
                onSuccess: () => {
                    // Toast is already handled in the hook, but we can add specific logic here if needed
                }
            }
        );
    };

    return (
        <div className="space-y-6 w-full">
            <div className="w-full">
                <h2 className="text-2xl font-semibold mb-2">Informations personnelles</h2>
                <p className="text-sm text-muted-foreground">Gérez vos informations de profil</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            name="email"
                            render={() => ( // Not controlled by form
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input value={profile.email || ''} disabled className="bg-muted" />
                                    </FormControl>
                                    <FormDescription>
                                        Non modifiable
                                    </FormDescription>
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

                    <FormField
                        name="username"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom d'utilisateur</FormLabel>
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

                    <FormField
                        name="bio"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bio / Description</FormLabel>
                                <FormControl>
                                    <Input placeholder="Quelques mots à propos de vous..." {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Pays & Langue */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            name="country"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
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
                                    <FormLabel className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Langue de l'interface
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

                    {/* Fuseau horaire */}
                    <FormField
                        name="timezone"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
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

                    <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={updateProfile.isPending}>
                            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updateProfile.isPending ? 'Enregistrement...' : 'Mettre à jour'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
