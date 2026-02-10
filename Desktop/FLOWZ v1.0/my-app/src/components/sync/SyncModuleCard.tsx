import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

interface SyncModuleCardProps {
    title: string;
    total: number;
    current: number;
    status: 'idle' | 'running' | 'completed' | 'failed';
    icon: React.ReactNode;
}

export function SyncModuleCard({ title, total, current, status, icon }: SyncModuleCardProps) {
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <Card className="p-5 bg-card border-border group card-elevated">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                        {icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                            Module Sync
                        </p>
                        <h3 className="font-bold text-foreground tracking-tight">{title}</h3>
                    </div>
                </div>
                <div className="mt-1">
                    {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {status === 'failed' && <XCircle className="w-4 h-4 text-destructive" />}
                    {status === 'idle' && <CircleDashed className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">
                        {status === 'idle' && 'En attente...'}
                        {status === 'running' && 'Sycnhronisation...'}
                        {status === 'completed' && 'À jour'}
                        {status === 'failed' && 'Échec'}
                    </span>
                    <span className="text-foreground tabular-nums">
                        {current} / {total} ({Math.round(progress)}%)
                    </span>
                </div>
                <Progress value={progress} className="h-1.5 bg-muted/50" />
            </div>
        </Card>
    );
}
