import {
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface SyncJob {
    id: string;
    storeName: string;
    type: string;
    status: 'running' | 'completed' | 'failed' | 'pending';
    progress: number;
    timestamp: string;
}

interface SyncActivityWidgetProps {
    jobs: SyncJob[];
    className?: string;
}

const StatusIcon = ({ status }: { status: SyncJob['status'] }) => {
    switch (status) {
        case 'running':
            return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
        case 'completed':
            return <CheckCircle2 className="h-4 w-4 text-signal-success" />;
        case 'failed':
            return <XCircle className="h-4 w-4 text-destructive" />;
        case 'pending':
        default:
            return <Clock className="h-4 w-4 text-text-muted" />;
    }
};

const StatusBadge = ({ status }: { status: SyncJob['status'] }) => {
    const styles = {
        running: "bg-primary/10 text-primary border-primary/20",
        completed: "bg-signal-success/10 text-signal-success border-signal-success/20",
        failed: "bg-destructive/10 text-destructive border-destructive/20",
        pending: "bg-muted text-muted-foreground border-border",
    };

    return (
        <Badge variant="outline" className={cn("capitalize gap-1.5", styles[status])}>
            <StatusIcon status={status} />
            {status}
        </Badge>
    );
};

export function SyncActivityWidget({ jobs, className }: SyncActivityWidgetProps) {
    return (
        <Card className={cn("glassmorphism border-0 shadow-lg", className)}>
            <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-heading">
                        <Database className="h-5 w-5 text-primary" />
                        Activité de Synchronisation
                    </CardTitle>
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                        En temps réel
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    <div className="divide-y divide-border/50">
                        {jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Clock className="h-10 w-10 mb-2 opacity-20" />
                                <p>Aucune activité récente</p>
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-text-main">{job.storeName}</span>
                                            <span className="text-xs text-text-muted px-1.5 py-0.5 rounded-full bg-surface-muted border border-border/50">
                                                {job.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted font-mono">{job.id.substring(0, 8)}</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {job.status === 'running' && (
                                            <div className="hidden md:flex flex-col items-end gap-1 w-24">
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary animate-shimmer"
                                                        style={{ width: `${job.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-primary font-medium">{job.progress}%</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge status={job.status} />
                                            <span className="text-xs text-text-muted">{job.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
