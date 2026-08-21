import { randomUUID } from 'node:crypto';

export function createRateLimiter({ limit = 60, windowMs = 60_000, clock = () => Date.now() } = {}) {
  const buckets = new Map();
  return {
    check(key = 'anonymous') {
      const now = clock();
      const current = buckets.get(key);
      if (!current || current.resetAt <= now) {
        const next = { count: 1, resetAt: now + windowMs };
        buckets.set(key, next);
        return { allowed: true, remaining: limit - 1, resetAt: next.resetAt };
      }
      current.count += 1;
      return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
    },
    clear() { buckets.clear(); },
    _buckets: buckets,
  };
}

export function requestId(request) {
  const incoming = request.headers.get('x-request-id');
  return incoming && /^[a-zA-Z0-9._:-]{8,128}$/.test(incoming) ? incoming : randomUUID();
}

export function applySecurityHeaders(headers, { allowOrigin = '*' } = {}) {
  headers.set('access-control-allow-origin', allowOrigin);
  headers.set('access-control-allow-headers', 'content-type, authorization, x-request-id');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  headers.set('cross-origin-opener-policy', 'same-origin');
  headers.set('cross-origin-resource-policy', 'same-site');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self)');
  headers.set('content-security-policy', "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'");
  return headers;
}

export function jsonResponse(payload, { status = 200, requestId: id, headers = {} } = {}) {
  const responseHeaders = new Headers({ 'content-type': 'application/json; charset=utf-8', ...headers });
  if (id) responseHeaders.set('x-request-id', id);
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders });
}

export function errorResponse(status, code, message, id, details) {
  return jsonResponse({ error: { code, message, ...(details ? { details } : {}) } }, { status, requestId: id });
}

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}
