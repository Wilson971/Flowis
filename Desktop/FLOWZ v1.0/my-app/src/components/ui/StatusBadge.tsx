/**
 * StatusBadge - Badge de statut avec icônes
 * 
 * Composant de badge unifié utilisant les tokens du design system.
 * Supporte les icônes, les indicateurs pulsants, et les presets prédéfinis.
 */

import { ReactNode } from 'react';
import {
    type LucideIcon,
    Cloud,
    CloudUpload,
    CloudOff,
    Pencil,
    FileEdit,
    CheckCircle2,
    EyeOff,
    Zap,
    Moon,
    Wifi,
    WifiOff,
    Clock,
    Loader2,
    Sparkles,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    Bot,
    Play,
    XCircle,
    AlertCircle,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    Cloud,
    CloudUpload,
    CloudOff,
    Pencil,
    FileEdit,
    CheckCircle2,
    EyeOff,
    Zap,
    Moon,
    Wifi,
    WifiOff,
    Clock,
    Loader2,
    Sparkles,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    Bot,
    Play,
    XCircle,
    AlertCircle,
};
import { cn } from "../../lib/utils";
import {
    BadgeVariant,
    BadgeSize,
    badgeVariantStyles,
    badgeSizeStyles,
    badgeBaseStyles,
    badgePresets,
} from "../../lib/design-system/tokens/badges";

type StatusBadgeProps = {
    /** Variante de couleur du badge */
    variant?: BadgeVariant;
    /** Taille du badge */
    size?: BadgeSize;
    /** Icône Lucide à afficher */
    icon?: LucideIcon;
    /** Afficher l'indicateur pulsant */
    withIndicator?: boolean;
    /** Utiliser un preset prédéfini (remplace variant, icon et children) */
    preset?: keyof typeof badgePresets;
    /** Classes CSS additionnelles */
    className?: string;
    /** Contenu du badge */
    children?: ReactNode;
    /** Callback au clic */
    onClick?: (e: React.MouseEvent) => void;
};

export const StatusBadge = ({
    variant: variantProp,
    size = 'md',
    icon: iconProp,
    withIndicator = false,
    preset,
    className,
    children,
    onClick,
}: StatusBadgeProps) => {
    // Résoudre le preset si fourni
    const presetConfig = preset ? badgePresets[preset] : null;
    const variant = presetConfig?.variant || variantProp || 'neutral';
    const label = presetConfig?.label || children;

    // Résoudre l'icône
    let IconComponent: LucideIcon | null = iconProp || null;
    if (presetConfig?.iconName && !iconProp) {
        IconComponent = ICON_MAP[presetConfig.iconName] || null;
    }

    const variantStyle = badgeVariantStyles[variant];
    const sizeStyle = badgeSizeStyles[size];
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
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive ? 0 : undefined}
            >
                {/* Indicateur pulsant (dot) */}
                {withIndicator && !IconComponent && (
                    <div
                        className={cn(
                            'rounded-full animate-pulse',
                            variantStyle.indicatorColor,
                            sizeStyle.indicatorSize
                        )}
                    />
                )}

                {/* Icône */}
                {IconComponent && (
                    <IconComponent
                        className={cn(
                            sizeStyle.iconSize,
                            variantStyle.text
                        )}
                    />
                )}

                {/* Label */}
                {label && <span>{label}</span>}
            </div>
        </div>
    );
};

/**
 * Composant simplifié pour les badges courants
 */

// Badge Actif
export const ActiveBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="active" size={size} withIndicator />
);

// Badge Synchronisé
export const SyncedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="synced" size={size} icon={Cloud} />
);

// Badge Modifié
export const ModifiedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="modified" size={size} icon={Pencil} />
);

// Badge Publié
export const PublishedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="published" size={size} icon={CheckCircle2} />
);

// Badge En attente
export const PendingBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="pending" size={size} icon={Clock} />
);

// Badge Connecté
export const ConnectedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="connected" size={size} icon={Wifi} />
);

// Badge Erreur
export const ErrorBadge = ({ size = 'md', children }: { size?: BadgeSize; children?: ReactNode }) => (
    <StatusBadge variant="danger" size={size} icon={AlertCircle}>
        {children || 'Erreur'}
    </StatusBadge>
);

// Badge Optimisé
export const OptimizedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="optimized" size={size} icon={Sparkles} />
);

// Badge IA
export const AIBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="aiGenerated" size={size} icon={Sparkles} />
);

// Badge Terminé
export const CompletedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="completed" size={size} icon={CheckCircle2} />
);

// Badge En cours
export const InProgressBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="inProgress" size={size} icon={Play} />
);

// Badge Annulé
export const CancelledBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="cancelled" size={size} icon={XCircle} />
);

// Badge Échoué
export const FailedBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="failed" size={size} icon={XCircle} />
);

// Badge Suppression planifiée
export const DeletionScheduledBadge = ({ size = 'md' }: { size?: BadgeSize }) => (
    <StatusBadge preset="deletionScheduled" size={size} withIndicator />
);

export default StatusBadge;
