'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to manage slug lock state based on article publication status.
 * Published articles have their slug locked by default to prevent SEO-breaking URL changes.
 */
export function useSlugLock(status: string) {
  const isDraft = status === 'draft';
  const isPublished = status === 'published';
  const [isSlugLocked, setIsSlugLocked] = useState(false);
  const [showSlugWarning, setShowSlugWarning] = useState(false);

  // Auto-lock slug when published
  useEffect(() => {
    if (isPublished) {
      setIsSlugLocked(true);
    } else {
      setIsSlugLocked(false);
    }
  }, [isPublished]);

  return {
    isDraft,
    isPublished,
    isSlugLocked,
    setIsSlugLocked,
    showSlugWarning,
    setShowSlugWarning,
  };
}
