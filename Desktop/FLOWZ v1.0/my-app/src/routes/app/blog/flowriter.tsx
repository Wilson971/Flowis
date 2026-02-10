import { createFileRoute } from '@tanstack/react-router';
import { FlowriterAssistant } from '@/components/blog-ai/FlowriterAssistant';

export const Route = createFileRoute('/app/blog/flowriter')({
  component: FlowriterPage,
});

function FlowriterPage() {
  return <FlowriterAssistant />;
}
