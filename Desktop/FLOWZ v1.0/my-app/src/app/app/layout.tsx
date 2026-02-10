"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SettingsModalProvider } from '@/contexts/SettingsModalContext';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthGuard } from '@/components/auth/AuthGuard';

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
                </SettingsModalProvider>
            </TooltipProvider>
        </AuthGuard>
    );
}
