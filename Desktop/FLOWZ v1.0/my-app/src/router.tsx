import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
    routeTree,
    scrollRestoration: true,
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

declare module '@tanstack/react-start' {
    interface Register {
        router: typeof router
    }
}

export function getRouter() {
    return router
}
