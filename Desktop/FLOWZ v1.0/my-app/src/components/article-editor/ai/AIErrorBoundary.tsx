'use client';

/**
 * AIErrorBoundary - Error boundary specifically for AI components
 * 
 * Catches errors in AI-powered components and displays a fallback UI
 * without crashing the entire editor
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

interface AIErrorBoundaryProps {
    children: ReactNode;
    fallbackMessage?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface AIErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export class AIErrorBoundary extends Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
    constructor(props: AIErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): AIErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error
        console.error('AIErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const message = this.props.fallbackMessage || 'Une erreur est survenue avec le composant IA.';

            return (
                <div className="flex flex-col items-center justify-center p-6 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive mb-3">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Erreur IA</span>
                    </div>

                    <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                        {message}
                    </p>

                    {this.state.error && (
                        <p className="text-xs text-muted-foreground/70 mb-4 font-mono">
                            {this.state.error.message}
                        </p>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleReset}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Réessayer
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AIErrorBoundary;
