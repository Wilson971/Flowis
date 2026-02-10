import {
    AlertTriangle,
    XOctagon,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

// Mock type
interface ErrorLog {
    id: string;
    storeName: string;
    errorMessage: string;
    timestamp: string;
    severity: 'high' | 'medium' | 'low';
}

interface ErrorLogPanelProps {
    errors?: ErrorLog[];
    className?: string;
}

export function ErrorLogPanel({ errors = [], className }: ErrorLogPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!errors || errors.length === 0) {
        return null; // Don't show if no errors, or show empty state?
    }

    return (
        <Card className={cn("glassmorphism border-destructive/20 bg-destructive/5", className)}>
            <CardHeader className="pb-2 border-b border-destructive/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-heading text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Erreurs Critiques ({errors.length})
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="p-0">
                    <ScrollArea className="h-[200px]">
                        <div className="divide-y divide-destructive/10">
                            {errors.map((error) => (
                                <div key={error.id} className="p-4 hover:bg-white/40 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <XOctagon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-destructive-foreground/90">{error.storeName}</span>
                                                <span className="text-xs text-text-muted">{error.timestamp}</span>
                                            </div>
                                            <p className="text-sm text-text-main font-mono bg-white/50 p-2 rounded border border-destructive/10">
                                                {error.errorMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            )}
        </Card>
    );
}
