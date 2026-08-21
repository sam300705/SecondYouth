import process from 'node:process';

const asPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function getConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const jwtSecret = env.SECONDYOUTH_JWT_SECRET || (isProduction ? '' : 'development-only-change-me');
  if (isProduction && jwtSecret.length < 32) {
    throw new Error('SECONDYOUTH_JWT_SECRET must be at least 32 characters in production');
  }
  return {
    nodeEnv,
    port: asPositiveInt(env.PORT, 8787),
    jwtSecret,
    accessTokenTtlSeconds: asPositiveInt(env.ACCESS_TOKEN_TTL_SECONDS, 900),
    refreshTokenTtlSeconds: asPositiveInt(env.REFRESH_TOKEN_TTL_SECONDS, 60 * 60 * 24 * 30),
    aiProvider: env.AI_PROVIDER || 'disabled',
    openAiBaseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openAiApiKey: env.OPENAI_API_KEY || '',
    openAiModel: env.OPENAI_MODEL || 'gpt-4o-mini',
    allowedOrigin: env.ALLOWED_ORIGIN || '*',
    requireAuth: env.REQUIRE_AUTH === 'true' || isProduction,
  };
}
