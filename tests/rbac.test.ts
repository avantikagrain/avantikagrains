import { describe, it, expect } from 'vitest';
import { hasPermission, isStaff, permissionsFor } from '@/lib/auth/rbac';
import { ALLOWED_TRANSITIONS, canTransition, ORDER_STATUSES } from '@/models/Order';

describe('role permissions', () => {
  it('gives a customer no staff permissions at all', () => {
    expect(permissionsFor('customer')).toHaveLength(0);
    expect(isStaff('customer')).toBe(false);
    expect(hasPermission('customer', 'order:read')).toBe(false);
  });

  it('keeps gateway credentials and role grants owner-only', () => {
    for (const role of ['support', 'catalogue', 'manager', 'admin'] as const) {
      expect(hasPermission(role, 'integration:write')).toBe(false);
      expect(hasPermission(role, 'role:grant')).toBe(false);
    }
    expect(hasPermission('owner', 'integration:write')).toBe(true);
    expect(hasPermission('owner', 'role:grant')).toBe(true);
  });

  it('lets a manager request but not approve a refund', () => {
    expect(hasPermission('manager', 'refund:request')).toBe(true);
    expect(hasPermission('manager', 'refund:approve')).toBe(false);
    expect(hasPermission('admin', 'refund:approve')).toBe(true);
  });

  it('keeps support read-only over orders', () => {
    expect(hasPermission('support', 'order:read')).toBe(true);
    expect(hasPermission('support', 'order:write')).toBe(false);
    expect(hasPermission('support', 'product:write')).toBe(false);
  });

  it('does not let the catalogue role touch orders or money', () => {
    expect(hasPermission('catalogue', 'product:write')).toBe(true);
    expect(hasPermission('catalogue', 'order:write')).toBe(false);
    expect(hasPermission('catalogue', 'payment:read')).toBe(false);
  });
});

describe('order status machine', () => {
  it('covers every declared status', () => {
    for (const status of ORDER_STATUSES) {
      expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('allows the normal fulfilment path', () => {
    const path = [
      'pending_payment',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
    ] as const;

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('refuses to skip fulfilment steps', () => {
    expect(canTransition('pending_payment', 'delivered')).toBe(false);
    expect(canTransition('confirmed', 'shipped')).toBe(false);
    expect(canTransition('processing', 'delivered')).toBe(false);
  });

  it('refuses to move backwards', () => {
    expect(canTransition('shipped', 'confirmed')).toBe(false);
    expect(canTransition('delivered', 'processing')).toBe(false);
  });

  it('treats refunded as terminal', () => {
    expect(ALLOWED_TRANSITIONS.refunded).toHaveLength(0);
  });

  it('cannot cancel an order that has already been delivered', () => {
    expect(canTransition('delivered', 'cancelled')).toBe(false);
    expect(canTransition('out_for_delivery', 'cancelled')).toBe(false);
  });

  it('allows a refund only after cancellation or return', () => {
    expect(canTransition('cancelled', 'refunded')).toBe(true);
    expect(canTransition('returned', 'refunded')).toBe(true);
    expect(canTransition('delivered', 'refunded')).toBe(false);
  });
});
