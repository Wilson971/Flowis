import { memo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bot, Wand2, Calculator, Settings2, Image as ImageIcon } from "lucide-react";
import { ModularGenerationSettings } from "@/types/imageGeneration";

interface BatchGenerationConfigurationTabProps {
    settings: ModularGenerationSettings;
    onSettingsChange: (settings: ModularGenerationSettings) => void;
}

export const BatchGenerationConfigurationTab = memo(function BatchGenerationConfigurationTab({
    settings,
    onSettingsChange,
}: BatchGenerationConfigurationTabProps) {

    const handleWordLimitChange = (field: keyof typeof settings.word_limits, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) || value === '') {
            onSettingsChange({
                ...settings,
                word_limits: {
                    ...settings.word_limits,
                    [field]: value === '' ? undefined : numValue
                }
            });
        }
    };

    return (
        <div className="space-y-6 mt-0">
            {/* Section AI Model */}
            <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    Modèle IA (Gemini)
                </h4>
                <div className="space-y-2">
                    <Label className="text-xs">Modèle</Label>
                    <Select
                        value={settings.model}
                        onValueChange={(v) => onSettingsChange({ ...settings, provider: 'gemini', model: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Modèle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recommandé)</SelectItem>
                            <SelectItem value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            {/* Section Style */}
            <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Wand2 className="h-4 w-4 text-muted-foreground" />
                    Style & Ton
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Ton</Label>
                        <Select
                            value={settings.tone}
                            onValueChange={(v) => onSettingsChange({ ...settings, tone: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professional">Professionnel</SelectItem>
                                <SelectItem value="casual">Décontracté</SelectItem>
                                <SelectItem value="luxury">Luxe / Premium</SelectItem>
                                <SelectItem value="technical">Technique</SelectItem>
                                <SelectItem value="persuasive">Commercial / Vendeur</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Langue</Label>
                        <Select
                            value={settings.language}
                            onValueChange={(v) => onSettingsChange({ ...settings, language: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="en">Anglais</SelectItem>
                                <SelectItem value="es">Espagnol</SelectItem>
                                <SelectItem value="de">Allemand</SelectItem>
                                <SelectItem value="it">Italien</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Section Format SKU */}
            <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    Format SKU
                </h4>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs">Motif</Label>
                        <Select
                            value={settings.sku_format?.pattern || 'product_name_based'}
                            onValueChange={(v: any) => onSettingsChange({
                                ...settings,
                                sku_format: {
                                    pattern: v,
                                    separator: settings.sku_format?.separator || '-',
                                    max_length: settings.sku_format?.max_length || 12,
                                    prefix: settings.sku_format?.prefix || ''
                                }
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="product_name_based">Basé sur le nom</SelectItem>
                                <SelectItem value="category_based">Basé sur la catégorie</SelectItem>
                                <SelectItem value="custom">Aléatoire (Custom)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Séparateur</Label>
                            <Input
                                placeholder="-"
                                value={settings.sku_format?.separator || ''}
                                onChange={(e) => onSettingsChange({
                                    ...settings,
                                    sku_format: {
                                        pattern: settings.sku_format?.pattern || 'product_name_based',
                                        separator: e.target.value,
                                        max_length: settings.sku_format?.max_length || 12,
                                        prefix: settings.sku_format?.prefix
                                    }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Longueur Max</Label>
                            <Input
                                type="number"
                                value={settings.sku_format?.max_length || ''}
                                onChange={(e) => onSettingsChange({
                                    ...settings,
                                    sku_format: {
                                        pattern: settings.sku_format?.pattern || 'product_name_based',
                                        separator: settings.sku_format?.separator || '-',
                                        max_length: parseInt(e.target.value) || 12,
                                        prefix: settings.sku_format?.prefix
                                    }
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Section Contraintes Mots */}
            <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    Limites de mots (optionnel)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Titre</Label>
                        <Input
                            type="number"
                            placeholder="ex: 15"
                            value={settings.word_limits?.title || ''}
                            onChange={(e) => handleWordLimitChange('title', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Description courte</Label>
                        <Input
                            type="number"
                            placeholder="ex: 30"
                            value={settings.word_limits?.short_description || ''}
                            onChange={(e) => handleWordLimitChange('short_description', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Options Avancées */}
            <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    Options diverses
                </h4>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-3.5 w-3.5 text-primary" />
                            <Label className="text-sm">Analyse d'images</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">Utiliser la vision</p>
                    </div>
                    <Switch
                        checked={settings.image_analysis}
                        onCheckedChange={(c) => onSettingsChange({ ...settings, image_analysis: c })}
                    />
                </div>
            </div>
        </div>
    );
});
