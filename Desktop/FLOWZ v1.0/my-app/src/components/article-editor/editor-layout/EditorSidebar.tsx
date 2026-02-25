'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { StatusCard } from '../sidebar/StatusCard';
import { SeoScoreCard } from '../sidebar/SeoScoreCard';
import { LinkBuilderCard } from '../sidebar/LinkBuilderCard';
import { PublicationCard } from '../sidebar/PublicationCard';
import { OrganizationCard } from '../sidebar/OrganizationCard';
import { FeaturedImageCard } from '../sidebar/FeaturedImageCard';
import { VersionHistoryCard } from '../sidebar/VersionHistoryCard';
import { WordPressSyncCard } from '../sidebar/WordPressSyncCard';

import { sidebarVariants } from './motion-variants';

interface EditorSidebarProps {
  isNew: boolean;
  articleId?: string;
  currentContent: string;
  currentTitle: string;
  onVersionRestored: () => void;
}

export function EditorSidebar({
  isNew,
  articleId,
  currentContent,
  currentTitle,
  onVersionRestored,
}: EditorSidebarProps) {
  return (
    <motion.aside
      variants={sidebarVariants}
      className="space-y-4"
    >
      {/* Status Card */}
      <StatusCard />

      {/* SEO Score Card */}
      <SeoScoreCard />

      {/* LinkBuilder - Internal Linking Suggestions (only for existing articles) */}
      {!isNew && articleId && (
        <LinkBuilderCard />
      )}

      {/* Version History Card (only for existing articles) */}
      {!isNew && articleId && (
        <VersionHistoryCard
          articleId={articleId}
          currentContent={currentContent}
          currentTitle={currentTitle}
          onVersionRestored={onVersionRestored}
        />
      )}

      {/* Publication Card */}
      <PublicationCard />

      {/* WordPress Sync Card (only for existing articles) */}
      {!isNew && articleId && (
        <WordPressSyncCard articleId={articleId} />
      )}

      {/* Organization Card (Category + Tags) */}
      <OrganizationCard />

      {/* Featured Image Card */}
      <FeaturedImageCard />
    </motion.aside>
  );
}
