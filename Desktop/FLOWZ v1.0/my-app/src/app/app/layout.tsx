"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SettingsModalProvider } from '@/contexts/SettingsModalContext';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <TooltipProvider delayDuration={100}>
                <SettingsModalProvider>
                    <AppLayout>
                        {children}
                    </AppLayout>
                    <SettingsModal />
                    <CommandPalette />
                </SettingsModalProvider>
            </TooltipProvider>
        </AuthGuard>
    );
}
