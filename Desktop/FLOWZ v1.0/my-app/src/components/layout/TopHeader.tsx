"use client";

import {
  Search,
  Plus,
  PanelLeft,
  PanelLeftClose,
  PanelRightClose,
  Package,
  FileText,
  Palette,
  LogOut,
  User,
} from "lucide-react";
import { AIOrb } from "../ui/ai-orb";
import { OrbHoverPreview } from "../copilot/orb/OrbHoverPreview";
import { useCopilotNotifications } from "@/hooks/copilot/useCopilotNotifications";
import { Button } from "../ui/button";
import { NotificationBell } from "../notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { ThemeToggle } from "../ui/theme-toggle";
import { useSidebarPreference } from "../../contexts/SidebarContext";
import { useCopilot } from "../../contexts/CopilotContext";
import Link from "next/link";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUserProfile } from "@/hooks/profile/useUserProfile";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * TopHeader Component
 *
 * Main header bar with search, quick actions, and user menu
 * Includes sidebar toggle button
 */

export const TopHeader = () => {
  const { isCollapsed, toggleSidebar, isReady } = useSidebarPreference();
  const { isOpen: isCopilotOpen, toggleCopilot } = useCopilot();
  const [isOrbHovered, setIsOrbHovered] = useState(false);
  const { notifications, count, hasUrgent } = useCopilotNotifications();
  const { openSettings } = useSettingsModal();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  // Get user display info — prefer profile data (updated in real-time) over auth metadata
  const userEmail = profile?.email || user?.email || "user@flowz.com";
  const userName = profile?.full_name
    || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || "Utilisateur";
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push("/login");
    } catch (error) {
      // Silently ignore
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full header-metal shadow-lg z-50 rounded-b-3xl sticky top-0">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          {isReady && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8 rounded-lg header-btn transition-colors group"
                  aria-label={
                    isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                >
                  {isCollapsed ? (
                    <PanelLeft className="h-4 w-4 text-foreground/70 transition-transform group-hover:scale-110" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4 text-foreground/70 transition-transform group-hover:scale-110" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-medium bg-popover text-popover-foreground border-border/40 uppercase tracking-wider">
                {isCollapsed ? "Ouvrir Menu" : "Fermer Menu"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Search Bar */}
          <div className="flex-1 relative max-w-lg mx-2">
            <button
              type="button"
              className="group cursor-pointer w-full text-left"
              aria-label="Rechercher"
            >
              <div className="flex items-center gap-2.5 px-3.5 py-2 header-search rounded-lg transition-colors">
                <Search className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors" />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate hidden sm:inline-block">
                  Rechercher un produit, une commande...
                </span>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate sm:hidden">
                  Rechercher...
                </span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded-lg border border-border/40 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60 ml-auto transition-colors group-hover:border-border/60 group-hover:text-muted-foreground">
                  {isMac ? "⌘" : "Ctrl+"}K
                </kbd>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Quick Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg header-btn text-foreground/70 hover:bg-muted/60 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-0 border-border/40 shadow-lg ring-1 ring-border/50 rounded-xl overflow-hidden backdrop-blur-xl bg-popover">
                <div className="px-3 py-2.5 header-metal">
                  <div className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-foreground/70" />
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Actions Rapides</h4>
                  </div>
                </div>

                <div className="p-1">
                  <DropdownMenuItem asChild className="cursor-pointer gap-2 px-2 py-1.5 rounded-lg focus:bg-muted/60 focus:text-foreground transition-colors">
                    {/* @ts-expect-error -- DropdownMenuItem asChild + Link type mismatch */}
                    <Link href="/app/products" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-muted/60 ring-1 ring-border/40 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-foreground/70" />
                      </div>
                      <div className="flex flex-col ml-2">
                        <span className="text-xs font-medium">Nouveau Produit</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer gap-2 px-2 py-1.5 rounded-lg focus:bg-muted/60 focus:text-foreground transition-colors">
                    {/* @ts-expect-error -- DropdownMenuItem asChild + Link type mismatch */}
                    <Link href="/app/blog/flowriter" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-muted/60 ring-1 ring-border/40 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-foreground/70" />
                      </div>
                      <div className="flex flex-col ml-2">
                        <span className="text-xs font-medium">Nouvel Article</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Copilot Toggle */}
            <div
              className="relative"
              onMouseEnter={() => setIsOrbHovered(true)}
              onMouseLeave={() => setIsOrbHovered(false)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCopilot}
                    className={cn(
                      "h-8 w-8 rounded-lg header-btn transition-colors group",
                      isCopilotOpen && "bg-primary/10"
                    )}
                    aria-label={isCopilotOpen ? "Fermer Copilot" : "Ouvrir Copilot"}
                  >
                    {isCopilotOpen ? (
                      <PanelRightClose className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
                    ) : (
                      <AIOrb size={22} state={isOrbHovered ? "hover" : "idle"} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px] font-medium bg-popover text-popover-foreground border-border/40 uppercase tracking-wider">
                  {isCopilotOpen ? "Fermer Copilot" : "Copilot IA"}
                </TooltipContent>
              </Tooltip>
              {count > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white pointer-events-none",
                  hasUrgent ? "bg-destructive" : "bg-primary"
                )}>
                  {count}
                </span>
              )}
              <OrbHoverPreview notifications={notifications} isVisible={isOrbHovered && !isCopilotOpen} />
            </div>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full ml-1 hover:bg-muted/50 p-0 transition-colors overflow-hidden"
                  suppressHydrationWarning
                >
                  <Avatar className="h-8 w-8">
                    {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 border-border/40 shadow-lg ring-1 ring-border/50 rounded-xl overflow-hidden backdrop-blur-xl bg-popover">
                <div className="px-3 py-3 header-metal">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 ring-1 ring-border/50">
                      {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-[13px] font-semibold tracking-tight text-foreground truncate">{userName}</p>
                      <p className="text-[10px] font-medium text-muted-foreground/60 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-1">
                  <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Compte
                  </div>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 px-2 py-1.5 rounded-lg focus:bg-muted/60 focus:text-foreground transition-colors"
                    onClick={() => openSettings('account-profile')}
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted/60 ring-1 ring-border/40 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-foreground/70" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Mon Profil</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer gap-2 px-2 py-1.5 rounded-lg focus:bg-muted/60 focus:text-foreground transition-colors"
                    onClick={() => openSettings('account-preferences')}
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted/60 ring-1 ring-border/40 flex items-center justify-center shrink-0">
                      <Palette className="w-3.5 h-3.5 text-foreground/70" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Apparence</span>
                    </div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-border/40 mx-1" />

                <div className="p-1">
                  <DropdownMenuItem
                    className={cn(
                      "text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer gap-2 px-2 py-1.5 rounded-lg transition-colors font-medium"
                    )}
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs">{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
