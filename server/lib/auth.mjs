import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const base64url = (value) => Buffer.from(value).toString('base64url');
const fromBase64url = (value) => Buffer.from(value, 'base64url');
const sha256 = (value) => createHmac('sha256', 'refresh-token-hash').update(value).digest('hex');

const sign = (input, secret) => createHmac('sha256', secret).update(input).digest('base64url');

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAuthService({ secret, accessTokenTtlSeconds = 900, refreshTokenTtlSeconds = 2592000, clock = () => Date.now() } = {}) {
  if (!secret) throw new Error('An auth signing secret is required');
  const refreshTokens = new Map();

  const issueAccessToken = (claims) => {
    const now = Math.floor(clock() / 1000);
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({
      sub: claims.sub,
      roles: claims.roles || ['subject'],
      iat: now,
      exp: now + accessTokenTtlSeconds,
      iss: 'secondyouth-api',
    }));
    const unsigned = `${header}.${payload}`;
    return `${unsigned}.${sign(unsigned, secret)}`;
  };

  const verifyAccessToken = (token) => {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    if (!safeEqual(signature, sign(`${header}.${payload}`, secret))) return null;
    try {
      const decoded = JSON.parse(fromBase64url(payload).toString('utf8'));
      const now = Math.floor(clock() / 1000);
      if (decoded.iss !== 'secondyouth-api' || !decoded.sub || decoded.exp <= now) return null;
      return decoded;
    } catch {
      return null;
    }
  };

  const issueSession = ({ userId, roles = ['subject'] }) => {
    const familyId = randomBytes(16).toString('hex');
    const refreshToken = randomBytes(32).toString('base64url');
    const now = clock();
    refreshTokens.set(sha256(refreshToken), {
      familyId,
      userId,
      roles,
      expiresAt: now + refreshTokenTtlSeconds * 1000,
      used: false,
      revoked: false,
    });
    return { accessToken: issueAccessToken({ sub: userId, roles }), refreshToken, tokenType: 'Bearer', expiresIn: accessTokenTtlSeconds };
  };

  const rotateRefreshToken = (refreshToken) => {
    const tokenHash = sha256(refreshToken || '');
    const current = refreshTokens.get(tokenHash);
    if (!current || current.revoked || current.expiresAt <= clock()) return { ok: false, reason: 'invalid_refresh_token' };
    if (current.used) {
      for (const record of refreshTokens.values()) {
        if (record.familyId === current.familyId) record.revoked = true;
      }
      return { ok: false, reason: 'refresh_token_reuse_detected' };
    }
    current.used = true;
    const next = issueSession({ userId: current.userId, roles: current.roles });
    const nextRecord = refreshTokens.get(sha256(next.refreshToken));
    nextRecord.familyId = current.familyId;
    return { ok: true, ...next };
  };

  const revokeRefreshToken = (refreshToken) => {
    const current = refreshTokens.get(sha256(refreshToken || ''));
    if (!current) return false;
    for (const record of refreshTokens.values()) {
      if (record.familyId === current.familyId) record.revoked = true;
    }
    return true;
  };

  const clearExpired = () => {
    const now = clock();
    for (const [tokenHash, record] of refreshTokens.entries()) {
      if (record.expiresAt <= now) refreshTokens.delete(tokenHash);
    }
  };

  return { issueAccessToken, verifyAccessToken, issueSession, rotateRefreshToken, revokeRefreshToken, clearExpired, _refreshTokens: refreshTokens };
}

export function requireRole(user, allowedRoles) {
  return Boolean(user?.roles?.some((role) => allowedRoles.includes(role)));
}
