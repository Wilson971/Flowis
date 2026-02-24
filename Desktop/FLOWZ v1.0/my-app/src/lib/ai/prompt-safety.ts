/**
 * Shared Prompt Injection Detection & Input Sanitization
 *
 * Used by all AI endpoints: FloWriter, Photo Studio, Batch Generation.
 * Defense-in-depth: these patterns catch common injection techniques.
 */

// ============================================================================
// SUSPICIOUS PATTERNS (20+ patterns covering known injection vectors)
// ============================================================================

export const SUSPICIOUS_PATTERNS: RegExp[] = [
    // --- Original FloWriter patterns (9) ---
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
    /disregard\s+(all\s+)?(previous|above|prior)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /new\s+instructions?:/i,
    /system\s*prompt:/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /<<SYS>>/i,
    /<\|im_start\|>/i,

    // --- Role switching / impersonation ---
    /pretend\s+(to\s+be|you\'?re)\s+/i,
    /impersonate\s+(a|an|the)\s+/i,
    /act\s+as\s+(a|an|if)\s+/i,
    /roleplay\s+as\s+/i,

    // --- Context manipulation ---
    /forget\s+(all\s+)?(previous|above|prior|your)\s+/i,
    /clear\s+(your\s+)?(context|memory|instructions?)/i,
    /reset\s+(your\s+)?(context|instructions?|behavior)/i,
    /override\s+(your\s+)?(instructions?|rules?|guidelines?)/i,

    // --- Continuation attacks ---
    /from\s+now\s+on\s+(you|ignore|only|always)/i,
    /continue\s+(the\s+)?(above|previous)\s+(text|prompt|conversation)/i,
    /for\s+the\s+rest\s+of\s+this\s+(conversation|session)/i,

    // --- Code execution attempts ---
    /\beval\s*\(/i,
    /\bexec\s*\(/i,
    /\bimport\s+os\b/i,
    /\b__import__\s*\(/i,

    // --- Delimiter confusion ---
    /<\|im_end\|>/i,
    /<\|endoftext\|>/i,
    /```\s*system\b/i,
    /###\s*(system|instruction|human|assistant)\s*:/i,

    // --- Output manipulation ---
    /\b(print|output|return|echo)\s+the\s+(system|hidden|secret|original)\s+(prompt|instructions?|message)/i,
    /reveal\s+(your|the)\s+(system|hidden|secret|original)\s+(prompt|instructions?)/i,
    /what\s+(are|is)\s+your\s+(system|original|hidden)\s+(prompt|instructions?)/i,

    // --- Multilingual bypasses (French, Spanish, German) ---
    /ignore[rz]?\s+(toutes?\s+les?\s+)?(instructions?|consignes?)\s+(précédentes?|antérieures?)/i,
    /olvida\s+(todas?\s+)?(las?\s+)?instrucciones/i,
    /ignorier(e|en)?\s+(alle\s+)?(vorherigen?\s+)?(Anweisungen|Instruktionen)/i,
];

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Returns true if the text contains patterns indicative of prompt injection.
 */
export function detectPromptInjection(text: string): boolean {
    if (typeof text !== 'string') return false;
    return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize user-provided text before embedding in a prompt.
 * - Trims and limits length
 * - Strips control characters (except newlines/tabs)
 * - Escapes backslashes and double quotes
 */
export function sanitizeUserInput(text: string, maxLength: number = 1000): string {
    if (typeof text !== 'string') return '';

    // Trim and limit length
    let sanitized = text.trim().slice(0, maxLength);

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Escape characters that could break prompt structure
    sanitized = sanitized
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');

    return sanitized;
}
