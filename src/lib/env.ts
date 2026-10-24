/**
 * Startup environment validation.
 *
 * Fail fast: if required configuration is missing or malformed the process
 * must not boot. Never import this file from a client component — it would
 * pull server secrets into the browser bundle.
 */
import { z } from 'zod';

const boolish = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // URLs
  CLIENT_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  PUBLIC_SITE_URL: z.string().url(),
  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  // Database
  MONGODB_URI: z.string().startsWith('mongodb'),
  MONGODB_DB_NAME: z.string().min(1),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  COOKIE_DOMAIN: z.string().optional(),

  // Payments — Razorpay
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  // Shipping — Shiprocket
  SHIPROCKET_EMAIL: z.string().email().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_WEBHOOK_TOKEN: z.string().optional(),

  // Media storage
  STORAGE_PROVIDER: z.enum(['s3', 'r2', 'local']).default('local'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  CDN_BASE_URL: z.string().url().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(['resend', 'ses', 'smtp', 'none']).default('none'),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Stock imagery (development/demo only — see fetch-unsplash-images.ts)
  UNSPLASH_ACCESS_KEY: z.string().optional(),

  /**
   * Lets products publish in production while still carrying stand-in
   * imagery. A deliberate business decision, so it must be set explicitly;
   * the FSSAI guard has no equivalent override.
   */
  ALLOW_PLACEHOLDER_IMAGES: boolish.default(false),

  // Observability
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  SENTRY_DSN: z.string().optional(),

  // Commerce toggles
  // Zod 4: .default() on a transformed schema takes the OUTPUT type.
  PAYMENTS_LIVE_MODE: boolish.default(false),
  COD_ENABLED: boolish.default(true),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * A variable missing from the .env file arrives as `undefined`, but a key
 * written with no value (`CDN_BASE_URL=`, as .env.example ships it) arrives
 * as an empty string. Both mean "not configured", yet `.optional()` only
 * accepts the first — so `.email()` and `.url()` reject the blank form.
 *
 * Stripping empty values before validation makes the two equivalent. It
 * also stops a half-filled setting (STORAGE_PROVIDER=s3 with
 * STORAGE_BUCKET=) from passing as present-but-empty.
 */
const withBlanksAsAbsent = z.preprocess((raw) => {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value !== '') cleaned[key] = value;
  }
  return cleaned;
}, serverSchema);

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = withBlanksAsAbsent.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const value = parsed.data;

  // Unreplaced .env.example placeholders pass schema validation (a URI with
  // `<cluster>` in it still startsWith "mongodb"), then fail much later as an
  // opaque DNS error — `querySrv EBADNAME`. Catch them here instead.
  const placeholders = Object.entries(value)
    .filter(([, v]) => typeof v === 'string' && /<[a-z_-]+>/i.test(v))
    .map(([key]) => key);

  if (placeholders.length > 0) {
    throw new Error(
      `These variables still contain .env.example placeholders: ${placeholders.join(', ')}. ` +
        'Replace the <angle-bracket> parts with real values in .env.local.',
    );
  }

  // Production guards — these must never pass silently.
  if (value.NODE_ENV === 'production') {
    if (value.ALLOWED_ORIGINS.length === 0) {
      throw new Error('ALLOWED_ORIGINS must be set explicitly in production');
    }
    if (value.STORAGE_PROVIDER === 'local') {
      throw new Error('STORAGE_PROVIDER=local is not permitted in production');
    }
    if (value.PAYMENTS_LIVE_MODE && value.RAZORPAY_KEY_ID.startsWith('rzp_test')) {
      throw new Error('PAYMENTS_LIVE_MODE=true but a Razorpay test key is configured');
    }
  }

  cached = value;
  return cached;
}

/** Lazy accessor so importing this module never throws at import time. */
export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof ServerEnv];
  },
});
