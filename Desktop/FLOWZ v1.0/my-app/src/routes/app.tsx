import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * App Route - Parent layout for protected application routes
 *
 * Uses AppLayout with:
 * - Sidebar with collapse/expand
 * - Aurora background effects
 * - TopHeader with search and actions
 * - Smart sticky header on scroll
 */

export const Route = createFileRoute('/app')({
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  return (
    <TooltipProvider delayDuration={100}>
      <AppLayout />
    </TooltipProvider>
  )
}
