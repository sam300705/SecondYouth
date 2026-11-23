import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { applySecurityHeaders } from './security.mjs';

const mimeTypes = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  woff2: 'font/woff2',
  webmanifest: 'application/manifest+json',
};

export async function serveWeb(request, response, path, issuer) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const asset = /^\/assets\/[\w.-]+\.(?:js|css|svg|webp|woff2)$/.test(path);
  const filename = path === '/' ? 'index.html' : path.slice(1);
  if (!asset && !['index.html', 'sw.js', 'icon.svg', 'manifest.webmanifest'].includes(filename)) return false;

  const file = new URL(`../../dist/${filename}`, import.meta.url);
  const info = await stat(file).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!info?.isFile()) return false;

  const headers = applySecurityHeaders(new Headers());
  headers.delete('access-control-allow-origin');
  headers.set('permissions-policy', 'camera=(self), microphone=(self), geolocation=(self)');
  const connect = issuer ? "; connect-src 'self' " + new URL(issuer).origin : '';
  headers.set('content-security-policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' blob:; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'" + connect);
  headers.set('content-type', mimeTypes[basename(filename).split('.').pop()]);
  headers.set('content-length', String(info.size));
  headers.set('cache-control', asset ? 'public, max-age=31536000, immutable' : 'no-cache');
  response.writeHead(200, Object.fromEntries(headers));
  if (request.method === 'HEAD') response.end();
  else {
    const stream = createReadStream(file);
    stream.on('error', (error) => response.destroy(error));
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  }
  return true;
}
