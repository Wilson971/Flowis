import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PlatformLogo, type PlatformType } from "@/components/icons/PlatformLogo";

type PlatformSelectorProps = {
    selectedPlatform: "shopify" | "woocommerce" | null;
    onSelect: (platform: "shopify" | "woocommerce") => void;
};

export const PlatformSelector = ({
    selectedPlatform,
    onSelect,
}: PlatformSelectorProps) => {
    const platforms = [
        {
            id: "shopify" as const,
            name: "Shopify",
            description: "Connect your Shopify store in a few clicks.",
            colorClass: "text-[#95BF47]",
            bgClass: "bg-[#95BF47]/10",
            borderClass: "hover:border-[#95BF47]/50",
            selectedBorderClass: "border-[#95BF47]",
            checkBgClass: "bg-[#95BF47]",
        },
        {
            id: "woocommerce" as const,
            name: "WooCommerce",
            description: "Connect your WooCommerce store with your API keys.",
            colorClass: "text-[#96588a]",
            bgClass: "bg-[#96588a]/10",
            borderClass: "hover:border-[#96588a]/50",
            selectedBorderClass: "border-[#96588a]",
            checkBgClass: "bg-[#96588a]",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map((platform) => {
                const isSelected = selectedPlatform === platform.id;

                return (
                    <motion.div
                        key={platform.id}
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(platform.id)}
                        className={cn(
                            "relative cursor-pointer rounded-2xl border p-8 transition-all duration-300 overflow-hidden group h-full flex flex-col justify-center",
                            "bg-card",
                            isSelected
                                ? `${platform.selectedBorderClass} shadow-xl shadow-primary/5 ring-1 ring-primary/20`
                                : "border-border hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-1",
                        )}
                    >
                        {/* Background glow effect on hover */}
                        <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                            platform.bgClass
                        )} />

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            {/* Platform Logo Container */}
                            <div
                                className={cn(
                                    "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 border-2",
                                    isSelected
                                        ? "bg-background border-primary/20 shadow-lg scale-110"
                                        : "bg-muted/50 border-border group-hover:bg-background group-hover:border-primary/10 group-hover:scale-105"
                                )}
                            >
                                <PlatformLogo
                                    platform={platform.id as PlatformType}
                                    className="w-12 h-12 object-contain"
                                    size={48}
                                />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-foreground">{platform.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {platform.description}
                                </p>
                            </div>

                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-4 right-4"
                                >
                                    <div className={cn(
                                        "rounded-full p-1.5",
                                        platform.checkBgClass
                                    )}>
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
