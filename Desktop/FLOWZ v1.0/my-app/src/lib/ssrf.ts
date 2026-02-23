/**
 * Shared SSRF protection utilities.
 * Validates external URLs to prevent Server-Side Request Forgery attacks.
 *
 * Key protection: redirect: "error" rejects all redirects to prevent
 * SSRF bypass via open redirectors (attacker.com -> 169.254.169.254).
 */

const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\./,
  /^198\.18\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata',
  'kubernetes.default',
  'kubernetes.default.svc',
];

export function validateExternalUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS protocols allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.some(h => hostname === h || hostname.endsWith('.' + h))) {
      return { valid: false, error: 'Blocked hostname' };
    }

    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Blocked IP range' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }
}

/**
 * Fetch an external URL with SSRF protection.
 * Uses redirect: "error" to prevent redirect-based SSRF bypass.
 */
export async function fetchExternalUrl(
  url: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const validation = validateExternalUrl(url);
  if (!validation.valid) {
    throw new Error(`SSRF blocked: ${validation.error}`);
  }

  const { timeoutMs = 10_000, ...fetchOptions } = options || {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      redirect: 'error', // Reject redirects to prevent SSRF bypass
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch an image URL with full SSRF protection.
 * Returns base64-encoded image data ready for AI model consumption.
 */
export async function fetchImageSafe(
  imageUrl: string,
  maxSizeBytes: number = 10 * 1024 * 1024
): Promise<{ data: string; mimeType: string }> {
  const response = await fetchExternalUrl(imageUrl, {
    timeoutMs: 30_000,
    headers: { Accept: 'image/*' },
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Failed to fetch image: HTTP ${response.status}`),
      { code: 'IMAGE_FETCH_FAILED' }
    );
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxSizeBytes) {
    throw Object.assign(
      new Error(`Image too large: ${Math.round(buffer.byteLength / 1024 / 1024)}MB`),
      { code: 'INVALID_REQUEST' }
    );
  }

  return {
    data: Buffer.from(buffer).toString('base64'),
    mimeType: response.headers.get('content-type') || 'image/jpeg',
  };
}
