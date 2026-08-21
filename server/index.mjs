import { createServer } from 'node:http';
import { getConfig } from './lib/config.mjs';
import { createApi } from './app.mjs';

const config = getConfig();
const api = createApi({ config });

const readRequestBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const server = createServer(async (request, response) => {
  try {
    const url = `http://${request.headers.host || `localhost:${config.port}`}${request.url}`;
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await readRequestBody(request);
    const result = await api(new Request(url, {
      method: request.method,
      headers: request.headers,
      body: body?.length ? body : undefined,
    }));
    const payload = await result.arrayBuffer();
    response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
    response.end(Buffer.from(payload));
  } catch (error) {
    response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: { code: 'http_adapter_error', message: 'The server could not complete the request.' } }));
    console.error(JSON.stringify({ event: 'http_adapter.failed', error: error.message }));
  }
});

server.listen(config.port, () => console.log(JSON.stringify({ event: 'server.started', port: config.port, environment: config.nodeEnv })));

const shutdown = (signal) => {
  console.log(JSON.stringify({ event: 'server.stopping', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
