import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ModularGenerationSettings } from "@/types/imageGeneration";
import { BatchGenerationConfigurationTab } from "./settings/BatchGenerationConfigurationTab";
import { BatchGenerationExpertTab } from "./settings/BatchGenerationExpertTab";

interface BatchGenerationSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: ModularGenerationSettings;
    onSettingsChange: (settings: ModularGenerationSettings) => void;
}

export function BatchGenerationSettings({
    open,
    onOpenChange,
    settings,
    onSettingsChange,
}: BatchGenerationSettingsProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col gap-0 border-l border-border bg-card/95 backdrop-blur-xl">
                <SheetHeader className="px-6 py-4 border-b border-border space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Settings2 className="h-4 w-4 text-primary" />
                        </div>
                        <SheetTitle>Paramètres avancés</SheetTitle>
                    </div>
                    <SheetDescription>
                        Configurez le comportement de l'IA pour ce lot
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="configuration" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-2 border-b">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                <TabsTrigger value="expert">Expert (Structure)</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="px-6 py-6">
                                <TabsContent value="configuration" className="space-y-6 mt-0">
                                    <BatchGenerationConfigurationTab
                                        settings={settings}
                                        onSettingsChange={onSettingsChange}
                                    />
                                </TabsContent>

                                <TabsContent value="expert" className="space-y-6 mt-0">
                                    <BatchGenerationExpertTab
                                        settings={settings}
                                        onSettingsChange={onSettingsChange}
                                    />
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </div>

                <div className="p-4 border-t border-border bg-muted/20">
                    <Button className="w-full" onClick={() => onOpenChange(false)}>
                        Valider la configuration
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
