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
