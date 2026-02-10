import { ScrollArea } from "@/components/ui/scroll-area";
import { SyncLog } from "@/types/sync";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SyncConsoleProps {
    logs: SyncLog[];
    className?: string;
}

export function SyncConsole({ logs, className }: SyncConsoleProps) {
    const bottomRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className={cn("bg-muted/50 rounded-lg border border-border p-4 font-mono text-xs h-[300px] flex flex-col", className)}>
            <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
                <h3 className="text-muted-foreground text-xs font-normal">Console de synchronisation</h3>
                <span className="text-muted-foreground">{logs.length} événements</span>
            </div>
            <ScrollArea className="flex-1">
                <ul className="space-y-1">
                    {logs.map((log) => (
                        <li key={log.id} className="flex gap-2">
                            <span className="text-muted-foreground shrink-0">
                                {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                            <span className={cn(
                                "break-all",
                                log.type === 'error' ? "text-red-400" :
                                    log.type === 'warning' ? "text-yellow-400" :
                                        log.type === 'success' ? "text-green-400" :
                                            "text-zinc-300"
                            )}>
                                {log.message}
                            </span>
                        </li>
                    ))}
                    <li ref={bottomRef} />
                </ul>
            </ScrollArea>
        </div>
    );
}
