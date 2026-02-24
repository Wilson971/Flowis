"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
            <Card className="max-w-md w-full rounded-xl">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-foreground">
                            Une erreur est survenue
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {error.message || "Une erreur inattendue s'est produite. Veuillez réessayer."}
                        </p>
                    </div>
                    <Button onClick={reset} variant="outline" className="gap-2 rounded-lg">
                        <RefreshCw className="h-4 w-4" />
                        Réessayer
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
