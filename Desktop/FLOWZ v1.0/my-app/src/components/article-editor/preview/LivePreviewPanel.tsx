'use client';

/**
 * LivePreviewPanel Component
 *
 * Side panel for real-time article preview:
 * - Responsive device selector (desktop/tablet/mobile)
 * - Live content updates
 * - Slide-in animation
 * - Keyboard shortcut indicator
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Eye,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useLivePreview,
  type PreviewContent,
  type PreviewDevice,
  PREVIEW_DIMENSIONS,
} from '@/hooks/blog/useLivePreview';
import ReactMarkdown from 'react-markdown';

// ============================================================================
// TYPES
// ============================================================================

interface LivePreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: PreviewContent | null;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  className?: string;
}

// ============================================================================
// DEVICE BUTTON
// ============================================================================

interface DeviceButtonProps {
  device: PreviewDevice;
  currentDevice: PreviewDevice;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function DeviceButton({ device, currentDevice, onClick, icon, label }: DeviceButtonProps) {
  const isActive = device === currentDevice;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            size="icon"
            onClick={onClick}
            className={cn(
              'h-8 w-8 transition-all',
              isActive && 'bg-primary/10 text-primary border border-primary/20'
            )}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// PREVIEW CONTENT RENDERER
// ============================================================================

interface PreviewRendererProps {
  content: PreviewContent;
  device: PreviewDevice;
}

function PreviewRenderer({ content, device }: PreviewRendererProps) {
  const dimensions = PREVIEW_DIMENSIONS[device];

  return (
    <div
      className={cn(
        'mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300',
        device === 'mobile' && 'max-w-[375px]',
        device === 'tablet' && 'max-w-[768px]',
        device === 'desktop' && 'max-w-full'
      )}
      style={{
        width: device === 'desktop' ? '100%' : dimensions.width,
        minHeight: device === 'desktop' ? 'auto' : 400,
      }}
    >
      {/* Article Preview */}
      <article className="p-6 lg:p-8">
        {/* Featured Image */}
        {content.featuredImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-6">
            <img
              src={content.featuredImage}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {content.category && (
            <Badge variant="secondary" className="text-xs">
              {content.category}
            </Badge>
          )}
          {content.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1
          className={cn(
            'font-black text-gray-900 mb-4 leading-tight',
            device === 'mobile' ? 'text-2xl' : 'text-3xl lg:text-4xl'
          )}
        >
          {content.title || 'Sans titre'}
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          {content.author && (
            <div className="flex items-center gap-2">
              {content.author.avatar ? (
                <img
                  src={content.author.avatar}
                  alt={content.author.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                  {content.author.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {content.author.name}
              </span>
            </div>
          )}
          {content.publishedAt && (
            <span className="text-sm text-gray-500">
              {content.publishedAt.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Excerpt */}
        {content.excerpt && (
          <p
            className={cn(
              'text-gray-600 mb-8 font-medium leading-relaxed',
              device === 'mobile' ? 'text-base' : 'text-lg'
            )}
          >
            {content.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className={cn(
            'prose prose-gray max-w-none',
            device === 'mobile' ? 'prose-sm' : 'prose-lg'
          )}
        >
          <ReactMarkdown>{content.content || '*Aucun contenu*'}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LivePreviewPanel({
  isOpen,
  onClose,
  content,
  device,
  onDeviceChange,
  className,
}: LivePreviewPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 h-full w-full lg:w-[60%] xl:w-[55%] bg-gray-100 shadow-2xl z-50 flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Apercu en direct</h3>
                  <p className="text-[10px] text-muted-foreground">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Cmd+P</kbd> pour basculer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Device Selector */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <DeviceButton
                    device="desktop"
                    currentDevice={device}
                    onClick={() => onDeviceChange('desktop')}
                    icon={<Monitor className="w-4 h-4" />}
                    label="Desktop"
                  />
                  <DeviceButton
                    device="tablet"
                    currentDevice={device}
                    onClick={() => onDeviceChange('tablet')}
                    icon={<Tablet className="w-4 h-4" />}
                    label="Tablet"
                  />
                  <DeviceButton
                    device="mobile"
                    currentDevice={device}
                    onClick={() => onDeviceChange('mobile')}
                    icon={<Smartphone className="w-4 h-4" />}
                    label="Mobile"
                  />
                </div>

                {/* Close Button */}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-4 lg:p-6">
              {content ? (
                <PreviewRenderer content={content} device={device} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      Commencez a editer pour voir l'apercu
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {PREVIEW_DIMENSIONS[device].label} ({PREVIEW_DIMENSIONS[device].width}px)
              </p>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LivePreviewPanel;
