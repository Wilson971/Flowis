/**
 * Page Édition Article - Standalone Editor
 *
 * Navigation:
 * - /app/blog/editor/new -> Nouvel article (articleId = "new")
 * - /app/blog/editor/:id -> Édition d'un article existant
 */
'use client';

import { ArticleEditor } from '@/components/article-editor';
import { useParams } from 'next/navigation';

export default function ArticleEditorPage() {
    const params = useParams();
    const articleId = params?.articleId as string;

    // Si articleId est "new", on passe undefined pour créer un nouvel article
    const editorArticleId = articleId === 'new' ? undefined : articleId;

    return <ArticleEditor articleId={editorArticleId} />;
}
