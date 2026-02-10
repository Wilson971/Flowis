/**
 * ProfileForm - Formulaire d'édition de profil
 */
'use client';

import { useUserProfile } from '@/hooks/profile/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';
import { useState, useRef } from 'react';

export function ProfileForm() {
    const { profile, isLoading, updateProfile, updateAvatar } = useUserProfile();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [email, setEmail] = useState(profile?.email || ''); // Usually readonly from Auth
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when profile loads
    if (profile && !fullName && !isLoading) {
        setFullName(profile.full_name || '');
        setEmail(profile.email || '');
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate({ full_name: fullName });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateAvatar.mutate(file);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>
                    Gérez vos informations publiques et privées.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleAvatarClick}>
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={updateAvatar.isPending}>
                                {updateAvatar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Changer l'avatar
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                JPG, GIF ou PNG. 1MB max.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={email} disabled />
                            <p className="text-[10px] text-muted-foreground">
                                Géré via votre provider d'authentification.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullname">Nom complet</Label>
                            <Input
                                id="fullname"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" disabled={updateProfile.isPending}>
                                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
