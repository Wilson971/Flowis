import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
    return (
        <div className={cn("min-h-screen bg-shell w-full p-4 md:p-6 lg:p-8 space-y-6", className)}>
            <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
                {children}
            </div>
        </div>
    );
}

interface DashboardSectionProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export function DashboardSection({
    children,
    className,
    title,
    description,
    action
}: DashboardSectionProps) {
    return (
        <section className={cn("space-y-4", className)}>
            {(title || description || action) && (
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        {title && <h3 className="text-lg font-semibold text-text-main font-heading">{title}</h3>}
                        {description && <p className="text-sm text-text-muted">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </section>
    );
}
