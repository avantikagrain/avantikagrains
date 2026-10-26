import type { NextRequest } from 'next/server';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { created, route } from '@/lib/api-response';
import { connectDB } from '@/lib/db';
import { BulkEnquiry, ENQUIRY_PURPOSES } from '@/models';
import { AppError } from '@/lib/errors';
import { phoneSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required').max(160),
  contactName: z.string().trim().min(2, 'Your name is required').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: phoneSchema,
  city: z.string().trim().min(2, 'City is required').max(80),
  purpose: z.enum(ENQUIRY_PURPOSES),
  productsNeeded: z.string().trim().min(3, 'Tell us which products you need').max(600),
  estimatedMonthlyVolume: z.string().trim().max(120).optional(),
  packFormat: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),

  website: z.string().max(0).optional(),
});

const reference = customAlphabet('23456789ABCDEFGHJKMNPQRSTUVWXYZ', 6);

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 3;

export const POST = route(async (request: NextRequest) => {
  const body = await request.json();
  const input = schema.parse(body);

  if (input.website) {
    logger.warn('Bulk enquiry honeypot triggered');

    return created({ reference: `AG-BLK-${reference()}`, accepted: true });
  }

  await connectDB();

  const recent = await BulkEnquiry.countDocuments({
    phone: input.phone,
    createdAt: { $gte: new Date(Date.now() - RATE_WINDOW_MS) },
  });

  if (recent >= RATE_LIMIT) {
    throw new AppError(
      'RATE_LIMITED',
      'We already have a recent enquiry from this number. We will be in touch shortly.',
    );
  }

  const enquiry = await BulkEnquiry.create({
    ...input,
    website: undefined,
    reference: `AG-BLK-${reference()}`,
    status: 'new',

    submittedIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  });

  logger.info({ reference: enquiry.reference, purpose: enquiry.purpose }, 'Bulk enquiry received');

  return created({ reference: enquiry.reference, accepted: true });
});
