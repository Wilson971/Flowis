import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  Package,
  FileText,
  Store,
  Settings,
  ChevronDown,
  Sparkles,
  Camera,
  Layers,
  Maximize2,
  LayoutGrid,
  Palette,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "../ui/sidebar";
import { useSidebarPreference } from "../../contexts/SidebarContext";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { StoreSelector } from "./StoreSelector";

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
        <span className="text-white font-bold text-lg">F</span>
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
        <span className="text-white font-black text-xl">F</span>
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

  return (
    <div className={cn(
      "mt-auto border-t border-white/5 pt-4 transition-all duration-300",
      open ? "px-2" : "px-0"
    )}>
      <div className={cn(
        "flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer group",
        open ? "justify-start px-3" : "justify-center mx-auto w-11 h-11 p-0"
      )}>
        <div className={cn(
          "rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0 transition-all",
          open ? "w-8 h-8" : "w-10 h-10 ring-2 ring-white/5"
        )}>
          {/* Placeholder Avatar */}
          <Icon icon="solar:user-circle-bold" className={cn("text-neutral-400", open ? "w-5 h-5" : "w-6 h-6")} />
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex flex-col overflow-hidden"
          >
            <span className="text-xs font-bold text-white truncate">Wilson Mike</span>
            <span className="text-[10px] text-neutral-500 truncate font-medium">Administrateur</span>
          </motion.div>
        )}
      </div>
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
    id: "stores",
    label: "Stores",
    href: "/app/stores",
    icon: Store,
  },
  {
    id: "demo",
    label: "Demo",
    href: "/app/design-demo",
    icon: Layers,
    children: [
      {
        id: "design-system",
        label: "Design System 2026",
        href: "/app/design-demo",
        icon: Palette,
      },
      {
        id: "variation-studio",
        label: "Variation Studio",
        href: "/app/design-demo/variation-studio",
        icon: LayoutGrid,
      },
      {
        id: "proposal-d",
        label: "D. Fullscreen",
        href: "/app/design-demo/variation-studio/d",
        icon: Maximize2,
      },
    ]
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
  const { isCollapsed, setSidebarCollapsed } = useSidebarPreference();
  const { openSettings } = useSettingsModal();
  const isOpen = !isCollapsed;

  const isActive = (path: string) => {
    // Simple path matching - can be improved
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
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
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isItemActive = isActive(item.href);
              const isChildActive = hasChildren && item.children?.some(child => isActive(child.href));

              return (
                <div key={item.id} className="flex flex-col gap-1">
                  <SidebarLink
                    link={{
                      label: item.label,
                      href: item.href,
                      icon: <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />,
                    }}
                    active={isItemActive || isChildActive}
                    onClick={(e) => {
                      if (item.id === 'settings') {
                        e.preventDefault();
                        openSettings();
                      }
                    }}
                  />
                  {(hasChildren && isOpen) && (
                    <div className="flex flex-col gap-1 ml-9 mt-1 border-l border-white/10 pl-2">
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
                            active={isActive(child.href)}
                            className="h-9 hover:translate-x-0"
                          />
                        );
                      })}
                    </div>
                  )}
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
