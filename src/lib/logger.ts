import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'confirmPassword',
      '*.password',
      '*.passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      '*.token',
      'authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'SHIPROCKET_PASSWORD',
      'razorpay_signature',
      'cardNumber',
      'cvv',
    ],
    censor: '[REDACTED]',
  },
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
});

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
