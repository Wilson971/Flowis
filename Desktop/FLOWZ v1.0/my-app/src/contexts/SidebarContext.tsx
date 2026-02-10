"use client"

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

/**
 * SidebarContext
 *
 * Manages the sidebar collapsed/expanded state with localStorage persistence
 */

type SidebarContextType = {
  /** Current state of the sidebar (true = collapsed, false = expanded) */
  isCollapsed: boolean;
  /** Toggle the sidebar state */
  toggleSidebar: () => void;
  /** Set the sidebar state explicitly */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Indicates if data is ready (for anti-flickering) */
  isReady: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'flowiz-sidebar-collapsed';

export const SidebarPreferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    } catch (error) {
      console.error('Error loading sidebar preference:', error);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isReady) {
      try {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
      } catch (error) {
        console.error('Error saving sidebar preference:', error);
      }
    }
  }, [isCollapsed, isReady]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    if (collapsed !== isCollapsed) {
      setIsCollapsed(collapsed);
    }
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        isReady,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

/**
 * Hook to access sidebar preferences
 * Must be used inside SidebarPreferenceProvider
 */
export const useSidebarPreference = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarPreference must be used within a SidebarPreferenceProvider');
  }
  return context;
};
