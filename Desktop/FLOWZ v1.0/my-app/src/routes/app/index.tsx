import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Dashboard Home Page
 * Redirects to the main overview dashboard
 */

export const Route = createFileRoute('/app/')({
  beforeLoad: () => {
    throw redirect({ to: '/app/overview' })
  },
})
