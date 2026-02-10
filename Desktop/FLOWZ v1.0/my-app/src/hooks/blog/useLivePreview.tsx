/**
 * useLivePreview Hook
 *
 * Manages live preview state for the article editor:
 * - Toggle preview panel visibility
 * - Control preview device mode (desktop/tablet/mobile)
 * - Debounced content updates
 * - Keyboard shortcuts (Cmd+P)
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// CUSTOM DEBOUNCE HOOK
// ============================================================================

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// TYPES
// ============================================================================

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export interface PreviewDimensions {
  width: number;
  height: number | 'auto';
  label: string;
}

export interface PreviewContent {
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  author?: {
    name: string;
    avatar?: string;
  };
  publishedAt?: Date;
}

export interface UseLivePreviewOptions {
  initialOpen?: boolean;
  initialDevice?: PreviewDevice;
  debounceMs?: number;
  onToggle?: (isOpen: boolean) => void;
}

export interface UseLivePreviewReturn {
  // State
  isOpen: boolean;
  device: PreviewDevice;
  dimensions: PreviewDimensions;
  previewContent: PreviewContent | null;

  // Actions
  toggle: () => void;
  open: () => void;
  close: () => void;
  setDevice: (device: PreviewDevice) => void;
  updateContent: (content: Partial<PreviewContent>) => void;
  setContent: (content: PreviewContent) => void;

  // Helpers
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PREVIEW_DIMENSIONS: Record<PreviewDevice, PreviewDimensions> = {
  desktop: { width: 1200, height: 'auto', label: 'Desktop' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  mobile: { width: 375, height: 667, label: 'Mobile' },
};

// ============================================================================
// HOOK
// ============================================================================

export function useLivePreview(options: UseLivePreviewOptions = {}): UseLivePreviewReturn {
  const {
    initialOpen = false,
    initialDevice = 'desktop',
    debounceMs = 300,
    onToggle,
  } = options;

  // State
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [device, setDevice] = useState<PreviewDevice>(initialDevice);
  const [rawContent, setRawContent] = useState<PreviewContent | null>(null);

  // Debounced content for performance
  const debouncedContent = useDebouncedValue(rawContent, debounceMs);

  // Dimensions based on device
  const dimensions = useMemo(() => PREVIEW_DIMENSIONS[device], [device]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  }, [onToggle]);

  const open = useCallback(() => {
    setIsOpen(true);
    onToggle?.(true);
  }, [onToggle]);

  const close = useCallback(() => {
    setIsOpen(false);
    onToggle?.(false);
  }, [onToggle]);

  const updateContent = useCallback((content: Partial<PreviewContent>) => {
    setRawContent((prev) => (prev ? { ...prev, ...content } : null));
  }, []);

  const setContent = useCallback((content: PreviewContent) => {
    setRawContent(content);
  }, []);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + P to toggle preview
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        toggle();
      }

      // Escape to close preview
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close, isOpen]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    isOpen,
    device,
    dimensions,
    previewContent: debouncedContent,

    // Actions
    toggle,
    open,
    close,
    setDevice,
    updateContent,
    setContent,

    // Helpers
    isDesktop: device === 'desktop',
    isTablet: device === 'tablet',
    isMobile: device === 'mobile',
  };
}

// ============================================================================
// CONTEXT (for sharing preview state across components)
// ============================================================================

import { createContext, useContext, type ReactNode } from 'react';

const LivePreviewContext = createContext<UseLivePreviewReturn | null>(null);

export function LivePreviewProvider({
  children,
  ...options
}: UseLivePreviewOptions & { children: ReactNode }) {
  const preview = useLivePreview(options);

  return (
    <LivePreviewContext.Provider value={preview}>
      {children}
    </LivePreviewContext.Provider>
  );
}

export function useLivePreviewContext(): UseLivePreviewReturn {
  const context = useContext(LivePreviewContext);
  if (!context) {
    throw new Error('useLivePreviewContext must be used within LivePreviewProvider');
  }
  return context;
}
