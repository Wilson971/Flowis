import { Avatar, AvatarFallback } from "../ui/avatar";
import { ButtonMagic } from "../ui/button-magic";
import { Skeleton } from "../ui/skeleton";
import {
    AlertCircle,
} from "lucide-react";
import { useSelectedStore } from "../../contexts/StoreContext";
import { DashboardContext } from "../../types/dashboard";
import { PlatformLogo, PlatformType } from "../icons/PlatformLogo";
import { cn } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { styles } from "../../lib/design-system";

type DashboardHeaderProps = {
    userName: string;
    userEmail?: string;
    context?: DashboardContext;
    isLoading?: boolean;
    onGenerateClick?: () => void;
};

export const DashboardHeader = ({
    userName,
    userEmail,
    context,
    isLoading = false,
    onGenerateClick,
}: DashboardHeaderProps) => {
    const router = useRouter();
    const {
        selectedStore,
        stores,
        isLoading: storesLoading,
    } = useSelectedStore();

    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Status indicator based on connection
    const connectionStatus = selectedStore?.status;
    const isConnected = connectionStatus === "active";
    const syncErrors = context?.shopStats?.syncErrors || 0;

    return (
        <div className="bg-card border border-border rounded-lg p-4 md:p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: User Info + Store Selector */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-bold tracking-tight text-foreground">
                                Bonjour, {userName.split(" ")[0]}
                            </h1>
                            {storesLoading ? (
                                <Skeleton className="h-5 w-24" />
                            ) : selectedStore ? (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted border border-border">
                                    <PlatformLogo
                                        platform={selectedStore.platform as PlatformType}
                                        size={12}
                                    />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/80 max-w-[120px] truncate">
                                        {selectedStore.name}
                                    </span>
                                    <div className={cn("w-1.5 h-1.5 rounded-full ml-1", isConnected ? "bg-primary" : "bg-warning")} />
                                </div>
                            ) : null}
                        </div>
                        {userEmail && (
                            <p className="text-muted-foreground text-xs leading-tight">
                                Heureux de vous revoir sur votre tableau de bord.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Stats + Action */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Stats Row */}
                    <div className="flex items-center gap-2">
                        <div className={cn(styles.badge.base, styles.badge.neutral, styles.badge.md, "gap-1.5")}>
                            <span className="font-bold tabular-nums">{context?.shopStats?.totalProducts ?? 0}</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-70">PROD.</span>
                        </div>
                        <div className={cn(styles.badge.base, styles.badge.neutral, styles.badge.md, "gap-1.5")}>
                            <span className="font-bold tabular-nums">{context?.shopStats?.totalBlogPosts ?? 0}</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-70">ART.</span>
                        </div>
                        {syncErrors > 0 && (
                            <div
                                className={cn(styles.badge.base, styles.badge.error, styles.badge.md, "gap-1.5 cursor-pointer hover:opacity-80 transition-opacity")}
                                onClick={() => router.push("/app/products?sync=pending")}
                            >
                                <AlertCircle className="h-3 w-3" />
                                <span className="font-bold tabular-nums">{syncErrors}</span>
                                <span className="text-[9px] uppercase tracking-wider">erreurs</span>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <ButtonMagic
                        size="sm"
                        showSparkles
                        onClick={onGenerateClick}
                        className="h-8 px-3 text-[11px] font-semibold uppercase tracking-wide"
                    >
                        Générer du contenu
                    </ButtonMagic>
                </div>
            </div>
        </div>
    );
};
