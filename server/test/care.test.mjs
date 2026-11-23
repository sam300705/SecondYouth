import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import test from 'node:test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { makeCareService } from '../lib/care.mjs';

test('care retries, corrections, consent and revocation persist in PostgreSQL', {
  skip: !process.env.CARE_TEST_DATABASE_URL,
}, async (t) => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  const identityProvider = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ keys: [{ ...jwk, kid: 'care-test' }] }));
  });
  await new Promise((resolve) => identityProvider.listen(0, '127.0.0.1', resolve));
  t.after(() => identityProvider.close());
  const issuer = 'http://127.0.0.1:' + identityProvider.address().port;
  const audience = 'secondyouth-test';
  const token = (target = audience) => new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'care-test' })
    .setIssuer(issuer).setAudience(target).setSubject(randomUUID())
    .setIssuedAt().setExpirationTime('5m').sign(privateKey);
  const [owner, caregiver, stranger, wrongAudience] = await Promise.all([
    token(), token(), token(), token('other-api'),
  ]);
  const settings = {
    DATABASE_URL: process.env.CARE_TEST_DATABASE_URL,
    CARE_OIDC_ISSUER: issuer,
    CARE_OIDC_CLIENT_ID: 'secondyouth-test-ui',
    CARE_OIDC_AUDIENCE: audience,
    CARE_OIDC_JWKS_URI: issuer + '/jwks',
  };
  let care = await makeCareService(settings);
  t.after(() => care.close());

  function call(path, bearer, options = {}) {
    const route = '/api/care/' + path;
    return care.handle(new Request(issuer + route, {
      method: options.method || 'GET',
      headers: { authorization: 'Bearer ' + bearer, 'x-care-invite': options.invite || '' },
      body: options.body ? JSON.stringify(options.body) : undefined,
    }), route);
  }

  assert.equal((await call('grants', wrongAudience)).status, 401);
  const grant = await (await call('grants', owner, { method: 'POST' })).json();
  const read = (bearer) => call('timeline', bearer, { method: 'POST', invite: grant.token });
  assert.equal((await read(owner)).status, 403);
  assert.deepEqual((await (await read(caregiver)).json()).events, []);
  assert.equal((await read(stranger)).status, 403);
  const event = {
    id: randomUUID(), medicineId: 'demo-medicine', name: 'Fictional tablet',
    date: '2026-11-23', time: '09:00', taken: true, recordedAt: new Date().toISOString(),
  };
  const send = (body) => call('checkins', owner, { method: 'POST', body });
  assert.deepEqual(await (await send(event)).json(), { id: event.id });
  assert.deepEqual(await (await send(event)).json(), { id: event.id });
  assert.equal((await send({ ...event, id: randomUUID(), taken: false })).status, 200);
  await care.close();
  care = await makeCareService(settings);
  const { events } = await (await read(caregiver)).json();
  assert.deepEqual(events.map((row) => row.taken), [false, true]);
  assert.equal((await call('grants/' + grant.id, stranger, { method: 'DELETE' })).status, 204);
  assert.equal((await read(caregiver)).status, 200);
  assert.equal((await call('grants/' + grant.id, owner, { method: 'DELETE' })).status, 204);
  assert.equal((await read(caregiver)).status, 403);
});
