'use client';

import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSyncCategories } from '@/hooks/products/useProductCategories';

interface CategorySyncButtonProps {
  storeId: string;
}

export function CategorySyncButton({ storeId }: CategorySyncButtonProps) {
  const { mutate, isPending } = useSyncCategories();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => mutate({ storeId })}
      disabled={isPending}
    >
      <RefreshCw className={cn('h-4 w-4 mr-2', isPending && 'animate-spin')} />
      Synchroniser
    </Button>
  );
}
