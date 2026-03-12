import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Strip HTML tags from a string, returning plain text.
 * Handles null/undefined safely.
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Scroll an element into view WITHOUT propagating scroll to parent containers.
 * Finds the nearest scrollable ancestor and uses scrollTo/scrollBy instead of
 * the native scrollIntoView() which leaks scroll to every ancestor.
 */
export function safeScrollTo(
    el: HTMLElement,
    options: { block?: 'center' | 'start' | 'end' | 'nearest'; behavior?: ScrollBehavior } = {}
) {
    const { block = 'center', behavior = 'smooth' } = options;

    const scrollContainer = findScrollParent(el);
    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    let offset: number;
    switch (block) {
        case 'start':
            offset = elRect.top - containerRect.top;
            break;
        case 'end':
            offset = elRect.bottom - containerRect.bottom;
            break;
        case 'nearest': {
            const above = elRect.top < containerRect.top;
            const below = elRect.bottom > containerRect.bottom;
            if (above) offset = elRect.top - containerRect.top;
            else if (below) offset = elRect.bottom - containerRect.bottom;
            else return; // already visible
            break;
        }
        case 'center':
        default:
            offset = elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
            break;
    }

    scrollContainer.scrollBy({ top: offset, behavior });
}

/** Walk up the DOM to find the nearest scrollable parent. */
function findScrollParent(el: HTMLElement): HTMLElement | null {
    // Prefer Radix ScrollArea viewport
    const radix = el.closest<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (radix) return radix;

    let node = el.parentElement;
    while (node && node !== document.documentElement) {
        const style = getComputedStyle(node);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
            return node;
        }
        node = node.parentElement;
    }

    // Fallback to main content area or documentElement
    return document.querySelector<HTMLElement>('main') || document.documentElement;
}

/**
 * Focus an element without triggering scroll propagation.
 * Always uses preventScroll: true.
 */
export function safeFocus(el: HTMLElement | null) {
    el?.focus({ preventScroll: true });
}

export function stripMarkdown(content: string): string {
    if (!content) return "";
    return content
        .replace(/```[a-z]*\n?/gi, "") // Remove code blocks
        .replace(/```/g, "")
        .replace(/#{1,6}\s?/g, "") // Remove headers
        .replace(/\*\*|__/g, "") // Remove bold
        .replace(/\*|_/g, "") // Remove italic
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links but keep text
        .replace(/>\s?/g, "") // Remove blockquotes
        .replace(/`([^`]+)`/g, "$1") // Remove inline code
        .trim();
}
