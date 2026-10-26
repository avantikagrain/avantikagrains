import type { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AdminAuditLog } from '@/models';
import { logger } from '@/lib/logger';
import type { SessionUser } from '@/lib/auth/session';

export interface AuditInput {
  actor: SessionUser;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: { field: string; before: unknown; after: unknown }[];
  outcome: 'success' | 'denied' | 'error';
  reason?: string;
  request?: NextRequest;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await connectDB();
    await AdminAuditLog.create({
      actor: input.actor.id,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      changes: input.changes,
      outcome: input.outcome,
      reason: input.reason,
      ipAddress:
        input.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: input.request?.headers.get('user-agent') ?? undefined,
    });
  } catch (err) {
    logger.error({ err, action: input.action }, 'Failed to write audit log');
  }
}
