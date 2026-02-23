"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, HelpCircle, CheckCircle2, AlertCircle, Key, Globe, Store, Lock, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { useWooManager } from "@/hooks/onboarding/useWooManager";
import { wooCredentialsSchema, type WooCredentials } from "@/schemas/wooConnectionSchema";
import { cn } from "@/lib/utils";

interface WooConnectionCardProps {
    mode: "onboarding" | "update";
    initialData?: Partial<WooCredentials>;
    isConnected?: boolean;
    onSuccess?: (result: any) => void;
    onError?: (error: Error) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function SecretInput({
    value,
    onChange,
    placeholder,
    disabled,
    hasError,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    hasError?: boolean;
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <Input
                type={visible ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "h-11 rounded-xl bg-muted/50 border-input pr-10 transition-all focus:ring-primary/20",
                    hasError && "border-destructive focus:ring-destructive/20"
                )}
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-muted rounded-lg"
                onClick={() => setVisible(!visible)}
                tabIndex={-1}
            >
                {visible ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
        </div>
    );
}

function ConnectionStatusBadge({ status }: { status: "idle" | "connecting" | "success" | "error" }) {
    const variants = {
        idle: { className: "bg-muted text-muted-foreground border-border", icon: null, text: "Not Connected" },
        connecting: { className: "bg-primary/10 text-primary border-primary/20", icon: Loader2, text: "Verifying..." },
        success: { className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2, text: "Connected" },
        error: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle, text: "Error" },
    };

    const { className, icon: Icon, text } = variants[status];

    return (
        <Badge variant="outline" className={cn("gap-1.5 py-1 px-2.5 rounded-full font-medium transition-colors", className)}>
            {Icon && <Icon className={cn("h-3.5 w-3.5", status === "connecting" && "animate-spin")} />}
            {text}
        </Badge>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function WooConnectionCard({
    mode,
    initialData,
    isConnected,
    onSuccess,
    onError,
}: WooConnectionCardProps) {
    const isOnboarding = mode === "onboarding";

    const {
        connect,
        isConnecting,
        isConnectSuccess,
        connectError,
    } = useWooManager({
        onConnectSuccess: onSuccess,
    });

    const form = useForm<WooCredentials>({
        resolver: zodResolver(wooCredentialsSchema),
        defaultValues: {
            platform: "woocommerce",
            url: initialData?.url || "",
            store_name: initialData?.store_name || "",
            key: "",
            secret: "",
            wp_username: initialData?.wp_username || "",
            wp_app_password: "",
        },
    });

    const [showWpCredentials, setShowWpCredentials] = useState(
        !!initialData?.wp_username
    );

    const getStatus = () => {
        if (isConnecting) return "connecting";
        if (isConnectSuccess) return "success";
        if (connectError) return "error";
        if (isConnected && mode === "update") return "success";
        return "idle";
    };

    const onSubmit = async (data: WooCredentials) => {
        try {
            connect(data);
        } catch (error) {
            onError?.(error as Error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {isOnboarding && (
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-4 rounded-xl flex gap-3 text-purple-700 dark:text-purple-400">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">
                        To connect your store, generate API keys with <strong>Read/Write</strong> permissions in WooCommerce.
                    </p>
                </div>
            )}

            <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
                <CardContent className="p-8 space-y-8">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                {isOnboarding ? "Let's Connect Your Store" : "WooCommerce Settings"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {isOnboarding
                                    ? "Enter your API keys to sync your products"
                                    : "Update your connection credentials"}
                            </p>
                        </div>
                        <ConnectionStatusBadge status={getStatus()} />
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatePresence>
                                {connectError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="rounded-xl border border-red-100 bg-destructive/10/50 p-4 text-sm text-destructive dark:border-red-900/50 dark:bg-red-900/10 dark:text-destructive overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 font-medium mb-1">
                                            <AlertCircle className="h-4 w-4" />
                                            Connection Error
                                        </div>
                                        <p className="opacity-90 pl-6">{(connectError as Error).message}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid gap-6">
                                {isOnboarding && (
                                    <FormField
                                        control={form.control}
                                        name="store_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Store className="h-4 w-4 text-muted-foreground" />
                                                    <FormLabel className="text-base font-medium">Store Name</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex: My Awesome Store"
                                                        {...field}
                                                        disabled={isConnecting}
                                                        className="h-11 rounded-xl bg-muted/50 border-input focus:ring-primary/20"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <FormLabel className="text-base font-medium">Store URL</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://your-site.com"
                                                    {...field}
                                                    disabled={isConnecting}
                                                    className="h-11 rounded-xl bg-muted/50 border-input focus:ring-primary/20 font-mono text-sm"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="key"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Key className="h-4 w-4 text-muted-foreground" />
                                                    <FormLabel className="text-base font-medium">Consumer Key (CK)</FormLabel>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Key starts with "ck_"
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <FormControl>
                                                    <SecretInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder={mode === "update" ? "••••••••" : "ck_xxxxxxxx..."}
                                                        disabled={isConnecting}
                                                        hasError={!!form.formState.errors.key}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="secret"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                    <FormLabel className="text-base font-medium">Consumer Secret (CS)</FormLabel>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Secret starts with "cs_"
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <FormControl>
                                                    <SecretInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder={mode === "update" ? "••••••••" : "cs_xxxxxxxx..."}
                                                        disabled={isConnecting}
                                                        hasError={!!form.formState.errors.secret}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium flex items-center gap-2">
                                            Blog Sync
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">Optional</Badge>
                                        </Label>
                                        <p className="text-xs text-muted-foreground">Enable this to import your posts.</p>
                                    </div>
                                    <Switch
                                        checked={showWpCredentials}
                                        onCheckedChange={setShowWpCredentials}
                                    />
                                </div>

                                <AnimatePresence>
                                    {showWpCredentials && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-4 pt-2 overflow-hidden"
                                        >
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name="wp_username"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium">Admin User</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="admin"
                                                                    {...field}
                                                                    disabled={isConnecting}
                                                                    className="bg-background h-10"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="wp_app_password"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium">App Password</FormLabel>
                                                            <FormControl>
                                                                <SecretInput
                                                                    value={field.value || ""}
                                                                    onChange={field.onChange}
                                                                    placeholder="abcd efgh ijkl mnop"
                                                                    disabled={isConnecting}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-medium"
                                disabled={isConnecting}
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : isOnboarding ? (
                                    "Connect & Continue"
                                ) : (
                                    "Update Connection"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
