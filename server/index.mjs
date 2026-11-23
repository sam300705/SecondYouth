import { createServer } from 'node:http';
import { getConfig } from './lib/config.mjs';
import { createApi } from './app.mjs';
import { makeCareService } from './lib/care.mjs';
import { serveWeb } from './lib/web.mjs';

const MAX_BODY_BYTES = 32 * 1024;

const config = getConfig();
const care = await makeCareService();
const api = createApi({ config, care });

async function readRequestBody(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, bytes);
}

const server = createServer({ headersTimeout: 10_000, requestTimeout: 20_000, connectionsCheckingInterval: 5_000 }, async (request, response) => {
  try {
    const url = new URL(`http://localhost:${config.port}${request.url}`);
    if (await serveWeb(request, response, url.pathname, care?.issuer)) return;
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await readRequestBody(request);
    if (body === null) {
      response.writeHead(413, { 'content-type': 'application/json', connection: 'close' });
      response.end(JSON.stringify({ error: { code: 'payload_too_large', message: 'Request body exceeds 32 KiB.' } }));
      return;
    }
    const result = await api(new Request(url, {
      method: request.method,
      headers: request.headers,
      body: body?.length ? body : undefined,
    }));
    const payload = await result.arrayBuffer();
    response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
    response.end(Buffer.from(payload));
  } catch (error) {
    if (response.destroyed) return;
    if (response.headersSent) { response.destroy(); return; }
    response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: { code: 'http_adapter_error', message: 'The server could not complete the request.' } }));
    console.error(JSON.stringify({ event: 'http_adapter.failed', error: error.message }));
  }
});

server.listen(config.port, () => console.log(JSON.stringify({ event: 'server.started', port: config.port, environment: config.nodeEnv })));

const shutdown = (signal) => {
  console.log(JSON.stringify({ event: 'server.stopping', signal }));
  server.close(async () => { await care?.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
