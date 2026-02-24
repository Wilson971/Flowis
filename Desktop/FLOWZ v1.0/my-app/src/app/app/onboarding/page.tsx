"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlatformSelector } from "@/components/onboarding/PlatformSelector";
import { WooConnectionCard } from "@/components/onboarding/WooConnectionCard";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { AnimatedTransition } from "@/components/onboarding/AnimatedTransition";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

type Platform = "shopify" | "woocommerce" | null;
type Step = "welcome" | "platform" | "auth" | "complete";

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>("welcome");
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
    const [connectionData, setConnectionData] = useState<{
        store_name: string;
    } | null>(null);

    const steps = [
        { id: "platform", label: "Platform", number: 1 },
        { id: "auth", label: "Connect", number: 2 },
        { id: "complete", label: "Done", number: 3 },
    ];

    const currentStepNumber = steps.findIndex((s) => s.id === currentStep) + 1;

    const handlePlatformSelect = (platform: "shopify" | "woocommerce") => {
        setSelectedPlatform(platform);
    };

    const handleContinueFromPlatform = () => {
        if (selectedPlatform) {
            setCurrentStep("auth");
        }
    };

    const handleAuthSuccess = (data: { store_name: string }) => {
        setConnectionData(data);
        setCurrentStep("complete");
    };

    const handleFinish = () => {
        router.push("/app/stores");
    };

    return (
        <OnboardingLayout
            step={currentStep === "welcome" || currentStep === "complete" ? undefined : currentStepNumber}
            totalSteps={steps.length}
        >
            <AnimatePresence mode="wait">
                {/* Welcome Screen */}
                {currentStep === "welcome" && (
                    <AnimatedTransition key="welcome" className="text-center space-y-8 py-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block p-4 rounded-3xl bg-primary/10 mb-4"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                                <CheckCircle2 className="text-white w-8 h-8" />
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                                Add a New Store
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                                Connect your e-commerce platform to synchronize and manage your products effortlessly.
                            </p>
                        </div>

                        <Button
                            size="lg"
                            className="h-14 px-10 text-lg rounded-full shadow-lg"
                            onClick={() => setCurrentStep("platform")}
                        >
                            Get Started <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    </AnimatedTransition>
                )}

                {/* Platform Selection */}
                {currentStep === "platform" && (
                    <AnimatedTransition key="platform" className="space-y-8">
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-semibold">Choose your Platform</h2>
                            <p className="text-muted-foreground">Select the e-commerce platform you want to connect.</p>
                        </div>

                        <PlatformSelector
                            selectedPlatform={selectedPlatform}
                            onSelect={handlePlatformSelect}
                        />

                        <div className="flex justify-between items-center pt-8">
                            <Button variant="ghost" onClick={() => router.push("/app/stores")}>
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                className="px-8"
                                onClick={handleContinueFromPlatform}
                                disabled={!selectedPlatform}
                            >
                                Continue <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </AnimatedTransition>
                )}

                {/* Authentication */}
                {currentStep === "auth" && selectedPlatform && (
                    <AnimatedTransition key="auth" className="space-y-6">
                        <div className="flex justify-start">
                            <Button variant="ghost" onClick={() => setCurrentStep("platform")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to platforms
                            </Button>
                        </div>

                        {selectedPlatform === "woocommerce" ? (
                            <WooConnectionCard mode="onboarding" onSuccess={handleAuthSuccess} />
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Shopify connection is coming soon.</p>
                            </div>
                        )}
                    </AnimatedTransition>
                )}

                {/* Complete */}
                {currentStep === "complete" && (
                    <AnimatedTransition key="complete" className="text-center space-y-8 py-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                            className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto"
                        >
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </motion.div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold">Setup Complete!</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Your store <strong>{connectionData?.store_name}</strong> has been connected successfully.
                            </p>
                        </div>

                        <Button onClick={handleFinish} size="lg" className="px-12 rounded-full mt-6">
                            Go to Stores <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    </AnimatedTransition>
                )}
            </AnimatePresence>
        </OnboardingLayout>
    );
}
