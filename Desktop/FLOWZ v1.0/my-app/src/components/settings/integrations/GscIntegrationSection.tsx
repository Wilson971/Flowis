"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { styles } from "@/lib/design-system";
import {
    Search,
    ExternalLink,
    RefreshCw,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Globe,
    Mail,
} from "lucide-react";
import { useGscConnection } from "@/hooks/integrations/useGscConnection";

export default function GscIntegrationSection() {
    const {
        connections,
        activeConnection,
        isLoading,
        isConnected,
        sync,
        isSyncing,
        disconnect,
        isDisconnecting,
    } = useGscConnection();

    const [confirmingDisconnect, setConfirmingDisconnect] = useState<string | null>(null);

    const handleConnect = () => {
        window.location.href = "/api/gsc/oauth/authorize";
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Jamais";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Il y a quelques secondes";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `Il y a ${diffH}h`;
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className={cn(styles.text.h3)}>Google Search Console</h2>
                    <p className={cn(styles.text.bodyMuted, "mt-1")}>Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className={cn(styles.text.h3)}>Google Search Console</h2>
                <p className={cn(styles.text.bodyMuted, "mt-1")}>
                    Connectez votre Google Search Console pour recuperer les donnees de mots-cles reels et ameliorer vos scores SEO.
                </p>
            </div>

            {!isConnected ? (
                /* ===================== NOT CONNECTED ===================== */
                <Card className={cn(styles.card.base)}>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-4 py-6">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Search className="h-7 w-7 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className={cn(styles.text.h4)}>Connecter Google Search Console</h3>
                                <p className={cn(styles.text.bodyMuted, "max-w-md")}>
                                    Accedez aux donnees reelles de recherche Google : mots-cles, impressions, clics, position moyenne.
                                    Ces donnees enrichissent vos scores SEO et les suggestions IA.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 text-left text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Mots-cles reels de votre boutique
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Suggestions IA basees sur les vraies recherches
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Score SEO enrichi avec les donnees de trafic
                                </div>
                            </div>
                            <Button onClick={handleConnect} className="mt-2 gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Connecter GSC
                            </Button>
                            <p className="text-[11px] text-muted-foreground">
                                Acces en lecture seule. Nous ne modifions jamais vos donnees Search Console.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* ===================== CONNECTED ===================== */
                <div className="space-y-4">
                    {/* Connection header */}
                    <Card className={cn(styles.card.base)}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Search className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Google Search Console</CardTitle>
                                        <CardDescription className="text-xs">
                                            {connections.length} site{connections.length > 1 ? "s" : ""} connecte{connections.length > 1 ? "s" : ""}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                >
                                    Connecte
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {activeConnection?.email && (
                                <div className="flex items-center gap-2 text-sm mb-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Compte :</span>
                                    <span className="font-medium">{activeConnection.email}</span>
                                </div>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Les donnees sont synchronisees automatiquement toutes les 6 heures.
                                Les donnees GSC ont un delai de 2-3 jours par rapport au temps reel.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Per-site cards */}
                    {connections.map((conn) => (
                        <Card key={conn.site_id} className={cn(styles.card.base)}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Globe className="h-4 w-4 text-primary" />
                                        {conn.site_url}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px]",
                                            conn.is_active
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {conn.is_active ? "Actif" : "Inactif"}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    Derniere sync : {formatDate(conn.last_synced_at || null)}
                                </div>

                                <div className="flex items-center gap-2 pt-1 border-t border-border/10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => sync({ siteId: conn.site_id })}
                                        disabled={isSyncing}
                                        className="gap-1.5 h-7 text-xs"
                                    >
                                        <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                                        Synchroniser
                                    </Button>

                                    {confirmingDisconnect === conn.connection_id ? (
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <span className="text-xs text-muted-foreground">Confirmer ?</span>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-7 text-xs px-2.5"
                                                disabled={isDisconnecting}
                                                onClick={() => {
                                                    disconnect(conn.connection_id);
                                                    setConfirmingDisconnect(null);
                                                }}
                                            >
                                                {isDisconnecting ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Oui, supprimer"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs px-2"
                                                onClick={() => setConfirmingDisconnect(null)}
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive gap-1.5 ml-auto h-7 text-xs"
                                            disabled={isDisconnecting}
                                            onClick={() => setConfirmingDisconnect(conn.connection_id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Déconnecter
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
