import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  Package,
  FileText,
  Store,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Camera,
  TrendingUp,
  BarChart3,
  Type,
  ShieldCheck,
  Info,
  ListChecks,
  Map,
  ClipboardList,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "../ui/sidebar";
import { useSidebarPreference } from "../../contexts/SidebarContext";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import { useUserProfile } from "@/hooks/profile/useUserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect, useCallback } from "react";
import { StoreSelector } from "./StoreSelector";

// ============================================================================
// Collapsible Menu State Hook (persisted per user in localStorage)
// ============================================================================

const COLLAPSED_MENUS_KEY = "flowz-sidebar-collapsed-menus";

function useCollapsedMenus() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_MENUS_KEY);
      if (stored) setCollapsed(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(COLLAPSED_MENUS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const isCollapsedMenu = useCallback((id: string) => !!collapsed[id], [collapsed]);

  return { toggle, isCollapsedMenu };
}

/**
 * AppSidebar Component
 *
 * Main application sidebar with navigation
 * Integrates with SidebarPreferenceContext for persistence
 */

// Logo component
const logoTransition = { duration: 0.2 };

const Logo = () => {
  const { open } = useSidebar();
  const logoAnimate = useMemo(
    () => ({ display: open ? ("flex" as const) : ("none" as const), opacity: open ? 1 : 0 }),
    [open]
  );

  return (
    <div className="flex items-center gap-3 py-4 px-4 border-b border-white/5 mb-2">
      <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
        <span className="text-primary-foreground font-bold text-lg">F</span>
      </div>
      <motion.div
        animate={logoAnimate}
        transition={logoTransition}
        className="flex flex-col"
      >
        <span className="text-sm font-semibold leading-none tracking-tight text-white whitespace-pre">
          FLOWIZ
        </span>
        <span className="text-[10px] text-neutral-500 font-medium tracking-wider">Enterprise</span>
      </motion.div>
    </div>
  );
};

const LogoIcon = () => {
  return (
    <div className="flex items-center justify-center py-4 mb-2 border-b border-transparent w-full">
      <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10 hover:scale-105 transition-transform">
        <span className="text-primary-foreground font-black text-xl">F</span>
      </div>
    </div>
  );
};

const LogoWrapper = () => {
  const { open } = useSidebar();
  return open ? <Logo /> : <LogoIcon />;
};

// User Profile Component
const UserProfile = () => {
  const { open } = useSidebar();
  const { openSettings } = useSettingsModal();
  const { profile } = useUserProfile();

  const displayName = profile?.full_name
    || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    || 'Utilisateur';
  const role = profile?.job_title || 'Administrateur';
  const initials = displayName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className={cn(
      "mt-auto border-t border-white/5 pt-4 transition-all duration-300",
      open ? "px-2" : "px-0"
    )}>
      <button
        type="button"
        onClick={() => openSettings('account-profile')}
        className={cn(
          "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer group",
          open ? "justify-start px-3" : "justify-center mx-auto w-11 h-11 p-0"
        )}
      >
        <Avatar className={cn(
          "border border-white/10 flex-shrink-0 transition-all",
          open ? "w-8 h-8" : "w-10 h-10 ring-2 ring-white/5"
        )}>
          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className="bg-neutral-800 text-neutral-300 text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex flex-col overflow-hidden text-left"
          >
            <span className="text-xs font-bold text-white truncate">{displayName}</span>
            <span className="text-[10px] text-neutral-500 truncate font-medium">{role}</span>
          </motion.div>
        )}
      </button>
    </div>
  )
}

// Navigation items (temporary - will be moved to config later)
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/app/overview",
    icon: LayoutDashboard,
  },
  {
    id: "products",
    label: "Products",
    href: "/app/products",
    icon: Package,
  },
  {
    id: "photo-studio",
    label: "Photo Studio",
    href: "/app/photostudio",
    icon: Camera,
  },
  {
    id: "blog",
    label: "Blog AI",
    href: "/app/blog",
    icon: FileText,
    children: [
      {
        id: "flowriter",
        label: "Assistant IA",
        href: "/app/blog/flowriter",
        icon: Sparkles,
      },
      {
        id: "all-articles",
        label: "Tous les articles",
        href: "/app/blog",
        icon: FileText,
      }
    ]
  },
  {
    id: "seo",
    label: "SEO",
    href: "/app/seo",
    icon: TrendingUp,
    children: [
      { id: "seo-analytics", label: "Analytique", href: "/app/seo?tab=analytics", icon: BarChart3 },
      { id: "seo-keywords", label: "Mots-clés", href: "/app/seo?tab=keywords", icon: Type },
      { id: "seo-audit", label: "Audit", href: "/app/seo?tab=audit", icon: ShieldCheck },
      { id: "seo-info", label: "Info", href: "/app/seo?tab=info", icon: Info },
      { id: "seo-indexation", label: "Indexation", href: "/app/seo?tab=indexation", icon: ListChecks },
      { id: "seo-sitemaps", label: "Plans de site", href: "/app/seo?tab=sitemaps", icon: Map },
      { id: "seo-tasks", label: "Tâches", href: "/app/seo?tab=tasks", icon: ClipboardList },
    ],
  },
  {
    id: "stores",
    label: "Stores",
    href: "/app/stores",
    icon: Store,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed, setSidebarCollapsed } = useSidebarPreference();
  const { openSettings } = useSettingsModal();
  const { toggle: toggleMenu, isCollapsedMenu } = useCollapsedMenus();
  const isOpen = !isCollapsed;

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    // For paths with query params (e.g. /app/seo?tab=analytics), match base path
    const basePath = path.split("?")[0];
    return pathname?.startsWith(basePath);
  };

  const isExactActive = (path: string) => {
    // For child items with query params, match the full href including the tab
    if (path.includes("?")) {
      const basePath = path.split("?")[0];
      const matchTab = new URLSearchParams(path.split("?")[1]).get("tab");

      // Default to "analytics" or whichever base tab if the param is missing on the actual route
      const currentTab = searchParams?.get("tab") || (pathname === basePath ? "analytics" : null);

      return pathname === basePath && currentTab === matchTab;
    }
    return pathname === path;
  };

  return (
    <Sidebar pinned={isCollapsed} onPinnedChange={setSidebarCollapsed}>
      <SidebarBody className="justify-between gap-2 h-full">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar pb-4">
          <LogoWrapper />

          {/* Store Selector */}
          <div className={cn("mt-2 mb-6 transition-all duration-300", isOpen ? "px-1" : "px-0 flex justify-center")}>
            <StoreSelector />
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1" aria-label="Navigation principale">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isItemActive = isActive(item.href);
              const isChildActive = hasChildren && item.children?.some(child => isActive(child.href));
              const isMenuOpen = hasChildren && !isCollapsedMenu(item.id);

              return (
                <div key={item.id} className="flex flex-col">
                  <div className="relative flex items-center">
                    <SidebarLink
                      link={{
                        label: item.label,
                        href: item.href,
                        icon: <ItemIcon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />,
                      }}
                      active={isItemActive || isChildActive}
                      onClick={(e) => {
                        if (item.id === 'settings') {
                          e.preventDefault();
                          openSettings();
                        }
                        if (hasChildren && isOpen) {
                          e.preventDefault();
                          toggleMenu(item.id);
                        }
                      }}
                    >
                      {/* Chevron for collapsible menus */}
                      {hasChildren && isOpen && (
                        <motion.div
                          animate={{ rotate: isMenuOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-auto relative z-10"
                        >
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-colors",
                            (isItemActive || isChildActive) ? "text-primary-foreground/70" : "text-white/40"
                          )} />
                        </motion.div>
                      )}
                    </SidebarLink>
                  </div>

                  {/* Collapsible children */}
                  <AnimatePresence initial={false}>
                    {hasChildren && isOpen && isMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className={cn(
                          "flex flex-col gap-1 ml-9 mt-2 mb-2 pl-3 border-l-2 transition-colors duration-300",
                          isChildActive ? "border-primary/50" : "border-white/10"
                        )}>
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <SidebarLink
                                key={child.id}
                                link={{
                                  label: child.label,
                                  href: child.href,
                                  icon: <ChildIcon className="h-4 w-4 flex-shrink-0" />,
                                }}
                                active={isExactActive(child.href)}
                                className={cn(
                                  "h-9 text-xs transition-all duration-300",
                                  "hover:translate-x-1"
                                )}
                              />
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile at the bottom */}
        <UserProfile />

      </SidebarBody>
    </Sidebar>
  );
};
