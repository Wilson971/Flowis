"use client";

import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import type { ProductFormValues } from "../../schemas/product-schema";

import { AttributeSidebar } from "./AttributeSidebar";
import { AttributeDetailPanel } from "./AttributeDetailPanel";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AttributeBuilderV2 - Improved UX with sidebar + details panel
 *
 * Features:
 * - Sidebar: Collapsed list of attributes with quick stats
 * - Details panel: Full editing interface for selected attribute
 * - Color preview for color attributes
 * - Expand/collapse for space efficiency
 * - Active state highlighting
 * - Smooth animations
 */
export function AttributeBuilderV2() {
    const { watch } = useFormContext<ProductFormValues>();
    const { remove } = useFieldArray({
        name: "attributes",
    });
    const attributes = watch("attributes") || [];
    const [selectedIndex, setSelectedIndex] = useState<number | null>(
        attributes.length > 0 ? 0 : null
    );

    // Auto-select first attribute when list changes
    useEffect(() => {
        if (attributes.length > 0 && selectedIndex === null) {
            setSelectedIndex(0);
        }
        // If selected index is out of bounds, reset
        if (selectedIndex !== null && selectedIndex >= attributes.length) {
            setSelectedIndex(attributes.length > 0 ? attributes.length - 1 : null);
        }
    }, [attributes.length, selectedIndex]);

    const handleRemoveAttribute = (index: number) => {
        remove(index);
        // After removal, select the previous index or null if empty
        if (attributes.length === 1) {
            setSelectedIndex(null);
        } else if (index === selectedIndex) {
            setSelectedIndex(Math.max(0, index - 1));
        }
    };

    return (
        <div className="grid grid-cols-[280px_1fr] gap-4">
            {/* Left: Sidebar */}
            <AttributeSidebar
                activeIndex={selectedIndex}
                onAttributeClick={setSelectedIndex}
            />

            {/* Right: Details panel */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {selectedIndex !== null && attributes[selectedIndex] ? (
                        <motion.div
                            key={`detail-${selectedIndex}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={motionTokens.transitions.spring}
                        >
                            <AttributeDetailPanel
                                index={selectedIndex}
                                onRemove={() => handleRemoveAttribute(selectedIndex)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty-detail"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20"
                        >
                            <div className="text-center px-6">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-8 w-8 text-primary/60"
                                    >
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                                        <polyline points="7.5 19.79 7.5 14.6 3 12" />
                                        <polyline points="21 12 16.5 14.6 16.5 19.79" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">
                                    Sélectionnez un attribut
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Cliquez sur un attribut dans la sidebar pour le modifier,
                                    <br />
                                    ou créez-en un nouveau avec le bouton ci-dessous.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
