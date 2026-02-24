/**
 * Page Édition Article - Standalone Editor
 *
 * Navigation:
 * - /app/blog/editor/new -> Nouvel article (articleId = "new")
 * - /app/blog/editor/:id -> Édition d'un article existant
 */

import { ArticleEditorPageClient } from './client';

export default async function ArticleEditorPage({
    params,
}: {
    params: Promise<{ articleId: string }>;
}) {
    const { articleId } = await params;
    const editorArticleId = articleId === 'new' ? undefined : articleId;

    return <ArticleEditorPageClient articleId={editorArticleId} />;
}
