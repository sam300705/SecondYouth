import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import pg from 'pg';
import { createRateLimiter, errorResponse, jsonResponse, readJson } from './security.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');
const validToken = (value) => /^[A-Za-z0-9_-]{43}$/.test(value ?? '');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clockTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const calendarDate = /^\d{4}-\d{2}-\d{2}$/;
const boundedText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

function validDate(date) {
  if (typeof date !== 'string' || !calendarDate.test(date)) return false;
  const parsed = new Date(date);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function validEvent(event) {
  return event && typeof event.id === 'string' && uuid.test(event.id)
    && boundedText(event.medicineId, 120) && boundedText(event.name, 160)
    && validDate(event.date)
    && typeof event.time === 'string' && clockTime.test(event.time)
    && typeof event.taken === 'boolean' && typeof event.recordedAt === 'string'
    && Number.isFinite(Date.parse(event.recordedAt)) && new Date(event.recordedAt).toISOString() === event.recordedAt;
}

export async function makeCareService(env = process.env) {
  if (!env.DATABASE_URL) return null;
  const demo = env.CARE_DEMO === 'true';
  if (demo && env.NODE_ENV === 'production') throw new Error('CARE_DEMO requires a development environment');
  const issuer = env.CARE_OIDC_ISSUER;
  const clientId = env.CARE_OIDC_CLIENT_ID;
  const audience = env.CARE_OIDC_AUDIENCE;
  const scope = env.CARE_OIDC_SCOPE || 'openid profile';
  if (!demo && (!issuer || !clientId || !audience || !env.CARE_OIDC_JWKS_URI)) {
    throw new Error('Configure the care OIDC issuer, client, API audience, and JWKS URI');
  }
  const keys = demo ? null : createRemoteJWKSet(new URL(env.CARE_OIDC_JWKS_URI));
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const schema = await readFile(new URL('../db/care.sql', import.meta.url), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(2061572001)');
      await client.query(schema);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    await pool.end();
    throw error;
  }
  const limiter = createRateLimiter({ limit: 300, windowMs: 60_000 });

  async function identify(request) {
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return null;
    if (demo) return validToken(token) ? 'demo:' + digest(token) : null;
    try {
      const { payload } = await jwtVerify(token, keys, { issuer, audience, requiredClaims: ['exp', 'sub'] });
      return boundedText(payload.sub, 255) ? 'oidc:' + payload.sub : null;
    } catch {
      return null;
    }
  }

  async function handle(request, path) {
    const send = (value, status = 200) => jsonResponse(value, { status });
    const fail = (status, code, message) => errorResponse(status, code, message);
    if (request.method === 'GET' && path === '/api/care/config') {
      return send(demo ? { mode: 'demo' } : { mode: 'oidc', issuer, clientId, scope, resource: env.CARE_OIDC_RESOURCE || null });
    }

    const identity = await identify(request);
    if (!identity) return fail(401, 'sign_in_required', 'Sign in to continue.');
    const grantHeader = request.headers.get('x-care-invite');

    if (path === '/api/care/timeline' && request.method === 'POST') {
      if (!validToken(grantHeader)) return fail(403, 'sharing_unavailable', 'Caregiver access is unavailable.');
      const hash = digest(grantHeader);
      if (!demo) {
        await pool.query(
          `UPDATE care_grants SET caregiver_id = $2
           WHERE token_hash = $1 AND caregiver_id IS NULL AND revoked_at IS NULL AND expires_at > now() AND owner_id <> $2`,
          [hash, identity],
        );
      }
      // Authorization and the read share one database statement and snapshot.
      const { rows } = await pool.query(
        `SELECT event.event_id AS id, event.medicine_id AS "medicineId", event.medicine_name AS name,
                event.scheduled_date AS date, event.scheduled_time AS time, event.taken,
                event.recorded_at AS "recordedAt", event.synced_at AS "syncedAt"
         FROM care_grants AS grant_row
         LEFT JOIN LATERAL (
           SELECT * FROM care_checkins WHERE owner_id = grant_row.owner_id ORDER BY sequence DESC LIMIT 200
         ) AS event ON true
         WHERE grant_row.token_hash = $1 AND grant_row.revoked_at IS NULL AND grant_row.expires_at > now()
           AND ($2::boolean OR grant_row.caregiver_id = $3)
         ORDER BY event.sequence DESC`,
        [hash, demo, identity],
      );
      if (!rows.length) return fail(403, 'sharing_unavailable', 'This invitation is expired, revoked, or linked to another caregiver.');
      return send({ events: rows.filter((row) => row.id) });
    }

    if (path === '/api/care/checkins' && request.method === 'POST') {
      if (!limiter.check(identity).allowed) return fail(429, 'retry_later', 'Sync will retry shortly.');
      const event = await readJson(request);
      if (!validEvent(event)) return fail(400, 'invalid_checkin', 'The check-in could not be accepted.');
      await pool.query(
        `INSERT INTO care_checkins
         (owner_id, event_id, medicine_id, medicine_name, scheduled_date, scheduled_time, taken, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (owner_id, event_id) DO NOTHING`,
        [identity, event.id, event.medicineId, event.name, event.date, event.time, event.taken, event.recordedAt],
      );
      return send({ id: event.id });
    }

    if (path === '/api/care/grants' && request.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT id, created_at AS "createdAt", expires_at AS "expiresAt", caregiver_id IS NOT NULL AS claimed
         FROM care_grants WHERE owner_id = $1 AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC`,
        [identity],
      );
      return send({ grants: rows });
    }

    if (path === '/api/care/grants' && request.method === 'POST') {
      if (!limiter.check(identity).allowed) return fail(429, 'retry_later', 'Try again shortly.');
      const token = randomBytes(32).toString('base64url');
      const { rows: [grant] } = await pool.query(
        'INSERT INTO care_grants (id, owner_id, token_hash) VALUES ($1, $2, $3) RETURNING id, expires_at AS "expiresAt"',
        [randomUUID(), identity, digest(token)],
      );
      return send({ ...grant, token }, 201);
    }

    const grantId = path.slice('/api/care/grants/'.length);
    if (request.method === 'DELETE' && path.startsWith('/api/care/grants/') && uuid.test(grantId)) {
      await pool.query('UPDATE care_grants SET revoked_at = now() WHERE id = $1 AND owner_id = $2 AND revoked_at IS NULL', [grantId, identity]);
      return new Response(null, { status: 204 });
    }

    return fail(404, 'not_found', 'Care route not found.');
  }

  return { handle, close: () => pool.end(), issuer: demo ? null : issuer };
}
