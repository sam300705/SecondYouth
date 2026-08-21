import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiGateway } from '../lib/ai.mjs';
import { createAuthService } from '../lib/auth.mjs';
import { createRateLimiter } from '../lib/security.mjs';
import { createApi } from '../app.mjs';

test('signs and verifies access tokens, rejecting tampering', () => {
  const auth = createAuthService({ secret: 'test-secret-that-is-long-enough', clock: () => 1_700_000_000_000 });
  const token = auth.issueAccessToken({ sub: 'user-1', roles: ['caregiver'] });
  assert.equal(auth.verifyAccessToken(token).sub, 'user-1');
  assert.equal(auth.verifyAccessToken(`${token}x`), null);
});

test('rotates refresh tokens and revokes a family on reuse', () => {
  const auth = createAuthService({ secret: 'test-secret-that-is-long-enough' });
  const first = auth.issueSession({ userId: 'user-1' });
  const second = auth.rotateRefreshToken(first.refreshToken);
  assert.equal(second.ok, true);
  assert.equal(auth.rotateRefreshToken(first.refreshToken).reason, 'refresh_token_reuse_detected');
  assert.equal(auth.rotateRefreshToken(second.refreshToken).reason, 'invalid_refresh_token');
});

test('rate limiter allows the configured burst and blocks the next request', () => {
  let now = 0;
  const limiter = createRateLimiter({ limit: 2, windowMs: 100, clock: () => now });
  assert.equal(limiter.check('user').allowed, true);
  assert.equal(limiter.check('user').allowed, true);
  assert.equal(limiter.check('user').allowed, false);
  now = 101;
  assert.equal(limiter.check('user').allowed, true);
});

test('local assistant provides safe medicine guidance without claiming clinical authority', async () => {
  const ai = createAiGateway();
  const result = await ai.complete('What is my next medicine?', { currentScreen: 'home', medicines: [{ name: 'Vitamin D', time: '09:00', active: true }] });
  assert.equal(result.ok, true);
  assert.match(result.text, /Vitamin D/);
  assert.match(result.text, /confirm/i);
});

test('API health and assistant routes return structured responses', async () => {
  const api = createApi({ config: { requireAuth: false, allowedOrigin: '*', aiProvider: 'disabled' } });
  const health = await api(new Request('http://localhost/healthz'));
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  const assistant = await api(new Request('http://localhost/api/v1/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'How do I reach settings?', context: { route: 'home' } }) }));
  assert.equal(assistant.status, 200);
  assert.match((await assistant.json()).text, /settings/i);
});
