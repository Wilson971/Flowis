import React, { useState } from 'react';
import {
    FileJson,
    Database,
    Search,
    ChevronRight,
    Eye,
    ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Mock types for the inspector
interface ProductSample {
    id: string;
    title: string;
    sourceData: any;
    mappedData: any;
    platform: string;
}

interface DataInspectorProps {
    samples?: ProductSample[];
    isLoading?: boolean;
}

export function DataInspector({ samples = [], isLoading }: DataInspectorProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const selectedSample = samples.find(s => s.id === selectedId);

    return (
        <Card className="glassmorphism max-h-[600px] flex flex-col shadow-xl border-dashed border-2 border-primary/10">
            <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-heading">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        Inspecteur de Données
                    </CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                        <Input
                            placeholder="Rechercher un produit..."
                            className="pl-9 bg-white/50 border-primary/10 focus-visible:ring-primary/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex overflow-hidden min-h-[400px]">
                {/* Sidebar List */}
                <div className="w-1/3 border-r border-border/50 bg-white/30">
                    <ScrollArea className="h-full">
                        <div className="p-2 space-y-1">
                            {samples.length === 0 ? (
                                <div className="text-center py-8 text-text-muted text-sm">
                                    Aucune donnée d'échantillon
                                </div>
                            ) : (
                                samples
                                    .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((sample) => (
                                        <button
                                            key={sample.id}
                                            onClick={() => setSelectedId(sample.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-lg text-sm transition-all flex items-center justify-between group",
                                                selectedId === sample.id
                                                    ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/20"
                                                    : "hover:bg-white/50 text-text-muted hover:text-text-main"
                                            )}
                                        >
                                            <div className="truncate pr-2">
                                                <span className="block truncate">{sample.title}</span>
                                                <span className="text-[10px] opacity-70 font-mono mt-0.5 block">{sample.id.substring(0, 8)}</span>
                                            </div>
                                            <ChevronRight className={cn(
                                                "h-4 w-4 opacity-0 transition-opacity",
                                                selectedId === sample.id ? "opacity-100" : "group-hover:opacity-50"
                                            )} />
                                        </button>
                                    ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white/40 relative">
                    {selectedSample ? (
                        <div className="absolute inset-0 grid grid-cols-2 divide-x divide-border/50">
                            {/* Source Data Column */}
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2">
                                    <FileJson className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold text-blue-900 text-sm">Source (JSON)</span>
                                    <Badge variant="secondary" className="ml-auto text-xs">{selectedSample.platform}</Badge>
                                </div>
                                <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                                    <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
                                        {JSON.stringify(selectedSample.sourceData, null, 2)}
                                    </pre>
                                </ScrollArea>
                            </div>

                            {/* Mapped Data Column */}
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-3 bg-cyan-50/50 border-b border-cyan-100 flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-primary text-sm">Mappé (Supabase)</span>
                                </div>
                                <ScrollArea className="flex-1 p-4 bg-white/50">
                                    <div className="space-y-4">
                                        {Object.entries(selectedSample.mappedData).map(([key, value]) => (
                                            <div key={key} className="space-y-1">
                                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{key}</span>
                                                <div className="p-2 rounded bg-white border border-border/50 text-sm text-text-main break-words">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-full bg-white/50 mb-4 flex items-center justify-center shadow-sm">
                                <Eye className="h-8 w-8 text-primary/40" />
                            </div>
                            <h3 className="text-lg font-medium text-text-main mb-1">Sélectionnez un produit</h3>
                            <p className="text-sm max-w-xs">Cliquez sur un produit dans la liste pour comparer ses données source et mappées.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
