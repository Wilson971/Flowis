import { motion, AnimatePresence } from "framer-motion";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModularGenerationSettings } from "@/types/imageGeneration";
import { BatchGenerationConfigurationTab } from "./settings/BatchGenerationConfigurationTab";
import { BatchGenerationExpertTab } from "./settings/BatchGenerationExpertTab";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BatchGenerationRightSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ModularGenerationSettings;
    onSettingsChange: (settings: ModularGenerationSettings) => void;
    width?: number; // Configurable width, matches rightSheetWidth in BatchGenerationSheet
}

export function BatchGenerationRightSettingsPanel({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    width = 480, // Default width
}: BatchGenerationRightSettingsPanelProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for smaller screens (optional, but good for UX if it covers content) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[9998] lg:hidden"
                        onClick={onClose}
                    />

                    {/* Right Floating Settings Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring", stiffness: 350, damping: 25,
                            opacity: { duration: 0.2 }
                        }}
                        className="fixed right-4 top-4 bottom-4 bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl z-[9999] flex flex-col rounded-2xl overflow-hidden"
                        style={{ width: `${width}px`, maxWidth: "calc(100vw - 2rem)" }}
                    >
                        {/* Multi-layer glassmorphism effects matching main panel */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/3 pointer-events-none" />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)' }} />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-border/50 space-y-1 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Settings2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <h2 className="text-lg font-semibold tracking-tight">Paramètres avancés</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Configurez le comportement de l'IA pour ce lot
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mr-2">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-col flex overflow-hidden min-h-0 flex-shrink">
                                <Tabs defaultValue="configuration" className="flex-1 flex flex-col overflow-hidden min-h-0">
                                    <div className="px-6 py-2 border-b">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                            <TabsTrigger value="expert">Expert (Structure)</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <ScrollArea className="flex-1 overflow-auto min-h-0">
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

                            <div className="p-4 border-t border-border/50 bg-card/95 backdrop-blur-sm sticky bottom-0">
                                <Button className="w-full" onClick={onClose}>
                                    Valider la configuration
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}
