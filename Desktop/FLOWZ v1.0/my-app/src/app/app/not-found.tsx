import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function DashboardNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
            <Card className="max-w-md w-full rounded-xl">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        <FileQuestion className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-foreground">
                            Page introuvable
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            La page que vous recherchez n&apos;existe pas ou a été déplacée.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="gap-2 rounded-lg">
                        <Link href="/app/overview">
                            <ArrowLeft className="h-4 w-4" />
                            Retour au tableau de bord
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
