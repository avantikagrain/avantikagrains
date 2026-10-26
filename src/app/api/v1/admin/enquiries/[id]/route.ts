import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, route } from '@/lib/api-response';
import { requirePermission } from '@/lib/auth/session';
import { notFound } from '@/lib/errors';
import { connectDB } from '@/lib/db';
import { BulkEnquiry, ENQUIRY_STATUSES } from '@/models';
import { objectIdSchema } from '@/lib/validation';
import { recordAudit } from '@/services/admin-audit';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});

export const PATCH = route(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const actor = await requirePermission('customer:write');
    const { id } = await context.params;
    const enquiryId = objectIdSchema.parse(id);
    const input = bodySchema.parse(await request.json());

    await connectDB();

    const enquiry = await BulkEnquiry.findById(enquiryId);
    if (!enquiry) throw notFound('Enquiry not found');

    const changes: { field: string; before: unknown; after: unknown }[] = [];

    if (input.status && input.status !== enquiry.status) {
      changes.push({ field: 'status', before: enquiry.status, after: input.status });
      enquiry.status = input.status;
      enquiry.handledBy = actor.id as never;
      if (input.status !== 'new' && !enquiry.respondedAt) {
        enquiry.respondedAt = new Date();
      }
    }

    if (input.internalNote !== undefined && input.internalNote !== enquiry.internalNote) {
      changes.push({
        field: 'internalNote',
        before: enquiry.internalNote ?? '',
        after: input.internalNote,
      });
      enquiry.internalNote = input.internalNote;
    }

    if (changes.length === 0) {
      return ok({ id: String(enquiry._id), status: enquiry.status });
    }

    await enquiry.save();

    await recordAudit({
      actor,
      action: 'enquiry.update',
      resourceType: 'BulkEnquiry',
      resourceId: enquiry.reference,
      changes,
      outcome: 'success',
      request,
    });

    return ok({ id: String(enquiry._id), status: enquiry.status });
  },
);
