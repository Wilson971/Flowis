import { createFileRoute } from '@tanstack/react-router';
import { ArticleEditor } from '@/components/article-editor';

export const Route = createFileRoute('/app/blog/editor/$articleId')({
  component: EditArticlePage,
});

function EditArticlePage() {
  const { articleId } = Route.useParams();
  return <ArticleEditor articleId={articleId} />;
}
