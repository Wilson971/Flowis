import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme, THEME_PALETTES } from "@/contexts/ThemeContext";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun, Monitor, Palette, Layout } from "lucide-react";

export function ProfileSecuritySection() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Sécurité</h3>
                <p className="text-sm text-muted-foreground">Gérez votre mot de passe et la double authentification.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Mot de passe</CardTitle>
                    <CardDescription>Changer votre mot de passe</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Fonctionnalité à venir...</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function ProfileNotificationsSection() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">Gérez vos préférences de notifications.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Fonctionnalité à venir...</p>
                </CardContent>
            </Card>
        </div>
    );
}


export function ProfilePreferencesSection() {
    const { theme, setTheme, palette, setBrandTheme, radius, setRadius } = useTheme();

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold tracking-tight">Apparence & Personnalisation</h3>
                <p className="text-sm text-muted-foreground">Personnalisez l'interface de votre tableau de bord selon vos goûts.</p>
            </div>

            {/* Mode Sombre / Clair */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Monitor className="w-4 h-4" />
                    <span>Mode d'affichage</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'light', name: 'Clair', icon: Sun },
                        { id: 'dark', name: 'Sombre', icon: Moon },
                    ].map((mode) => (
                        <Button
                            key={mode.id}
                            variant="outline"
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 h-20 border-2 transition-all duration-300",
                                theme === mode.id
                                    ? "border-primary bg-primary/5 shadow-glow-sm"
                                    : "border-border/50 hover:border-primary/50"
                            )}
                            onClick={() => setTheme(mode.id as 'light' | 'dark')}
                        >
                            <mode.icon className={cn("w-5 h-5", theme === mode.id ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-bold">{mode.name}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Palette de couleurs */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Palette className="w-4 h-4" />
                    <span>Palette de couleurs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {THEME_PALETTES.map((p) => (
                        <button
                            key={p.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-300 group",
                                palette.id === p.id
                                    ? "border-primary bg-primary/5 shadow-glow-sm"
                                    : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                            )}
                            onClick={() => setBrandTheme(p.id)}
                        >
                            <div className="w-10 h-10 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: p.previewColor }} />
                            <div className="flex-1">
                                <p className={cn("text-sm font-bold", palette.id === p.id ? "text-primary" : "text-foreground")}>{p.name}</p>
                            </div>
                            {palette.id === p.id && (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Arrondi des bordures */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <Layout className="w-4 h-4" />
                        <span>Style des bordures</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase font-bold tracking-widest">{radius}px</span>
                </div>
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <Slider
                                value={[radius]}
                                min={0}
                                max={24}
                                step={2}
                                onValueChange={(val) => setRadius(val[0])}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Sharp</span>
                                <span>Default</span>
                                <span>Extra Rounded</span>
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="pt-4 border-t border-border/20">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Aperçu</p>
                            <div className="flex gap-4">
                                <div
                                    className="h-16 w-32 border-2 border-primary/20 bg-primary/5 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight text-primary transition-all duration-300"
                                    style={{ borderRadius: `${radius}px` }}
                                >
                                    Bouton
                                </div>
                                <div
                                    className="h-16 flex-1 border border-border/50 bg-muted/30 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground transition-all duration-300"
                                    style={{ borderRadius: `${radius}px` }}
                                >
                                    Carte
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function ProfileAISection() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Intelligence Artificielle</h3>
                <p className="text-sm text-muted-foreground">Configurez vos préférences IA.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Fonctionnalité à venir...</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function ProfileDangerZoneSection() {
    return (
        <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-950/20">
                <h3 className="text-lg font-medium text-red-600">Zone de danger</h3>
                <p className="text-sm text-red-500">Actions irréversibles.</p>
            </div>
        </div>
    );
}

export function ProfileIntegrationsSection() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Intégrations</h3>
                <p className="text-sm text-muted-foreground">Connectez vos outils externes.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Fonctionnalité à venir...</p>
                </CardContent>
            </Card>
        </div>
    );
}
