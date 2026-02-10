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
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Context
import { useSettingsModal, SettingsTab } from "@/contexts/SettingsModalContext";

// Hooks
import { useUserProfile } from "@/hooks/profile/useUserProfile";

// Sections
import ProfileGeneralSection from "@/components/profile/ProfileGeneralSection";
import {
    ProfileSecuritySection,
    ProfileNotificationsSection,
    ProfilePreferencesSection,
    ProfileAISection,
    ProfileDangerZoneSection,
    ProfileIntegrationsSection
} from "@/components/profile/ProfileSections";

// Placeholders for Workspace/Store (as they weren't part of this specific task but are needed for the menu)
const WorkspacePlaceholder = ({ title }: { title: string }) => <div className="p-8"><h2 className="text-2xl font-bold mb-4">{title}</h2><p className="text-muted-foreground">Paramètres du workspace à venir.</p></div>;
const StorePlaceholder = ({ title }: { title: string }) => <div className="p-8"><h2 className="text-2xl font-bold mb-4">{title}</h2><p className="text-muted-foreground">Paramètres de la boutique à venir.</p></div>;

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsModal() {
    const { initialTab, setInitialTab, isOpen, setIsOpen } = useSettingsModal();
    const [activeTab, setActiveTab] = useState<SettingsTab>("account-profile"); // Default to profile for now

    // Set active tab when initialTab is provided
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
            setInitialTab(undefined);
        }
    }, [initialTab, setInitialTab]);

    const { profile, isLoading: isProfileLoading } = useUserProfile();
    // Assuming we might have a workspace context later, for now we mock the name
    const currentWorkspaceName = "My Workspace";

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

    const renderContent = () => {
        // Store settings
        if (activeTab.startsWith("store-")) {
            switch (activeTab) {
                case "store-general": return <StorePlaceholder title="Général" />;
                case "store-sync": return <StorePlaceholder title="Synchronisation" />;
                case "store-watermark": return <StorePlaceholder title="Watermark" />;
                default: return null;
            }
        }

        // Account & Integrations settings
        if (activeTab.startsWith("account-") || activeTab === "integrations-general") {
            if (isProfileLoading) {
                return (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                );
            }
            if (!profile) {
                return (
                    <div className="p-8">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>Impossible de charger le profil.</AlertDescription>
                        </Alert>
                    </div>
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

        // Workspace settings
        switch (activeTab) {
            case "workspace-general": return <WorkspacePlaceholder title="Workspace Settings" />;
            case "workspace-people": return <WorkspacePlaceholder title="People" />;
            case "workspace-plans": return <WorkspacePlaceholder title="Plans & Credits" />;
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden bg-background flex flex-col [&]:bg-background">
                <VisuallyHidden.Root asChild>
                    <DialogTitle>Paramètres</DialogTitle>
                </VisuallyHidden.Root>
                <VisuallyHidden.Root asChild>
                    <DialogDescription>Gérez vos paramètres de workspace et de compte</DialogDescription>
                </VisuallyHidden.Root>

                <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-border/50 bg-card flex flex-col min-h-0 flex-shrink-0">
                        <div className="p-4 border-b border-border/50 flex-shrink-0">
                            <div className="flex items-center gap-2 font-semibold">
                                <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                    {currentWorkspaceName.charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate">{currentWorkspaceName}</span>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="px-2 py-4 space-y-6">
                                {sidebarItems.map((group) => (
                                    <div key={group.section}>
                                        <h4 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                                            {group.section}
                                        </h4>
                                        <div className="space-y-1">
                                            {group.items.map((item) => (
                                                <Button
                                                    key={item.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "w-full justify-start gap-2 px-2 h-8 font-normal",
                                                        activeTab === item.id && "bg-accent text-accent-foreground font-medium"
                                                    )}
                                                    onClick={() => setActiveTab(item.id as SettingsTab)}
                                                >
                                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                                    {item.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background w-full">
                        <ScrollArea className="flex-1 w-full">
                            <div className="p-8 w-full max-w-4xl mx-auto">
                                {renderContent()}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
