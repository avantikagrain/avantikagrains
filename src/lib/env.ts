import { z } from 'zod';

const boolish = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  CLIENT_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  PUBLIC_SITE_URL: z.string().url(),
  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  MONGODB_URI: z.string().startsWith('mongodb'),
  MONGODB_DB_NAME: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  COOKIE_DOMAIN: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  SHIPROCKET_EMAIL: z.string().email().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_WEBHOOK_TOKEN: z.string().optional(),

  STORAGE_PROVIDER: z.enum(['s3', 'r2', 'local']).default('local'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  CDN_BASE_URL: z.string().url().optional(),

  EMAIL_PROVIDER: z.enum(['resend', 'ses', 'smtp', 'none']).default('none'),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  SENTRY_DSN: z.string().optional(),

  PAYMENTS_LIVE_MODE: boolish.default(false),
  COD_ENABLED: boolish.default(true),
});

export type ServerEnv = z.infer<typeof serverSchema>;

const withBlanksAsAbsent = z.preprocess((raw) => {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value !== '') cleaned[key] = value;
  }
  return cleaned;
}, serverSchema);

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

const buildPhaseDefaults: Record<string, string> = {
  CLIENT_URL: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:3000/api/v1',
  PUBLIC_SITE_URL: 'http://localhost:3000',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  MONGODB_URI: 'mongodb://127.0.0.1:27017',
  MONGODB_DB_NAME: 'build',
  JWT_ACCESS_SECRET: 'build-phase-placeholder-secret-value-32ch',
  JWT_REFRESH_SECRET: 'build-phase-placeholder-secret-value-32ch',
  RAZORPAY_KEY_ID: 'rzp_test_build',
  RAZORPAY_KEY_SECRET: 'build-phase-placeholder',
  RAZORPAY_WEBHOOK_SECRET: 'build-phase-placeholder',
};

export function productionWarnings(value: ServerEnv): string[] {
  const warnings: string[] = [];

  if (value.ALLOWED_ORIGINS.length === 0) {
    warnings.push(
      'ALLOWED_ORIGINS is not set. Cross-origin requests are refused until it is.',
    );
  }

  if (value.STORAGE_PROVIDER === 'local' && !value.CDN_BASE_URL) {
    warnings.push(
      'STORAGE_PROVIDER=local without CDN_BASE_URL. On a host with an ephemeral ' +
        'filesystem, uploaded media is lost on every deploy. Set an object-storage ' +
        'provider (s3 / r2) before enabling uploads.',
    );
  }

  if (value.EMAIL_PROVIDER === 'none') {
    warnings.push('EMAIL_PROVIDER=none. Order confirmation emails are not being sent.');
  }

  return warnings;
}

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const building = isBuildPhase();

  const source = building
    ? { ...buildPhaseDefaults, ...process.env }
    : process.env;

  const parsed = withBlanksAsAbsent.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    const everythingMissing = parsed.error.issues.every((i) =>
      i.message.includes('received undefined'),
    );

    const hint = everythingMissing
      ? '\n\nEvery required variable is absent, which means no environment file was ' +
        'loaded at all rather than one being incomplete. Copy .env.example to ' +
        '.env.local in the project root and fill it in. On a hosting platform, set ' +
        'these in the project\'s environment settings and redeploy.'
      : '';

    throw new Error(`Invalid environment configuration:\n${issues}${hint}`);
  }

  const value = parsed.data;

  const placeholders = Object.entries(value)
    .filter(([, v]) => typeof v === 'string' && /<[a-z_-]+>/i.test(v))
    .map(([key]) => key);

  if (placeholders.length > 0) {
    throw new Error(
      `These variables still contain .env.example placeholders: ${placeholders.join(', ')}. ` +
        'Replace the <angle-bracket> parts with real values in .env.local.',
    );
  }

  if (value.NODE_ENV === 'production' && !building) {
    if (value.PAYMENTS_LIVE_MODE && value.RAZORPAY_KEY_ID.startsWith('rzp_test')) {
      throw new Error('PAYMENTS_LIVE_MODE=true but a Razorpay test key is configured');
    }

    for (const warning of productionWarnings(value)) {
      console.warn(`[config] ${warning}`);
    }
  }

  cached = value;
  return cached;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof ServerEnv];
  },
});