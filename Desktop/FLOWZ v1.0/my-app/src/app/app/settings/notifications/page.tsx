/**
 * Page de préférences de notifications
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NotificationsSettingsPage() {
    // Mock state for now, ideally connected to useUserProfile().preferences
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);
    const [securityNotifs, setSecurityNotifs] = useState(true);

    const handleSave = () => {
        // Mock save
        toast.success("Préférences enregistrées");
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                    Configurez comment vous recevez les notifications.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Canaux de communication</CardTitle>
                    <CardDescription>
                        Choisissez vos méthodes de réception favorites.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email" className="flex flex-col space-y-1">
                            <span>Email</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Recevoir un digest quotidien de l'activité.
                            </span>
                        </Label>
                        <Switch id="email" checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="push" className="flex flex-col space-y-1">
                            <span>Push Notifications</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Recevoir des alertes en temps réel sur votre navigateur.
                            </span>
                        </Label>
                        <Switch id="push" checked={pushNotifs} onCheckedChange={setPushNotifs} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Types d'alertes</CardTitle>
                    <CardDescription>
                        Filtrer les notifications par catégorie.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="security" className="flex flex-col space-y-1">
                            <span>Sécurité & Système</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Alertes critiques concernant votre compte ou les erreurs système.
                            </span>
                        </Label>
                        <Switch id="security" checked={securityNotifs} onCheckedChange={setSecurityNotifs} disabled />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
