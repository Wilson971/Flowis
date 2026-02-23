"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Link as LinkIcon,
    Heading2,
    Heading3,
    Quote,
    Code,
    Undo,
    Redo,
    RemoveFormatting,
    Sparkles,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface TipTapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    disabled?: boolean;
    className?: string;
    autoFixSpacing?: boolean; // New prop to enable auto-fixing
}

// ============================================================================
// TOOLBAR BUTTON
// ============================================================================

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
}

const ToolbarButton = ({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) => (
    <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn(
            "h-7 w-7 p-0",
            isActive && "bg-primary/10 text-primary"
        )}
    >
        {children}
    </Button>
);

// ============================================================================
// HELPER: Fix spacing around bold tags
// ============================================================================
const fixSpacing = (html: string): string => {
    if (!html) return html;
    // Add space before <strong> if preceded by non-space char (and not >)
    // Add space after </strong> if followed by non-space char (and not < or punctuation)
    // This is a naive implementation, a robust one would parse DOM.
    // However, for typical descriptions, simple regex helps.

    // Pattern: checks for char, then tag start/end, then char. 
    // We rely on TipTap's own normalization mostly, but we can force space injection.

    // Actually, simpler approach: let TipTap handle it, but we can instruct it?
    // No, TipTap converts HTML to JSON. 

    // Let's try to inject spaces in the source HTML string before passing to editor.
    return html
        .replace(/([^\s>])(<strong>|<b>)/gi, '$1 $2') // Space before
        .replace(/(<\/strong>|<\/b>)([^\s<.,:;!?])/gi, '$1 $2'); // Space after (unless punctuation)
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TipTapEditor = ({
    value,
    onChange,
    placeholder = "Commencez à écrire...",
    minHeight = 150,
    maxHeight = 400,
    disabled = false,
    className,
    autoFixSpacing = true,
}: TipTapEditorProps) => {
    // Guard: suppress onChange during editor initialization to prevent false isDirty.
    // TipTap may normalize HTML (e.g. "" → "<p></p>", add paragraph wrappers)
    // which would trigger field.onChange and mark the form dirty immediately.
    const isInitializingRef = useRef(true);

    // Sanitize initial value if requested
    const initialContent = autoFixSpacing ? fixSpacing(value) : value;

    const editor = useEditor({
        immediatelyRender: false, // Required for Next.js SSR
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3, 4],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline cursor-pointer",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: initialContent,
        editable: !disabled,
        onCreate: () => {
            // Allow onChange after editor is fully initialized + first render cycle
            requestAnimationFrame(() => {
                isInitializingRef.current = false;
            });
        },
        onUpdate: ({ editor }) => {
            if (isInitializingRef.current) return;
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm dark:prose-invert max-w-none",
                    "focus:outline-none",
                    "px-4 py-3",
                    disabled && "opacity-50 cursor-not-allowed"
                ),
            },
        },
    });

    // Sync content when value changes externally (e.g. form reset, undo/redo, draft accept)
    // NOTE: Do NOT guard with isInitializingRef here. When product data is already cached
    // (TanStack Query), value arrives in the same render cycle as editor creation.
    // The RAF in onCreate hasn't fired yet, so isInitializingRef is still true — skipping
    // the sync permanently. emitUpdate:false already prevents false dirty state.
    useEffect(() => {
        if (!editor) return;

        const editorHtml = editor.getHTML();
        if (editorHtml !== value) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    // Manual fix handler
    const handleAutoFix = useCallback(() => {
        if (!editor) return;
        const currentHtml = editor.getHTML();
        const fixed = fixSpacing(currentHtml);
        if (fixed !== currentHtml) {
            editor.commands.setContent(fixed);
            onChange(fixed); // Update parent
        }
    }, [editor, onChange]);

    // Set link
    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL du lien:', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // Sanitize URL: only allow http/https to prevent XSS via javascript: links
        let safeUrl = url.trim();
        if (!/^https?:\/\//i.test(safeUrl)) {
            safeUrl = 'https://' + safeUrl;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run();
    }, [editor]);

    if (!editor) {
        return (
            <div
                className={cn(
                    "rounded-lg border border-border bg-background animate-pulse",
                    className
                )}
                style={{ minHeight }}
            />
        );
    }

    return (
        <div className={cn("rounded-lg border border-border overflow-hidden bg-background", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/30">
                {/* Text formatting */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        disabled={disabled}
                        title="Gras (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        disabled={disabled}
                        title="Italique (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        disabled={disabled}
                        title="Barré"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Headings */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        disabled={disabled}
                        title="Titre H2"
                    >
                        <Heading2 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        disabled={disabled}
                        title="Titre H3"
                    >
                        <Heading3 className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Lists */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        disabled={disabled}
                        title="Liste à puces"
                    >
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        disabled={disabled}
                        title="Liste numérotée"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Others */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        disabled={disabled}
                        title="Citation"
                    >
                        <Quote className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        disabled={disabled}
                        title="Code inline"
                    >
                        <Code className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={setLink}
                        isActive={editor.isActive('link')}
                        disabled={disabled}
                        title="Ajouter un lien"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex-1" />

                {/* Spacer logic fix button */}
                <ToolbarButton
                    onClick={handleAutoFix}
                    disabled={disabled}
                    title="Corriger automatiquement les espaces (Auto-fix)"
                >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                        disabled={disabled}
                        title="Supprimer le formatage"
                    >
                        <RemoveFormatting className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={disabled || !editor.can().undo()}
                        title="Annuler (Ctrl+Z)"
                    >
                        <Undo className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={disabled || !editor.can().redo()}
                        title="Rétablir (Ctrl+Y)"
                    >
                        <Redo className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>

            {/* Editor content */}
            <div
                className="overflow-y-auto"
                style={{ minHeight, maxHeight }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
