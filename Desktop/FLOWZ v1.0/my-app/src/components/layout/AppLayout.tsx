"use client";

import { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { AuroraBackground } from "./AuroraBackground";
import { SidebarPreferenceProvider } from "../../contexts/SidebarContext";
import { CopilotProvider, useCopilot } from "../../contexts/CopilotContext";
import { useTheme } from "../../contexts/ThemeContext";
import { CopilotPanel } from "../copilot/CopilotPanel";
import { SpotlightModal } from "../copilot/spotlight/SpotlightModal";
import { AnimatePresence } from "framer-motion";

/**
 * AppLayout Component
 *
 * Main application layout with sidebar, header, and content area
 * Features:
 * - Aurora background effects for visual depth
 * - Collapsible sidebar with persistence
 * - Smart sticky header with scroll detection
 * - Rounded card-style main content area
 * - Windows Copilot-style AI panel (push behavior)
 */

const AppLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  const { isOpen: isCopilotOpen } = useCopilot();
  const mainRef = useRef<HTMLElement>(null);
  const savedScrollRef = useRef(0);

  // Preserve main scroll position when Copilot panel opens/closes (push resize causes scroll reset)
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const saved = savedScrollRef.current;
    // Restore scroll repeatedly during the 300ms animation to fight browser resets
    const restore = () => { main.scrollTop = saved; };
    restore();
    const raf1 = requestAnimationFrame(restore);
    const t1 = setTimeout(restore, 50);
    const t2 = setTimeout(restore, 150);
    const t3 = setTimeout(restore, 350);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isCopilotOpen]);

  // Continuously track scroll position
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const onScroll = () => { savedScrollRef.current = main.scrollTop; };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0e0e0e] text-white relative overflow-hidden">
      {/* Global Aurora Effects - Simplified for performance */}
      <AuroraBackground opacity={0.3} />

      {/* Sidebar with integrated auroras - Always Dark */}
      <div className="relative flex-shrink-0 z-20 h-screen dark">
        <AppSidebar />
      </div>

      {/* Main content area - flex row for main card + copilot (push on desktop) */}
      <div className="flex-1 flex flex-row h-full relative z-30 overflow-hidden p-1 md:p-2 lg:p-3 pl-0 gap-2 transition-all duration-300">
        {/* Main card */}
        <div
          suppressHydrationWarning
          className={cn(
            "flex-1 min-w-0 min-h-0 flex flex-col bg-background text-foreground rounded-l-3xl md:rounded-3xl border border-white/5 overflow-hidden",
            theme
          )}
        >
          {/* Unified Header with Metallic Style */}
          <TopHeader />

          {/* Scrollable content area */}
          <main
            ref={mainRef}
            id="main-content"
            role="main"
            className="flex-1 min-h-0 overflow-y-auto w-full bg-background scroll-smooth custom-scrollbar"
          >
            <div className="px-4 md:px-8 py-4 md:py-6 w-full">
              {children}
            </div>
          </main>
        </div>

        {/* Copilot panel — push on desktop, overlay on mobile (handled internally) */}
        <AnimatePresence>
          {isCopilotOpen && <CopilotPanel />}
        </AnimatePresence>
      </div>

      {/* Spotlight search modal (Ctrl+K) */}
      <SpotlightModal />
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarPreferenceProvider>
      <CopilotProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </CopilotProvider>
    </SidebarPreferenceProvider>
  );
};
