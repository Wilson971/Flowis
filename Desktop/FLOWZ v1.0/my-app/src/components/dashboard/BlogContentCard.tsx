import { FileText, PenTool, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

type BlogContentCardProps = {
    publishedCount: number;
    draftsCount: number;
    lastCreated: string;
    onCreateArticle?: () => void;
};

export const BlogContentCard = ({
    publishedCount,
    draftsCount,
    lastCreated,
    onCreateArticle
}: BlogContentCardProps) => {
    const total = publishedCount + draftsCount;
    const progress = total > 0 ? (publishedCount / total) * 100 : 0;

    return (
        <div className="h-full p-5 flex flex-col justify-between group">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                            Contenu Blog
                        </p>
                        <h3 className="text-xl font-bold tracking-tight text-foreground">Aperçu</h3>
                    </div>
                </div>
            </div>
            <div>
                <div className="mt-2 space-y-4">
                    <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{publishedCount}</span>
                            <span className="text-xs text-muted-foreground font-medium">publiés</span>
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                            {draftsCount} brouillons
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <span>Ratio de publication</span>
                            <span className="tabular-nums">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-muted" />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border mt-4">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span className="truncate max-w-[120px]">Dernier: {lastCreated}</span>
                        </span>
                        {onCreateArticle && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold gap-1 hover:text-primary p-0 hover:bg-transparent" onClick={onCreateArticle}>
                                Rédiger <ArrowRight className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
