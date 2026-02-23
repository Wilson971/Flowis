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
    ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// Workspace sections
import WorkspaceGeneralSection from "@/components/settings/workspace/WorkspaceGeneralSection";
import WorkspacePeopleSection from "@/components/settings/workspace/WorkspacePeopleSection";
import WorkspacePlansSection from "@/components/settings/workspace/WorkspacePlansSection";

// Store sections
import StoreGeneralSection from "@/components/settings/store/StoreGeneralSection";
import StoreSyncSection from "@/components/settings/store/StoreSyncSection";
import StoreWatermarkSection from "@/components/settings/store/StoreWatermarkSection";

const sidebarItems = [
    {
        section: "Workspace",
        items: [
            { id: "workspace-general", label: "Workspace Settings", icon: LayoutGrid },
            { id: "workspace-people", label: "People", icon: Users },
            { id: "workspace-plans", label: "Plans & credits", icon: CreditCard },
        ]
    },
    {
        section: "Boutique",
        items: [
            { id: "store-general", label: "Général", icon: Store },
            { id: "store-sync", label: "Synchronisation", icon: RefreshCw },
            { id: "store-watermark", label: "Watermark", icon: Stamp },
        ]
    },
    {
        section: "Account",
        items: [
            { id: "account-profile", label: "Profile", icon: User },
            { id: "account-notifications", label: "Notifications", icon: Bell },
            { id: "account-security", label: "Security", icon: Shield },
            { id: "account-preferences", label: "Preferences", icon: Settings },
            { id: "account-ai", label: "AI", icon: Sparkles },
            { id: "account-danger", label: "Danger Zone", icon: AlertTriangle },
        ]
    },
    {
        section: "Integrations",
        items: [
            { id: "integrations-general", label: "Integrations", icon: Plug },
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

        // Account & Integrations sections
        if (activeTab.startsWith("account-") || activeTab === "integrations-general") {
            if (isProfileLoading) {
                return (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
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
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background">
                <VisuallyHidden.Root asChild>
                    <DialogTitle>Paramètres</DialogTitle>
                </VisuallyHidden.Root>
                <VisuallyHidden.Root asChild>
                    <DialogDescription>Gérez vos paramètres de workspace et de compte</DialogDescription>
                </VisuallyHidden.Root>

                <div className="flex flex-1 min-h-0 overflow-hidden w-full">

                    {/* ── Sidebar ───────────────────────────────── */}
                    <aside className="w-60 border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col min-h-0 flex-shrink-0">
                        {/* Workspace header */}
                        <div className="px-4 py-4 border-b border-border/50 flex-shrink-0">
                            <button
                                className="w-full flex items-center gap-2.5 group"
                                onClick={() => setActiveTab("workspace-general" as SettingsTab)}
                            >
                                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                                    {currentWorkspaceName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold truncate flex-1 text-left">
                                    {currentWorkspaceName}
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                        </div>

                        {/* Nav items */}
                        <ScrollArea className="flex-1 min-h-0">
                            <nav className="px-2 py-3 space-y-5">
                                {sidebarItems.map((group) => (
                                    <div key={group.section}>
                                        <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                                                            "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150 text-left",
                                                            isActive
                                                                ? isDanger
                                                                    ? "bg-destructive/10 text-destructive font-medium"
                                                                    : "bg-primary/10 text-primary font-medium"
                                                                : isDanger
                                                                    ? "text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
                                                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={cn(
                                                                "h-4 w-4 shrink-0 transition-colors",
                                                                isActive
                                                                    ? isDanger ? "text-destructive" : "text-primary"
                                                                    : isDanger ? "text-destructive/60" : "text-muted-foreground"
                                                            )}
                                                        />
                                                        <span className="truncate">{item.label}</span>
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
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <ScrollArea className="flex-1 w-full">
                            <div className="p-8 w-full">
                                {renderContent()}
                            </div>
                        </ScrollArea>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
