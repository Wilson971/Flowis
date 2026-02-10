import { cn } from "../../lib/utils";
import Link from "next/link";
import React, { useState, createContext, useContext, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ShellAurora } from "../layout/AuroraBackground";

/**
 * Sidebar Component System
 *
 * A flexible, animated sidebar with collapse/expand functionality
 * Supports mobile and desktop layouts with aurora background effects
 */

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  pinned: boolean;
  togglePinned: () => void;
  setPinnedState: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  pinned: pinnedProp,
  onPinnedChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  pinned?: boolean;
  onPinnedChange?: (collapsed: boolean) => void;
}) => {
  const [openState, setOpenState] = useState(true);
  const [pinnedState, setPinnedStateInternal] = useState(false);

  const pinned = pinnedProp !== undefined ? pinnedProp : pinnedState;
  const open = !pinned;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  const togglePinned = useCallback(() => {
    const newState = !pinned;
    if (onPinnedChange) {
      onPinnedChange(newState);
    } else {
      setPinnedStateInternal(newState);
    }
  }, [pinned, onPinnedChange]);

  const setPinnedState = useCallback(
    (collapsed: boolean) => {
      if (onPinnedChange) {
        onPinnedChange(collapsed);
      } else {
        setPinnedStateInternal(collapsed);
      }
    },
    [onPinnedChange]
  );

  return (
    <SidebarContext.Provider
      value={{ open, setOpen, animate, pinned, togglePinned, setPinnedState }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  pinned,
  onPinnedChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  pinned?: boolean;
  onPinnedChange?: (collapsed: boolean) => void;
}) => {
  return (
    <SidebarProvider
      open={open}
      setOpen={setOpen}
      animate={animate}
      pinned={pinned}
      onPinnedChange={onPinnedChange}
    >
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as unknown as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: any;
} & Omit<React.ComponentProps<typeof motion.div>, "children">) => {
  const { open, animate, pinned } = useSidebar();

  const getWidth = () => {
    if (!animate) return "280px";
    return pinned ? "80px" : "280px";
  };

  return (
    <motion.div
      className={cn(
        "h-screen py-6 hidden md:flex md:flex-col flex-shrink-0 sticky top-0 relative z-20 overflow-visible bg-transparent transition-all duration-300",
        pinned ? "w-[80px] px-0" : "w-[280px] px-4",
        className
      )}
      style={{
        backgroundColor: "transparent",
        background: "none",
        color: "var(--text-main)",
      }}
      animate={{
        width: getWidth(),
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      {...props}
    >
      {/* Aurora effects in sidebar */}
      <ShellAurora position="top" opacity={0.15} />
      <ShellAurora position="middle" opacity={0.15} />
      <ShellAurora position="bottom" opacity={0.15} />

      <div className="relative z-10 h-full flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: any;
} & Omit<React.ComponentProps<"div">, "children">) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between w-full bg-shell relative overflow-hidden"
        )}
        {...props}
      >
        <ShellAurora position="top" opacity={0.25} />
        <div className="flex justify-end z-20 w-full relative">
          <Menu
            className="cursor-pointer text-white"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 p-10 z-[100] flex flex-col justify-between bg-shell/95 backdrop-blur-xl",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 cursor-pointer text-white"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              <div className="relative z-10 h-full flex flex-col bg-transparent">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  onClick,
  children,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href">) => {
  const { open, animate } = useSidebar();

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center group/sidebar h-11 rounded-xl transition-all duration-300 relative overflow-hidden",
        animate && !open
          ? "justify-center px-0 w-11 mx-auto"
          : "justify-start gap-3 px-3",
        active &&
        "bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_color-mix(in_srgb,var(--primary),transparent_60%)]",
        !active && "hover:bg-white/5 text-white/70 hover:text-white",
        !active && "hover:translate-x-1",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-glow"
          className="absolute inset-0 bg-primary opacity-20 blur-lg"
        />
      )}

      <motion.div
        whileHover={{ scale: 1.1, rotate: active ? 0 : 5 }}
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-5 h-5 transition-colors relative z-10",
          active
            ? "text-primary-foreground"
            : "text-white/70 group-hover/sidebar:text-white"
        )}
      >
        {link.icon}
      </motion.div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "text-sm font-medium leading-none group-hover/sidebar:translate-x-0.5 transition-transform duration-150 whitespace-pre inline-block !p-0 !m-0 relative z-10",
          active ? "text-primary-foreground" : "text-white/70 group-hover/sidebar:text-white"
        )}
      >
        {link.label}
      </motion.span>

      {children}
    </Link>
  );
};
