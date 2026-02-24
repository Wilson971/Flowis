import {
    Type, FileText, Search, Hash, AlignLeft, Globe, ImageIcon
} from "lucide-react";
import type { ContentType } from "./types";

export const CONTENT_TYPES: ContentType[] = [
    { id: "title", label: "Titre produit", defaultEnabled: true },
    { id: "short_description", label: "Description courte", defaultEnabled: true },
    { id: "description", label: "Description complète", defaultEnabled: true },
    { id: "seo_title", label: "Titre SEO", defaultEnabled: true },
    { id: "meta_description", label: "Méta-description", defaultEnabled: true },
    { id: "sku", label: "Génération SKU", defaultEnabled: false },
    { id: "alt_text", label: "Alt text images", defaultEnabled: false },
];

export const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
    title: Type,
    short_description: AlignLeft,
    description: FileText,
    seo_title: Globe,
    meta_description: Search,
    sku: Hash,
    alt_text: ImageIcon,
};
