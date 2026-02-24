'use client';

import { ArticleEditor } from '@/components/article-editor';

export function ArticleEditorPageClient({ articleId }: { articleId?: string }) {
    return <ArticleEditor articleId={articleId} />;
}
