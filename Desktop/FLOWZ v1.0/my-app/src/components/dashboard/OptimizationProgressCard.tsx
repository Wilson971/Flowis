import { Store, FileText, LucideIcon, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { PremiumBadge } from "../ui/PremiumBadge";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";

interface OptimizationProgressCardProps {
    type: 'products' | 'blog';
    optimized: number;
    total: number;
    onNavigate?: () => void;
}

const typeConfig: Record<'products' | 'blog', {
    icon: LucideIcon;
    label: string;
    filter: string;
}> = {
    products: {
        icon: Store,
        label: 'Produits',
        filter: 'non-optimized',
    },
    blog: {
        icon: FileText,
        label: 'Articles de blog',
        filter: 'non-optimized',
    },
};

export const OptimizationProgressCard = ({
    type,
    optimized,
    total,
    onNavigate,
}: OptimizationProgressCardProps) => {
    const router = useRouter();
    const config = typeConfig[type];
    const Icon = config.icon;
    const isComplete = optimized === total && total > 0;
    const percentage = total > 0 ? Math.round((optimized / total) * 100) : 0;

    const handleClick = () => {
        if (!isComplete && total > 0) {
            if (onNavigate) {
                onNavigate();
            } else {
                router.push(`/app/${type === 'products' ? 'products' : 'blog'}?filter=${config.filter}`);
            }
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <m.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "cursor-pointer p-4 rounded-xl block h-full",
                            "bg-transparent",
                            // Hover - SHADOW (sur parent)
                            "hover:shadow-lg",
                            // Transition
                            "transition-all duration-200 ease-out",
                        )}
                        onClick={handleClick}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                {/* Icône - TOUJOURS PRIMARY (le statut est montré via les badges) */}
                                <div className={cn(
                                    "p-2 rounded-full bg-primary text-primary-foreground",
                                    "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]",
                                    "group-hover:scale-110 group-hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)]",
                                    "transition-all duration-200 border-none ring-0 ring-transparent"
                                )}>
                                    <Icon className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <span className="font-semibold text-sm text-foreground">{config.label}</span>
                            </div>
                            <span
                                className={cn(
                                    'text-lg font-bold tabular-nums tracking-tight',
                                    'text-foreground'
                                )}
                            >
                                {optimized.toLocaleString()} / {total.toLocaleString()}
                            </span>
                        </div>

                        {/* Barre de progression - TOUJOURS PRIMARY */}
                        <div className="w-full bg-muted rounded-full h-4 mb-4 overflow-hidden shadow-inner border border-border">
                            <m.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full rounded-full relative overflow-hidden bg-primary"
                            >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
                                {/* Highlight */}
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
                            </m.div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">
                                {optimized.toLocaleString()} optimisé{optimized > 1 ? 's' : ''} · {percentage}% optimisé
                            </span>
                            {isComplete ? (
                                <PremiumBadge variant="success" size="sm" className="shadow-sm">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Terminé
                                </PremiumBadge>
                            ) : (
                                <m.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <PremiumBadge
                                        variant="warning"
                                        size="sm"
                                        className="shadow-sm cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClick();
                                        }}
                                    >
                                        À optimiser
                                    </PremiumBadge>
                                </m.div>
                            )}
                        </div>
                    </m.div>
                </TooltipTrigger>
                <TooltipContent className="bg-background border-border shadow-xl">
                    <p className="text-sm text-foreground">
                        {optimized.toLocaleString()} contenus optimisés sur {total.toLocaleString()}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
