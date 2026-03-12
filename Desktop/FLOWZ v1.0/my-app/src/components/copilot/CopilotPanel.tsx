"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  TrendingUp,
  Package,
  FileText,
  Search,
  BarChart3,
  Zap,
  Loader2,
  Wrench,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCopilot } from "@/contexts/CopilotContext";
import { usePathname } from "next/navigation";
import { motionTokens } from "@/lib/design-system";

/**
 * CopilotPanel
 *
 * Windows Copilot-style side panel that pushes the main content.
 * Provides contextual AI suggestions based on the current page.
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type QuickSuggestion = {
  icon: React.ReactNode;
  label: string;
  prompt: string;
};

const getContextualSuggestions = (pathname: string): QuickSuggestion[] => {
  if (pathname.includes("/products")) {
    return [
      {
        icon: <Package className="w-3.5 h-3.5" />,
        label: "Optimiser les descriptions",
        prompt: "Quels produits ont des descriptions incomplètes ?",
      },
      {
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        label: "Analyse SEO produits",
        prompt: "Analyse le score SEO de mes produits et suggère des améliorations.",
      },
      {
        icon: <Zap className="w-3.5 h-3.5" />,
        label: "Générer en lot",
        prompt: "Génère des descriptions pour les produits sans contenu.",
      },
    ];
  }

  if (pathname.includes("/blog")) {
    return [
      {
        icon: <FileText className="w-3.5 h-3.5" />,
        label: "Idées d'articles",
        prompt: "Suggère des idées d'articles basées sur mes produits.",
      },
      {
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        label: "Tendances du moment",
        prompt: "Quelles sont les tendances actuelles dans mon secteur ?",
      },
      {
        icon: <Search className="w-3.5 h-3.5" />,
        label: "Mots-clés à cibler",
        prompt: "Quels mots-clés devrais-je cibler pour mon prochain article ?",
      },
    ];
  }

  if (pathname.includes("/seo")) {
    return [
      {
        icon: <BarChart3 className="w-3.5 h-3.5" />,
        label: "Audit rapide",
        prompt: "Fais un audit SEO rapide de mon site.",
      },
      {
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        label: "Opportunités",
        prompt: "Quelles sont mes meilleures opportunités SEO ?",
      },
      {
        icon: <Search className="w-3.5 h-3.5" />,
        label: "Erreurs critiques",
        prompt: "Y a-t-il des erreurs SEO critiques à corriger ?",
      },
    ];
  }

  // Default / overview
  return [
    {
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      label: "Résumé du jour",
      prompt: "Donne-moi un résumé de l'activité de ma boutique aujourd'hui.",
    },
    {
      icon: <Zap className="w-3.5 h-3.5" />,
      label: "Actions prioritaires",
      prompt: "Quelles sont les actions prioritaires à faire aujourd'hui ?",
    },
    {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      label: "Performance globale",
      prompt: "Comment se porte ma boutique cette semaine ?",
    },
  ];
};

const getWelcomeMessage = (pathname: string): string => {
  if (pathname.includes("/products")) {
    return "Je suis votre assistant produits. Je peux optimiser vos descriptions, analyser le SEO, ou générer du contenu en lot.";
  }
  if (pathname.includes("/blog")) {
    return "Je suis votre assistant rédaction. Je peux vous aider à trouver des idées, optimiser vos articles, ou planifier votre calendrier éditorial.";
  }
  if (pathname.includes("/seo")) {
    return "Je suis votre assistant SEO. Je peux auditer votre site, identifier des opportunités, et vous guider pour améliorer votre référencement.";
  }
  return "Bonjour ! Je suis votre Copilot FLOWZ. Comment puis-je vous aider aujourd'hui ?";
};

// Tool name display map
const TOOL_LABELS: Record<string, string> = {
  search_products: "Recherche produits",
  get_product: "Chargement produit",
  get_seo_scores: "Analyse SEO",
  get_dashboard_kpis: "Chargement KPIs",
  list_articles: "Liste articles",
  generate_product_content: "Génération contenu",
  suggest_seo_fix: "Suggestions SEO",
  update_product_content: "Mise à jour produit",
  push_to_store: "Sync boutique",
};

export const CopilotPanel = () => {
  const { isOpen, setCopilotOpen } = useCopilot();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = getContextualSuggestions(pathname);
  const welcomeMessage = getWelcomeMessage(pathname);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, activeTool]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = text || inputValue.trim();
      if (!content || isTyping) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);
      setActiveTool(null);

      // Build history from previous messages (exclude the one we just added)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Abort previous request if any
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/copilot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history,
            context: { currentPage: pathname },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Erreur ${response.status}`);
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (eventType) {
                  case "tool_call":
                    setActiveTool(data.tool);
                    break;
                  case "tool_result":
                    setActiveTool(null);
                    break;
                  case "message": {
                    const assistantMessage: Message = {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: data.content,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    break;
                  }
                  case "error": {
                    const errorMessage: Message = {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: `Désolé, une erreur est survenue: ${data.message}`,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                    break;
                  }
                  case "done":
                    break;
                }
              } catch {
                // Ignore malformed JSON
              }
              eventType = "";
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Erreur de connexion: ${err.message || "Impossible de contacter le serveur"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        setActiveTool(null);
      }
    },
    [inputValue, isTyping, messages, pathname]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={motionTokens.transitions.default}
      className="h-full flex-shrink-0 overflow-hidden"
    >
      <div className="h-full w-[380px] flex flex-col border-l border-border/10 bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Copilot
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Assistant IA FLOWZ
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCopilotOpen(false)}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <motion.div
                variants={motionTokens.variants.fadeIn}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* AI greeting */}
                <div className="flex gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {welcomeMessage}
                    </p>
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                    Suggestions
                  </p>
                  <div className="space-y-1.5">
                    {suggestions.map((suggestion, i) => (
                      <motion.button
                        key={i}
                        custom={i}
                        variants={motionTokens.variants.staggeredSlideLeft}
                        initial="hidden"
                        animate="visible"
                        onClick={() => handleSend(suggestion.prompt)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                          "bg-muted/40 hover:bg-muted/70 border border-border/10 hover:border-border/20",
                          "transition-colors text-left group"
                        )}
                      >
                        <div className="h-7 w-7 rounded-lg bg-background/80 ring-1 ring-border/20 flex items-center justify-center flex-shrink-0 group-hover:ring-border/40 transition-colors">
                          {suggestion.icon}
                        </div>
                        <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                          {suggestion.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={motionTokens.variants.slideUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className={cn(
                    "flex gap-2.5",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/50 text-foreground/90 rounded-bl-sm"
                    )}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing / Tool indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  variants={motionTokens.variants.fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex gap-2.5"
                >
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {activeTool ? (
                      <Wrench className="w-3.5 h-3.5 text-primary animate-pulse" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="bg-muted/50 px-3 py-2.5 rounded-xl rounded-bl-sm">
                    {activeTool ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                        <span className="text-[10px] text-muted-foreground">
                          {TOOL_LABELS[activeTool] || activeTool}...
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={scrollEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/10 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Demandez-moi quelque chose..."
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl border border-border/20 bg-muted/30 px-3 py-2.5",
                  "text-xs text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30",
                  "transition-colors max-h-24"
                )}
                style={{
                  height: "auto",
                  minHeight: "38px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 96) + "px";
                }}
              />
            </div>
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="h-[38px] w-[38px] rounded-xl flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            Copilot FLOWZ - IA contextuelle
          </p>
        </div>
      </div>
    </motion.div>
  );
};
