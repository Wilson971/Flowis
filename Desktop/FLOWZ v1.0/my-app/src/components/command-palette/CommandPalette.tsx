"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Camera,
    FileText,
    PenTool,
    Store,
    Settings,
    Search,
    Sparkles,
    Zap,
    User,
    Bell,
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

/**
 * CommandPalette Component
 *
 * Global command palette accessible via Cmd+K / Ctrl+K.
 * Provides quick navigation, actions, and AI tools.
 */

interface CommandAction {
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    onSelect: () => void;
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Global keyboard listener
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const navigate = useCallback(
        (path: string) => {
            setOpen(false);
            router.push(path);
        },
        [router]
    );

    const navigationItems: CommandAction[] = [
        {
            label: "Dashboard",
            icon: <LayoutDashboard className="h-4 w-4" />,
            shortcut: "D",
            onSelect: () => navigate("/app/overview"),
        },
        {
            label: "Produits",
            icon: <Package className="h-4 w-4" />,
            shortcut: "P",
            onSelect: () => navigate("/app/products"),
        },
        {
            label: "Photo Studio",
            icon: <Camera className="h-4 w-4" />,
            onSelect: () => navigate("/app/photostudio"),
        },
        {
            label: "Blog",
            icon: <FileText className="h-4 w-4" />,
            shortcut: "B",
            onSelect: () => navigate("/app/blog"),
        },
        {
            label: "Boutiques",
            icon: <Store className="h-4 w-4" />,
            onSelect: () => navigate("/app/stores"),
        },
        {
            label: "Profil",
            icon: <User className="h-4 w-4" />,
            onSelect: () => navigate("/app/settings/profile"),
        },
        {
            label: "Notifications",
            icon: <Bell className="h-4 w-4" />,
            onSelect: () => navigate("/app/settings/notifications"),
        },
    ];

    const actionItems: CommandAction[] = [
        {
            label: "Nouvel article",
            icon: <PenTool className="h-4 w-4" />,
            shortcut: "N",
            onSelect: () => navigate("/app/blog/new"),
        },
        {
            label: "Paramètres",
            icon: <Settings className="h-4 w-4" />,
            onSelect: () => navigate("/app/settings/profile"),
        },
    ];

    const aiItems: CommandAction[] = [
        {
            label: "FloWriter — Rédiger un article IA",
            icon: <Sparkles className="h-4 w-4" />,
            onSelect: () => navigate("/app/blog/flowriter"),
        },
        {
            label: "Optimiser les descriptions produit",
            icon: <Zap className="h-4 w-4" />,
            onSelect: () => navigate("/app/products"),
        },
    ];

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Rechercher une page, une action..." />
            <CommandList>
                <CommandEmpty>
                    <div className="flex flex-col items-center gap-1 py-4">
                        <Search className="h-5 w-5 text-muted-foreground/50" />
                        <p>Aucun résultat trouvé.</p>
                    </div>
                </CommandEmpty>

                <CommandGroup heading="Navigation">
                    {navigationItems.map((item) => (
                        <CommandItem
                            key={item.label}
                            onSelect={item.onSelect}
                            className="gap-3 rounded-lg"
                        >
                            <span className="text-muted-foreground">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.shortcut && (
                                <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Actions">
                    {actionItems.map((item) => (
                        <CommandItem
                            key={item.label}
                            onSelect={item.onSelect}
                            className="gap-3 rounded-lg"
                        >
                            <span className="text-muted-foreground">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.shortcut && (
                                <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Outils IA">
                    {aiItems.map((item) => (
                        <CommandItem
                            key={item.label}
                            onSelect={item.onSelect}
                            className="gap-3 rounded-lg"
                        >
                            <span className="text-primary">{item.icon}</span>
                            <span>{item.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
