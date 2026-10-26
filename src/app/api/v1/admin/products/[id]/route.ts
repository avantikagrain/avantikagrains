import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, route } from '@/lib/api-response';
import { requirePermission } from '@/lib/auth/session';
import { badRequest, notFound } from '@/lib/errors';
import { connectDB } from '@/lib/db';
import { PRODUCT_STATUSES, Product } from '@/models';
import { objectIdSchema } from '@/lib/validation';
import { recordAudit } from '@/services/admin-audit';

export const dynamic = 'force-dynamic';

const variantUpdateSchema = z.object({
  variantId: objectIdSchema,
  pricePaise: z.number().int().min(1).optional(),
  mrpPaise: z.number().int().min(1).optional(),
  stockQty: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const bodySchema = z.object({
  status: z.enum(PRODUCT_STATUSES).optional(),
  isFeatured: z.boolean().optional(),
  variants: z.array(variantUpdateSchema).max(20).optional(),
});

export const PATCH = route(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const actor = await requirePermission('product:write');
    const { id } = await context.params;
    const productId = objectIdSchema.parse(id);
    const input = bodySchema.parse(await request.json());

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) throw notFound('Product not found');

    const changes: { field: string; before: unknown; after: unknown }[] = [];

    if (input.status && input.status !== product.status) {
      changes.push({ field: 'status', before: product.status, after: input.status });
      product.status = input.status;
    }

    if (input.isFeatured !== undefined && input.isFeatured !== product.isFeatured) {
      changes.push({
        field: 'isFeatured',
        before: product.isFeatured,
        after: input.isFeatured,
      });
      product.isFeatured = input.isFeatured;
    }

    for (const update of input.variants ?? []) {
      const variant = product.variants.find((v) => String(v._id) === update.variantId);
      if (!variant) throw badRequest('One of the pack sizes no longer exists');

      if (update.pricePaise !== undefined && update.pricePaise !== variant.pricePaise) {
        changes.push({
          field: `${variant.sku}.pricePaise`,
          before: variant.pricePaise,
          after: update.pricePaise,
        });
        variant.pricePaise = update.pricePaise;
      }

      if (update.mrpPaise !== undefined && update.mrpPaise !== variant.mrpPaise) {
        changes.push({
          field: `${variant.sku}.mrpPaise`,
          before: variant.mrpPaise,
          after: update.mrpPaise,
        });
        variant.mrpPaise = update.mrpPaise;
      }

      if (update.stockQty !== undefined && update.stockQty !== variant.stockQty) {
        if (update.stockQty < variant.reservedQty) {
          throw badRequest(
            `${variant.sku}: stock cannot be set below the ${variant.reservedQty} units already reserved against open orders`,
          );
        }
        changes.push({
          field: `${variant.sku}.stockQty`,
          before: variant.stockQty,
          after: update.stockQty,
        });
        variant.stockQty = update.stockQty;

        variant.availableQty = update.stockQty - variant.reservedQty;
      }

      if (
        update.lowStockThreshold !== undefined &&
        update.lowStockThreshold !== variant.lowStockThreshold
      ) {
        changes.push({
          field: `${variant.sku}.lowStockThreshold`,
          before: variant.lowStockThreshold,
          after: update.lowStockThreshold,
        });
        variant.lowStockThreshold = update.lowStockThreshold;
      }

      if (update.isActive !== undefined && update.isActive !== variant.isActive) {
        changes.push({
          field: `${variant.sku}.isActive`,
          before: variant.isActive,
          after: update.isActive,
        });
        variant.isActive = update.isActive;
      }
    }

    if (changes.length === 0) {
      return ok({ id: String(product._id), status: product.status });
    }

    await product.save();

    await recordAudit({
      actor,
      action: 'product.update',
      resourceType: 'Product',
      resourceId: product.slug,
      changes,
      outcome: 'success',
      request,
    });

    return ok({ id: String(product._id), status: product.status, updated: changes.length });
  },
);
