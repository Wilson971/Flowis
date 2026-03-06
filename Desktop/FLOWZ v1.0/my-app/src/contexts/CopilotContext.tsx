"use client"

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

/**
 * CopilotContext
 *
 * Manages the Copilot panel open/closed state with localStorage persistence.
 * Mirrors the SidebarContext pattern for consistency.
 */

type CopilotContextType = {
  /** Whether the copilot panel is open */
  isOpen: boolean;
  /** Toggle the copilot panel */
  toggleCopilot: () => void;
  /** Set the copilot state explicitly */
  setCopilotOpen: (open: boolean) => void;
  /** Indicates if data is ready (anti-flickering) */
  isReady: boolean;
};

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

const STORAGE_KEY = 'flowiz-copilot-open';

export const CopilotProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsOpen(stored === 'true');
      }
    } catch (error) {
      console.error('Error loading copilot preference:', error);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isReady) {
      try {
        localStorage.setItem(STORAGE_KEY, String(isOpen));
      } catch (error) {
        console.error('Error saving copilot preference:', error);
      }
    }
  }, [isOpen, isReady]);

  const toggleCopilot = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const setCopilotOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        toggleCopilot,
        setCopilotOpen,
        isReady,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

/**
 * Hook to access copilot panel state.
 * Must be used inside CopilotProvider.
 */
export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
};
