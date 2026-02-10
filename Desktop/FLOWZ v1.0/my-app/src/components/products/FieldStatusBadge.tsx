import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, AlertTriangle, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FieldStatusBadgeProps {
    hasDraft?: boolean;
    isSynced?: boolean;
    isDirty?: boolean;
    hasConflict?: boolean;
    tooltip?: string;
    className?: string;
}

export const FieldStatusBadge = ({
    hasDraft,
    isSynced,
    isDirty,
    hasConflict,
    tooltip,
    className
}: FieldStatusBadgeProps) => {
    // 1. Priorité aux conflits
    if (hasConflict) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="destructive" className={`h-5 gap-1 px-1.5 ${className}`}>
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">Conflit</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Des modifications concurrentes ont été détectées"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // 2. Draft AI (Priorité sur Synced)
    if (hasDraft) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className={`h-5 gap-1 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 ${className}`}>
                            <Sparkles className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">IA v2</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Une proposition IA est disponible pour ce champ"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // 3. Dirty (modifications locales non synchronisées)
    if (isDirty) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className={`h-5 gap-1 px-1.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 ${className}`}>
                            <Pencil className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">Modifié</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Ce champ a été modifié localement"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // 4. Synced
    if (isSynced) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className={`h-5 gap-1 px-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 ${className}`}>
                            <RefreshCw className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase">Sync</span>
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip || "Synchronisé avec la boutique"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return null;
};
