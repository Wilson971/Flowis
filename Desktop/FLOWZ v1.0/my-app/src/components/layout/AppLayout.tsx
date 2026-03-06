"use client";

import { cn } from "../../lib/utils";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { AuroraBackground } from "./AuroraBackground";
import { SidebarPreferenceProvider } from "../../contexts/SidebarContext";
import { CopilotProvider } from "../../contexts/CopilotContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCopilot } from "../../contexts/CopilotContext";
import { CopilotPanel } from "../copilot/CopilotPanel";
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

  return (
    <div className="flex h-screen w-full bg-[#0e0e0e] text-white relative overflow-hidden">
      {/* Global Aurora Effects - Simplified for performance */}
      <AuroraBackground opacity={0.3} />

      {/* Sidebar with integrated auroras - Always Dark */}
      <div className="relative flex-shrink-0 z-20 h-screen dark">
        <AppSidebar />
      </div>

      {/* Main content area - transitions when copilot opens/closes */}
      <div className="flex-1 flex flex-col h-full relative z-30 overflow-hidden p-1 md:p-2 lg:p-3 pl-0 transition-all duration-300">
        {/* Large unified card */}
        <div
          suppressHydrationWarning
          className={cn(
            "flex-1 min-h-0 flex flex-row bg-background text-foreground rounded-l-3xl md:rounded-3xl border border-white/5 overflow-hidden",
            theme
          )}
        >
          {/* Content column */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Unified Header with Metallic Style */}
            <TopHeader />

            {/* Scrollable content area */}
            <main
              id="main-content"
              role="main"
              className="flex-1 min-h-0 overflow-y-auto w-full bg-background/50 scroll-smooth custom-scrollbar"
            >
              <div className="px-4 md:px-8 py-4 md:py-6 max-w-none mx-auto w-full">
                {children}
              </div>
            </main>
          </div>

          {/* Copilot Panel - pushes content when open */}
          <AnimatePresence>
            {isCopilotOpen && <CopilotPanel />}
          </AnimatePresence>
        </div>
      </div>
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
