/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
    Outlet,
    createRootRoute,
    HeadContent,
    Scripts,
} from '@tanstack/react-router'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: 'TanStack Start Starter',
            },
        ],
        links: [{ rel: 'stylesheet', href: appCss }],
    }),
    component: RootComponent,
})

import { AuthProvider } from '../lib/auth/AuthContext'
import { TooltipProvider } from '../components/ui/tooltip'
import { ThemeProvider } from '../contexts/ThemeContext'
import { StoreProvider } from '../contexts/StoreContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60000, // 1 minute
            refetchOnWindowFocus: false,
        },
    },
})

function RootComponent() {
    return (
        <RootDocument>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <StoreProvider>
                            <TooltipProvider delayDuration={200}>
                                <Outlet />
                            </TooltipProvider>
                        </StoreProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </RootDocument>
    )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="dark" suppressHydrationWarning>
            <head>
                <HeadContent />
                {/* Script inline pour éviter le flash de thème - s'exécute avant React */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('flowiz-theme');
                                    if (theme === 'light') {
                                        document.documentElement.classList.remove('dark');
                                        document.documentElement.classList.add('light');
                                    } else {
                                        document.documentElement.classList.add('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className="bg-background text-foreground antialiased">
                {children}
                <Scripts />
            </body>
        </html>
    )
}
