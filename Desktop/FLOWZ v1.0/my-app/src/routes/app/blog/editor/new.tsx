import { createFileRoute } from '@tanstack/react-router';
import { ArticleEditor } from '@/components/article-editor';

export const Route = createFileRoute('/app/blog/editor/new')({
  component: NewArticlePage,
});

function NewArticlePage() {
  return <ArticleEditor />;
}
