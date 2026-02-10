import { createFileRoute } from '@tanstack/react-router';
import { BlogList } from '@/components/blog/BlogList';

export const Route = createFileRoute('/app/blog/')({
  component: BlogListPage,
});

function BlogListPage() {
  return <BlogList />;
}
