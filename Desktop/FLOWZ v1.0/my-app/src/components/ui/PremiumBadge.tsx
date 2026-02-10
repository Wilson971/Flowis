/**
 * PremiumBadge - Badge premium avec indicateur pulsant
 * 
 * Utilise les tokens du design system pour une cohérence parfaite.
 * Pour les badges avec icônes, utilisez StatusBadge à la place.
 */

import { ReactNode } from "react";
import { cn } from "../../lib/utils";
import {
    BadgeVariant,
    BadgeSize,
    badgeVariantStyles,
    badgeSizeStyles,
    badgeBaseStyles,
} from "../../lib/design-system/tokens/badges";

// Map des anciennes variantes vers les nouvelles
type LegacyVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type PremiumBadgeProps = {
    variant: LegacyVariant;
    children: ReactNode;
    withIndicator?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
};

export const PremiumBadge = ({
    variant,
    children,
    withIndicator = true,
    size = 'md',
    className,
    onClick,
}: PremiumBadgeProps) => {
    const variantStyle = badgeVariantStyles[variant as BadgeVariant];
    const sizeStyle = badgeSizeStyles[size as BadgeSize];
    const isInteractive = !!onClick;

    return (
        <div className={badgeBaseStyles.container}>
            <div
                className={cn(
                    'flex items-center',
                    'bg-gradient-to-r',
                    variantStyle.gradient,
                    variantStyle.text,
                    'border-0',
                    sizeStyle.text,
                    'font-bold uppercase tracking-wider',
                    sizeStyle.padding,
                    sizeStyle.gap,
                    'rounded-full',
                    'backdrop-blur-sm',
                    isInteractive && 'cursor-pointer',
                    className
                )}
                onClick={onClick}
            >
                {withIndicator && (
                    <div
                        className={cn(
                            'rounded-full animate-pulse',
                            variantStyle.indicatorColor,
                            sizeStyle.indicatorSize
                        )}
                    />
                )}
                {children}
            </div>
        </div>
    );
};
