/**
 * Copilot Chat API Route
 *
 * POST /api/copilot/chat
 *
 * Agent loop:
 * 1. Receives user message + conversation history
 * 2. Sends to Claude with tool definitions
 * 3. If Claude calls a tool → execute it → send result back to Claude
 * 4. Repeat until Claude produces a text response
 * 5. Stream the final response via SSE
 *
 * Architecture:
 * - Claude (Anthropic) = reasoning + tool selection
 * - Gemini = content generation (called by tools)
 * - Supabase = data layer (RLS-protected)
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COPILOT_TOOLS, type CopilotToolName } from "@/lib/copilot/tools";
import { executeToolCall } from "@/lib/copilot/executors";
import { detectPromptInjection, sanitizeUserInput } from "@/lib/ai/prompt-safety";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes for multi-turn tool loops

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
  context?: {
    currentPage?: string;
    storeId?: string;
  };
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `Tu es le Copilot FLOWZ, un assistant IA intégré à la plateforme FLOWZ de gestion e-commerce.

IDENTITÉ:
- Tu es un expert en e-commerce, SEO, et gestion de contenu produit
- Tu parles français par défaut, mais tu peux répondre dans la langue de l'utilisateur
- Tu es concis, professionnel, et orienté action
- Tu tutoies l'utilisateur de manière professionnelle

CAPACITÉS (via tes tools):
- Rechercher et analyser des produits dans le catalogue
- Consulter les scores SEO et suggérer des améliorations
- Générer du contenu IA pour les produits (via Gemini)
- Mettre à jour le contenu des produits
- Pousser les modifications vers WooCommerce/Shopify
- Consulter les KPIs du dashboard
- Lister les articles de blog

RÈGLES:
1. Utilise TOUJOURS les tools disponibles pour répondre avec des données réelles
2. Ne fabrique JAMAIS de données — utilise les tools pour récupérer les vraies données
3. Quand tu modifies du contenu, EXPLIQUE ce que tu as fait et DEMANDE confirmation avant de pousser vers la boutique
4. Pour les actions d'écriture (update, push), CONFIRME avec l'utilisateur avant d'exécuter
5. Formate tes réponses de manière lisible (listes, gras pour les points importants)
6. Si tu rencontres une erreur, explique-la simplement et propose une alternative

CONTEXTE PLATEFORME:
- FLOWZ gère des boutiques WooCommerce/Shopify
- Les produits ont un "working_content" (contenu actuel) et un "draft_generated_content" (brouillon IA)
- Le push vers la boutique synchronise le working_content vers WooCommerce
- Les scores SEO vont de 0 à 100 (< 40 = critique, 40-70 = avertissement, > 70 = bon)`;

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Get tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return Response.json(
        { error: "Profil non trouvé" },
        { status: 403 }
      );
    }

    const tenantId = profile.tenant_id;

    // Parse request
    const body: RequestBody = await request.json();
    const { message, history = [], context } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Security: check for prompt injection
    const sanitized = sanitizeUserInput(message);
    const injection = detectPromptInjection(sanitized);
    if (injection.isInjection) {
      return Response.json(
        { error: "Message invalide détecté" },
        { status: 400 }
      );
    }

    // Check for Anthropic API key
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY non configurée" },
        { status: 500 }
      );
    }

    // Build messages for Claude
    const claudeMessages = [
      // Conversation history
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      // Current message with page context
      {
        role: "user" as const,
        content: context?.currentPage
          ? `[L'utilisateur est sur la page: ${context.currentPage}]\n\n${sanitized}`
          : sanitized,
      },
    ];

    // Stream SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          send("connected", { status: "ok" });

          // Agent loop: call Claude, execute tools, repeat
          let currentMessages = [...claudeMessages];
          let iterations = 0;
          const MAX_ITERATIONS = 8; // Safety limit

          while (iterations < MAX_ITERATIONS) {
            iterations++;

            // Call Claude API
            const claudeResponse = await fetch(
              "https://api.anthropic.com/v1/messages",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": anthropicKey,
                  "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                  model: "claude-sonnet-4-20250514",
                  max_tokens: 2048,
                  system: SYSTEM_PROMPT,
                  tools: COPILOT_TOOLS.map((t) => ({
                    name: t.name,
                    description: t.description,
                    input_schema: t.input_schema,
                  })),
                  messages: currentMessages,
                }),
              }
            );

            if (!claudeResponse.ok) {
              const errBody = await claudeResponse.text();
              send("error", {
                message: "Erreur API Claude",
                details: claudeResponse.status,
              });
              break;
            }

            const result = await claudeResponse.json();

            // Check if Claude wants to use a tool
            const toolUseBlocks = (result.content || []).filter(
              (b: any) => b.type === "tool_use"
            );
            const textBlocks = (result.content || []).filter(
              (b: any) => b.type === "text"
            );

            if (toolUseBlocks.length > 0) {
              // Send tool usage status
              for (const toolUse of toolUseBlocks) {
                send("tool_call", {
                  tool: toolUse.name,
                  input: toolUse.input,
                });

                // Execute the tool
                const toolResult = await executeToolCall(
                  toolUse.name as CopilotToolName,
                  toolUse.input,
                  supabase,
                  tenantId
                );

                send("tool_result", {
                  tool: toolUse.name,
                  success: toolResult.success,
                });

                // Add assistant message with tool_use + tool_result to continue the loop
                currentMessages = [
                  ...currentMessages,
                  {
                    role: "assistant" as const,
                    content: result.content,
                  },
                  {
                    role: "user" as const,
                    content: [
                      {
                        type: "tool_result",
                        tool_use_id: toolUse.id,
                        content: JSON.stringify(toolResult),
                      },
                    ],
                  },
                ];
              }

              // If Claude also produced text alongside tool calls, we'll continue the loop
              // to let Claude process the tool results
              if (result.stop_reason === "end_turn" && textBlocks.length > 0) {
                // Claude finished — send the text
                const finalText = textBlocks.map((b: any) => b.text).join("\n");
                send("message", { content: finalText });
                break;
              }

              // Continue the loop to get Claude's response after tool results
              continue;
            }

            // No tool calls — Claude produced a final text response
            if (textBlocks.length > 0) {
              const finalText = textBlocks.map((b: any) => b.text).join("\n");
              send("message", { content: finalText });
            } else {
              send("message", {
                content: "Je n'ai pas pu générer de réponse. Peux-tu reformuler ?",
              });
            }

            break;
          }

          if (iterations >= MAX_ITERATIONS) {
            send("error", {
              message:
                "Trop d'itérations. La requête est trop complexe pour être traitée en une seule fois.",
            });
          }

          send("done", { iterations });
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erreur interne";
          send("error", { message: msg });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
