import { makeCareService } from '../server/lib/care.mjs';
import { errorResponse } from '../server/lib/security.mjs';

const MAX_BODY_BYTES = 32 * 1024;
const routePattern = /^(?:config|timeline|checkins|grants(?:\/[a-fA-F0-9-]{36})?)$/;
let startup;

function startCare() {
  startup ??= makeCareService().catch((error) => {
    startup = undefined;
    throw error;
  });
  return startup;
}

function jsonBody(value) {
  if (value == null) return undefined;
  if (Buffer.isBuffer(value) || typeof value === 'string') return value;
  return JSON.stringify(value);
}

export default async function handler(request, response) {
  const url = new URL(request.url || '/', 'https://secondyouth.invalid');
  const path = url.pathname.startsWith('/api/care/')
    ? url.pathname.slice('/api/care/'.length)
    : url.searchParams.get('route');
  let result;
  try {
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : jsonBody(request.body);
    if (body !== undefined && Buffer.byteLength(body) > MAX_BODY_BYTES) {
      result = errorResponse(413, 'payload_too_large', 'Request body exceeds 32 KiB.');
    } else if (!routePattern.test(path || '')) {
      result = errorResponse(404, 'not_found', 'Care route not found.');
    } else {
      const care = await startCare();
      if (care) {
        const apiPath = '/api/care/' + path;
        result = await care.handle(new Request(new URL(apiPath, url), {
          method: request.method,
          headers: request.headers,
          body,
        }), apiPath);
      } else {
        result = errorResponse(503, 'care_unavailable', 'Care sharing is unavailable on this server.');
      }
    }
  } catch (error) {
    console.error('Care function failed', error.code || error.name);
    result = errorResponse(503, 'care_unavailable', 'Care sharing is temporarily unavailable.');
  }
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
  for (const [key, value] of result.headers) response.setHeader(key, value);
  response.statusCode = result.status;
  response.end(result.body ? Buffer.from(await result.arrayBuffer()) : undefined);
}
