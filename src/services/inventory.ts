import type { ClientSession, Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import {
  InventoryMovement,
  InventoryReservation,
  Product,
  type IInventoryReservation,
} from '@/models';
import { outOfStock } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Stock lifecycle.
 *
 *   reserve  → availableQty--, reservedQty++     (checkout starts)
 *   commit   → reservedQty--,  stockQty--        (payment confirmed)
 *   release  → reservedQty--,  availableQty++    (cancelled / expired)
 *
 * Every step is a single conditional `updateOne`. There is no
 * read-check-write anywhere in this file, because between the read and the
 * write another request can take the last unit — which is exactly how an
 * oversell happens.
 */

export interface ReserveLine {
  productId: Types.ObjectId | string;
  variantId: Types.ObjectId | string;
  sku: string;
  quantity: number;
}

/**
 * Atomically holds stock for every line, or holds nothing.
 *
 * Partial reservations are rolled back explicitly: if line 3 of 5 fails,
 * lines 1 and 2 are released before the error propagates, so a failed
 * checkout never leaves stock stranded.
 *
 * `idempotencyKey` makes a retried request a no-op rather than a second
 * hold — the unique index on the reservation is the guard.
 */
export async function reserveStock(
  lines: ReserveLine[],
  idempotencyKey: string,
  session?: ClientSession,
): Promise<IInventoryReservation[]> {
  await connectDB();

  // A retry of the same checkout returns the existing holds untouched.
  const existing = await InventoryReservation.find({
    idempotencyKey: { $regex: `^${escapeRegex(idempotencyKey)}:` },
    status: 'held',
  }).session(session ?? null);

  if (existing.length === lines.length) {
    logger.info({ idempotencyKey }, 'Reservation already held — returning existing');
    return existing;
  }

  const taken: ReserveLine[] = [];
  const reservations: IInventoryReservation[] = [];

  try {
    for (const line of lines) {
      const result = await Product.updateOne(
        {
          _id: line.productId,
          variants: {
            $elemMatch: {
              _id: line.variantId,
              isActive: true,
              availableQty: { $gte: line.quantity },
            },
          },
        },
        {
          $inc: {
            'variants.$.reservedQty': line.quantity,
            'variants.$.availableQty': -line.quantity,
          },
        },
        { session },
      );

      // matchedCount === 0 means the predicate failed: either the variant
      // vanished or someone else took the stock a moment ago.
      if (result.matchedCount === 0) {
        throw outOfStock(`"${line.sku}" is no longer available in the requested quantity`, {
          sku: line.sku,
          requested: line.quantity,
        });
      }

      taken.push(line);

      const [reservation] = await InventoryReservation.create(
        [
          {
            product: line.productId,
            variantId: line.variantId,
            sku: line.sku,
            quantity: line.quantity,
            idempotencyKey: `${idempotencyKey}:${line.sku}`,
            status: 'held',
          },
        ],
        { session },
      );

      reservations.push(reservation);
    }

    return reservations;
  } catch (err) {
    // Roll back whatever was already held so the failure costs nothing.
    for (const line of taken) {
      await Product.updateOne(
        { _id: line.productId, 'variants._id': line.variantId },
        {
          $inc: {
            'variants.$.reservedQty': -line.quantity,
            'variants.$.availableQty': line.quantity,
          },
        },
        { session },
      ).catch((rollbackErr) => {
        // A failed rollback is a genuine inconsistency — loud, not silent.
        logger.error(
          { rollbackErr, sku: line.sku, idempotencyKey },
          'CRITICAL: reservation rollback failed, stock may be stranded',
        );
      });
    }
    await InventoryReservation.deleteMany({
      idempotencyKey: { $regex: `^${escapeRegex(idempotencyKey)}:` },
    }).catch(() => undefined);

    throw err;
  }
}

/**
 * Converts holds into real stock depletion. Called only after payment is
 * confirmed server-side (or a COD order is accepted).
 */
export async function commitReservations(
  orderId: Types.ObjectId | string,
  idempotencyKey: string,
  session?: ClientSession,
): Promise<void> {
  await connectDB();

  const held = await InventoryReservation.find({
    idempotencyKey: { $regex: `^${escapeRegex(idempotencyKey)}:` },
    status: 'held',
  }).session(session ?? null);

  for (const reservation of held) {
    const result = await Product.findOneAndUpdate(
      { _id: reservation.product, 'variants._id': reservation.variantId },
      {
        $inc: {
          'variants.$.reservedQty': -reservation.quantity,
          'variants.$.stockQty': -reservation.quantity,
        },
      },
      { new: true, session },
    );

    const variant = result?.variants.find((v) => v._id.equals(reservation.variantId));

    await InventoryMovement.create(
      [
        {
          product: reservation.product,
          variantId: reservation.variantId,
          sku: reservation.sku,
          delta: -reservation.quantity,
          balanceAfter: variant?.stockQty ?? 0,
          reason: 'order_committed',
          order: orderId,
          reservation: reservation._id,
        },
      ],
      { session },
    );

    reservation.status = 'committed';
    reservation.order = orderId as Types.ObjectId;
    reservation.committedAt = new Date();
    await reservation.save({ session });
  }

  logger.info({ orderId, count: held.length }, 'Reservations committed');
}

/** Returns held stock to the available pool (cancellation, payment failure). */
export async function releaseReservations(
  idempotencyKey: string,
  reason: 'order_cancelled' | 'reservation_expired' = 'order_cancelled',
  session?: ClientSession,
): Promise<number> {
  await connectDB();

  const held = await InventoryReservation.find({
    idempotencyKey: { $regex: `^${escapeRegex(idempotencyKey)}:` },
    status: 'held',
  }).session(session ?? null);

  for (const reservation of held) {
    await Product.updateOne(
      { _id: reservation.product, 'variants._id': reservation.variantId },
      {
        $inc: {
          'variants.$.reservedQty': -reservation.quantity,
          'variants.$.availableQty': reservation.quantity,
        },
      },
      { session },
    );

    reservation.status = reason === 'reservation_expired' ? 'expired' : 'released';
    reservation.releasedAt = new Date();
    await reservation.save({ session });
  }

  return held.length;
}

/**
 * Sweeper for holds whose checkout never completed.
 *
 * The reservation document carries a TTL index, but TTL deletion would
 * remove the row WITHOUT returning the stock. This job must therefore run
 * more frequently than the TTL window (every 5 minutes against a 20-minute
 * hold) so stock is restored before the record disappears.
 */
export async function releaseExpiredReservations(): Promise<number> {
  await connectDB();

  const expired = await InventoryReservation.find({
    status: 'held',
    expiresAt: { $lt: new Date() },
  }).limit(500);

  let restored = 0;

  for (const reservation of expired) {
    const result = await Product.findOneAndUpdate(
      { _id: reservation.product, 'variants._id': reservation.variantId },
      {
        $inc: {
          'variants.$.reservedQty': -reservation.quantity,
          'variants.$.availableQty': reservation.quantity,
        },
      },
      { new: true },
    );

    const variant = result?.variants.find((v) => v._id.equals(reservation.variantId));

    await InventoryMovement.create({
      product: reservation.product,
      variantId: reservation.variantId,
      sku: reservation.sku,
      delta: reservation.quantity,
      balanceAfter: variant?.stockQty ?? 0,
      reason: 'reservation_expired',
      reservation: reservation._id,
      note: 'Checkout abandoned; hold returned to available stock',
    });

    reservation.status = 'expired';
    reservation.releasedAt = new Date();
    await reservation.save();
    restored += 1;
  }

  if (restored > 0) {
    logger.info({ restored }, 'Expired reservations released');
  }
  return restored;
}

/** Manual adjustment from the admin dashboard. Always leaves a ledger row. */
export async function adjustStock(params: {
  productId: Types.ObjectId | string;
  variantId: Types.ObjectId | string;
  sku: string;
  delta: number;
  reason: 'purchase_received' | 'manual_adjustment' | 'damage_writeoff' | 'stock_count_correction';
  performedBy: Types.ObjectId | string;
  note?: string;
}): Promise<number> {
  await connectDB();
  const { productId, variantId, sku, delta, reason, performedBy, note } = params;

  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error('Stock adjustment must be a non-zero integer');
  }

  const updated = await Product.findOneAndUpdate(
    {
      _id: productId,
      variants: {
        $elemMatch: {
          _id: variantId,
          // A negative adjustment must not push available stock below zero.
          ...(delta < 0 ? { availableQty: { $gte: -delta } } : {}),
        },
      },
    },
    { $inc: { 'variants.$.stockQty': delta, 'variants.$.availableQty': delta } },
    { new: true },
  );

  if (!updated) {
    throw outOfStock(`Cannot reduce stock for ${sku} below the quantity already reserved`);
  }

  const variant = updated.variants.find((v) => v._id.equals(variantId));

  await InventoryMovement.create({
    product: productId,
    variantId,
    sku,
    delta,
    balanceAfter: variant?.stockQty ?? 0,
    reason,
    performedBy,
    note,
  });

  return variant?.stockQty ?? 0;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
