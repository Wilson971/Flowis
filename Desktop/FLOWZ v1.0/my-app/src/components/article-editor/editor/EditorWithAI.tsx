'use client';

/**
 * EditorWithAI - TipTap Editor with AI Bubble Menu
 *
 * Rich text editor with contextual AI actions on text selection
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
  RefreshCw,
  Plus,
  Minus,
  Lightbulb,
  ListTree,
  AlignLeft,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { useAIEditorActions } from '@/hooks/blog/useAIEditorActions';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EditorWithAIProps {
  value: string;
  onChange: (value: string) => void;
  aiActions?: ReturnType<typeof useAIEditorActions>;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
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

const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: ToolbarButtonProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'h-7 w-7 p-0',
            isActive && 'bg-primary/10 text-primary'
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      {title && (
        <TooltipContent side="top" className="text-xs">
          {title}
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

// ============================================================================
// AI BUBBLE MENU BUTTON
// ============================================================================

interface AIBubbleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  title?: string;
}

const AIBubbleButton = ({
  onClick,
  disabled,
  isLoading,
  children,
  title,
}: AIBubbleButtonProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled || isLoading}
          className="h-7 px-2 text-xs gap-1"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            children
          )}
        </Button>
      </TooltipTrigger>
      {title && (
        <TooltipContent side="top" className="text-xs">
          {title}
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditorWithAI({
  value,
  onChange,
  aiActions,
  placeholder = 'Commencez à écrire...',
  minHeight = 300,
  maxHeight = 600,
  disabled = false,
  className,
}: EditorWithAIProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);

  // Initialize editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
        setSelectionRange({ from, to });
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none',
          'px-4 py-3',
          disabled && 'opacity-50 cursor-not-allowed'
        ),
      },
    },
  });

  // Sync content when value changes externally
  useEffect(() => {
    if (editor && value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Handle AI action on selection
  const handleSelectionAIAction = useCallback(
    async (action: string) => {
      if (!selectedText || !selectionRange || !editor || !aiActions) return;

      const result = await aiActions.previewAction({
        action: action as any,
        content: selectedText,
        selection: {
          from: selectionRange.from,
          to: selectionRange.to,
          text: selectedText,
        },
      });

      // Result will be shown in preview panel
      // When user applies, we need to replace the selection
    },
    [selectedText, selectionRange, editor, aiActions]
  );

  // Set link
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-md bg-background animate-pulse',
          className
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Standard Toolbar */}
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

        <Separator orientation="vertical" className="h-5 mx-1" />

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

        <Separator orientation="vertical" className="h-5 mx-1" />

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

        <Separator orientation="vertical" className="h-5 mx-1" />

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

      {/* AI Actions Bar (visible when text is selected and aiActions is available) */}
      {selectedText && aiActions && (
        <div className="flex items-center gap-0.5 p-1.5 border-b border-border bg-primary/5">
          <span className="text-xs text-muted-foreground px-2">Actions IA:</span>
          <AIBubbleButton
            onClick={() => handleSelectionAIAction('rewrite')}
            isLoading={aiActions.isProcessing && aiActions.currentAction === 'rewrite'}
            disabled={!selectedText}
            title="Reecrire"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reecrire
          </AIBubbleButton>

          <AIBubbleButton
            onClick={() => handleSelectionAIAction('expand_selection')}
            isLoading={aiActions.isProcessing && aiActions.currentAction === 'expand_selection'}
            disabled={!selectedText}
            title="Etendre"
          >
            <Plus className="h-3 w-3" />
          </AIBubbleButton>

          <AIBubbleButton
            onClick={() => handleSelectionAIAction('shorten')}
            isLoading={aiActions.isProcessing && aiActions.currentAction === 'shorten'}
            disabled={!selectedText}
            title="Raccourcir"
          >
            <Minus className="h-3 w-3" />
          </AIBubbleButton>

          <AIBubbleButton
            onClick={() => handleSelectionAIAction('clarify')}
            isLoading={aiActions.isProcessing && aiActions.currentAction === 'clarify'}
            disabled={!selectedText}
            title="Clarifier"
          >
            <Lightbulb className="h-3 w-3" />
          </AIBubbleButton>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <AIBubbleButton
            onClick={() => handleSelectionAIAction('to_list')}
            isLoading={aiActions.isProcessing && aiActions.currentAction === 'to_list'}
            disabled={!selectedText}
            title="En liste"
          >
            <ListTree className="h-3 w-3" />
          </AIBubbleButton>

          <AIBubbleButton
            onClick={() => handleSelectionAIAction('to_paragraph')}
            isLoading={aiActions.isProcessing && aiActions.currentAction === 'to_paragraph'}
            disabled={!selectedText}
            title="En paragraphe"
          >
            <AlignLeft className="h-3 w-3" />
          </AIBubbleButton>
        </div>
      )}

      {/* Editor Content */}
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{ minHeight, maxHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
