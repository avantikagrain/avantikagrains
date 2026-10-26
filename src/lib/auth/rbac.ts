export const USER_ROLES = [
  'customer',
  'support',
  'catalogue',
  'manager',
  'admin',
  'owner',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: readonly UserRole[] = [
  'support',
  'catalogue',
  'manager',
  'admin',
  'owner',
];

export type Permission =
  | 'product:read' | 'product:write'
  | 'inventory:read' | 'inventory:write'
  | 'order:read' | 'order:write' | 'order:cancel'
  | 'customer:read' | 'customer:write'
  | 'payment:read'
  | 'refund:request' | 'refund:approve'
  | 'coupon:read' | 'coupon:write'
  | 'shipment:read' | 'shipment:write'
  | 'content:write'
  | 'report:read'
  | 'audit:read'
  | 'settings:read' | 'settings:write'
  | 'integration:write'
  | 'role:grant';

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: [],

  support: ['order:read', 'customer:read', 'payment:read', 'shipment:read', 'product:read'],

  catalogue: [
    'product:read', 'product:write',
    'inventory:read', 'inventory:write',
    'content:write',
  ],

  manager: [
    'product:read', 'product:write',
    'inventory:read', 'inventory:write',
    'order:read', 'order:write', 'order:cancel',
    'customer:read', 'customer:write',
    'payment:read',
    'refund:request',
    'coupon:read', 'coupon:write',
    'shipment:read', 'shipment:write',
    'content:write',
    'report:read',
  ],

  admin: [
    'product:read', 'product:write',
    'inventory:read', 'inventory:write',
    'order:read', 'order:write', 'order:cancel',
    'customer:read', 'customer:write',
    'payment:read',
    'refund:request', 'refund:approve',
    'coupon:read', 'coupon:write',
    'shipment:read', 'shipment:write',
    'content:write',
    'report:read',
    'audit:read',
    'settings:read', 'settings:write',
  ],

  owner: [
    'product:read', 'product:write',
    'inventory:read', 'inventory:write',
    'order:read', 'order:write', 'order:cancel',
    'customer:read', 'customer:write',
    'payment:read',
    'refund:request', 'refund:approve',
    'coupon:read', 'coupon:write',
    'shipment:read', 'shipment:write',
    'content:write',
    'report:read',
    'audit:read',
    'settings:read', 'settings:write',
    'integration:write',
    'role:grant',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function permissionsFor(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
