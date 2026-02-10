'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    // Remove markdown code blocks if they wrap the entire content or appear at the start
    // AI often outputs ```markdown ... ```
    let cleanContent = content;

    // Remove starting ```markdown or ```
    cleanContent = cleanContent.replace(/^```markdown\s*\n?/i, '');
    cleanContent = cleanContent.replace(/^```\s*\n?/i, '');

    // Remove ending ```
    cleanContent = cleanContent.replace(/\n?\s*```$/i, '');

    // Fix malformed tables (common with some AI models)
    // Remove empty pipe lines between header and separator: | Header |\n|\n|---|
    cleanContent = cleanContent.replace(/(\|[^\n]+\|)\n\|[ \t]*\|\n(\|[ \t]*:?-+:?[ \t]*\|)/g, '$1\n$2');

    // Ensure tables have a newline before them if preceded by text
    cleanContent = cleanContent.replace(/([^\n])\n(\|[^\n]+\|)\n(\|[ \t]*:?-+:?[ \t]*\|)/g, '$1\n\n$2\n$3');

    return (
        <div className={cn(
            "prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl",
            "prose-table:border prose-table:rounded-lg prose-table:overflow-hidden prose-th:bg-muted/50 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-td:border-t",
            className
        )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cleanContent}
            </ReactMarkdown>
        </div>
    );
}
