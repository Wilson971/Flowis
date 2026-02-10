"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { AuroraBackground } from "./AuroraBackground";
import { SidebarPreferenceProvider } from "../../contexts/SidebarContext";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * AppLayout Component
 *
 * Main application layout with sidebar, header, and content area
 * Features:
 * - Aurora background effects for visual depth
 * - Collapsible sidebar with persistence
 * - Smart sticky header with scroll detection
 * - Rounded card-style main content area
 */

const AppLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();

  // Handle scroll on main content area
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 20);
  };

  return (
    <div className="flex h-screen w-full bg-[#0e0e0e] text-white relative overflow-hidden">
      {/* Global Aurora Effects - Simplified for performance */}
      <AuroraBackground opacity={0.3} />

      {/* Sidebar with integrated auroras - Always Dark */}
      <div className="relative flex-shrink-0 z-20 h-full dark">
        <AppSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full relative z-30 overflow-hidden p-1 md:p-2 lg:p-3 pl-0">
        {/* Large unified card */}
        <div
          suppressHydrationWarning
          className={cn(
            "flex-1 flex flex-col bg-background text-foreground rounded-l-3xl md:rounded-3xl border border-white/5 overflow-hidden",
            theme
          )}
        >
          {/* Unified Header with Metallic Style */}
          <TopHeader />

          {/* Scrollable content area */}
          <main
            id="main-content"
            role="main"
            className="flex-1 overflow-y-auto w-full bg-background/50 scroll-smooth custom-scrollbar"
            onScroll={handleScroll}
          >
            <div className="px-4 md:px-8 py-4 md:py-6 max-w-none mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarPreferenceProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarPreferenceProvider>
  );
};
