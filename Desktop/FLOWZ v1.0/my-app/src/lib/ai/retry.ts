/**
 * Shared retry utilities for AI API calls.
 * Used by FloWriter, batch-generation, and photo-studio routes.
 */

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableCodes: [429, 500, 502, 503, 504],
} as const;

export function calculateBackoff(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  );
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

export interface ClassifiedError {
  retryable: boolean;
  code: string;
  message: string;
}

export function classifyError(error: unknown): ClassifiedError {
  const err = error as { message?: string; status?: number; code?: number };
  const msg = err?.message?.toLowerCase() || '';
  const status = err?.status || err?.code;

  if (status === 429 || msg.includes('quota') || msg.includes('rate limit')) {
    return { retryable: true, code: 'QUOTA_EXCEEDED', message: 'Quota API dépassé' };
  }
  if (status === 503 || msg.includes('unavailable')) {
    return { retryable: true, code: 'SERVICE_UNAVAILABLE', message: 'Service IA indisponible' };
  }
  if (msg.includes('timeout') || msg.includes('deadline')) {
    return { retryable: true, code: 'TIMEOUT', message: "Timeout de l'API" };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('econnreset')) {
    return { retryable: true, code: 'NETWORK_ERROR', message: 'Erreur réseau' };
  }
  if (typeof status === 'number' && RETRY_CONFIG.retryableCodes.includes(status)) {
    return { retryable: true, code: 'SERVER_ERROR', message: `Erreur serveur (${status})` };
  }

  return { retryable: false, code: 'FATAL', message: msg || 'Erreur inconnue' };
}
