'use client';

/**
 * Flowriter AI Writer Page
 *
 * AI-powered article generation wizard
 * Route: /app/blog/ai-writer
 */

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FlowriterAssistant } from '@/components/blog-ai';
import { useSelectedStore } from '@/contexts/StoreContext';
import { styles, motionTokens } from '@/lib/design-system';
import { cn } from '@/lib/utils';

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <p className={styles.text.bodyMuted}>Chargement de Flowriter...</p>
      </div>
    </div>
  );
}

// ============================================================================
// AI WRITER PAGE
// ============================================================================

export default function AIWriterPage() {
  const router = useRouter();
  const { selectedStore } = useSelectedStore();

  const handleArticleComplete = (articleId: string) => {
    // Navigate to the article editor after creation
    router.push(`/app/blog/${articleId}`);
  };

  const handleCancel = () => {
    router.push('/app/blog');
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionTokens.variants.staggerContainer}
      className="min-h-screen"
    >
      {/* Header */}
      <motion.header
        variants={motionTokens.variants.staggerItem}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app/blog">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className={cn(styles.text.h3, 'mb-0')}>Flowriter AI</h1>
                  <p className={cn(styles.text.bodySmall, 'text-muted-foreground')}>
                    Créez votre article avec l'IA
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        variants={motionTokens.variants.staggerItem}
        className="container mx-auto px-4 py-8"
      >
        <Suspense fallback={<LoadingSkeleton />}>
          {selectedStore?.id && selectedStore?.tenant_id ? (
            <FlowriterAssistant
              storeId={selectedStore.id}
              tenantId={selectedStore.tenant_id}
              onComplete={handleArticleComplete}
              onCancel={handleCancel}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className={styles.text.bodyMuted}>Veuillez sélectionner une boutique</p>
            </div>
          )}
        </Suspense>
      </motion.main>
    </motion.div>
  );
}
