/**
 * useBlogAI Hook
 *
 * AI generation functions for Flowriter
 * Integrates with Gemini AI via Server Actions and Streaming API
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GenerateTitlesRequest,
  GenerateOutlineRequest,
  GenerateArticleRequest,
  GenerateMetaRequest,
  RewriteTextRequest,
} from '@/types/blog-ai';
import {
  generateTitleSuggestionsWithSEOAction,
  generateOutlineAction,
  generateBlockSuggestionAction,
  rewriteTextAction,
  analysisSeoAction,
  generateMetaAction
} from '@/actions/flowriter';

// ============================================================================
// GENERATE TITLE SUGGESTIONS
// ============================================================================

export function useGenerateTitles() {
  return useMutation({
    mutationFn: async (request: GenerateTitlesRequest) => {
      const suggestions = await generateTitleSuggestionsWithSEOAction(request.topic);
      return suggestions;
    },
    onError: (error: Error) => {
      toast.error('Erreur de génération', {
        description: error.message || 'Impossible de générer les titres.',
      });
    },
  });
}

// ============================================================================
// GENERATE OUTLINE
// ============================================================================

export function useGenerateOutline() {
  return useMutation({
    mutationFn: async (request: GenerateOutlineRequest) => {
      // Pass config to generate intelligent structure based on word count, style, etc.
      const outline = await generateOutlineAction(
        request.topic,
        request.title,
        request.keywords,
        request.config
      );
      return outline;
    },
    onError: (error: Error) => {
      toast.error('Erreur de génération', {
        description: error.message || 'Impossible de générer le plan.',
      });
    },
  });
}

// ============================================================================
// GENERATE ARTICLE (Streaming)
// ============================================================================

interface GenerateArticleCallbacks {
  onProgress?: (phase: string, section: number, title: string) => void;
  onChunk?: (chunk: string) => void;
  onComplete?: (content: string, meta?: { title?: string; description?: string }) => void;
  onError?: (error: string) => void;
}

export function useGenerateArticle() {
  return useMutation({
    mutationFn: async ({
      request,
      callbacks,
    }: {
      request: GenerateArticleRequest;
      callbacks?: GenerateArticleCallbacks;
    }) => {

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        const response = await fetch('/api/flowriter/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullContent = '';
        let meta: { title?: string; description?: string; wordCount?: number } | undefined;
        let hasCompleted = false;
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'connected':
                    console.log('[FloWriter] Connected to stream');
                    break;

                  case 'heartbeat':
                    // Keep-alive signal, no action needed
                    break;

                  case 'progress':
                    callbacks?.onProgress?.(
                      data.phase,
                      data.section,
                      data.sectionTitle
                    );
                    break;

                  case 'chunk':
                    fullContent += data.content;
                    callbacks?.onChunk?.(data.content);
                    break;

                  case 'complete':
                    hasCompleted = true;
                    meta = data.meta;
                    callbacks?.onComplete?.(fullContent, meta);
                    break;

                  case 'error':
                    callbacks?.onError?.(data.message);
                    throw new Error(data.message);
                }
              } catch (e) {
                if (e instanceof SyntaxError) {
                  // Ignore JSON parse errors (incomplete chunks)
                  continue;
                }
                throw e;
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer && buffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.slice(6));
            if (data.type === 'complete') {
              hasCompleted = true;
              meta = data.meta;
              callbacks?.onComplete?.(fullContent, meta);
            }
          } catch (e) {
            // Ignore
          }
        }

        // Safety: If stream ends without explicit complete event
        if (!hasCompleted && fullContent.length > 0) {
          console.warn('[FloWriter] Stream ended without complete event');
          callbacks?.onComplete?.(fullContent, meta);
        }

        return { content: fullContent, meta };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new Error('La génération a pris trop de temps. Veuillez réessayer.');
          callbacks?.onError?.(timeoutError.message);
          throw timeoutError;
        }

        throw error;
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur de génération', {
        description: error.message || 'Impossible de générer l\'article.',
      });
    },
  });
}

// ============================================================================
// GENERATE META TAGS
// ============================================================================

export function useGenerateMeta() {
  return useMutation({
    mutationFn: async (request: GenerateMetaRequest) => {
      return await generateMetaAction(request.title, request.content, request.keywords);
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de générer les méta-données.',
      });
    },
  });
}

// ============================================================================
// REWRITE TEXT (Canvas Actions)
// ============================================================================

export function useRewriteText() {
  return useMutation({
    mutationFn: async (request: RewriteTextRequest) => {
      return await rewriteTextAction(request.text, request.action, request.context);
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de traiter le texte.',
      });
    },
  });
}

// ============================================================================
// ANALYZE SEO
// ============================================================================

export function useAnalyzeSeo() {
  return useMutation({
    mutationFn: async ({
      content,
      keywords,
    }: {
      content: string;
      keywords?: string[];
    }) => {
      return await analysisSeoAction(content, keywords || []);
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'analyse', {
        description: error.message || 'Impossible d\'analyser le SEO.',
      });
    },
  });
}

// ============================================================================
// GENERATE BLOCK CONTENT
// ============================================================================

export function useGenerateBlockContent() {
  return useMutation({
    mutationFn: async ({
      blockType,
      title,
      context,
      articleTopic,
      articleTitle,
      previousBlockContext,
    }: {
      blockType: string;
      title: string;
      context?: string;
      articleTopic?: string;
      articleTitle?: string;
      previousBlockContext?: string;
    }) => {
      // Call the server action with proper parameters
      return await generateBlockSuggestionAction(
        articleTitle || title,
        articleTopic || '',
        blockType as any,
        context || null,
        previousBlockContext || null
      );
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de générer le contenu.',
      });
    },
  });
}

// ============================================================================
// COMBINED HOOK
// ============================================================================

export function useBlogAI() {
  const generateTitles = useGenerateTitles();
  const generateOutline = useGenerateOutline();
  const generateArticle = useGenerateArticle();
  // const generateArticleSync = useGenerateArticleSync(); // Deprecated/Unused
  const generateMeta = useGenerateMeta();
  const rewriteText = useRewriteText();
  const analyzeSeo = useAnalyzeSeo();
  const generateBlockContent = useGenerateBlockContent();

  const isLoading =
    generateTitles.isPending ||
    generateOutline.isPending ||
    generateArticle.isPending ||
    generateMeta.isPending ||
    rewriteText.isPending ||
    analyzeSeo.isPending ||
    generateBlockContent.isPending;

  return {
    generateTitles,
    generateOutline,
    generateArticle,
    generateMeta,
    rewriteText,
    analyzeSeo,
    generateBlockContent,
    isLoading,
  };
}

