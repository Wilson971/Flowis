'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import {
    User,
    Settings,
    CreditCard,
    Users,
    Shield,
    Plug,
    Store,
    RefreshCw,
    Stamp,
    LayoutGrid,
    Bell,
    Sparkles,
    AlertTriangle,
    AlertCircle,
    Search,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Context
import { useSettingsModal, SettingsTab } from "@/contexts/SettingsModalContext";

// Hooks
import { useUserProfile } from "@/hooks/profile/useUserProfile";
import { useWorkspace } from "@/hooks/workspace";

// Account sections
import ProfileGeneralSection from "@/components/profile/ProfileGeneralSection";
import {
    ProfileSecuritySection,
    ProfileNotificationsSection,
    ProfilePreferencesSection,
    ProfileAISection,
    ProfileDangerZoneSection,
    ProfileIntegrationsSection
} from "@/components/profile/ProfileSections";

// GSC section
import GscSettingsSection from "@/components/settings/integrations/GscSettingsSection";

// Workspace sections
import WorkspaceGeneralSection from "@/components/settings/workspace/WorkspaceGeneralSection";
import WorkspacePeopleSection from "@/components/settings/workspace/WorkspacePeopleSection";
import WorkspacePlansSection from "@/components/settings/workspace/WorkspacePlansSection";

// Store sections
import StoreGeneralSection from "@/components/settings/store/StoreGeneralSection";
import StoreSyncSection from "@/components/settings/store/StoreSyncSection";
import StoreWatermarkSection from "@/components/settings/store/StoreWatermarkSection";

type SidebarBadge = {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "info" | "neutral" | "destructive";
};

type SidebarItem = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: SidebarBadge;
};

const sidebarItems: { section: string; items: SidebarItem[] }[] = [
    {
        section: "Workspace",
        items: [
            { id: "workspace-general", label: "Workspace Settings", icon: LayoutGrid },
            { id: "workspace-people", label: "People", icon: Users },
            { id: "workspace-plans", label: "Plans & credits", icon: CreditCard, badge: { label: "Pro", variant: "default" } },
        ]
    },
    {
        section: "Boutique",
        items: [
            { id: "store-general", label: "Général", icon: Store },
            { id: "store-sync", label: "Synchronisation", icon: RefreshCw },
            { id: "store-watermark", label: "Watermark", icon: Stamp, badge: { label: "Beta", variant: "info" } },
        ]
    },
    {
        section: "Account",
        items: [
            { id: "account-profile", label: "Profile", icon: User },
            { id: "account-notifications", label: "Notifications", icon: Bell, badge: { label: "3", variant: "warning" } },
            { id: "account-security", label: "Security", icon: Shield },
            { id: "account-preferences", label: "Preferences", icon: Settings },
            { id: "account-ai", label: "AI", icon: Sparkles, badge: { label: "New", variant: "success" } },
            { id: "account-danger", label: "Danger Zone", icon: AlertTriangle },
        ]
    },
    {
        section: "Integrations",
        items: [
            { id: "integrations-general", label: "Integrations", icon: Plug },
            { id: "integrations-gsc", label: "Google Search Console", icon: Search, badge: { label: "New", variant: "success" } },
        ]
    }
];

export function SettingsModal() {
    const { initialTab, setInitialTab, isOpen, setIsOpen } = useSettingsModal();
    const [activeTab, setActiveTab] = useState<SettingsTab>("account-profile");

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
            setInitialTab(undefined);
        }
    }, [initialTab, setInitialTab]);

    const { profile, isLoading: isProfileLoading } = useUserProfile();
    const { workspace } = useWorkspace();
    const currentWorkspaceName = workspace?.name || "Mon Workspace";

    // ── Page headers per tab ──────────────────────────────────────
    const pageHeaders: Record<string, { title: string; description: string; badge?: SidebarBadge }> = {
        "workspace-general": { title: "Workspace Settings", description: "Gérez les paramètres généraux de votre workspace." },
        "workspace-people": { title: "People", description: "Gérez les membres et les rôles de votre workspace." },
        "workspace-plans": { title: "Plan & Utilisation", description: "Gérez votre abonnement et suivez votre consommation.", badge: { label: "Pro", variant: "default" } },
        "store-general": { title: "Général", description: "Paramètres généraux de votre boutique." },
        "store-sync": { title: "Synchronisation", description: "Configurez la synchronisation avec votre plateforme e-commerce." },
        "store-watermark": { title: "Watermark", description: "Configurez le filigrane de vos images.", badge: { label: "Beta", variant: "info" } },
        "account-profile": { title: "Profile", description: "Gérez vos informations personnelles et votre avatar." },
        "account-notifications": { title: "Notifications", description: "Configurez vos préférences de notifications." },
        "account-security": { title: "Security", description: "Gérez votre mot de passe et la sécurité de votre compte." },
        "account-preferences": { title: "Preferences", description: "Personnalisez votre expérience FLOWZ." },
        "account-ai": { title: "AI", description: "Configurez vos préférences d'intelligence artificielle." },
        "account-danger": { title: "Danger Zone", description: "Actions irréversibles sur votre compte." },
        "integrations-general": { title: "Intégrations", description: "Gérez vos plateformes e-commerce et connecteurs externes." },
        "integrations-gsc": { title: "Google Search Console", description: "Connectez et gérez vos sites Google Search Console." },
    };

    const currentHeader = pageHeaders[activeTab];

    const renderContent = () => {
        // Workspace sections
        if (activeTab.startsWith("workspace-")) {
            switch (activeTab) {
                case "workspace-general": return <WorkspaceGeneralSection />;
                case "workspace-people": return <WorkspacePeopleSection />;
                case "workspace-plans": return <WorkspacePlansSection />;
                default: return null;
            }
        }

        // Store sections
        if (activeTab.startsWith("store-")) {
            switch (activeTab) {
                case "store-general": return <StoreGeneralSection />;
                case "store-sync": return <StoreSyncSection />;
                case "store-watermark": return <StoreWatermarkSection />;
                default: return null;
            }
        }

        // GSC settings
        if (activeTab === "integrations-gsc") {
            return <GscSettingsSection />;
        }

        // Account & Integrations sections
        if (activeTab.startsWith("account-") || activeTab === "integrations-general") {
            if (isProfileLoading) {
                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
                            <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
                            <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
                            <div className="h-10 w-3/4 bg-muted/30 rounded-lg animate-pulse" />
                        </div>
                    </div>
                );
            }
            if (!profile) {
                return (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>Impossible de charger le profil.</AlertDescription>
                    </Alert>
                );
            }

            switch (activeTab) {
                case "account-profile": return <ProfileGeneralSection profile={profile} />;
                case "account-notifications": return <ProfileNotificationsSection />;
                case "account-security": return <ProfileSecuritySection />;
                case "account-preferences": return <ProfilePreferencesSection />;
                case "account-ai": return <ProfileAISection />;
                case "account-danger": return <ProfileDangerZoneSection />;
                case "integrations-general": return <ProfileIntegrationsSection />;
                default: return null;
            }
        }

        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[1430px] w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-background rounded-2xl">
                <VisuallyHidden.Root asChild>
                    <DialogTitle>Paramètres</DialogTitle>
                </VisuallyHidden.Root>
                <VisuallyHidden.Root asChild>
                    <DialogDescription>Gérez vos paramètres de workspace et de compte</DialogDescription>
                </VisuallyHidden.Root>

                {/* ── Top header row (full-width, aligned border) ── */}
                <div className="flex-shrink-0 flex border-b border-border/40 bg-card/20">
                    {/* Sidebar header */}
                    <div className="w-[240px] shrink-0 px-4 pt-5 pb-4 border-r border-border/40">
                        <button
                            className="w-full flex items-center gap-2.5 group"
                            onClick={() => setActiveTab("workspace-general" as SettingsTab)}
                        >
                            <div className="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center text-[11px] font-bold shrink-0">
                                {currentWorkspaceName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[13px] font-semibold tracking-tight truncate flex-1 text-left text-foreground">
                                {currentWorkspaceName}
                            </span>
                        </button>
                    </div>
                    {/* Page header */}
                    {currentHeader && (
                        <div className="flex-1 px-10 pt-5 pb-4">
                            <div className="flex items-center gap-2.5">
                                <h2 className={cn(
                                    "text-[15px] font-semibold tracking-tight text-foreground",
                                    activeTab === "account-danger" && "text-red-500"
                                )}>
                                    {currentHeader.title}
                                </h2>
                                {currentHeader.badge && (
                                    <Badge
                                        variant={currentHeader.badge.variant}
                                        size="sm"
                                        className="px-1.5 py-0 text-[9px] h-4"
                                    >
                                        {currentHeader.badge.label}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {currentHeader.description}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-1 min-h-0 overflow-hidden w-full">

                    {/* ── Sidebar ───────────────────────────────── */}
                    <aside className="w-[240px] border-r border-border/40 bg-card/20 flex flex-col min-h-0 flex-shrink-0">

                        {/* Nav items */}
                        <ScrollArea className="flex-1 min-h-0">
                            <nav className="px-3 py-4 space-y-6">
                                {sidebarItems.map((group) => (
                                    <div key={group.section}>
                                        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                                            {group.section}
                                        </p>
                                        <div className="space-y-0.5">
                                            {group.items.map((item) => {
                                                const isActive = activeTab === item.id;
                                                const isDanger = item.id === "account-danger";
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setActiveTab(item.id as SettingsTab)}
                                                        className={cn(
                                                            "w-full flex items-center gap-2.5 px-2 py-[7px] rounded-lg text-[13px] transition-colors text-left overflow-visible",
                                                            isActive
                                                                ? isDanger
                                                                    ? "bg-red-500/10 text-red-500 font-medium"
                                                                    : "bg-muted/70 text-foreground font-medium"
                                                                : isDanger
                                                                    ? "text-red-500/60 hover:bg-red-500/5 hover:text-red-500"
                                                                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={cn(
                                                                "h-[15px] w-[15px] shrink-0",
                                                                isActive
                                                                    ? isDanger ? "text-red-500" : "text-foreground/70"
                                                                    : isDanger ? "text-red-500/50" : "text-muted-foreground/50"
                                                            )}
                                                        />
                                                        <span className="truncate flex-1">{item.label}</span>
                                                        {item.badge && (
                                                            <Badge
                                                                variant={item.badge.variant}
                                                                size="sm"
                                                                className="ml-auto px-1.5 py-0 text-[9px] h-[18px] leading-[18px] shrink-0"
                                                            >
                                                                {item.badge.label}
                                                            </Badge>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </ScrollArea>
                    </aside>

                    {/* ── Content ───────────────────────────────── */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
                        <ScrollArea className="flex-1 w-full">
                            <div className="px-10 py-6 w-full">
                                {renderContent()}
                            </div>
                        </ScrollArea>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
