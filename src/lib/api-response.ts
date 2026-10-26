import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError, isAppError } from './errors';
import { logger } from './logger';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function ok<T>(
  data: T,
  init: { status?: number; meta?: unknown; headers?: HeadersInit } = {},
) {
  const { status = 200, meta, headers } = init;
  return NextResponse.json(
    meta === undefined ? { success: true, data } : { success: true, data, meta },
    { status, headers },
  );
}

export function created<T>(data: T, headers?: HeadersInit) {
  return ok(data, { status: 201, headers });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(items: T[], meta: PaginationMeta) {
  return ok(items, { meta });
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

function requestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}`;
}

export function handleError(err: unknown, context?: Record<string, unknown>) {
  const id = requestId();

  if (isAppError(err)) {
    logger.warn({ ...context, requestId: id, code: err.code, msg: err.message }, 'Request failed');
    return NextResponse.json(
      {
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
        requestId: id,
      },
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      field: i.path.join('.') || '(root)',
      message: i.message,
    }));
    logger.warn({ ...context, requestId: id, details }, 'Validation failed');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Invalid request data', details },
        requestId: id,
      },
      { status: 422 },
    );
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    logger.warn({ ...context, requestId: id, details }, 'Model validation failed');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Invalid data', details },
        requestId: id,
      },
      { status: 422 },
    );
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  ) {
    const keyPattern = (err as { keyPattern?: Record<string, number> }).keyPattern ?? {};
    const field = Object.keys(keyPattern)[0] ?? 'field';
    logger.warn({ ...context, requestId: id, field }, 'Duplicate key');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'CONFLICT', message: `A record with this ${field} already exists` },
        requestId: id,
      },
      { status: 409 },
    );
  }

  logger.error({ ...context, requestId: id, err }, 'Unhandled error');
  return NextResponse.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      requestId: id,
    },
    { status: 500 },
  );
}

export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleError(err);
    }
  };
}

export { AppError };
