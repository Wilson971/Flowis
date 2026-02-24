"use client";

import {
  Search,
  Plus,
  PanelLeft,
  PanelLeftClose,
  Package,
  FileText,
  Palette,
  LogOut,
} from "lucide-react";
import { Badge } from "../ui/badge";
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
import Link from "next/link";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUserProfile } from "@/hooks/profile/useUserProfile";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * TopHeader Component
 *
 * Main header bar with search, quick actions, and user menu
 * Includes sidebar toggle button
 */

export const TopHeader = () => {
  const { isCollapsed, toggleSidebar, isReady } = useSidebarPreference();
  const { openSettings } = useSettingsModal();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full header-metal shadow-lg z-50 rounded-b-[32px] sticky top-0">
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          {isReady && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-9 w-9 rounded-lg header-btn transition-all duration-200 group"
                  aria-label={
                    isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                >
                  {isCollapsed ? (
                    <PanelLeft className="h-4 w-4 transition-transform group-hover:scale-110" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4 transition-transform group-hover:scale-110" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-bold bg-popover text-popover-foreground border-border/40 uppercase tracking-widest">
                {isCollapsed ? "Ouvrir Menu" : "Fermer Menu"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Search Bar */}
          <div className="flex-1 relative max-w-lg mx-2">
            <div className="group cursor-pointer">
              <div className="flex items-center gap-2.5 px-3.5 py-2 header-search rounded-lg transition-all duration-300">
                <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all duration-300" />
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate hidden sm:inline-block">
                  Rechercher un produit, une commande...
                </span>
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate sm:hidden">
                  Rechercher...
                </span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded-[4px] border border-border bg-muted/50 px-1.5 font-mono text-[9px] font-bold text-muted-foreground ml-auto transition-all group-hover:border-primary/40 group-hover:text-primary">
                  <span className="text-[10px]">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Quick Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg header-btn !text-primary hover:!bg-primary/10 transition-all mr-1"
                  suppressHydrationWarning
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-0 border-border shadow-2xl rounded-xl overflow-hidden backdrop-blur-xl bg-popover">
                <div className="px-3 py-2.5 header-metal">
                  <div className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <h4 className="font-bold text-[11px] uppercase tracking-wider text-foreground">Actions Rapides</h4>
                  </div>
                </div>

                <div className="p-1">
                  <DropdownMenuItem asChild className="cursor-pointer gap-2 px-2 py-1.5 rounded focus:bg-primary/10 focus:text-primary transition-colors">
                    {/* @ts-expect-error -- DropdownMenuItem asChild + Link type mismatch */}
                    <Link href="/app/products" className="flex items-center w-full">
                      <div className="w-7 h-7 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col ml-2">
                        <span className="text-[12px] font-semibold">Nouveau Produit</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer gap-2 px-2 py-1.5 rounded focus:bg-primary/10 focus:text-primary transition-colors">
                    {/* @ts-expect-error -- DropdownMenuItem asChild + Link type mismatch */}
                    <Link href="/content" className="flex items-center w-full">
                      <div className="w-7 h-7 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col ml-2">
                        <span className="text-[12px] font-semibold">Nouvel Article</span>
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

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ml-2 hover:bg-muted/50 p-0 transition-all overflow-hidden"
                  suppressHydrationWarning
                >
                  <Avatar className="h-9 w-9">
                    {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 border-border shadow-2xl rounded-xl overflow-hidden backdrop-blur-xl bg-popover">
                <div className="px-3 py-3 header-metal">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-border shadow-md">
                      {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-[13px] font-bold tracking-tight text-foreground truncate">{userName}</p>
                      <p className="text-[10px] font-medium text-muted-foreground truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-1">
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Compte
                  </div>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 px-2 py-1.5 rounded focus:bg-primary/10 focus:text-primary transition-colors"
                    onClick={() => openSettings('account-profile')}
                  >
                    <div className="w-7 h-7 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                      <PanelLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold">Mon Profil</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer gap-2 px-2 py-1.5 rounded focus:bg-primary/10 focus:text-primary transition-colors"
                    onClick={() => openSettings('account-preferences')}
                  >
                    <div className="w-7 h-7 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold">Apparence</span>
                    </div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-border mx-1" />

                <div className="p-1">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer gap-2 px-2 py-1.5 rounded transition-colors font-semibold"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    <div className="w-7 h-7 rounded bg-destructive/15 flex items-center justify-center shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px]">{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
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
