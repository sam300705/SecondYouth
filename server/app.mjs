import { getConfig } from './lib/config.mjs';
import { createAiGateway, buildAssistantContext } from './lib/ai.mjs';
import { createAuthService, requireRole } from './lib/auth.mjs';
import { applySecurityHeaders, createRateLimiter, errorResponse, jsonResponse, readJson, requestId } from './lib/security.mjs';

const bearerToken = (request) => {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export function createApi({ config = getConfig(), authService = createAuthService({ ...config, secret: config.jwtSecret || 'development-only-change-me' }), aiGateway = createAiGateway({ provider: config.aiProvider, apiKey: config.openAiApiKey, baseUrl: config.openAiBaseUrl, model: config.openAiModel }), logger = console, clock = () => Date.now() } = {}) {
  const assistantLimiter = createRateLimiter({ limit: 20, windowMs: 60_000, clock });
  const refreshLimiter = createRateLimiter({ limit: 10, windowMs: 60_000, clock });

  const withHeaders = (response, id) => {
    const headers = new Headers(response.headers);
    applySecurityHeaders(headers, { allowOrigin: config.allowedOrigin });
    headers.set('x-request-id', id);
    return new Response(response.body, { status: response.status, headers });
  };

  const authenticate = (request, id) => {
    if (!config.requireAuth) return { sub: 'offline-demo', roles: ['subject'] };
    const user = authService.verifyAccessToken(bearerToken(request));
    if (!user) throw Object.assign(new Error('Authentication required'), { status: 401, code: 'unauthorized' });
    return user;
  };

  return async function handle(request) {
    const id = requestId(request);
    const url = new URL(request.url);
    try {
      if (request.method === 'OPTIONS') return withHeaders(new Response(null, { status: 204 }), id);
      if (url.pathname === '/healthz' || url.pathname === '/api/v1/health') {
        return withHeaders(jsonResponse({ status: 'ok', service: 'secondyouth-api', time: new Date(clock()).toISOString() }, { requestId: id }), id);
      }
      if (url.pathname === '/readyz') {
        return withHeaders(jsonResponse({ status: 'ready', dependencies: { auth: 'in-memory-adapter', ai: config.aiProvider } }, { requestId: id }), id);
      }

      if (url.pathname === '/api/v1/auth/refresh' && request.method === 'POST') {
        const key = request.headers.get('x-forwarded-for') || 'anonymous';
        const limit = refreshLimiter.check(key);
        if (!limit.allowed) return withHeaders(errorResponse(429, 'rate_limited', 'Too many refresh attempts. Try again later.', id), id);
        const body = await readJson(request);
        const result = authService.rotateRefreshToken(body?.refreshToken);
        if (!result.ok) return withHeaders(errorResponse(401, result.reason, 'The refresh session is no longer valid.', id), id);
        return withHeaders(jsonResponse(result, { requestId: id }), id);
      }

      if (url.pathname === '/api/v1/auth/revoke' && request.method === 'POST') {
        const body = await readJson(request);
        authService.revokeRefreshToken(body?.refreshToken);
        return withHeaders(new Response(null, { status: 204 }), id);
      }

      if (url.pathname === '/api/v1/assistant' && request.method === 'POST') {
        const user = authenticate(request, id);
        if (!requireRole(user, ['subject', 'caregiver', 'administrator'])) throw Object.assign(new Error('Insufficient role'), { status: 403, code: 'forbidden' });
        const key = user.sub || request.headers.get('x-forwarded-for') || 'anonymous';
        const limit = assistantLimiter.check(key);
        if (!limit.allowed) return withHeaders(errorResponse(429, 'rate_limited', 'Assistant request limit reached. Try again later.', id), id);
        const body = await readJson(request);
        const context = buildAssistantContext(body?.context || {});
        const result = await aiGateway.complete(body?.message, context);
        if (!result.ok) return withHeaders(errorResponse(400, result.code, result.message, id), id);
        logger.info(JSON.stringify({ event: 'assistant.completed', requestId: id, userId: user.sub, provider: result.provider }));
        return withHeaders(jsonResponse({ ...result, safety: 'Assistive only; verify medicine details and use emergency services for immediate danger.' }, { requestId: id }), id);
      }

      return withHeaders(errorResponse(404, 'not_found', 'Route not found.', id), id);
    } catch (error) {
      const status = error.status || 500;
      const code = error.code || 'internal_error';
      if (status >= 500) logger.error(JSON.stringify({ event: 'request.failed', requestId: id, error: error.message }));
      return withHeaders(errorResponse(status, code, status >= 500 ? 'An unexpected server error occurred.' : error.message, id), id);
    }
  };
}
