export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'PRICE_CHANGED'
  | 'COUPON_INVALID'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFICATION_FAILED'
  | 'SHIPPING_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  OUT_OF_STOCK: 409,
  PRICE_CHANGED: 409,
  COUPON_INVALID: 422,
  PAYMENT_FAILED: 402,
  PAYMENT_VERIFICATION_FAILED: 400,
  SHIPPING_UNAVAILABLE: 422,
  RATE_LIMITED: 429,
  IDEMPOTENCY_CONFLICT: 409,
  UPSTREAM_ERROR: 502,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (m: string, d?: unknown) => new AppError('BAD_REQUEST', m, d);
export const notFound = (m = 'Resource not found') => new AppError('NOT_FOUND', m);
export const unauthenticated = (m = 'Authentication required') =>
  new AppError('UNAUTHENTICATED', m);
export const forbidden = (m = 'You do not have permission to perform this action') =>
  new AppError('FORBIDDEN', m);
export const conflict = (m: string, d?: unknown) => new AppError('CONFLICT', m, d);
export const outOfStock = (m = 'Insufficient stock', d?: unknown) =>
  new AppError('OUT_OF_STOCK', m, d);
export const internal = (m = 'Something went wrong') => new AppError('INTERNAL_ERROR', m);

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
