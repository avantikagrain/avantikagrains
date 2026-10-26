'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasAnyPermission, type Permission, type UserRole } from '@/lib/auth/rbac';

interface NavItem {
  href: string;
  label: string;
  permissions: Permission[];
}

const ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', permissions: ['order:read', 'product:read'] },
  { href: '/admin/orders', label: 'Orders', permissions: ['order:read'] },
  { href: '/admin/products', label: 'Catalogue', permissions: ['product:read'] },
  { href: '/admin/enquiries', label: 'Enquiries', permissions: ['customer:read'] },
  { href: '/admin/customers', label: 'Customers', permissions: ['customer:read'] },
];

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections">
      <ul className="flex flex-wrap items-center gap-1">
        {ITEMS.filter((item) => hasAnyPermission(role, item.permissions)).map((item) => {
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-block rounded-[var(--radius-control)] px-3 py-1.5 text-spec transition-colors duration-[var(--t-fast)] ${
                  active
                    ? 'bg-[var(--color-forest-100)] font-medium text-[var(--accent)]'
                    : 'text-[var(--fg-muted)] hover:bg-[var(--bg-sunken)] hover:text-[var(--accent)]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
