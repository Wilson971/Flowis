'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, FileText, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';

const TYPE_CONFIG: Record<
  SearchResult['type'],
  { label: string; icon: typeof Package }
> = {
  product: { label: 'Produits', icon: Package },
  article: { label: 'Articles', icon: FileText },
  category: { label: 'Categories', icon: Package },
  store: { label: 'Boutiques', icon: Package },
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const debouncedQuery = useDebounce(input, 300);
  const { data: results = [], isLoading } = useGlobalSearch(debouncedQuery);
  const router = useRouter();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setInput('');
      router.push(href);
    },
    [router]
  );

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>(
    (acc, result) => {
      const key = result.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    },
    {}
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher produits, articles..."
        value={input}
        onValueChange={setInput}
      />
      <CommandList>
        {isLoading && debouncedQuery.length >= 2 ? (
          <div className={cn('flex items-center justify-center gap-2 p-6 text-muted-foreground')}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Recherche en cours...</span>
          </div>
        ) : (
          <>
            <CommandEmpty>Aucun resultat</CommandEmpty>
            <AnimatePresence mode="wait">
              {Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type as SearchResult['type']];
                if (!config) return null;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={type}
                    {...motionTokens.variants.fadeIn}
                    transition={motionTokens.transitions.fast}
                  >
                    <CommandGroup heading={config.label}>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.title}
                          onSelect={() => handleSelect(item.href)}
                          className={cn('flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer')}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted'
                            )}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="h-8 w-8 rounded-lg object-cover"
                              />
                            ) : (
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="truncate text-sm font-medium text-foreground">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
