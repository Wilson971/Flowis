/**
 * Store Selector Component
 *
 * Dropdown to select the active store
 * Displays in the header for quick store switching
 */

"use client";

import { Store as StoreIcon, Check, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useSelectedStore } from '../../contexts/StoreContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';

export function StoreSelector() {
  const { selectedStore, stores, setSelectedStore, isLoading } = useSelectedStore();
  const { open } = useSidebar();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={cn(
        "justify-start border border-white/10 text-white/50",
        open ? "w-full" : "w-10 h-10 p-0 rounded-full mx-auto flex justify-center"
      )}>
        <StoreIcon className={cn("h-4 w-4", open && "mr-2")} />
        {open && "..."}
      </Button>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <Link href="/app/stores" className={open ? "w-full" : "mx-auto"}>
        <Button variant="ghost" size="sm" className={cn(
          "justify-start border border-white/10 hover:bg-white/5 text-white",
          open ? "w-full" : "w-10 h-10 p-0 rounded-full flex justify-center"
        )}>
          <StoreIcon className={cn("h-4 w-4", open && "mr-2")} />
          {open && "Ajouter"}
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn(
          "h-11 border border-white/10 hover:bg-white/11 text-white hover:text-white transition-all duration-300",
          open
            ? "w-full justify-between rounded-full px-4"
            : "w-11 h-11 p-0 rounded-full mx-auto flex items-center justify-center bg-white/5 border-white/20 hover:scale-105"
        )}>
          <div className="flex items-center gap-2 overflow-hidden">
            <StoreIcon className={cn("flex-shrink-0 transition-transform", open ? "h-4 w-4" : "h-5 w-5")} />
            {open && (
              <span className="truncate text-sm font-semibold">
                {selectedStore?.name || 'Sélectionner'}
              </span>
            )}
          </div>
          {open && <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={open ? "end" : "start"} className="w-72 p-0 border-border/40 shadow-2xl rounded-xl overflow-hidden backdrop-blur-xl bg-popover/95" side={open ? "bottom" : "right"} sideOffset={10}>
        <div className="px-4 py-3 header-metal">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-3.5 h-3.5 text-primary" />
            <h4 className="font-bold text-[11px] uppercase tracking-wider dark:text-white text-slate-900 line-height-none">Mes Boutiques</h4>
          </div>
        </div>

        <div className="p-1">
          {stores.map((store) => (
            <DropdownMenuItem
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className={cn(
                "flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg transition-all duration-200 group/item mb-1 last:mb-0",
                selectedStore?.id === store.id ? "bg-primary/5 focus:bg-primary/10" : "focus:bg-muted/50"
              )}
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "font-bold text-[13px] truncate",
                    selectedStore?.id === store.id ? "text-primary" : "text-foreground"
                  )}>{store.name}</span>
                  {selectedStore?.id === store.id && (
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-primary/20 bg-primary/5 text-primary font-bold uppercase tracking-tighter">
                    {store.platform}
                  </Badge>
                  <Badge
                    variant={store.status === 'active' ? 'success' : 'neutral'}
                    className="text-[10px] py-0 px-1.5 h-4 font-bold uppercase tracking-tighter"
                  >
                    {store.status || 'active'}
                  </Badge>
                </div>
              </div>

              {selectedStore?.id === store.id && (
                <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-border/20 mx-1" />

        <div className="p-1">
          <DropdownMenuItem asChild className="p-0">
            {/* @ts-ignore */}
            <Link href="/app/stores" className="flex items-center gap-2 py-2 px-3 focus:bg-primary/5 focus:text-primary rounded-lg transition-colors cursor-pointer w-full group">
              <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <StoreIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[12px] font-bold">Gérer les boutiques</span>
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
