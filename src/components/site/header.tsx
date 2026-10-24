'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/components/cart/cart-store';

const NAV = [
  { label: 'Products', href: '/products' },
  { label: 'Manufacturing', href: '/manufacturing' },
  { label: 'Quality', href: '/quality' },
  { label: 'About', href: '/about' },
  { label: 'Bulk', href: '/bulk-orders' },
];

export function Header() {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /**
   * Close the mobile menu whenever the route changes.
   *
   * Adjusted during render rather than in an effect: an effect would paint
   * the new page once with the menu still covering it, and this also
   * catches a browser Back, which an onClick on the links would miss.
   * This is React's documented pattern for resetting state when a value
   * changes — the extra render it schedules happens before the browser
   * paints, so the menu is never seen open on the new page.
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-[var(--t-base)] ${
        scrolled || open
          ? 'glass !rounded-none shadow-[var(--shadow-soft)]'
          : 'bg-[var(--bg)]'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[86rem] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[var(--color-forest-100)] transition-colors duration-[var(--t-base)] group-hover:bg-[var(--gold-soft)]"
          >
            <WheatMark />
          </span>
          <span className="leading-none">
            <span className="display block text-[1.15rem] text-[var(--accent)]">
              Avantika
            </span>
            <span className="mt-0.5 block text-micro tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
              GRAIN MILLS
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative text-spec transition-colors duration-[var(--t-fast)] after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:rounded-full after:bg-[var(--gold)] after:transition-[width] after:duration-[var(--t-base)] after:ease-[var(--ease-lux)] hover:text-[var(--accent)] hover:after:w-full ${
                      active
                        ? 'font-medium text-[var(--accent)] after:w-full'
                        : 'text-[var(--fg-muted)] after:w-0'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-8">
          <Link href="/contact" className="btn btn-outline hidden !h-10 !px-5 !text-micro md:inline-flex">
            Let&rsquo;s talk
          </Link>

          <Link
            // Orders, not the sign-in form: the page redirects an anonymous
            // visitor to sign in and carries them back here afterwards, so a
            // signed-in customer skips a step instead of landing on a form
            // they do not need.
            href="/account/orders"
            aria-label="Your account"
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--fg-muted)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--color-forest-100)] hover:text-[var(--accent)]"
          >
            <User size={19} strokeWidth={1.6} />
          </Link>

          <Link
            href="/cart"
            aria-label={
              ready && count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'
            }
            className="relative grid h-11 w-11 place-items-center rounded-full text-[var(--fg-muted)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--color-forest-100)] hover:text-[var(--accent)]"
          >
            <ShoppingBag size={19} strokeWidth={1.6} />
            {/* Only after mount: the server renders no cart, so an earlier
                render would mismatch during hydration. */}
            {ready && count > 0 && (
              <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-semibold text-[var(--color-forest-900)]">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="nav-panel"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--fg)] lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-transform duration-[var(--t-base)] ease-[var(--ease-lux)] ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-transform duration-[var(--t-base)] ease-[var(--ease-lux)] ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="nav-panel"
          aria-label="Mobile"
          className="border-t border-[var(--hairline)] bg-[var(--bg-raised)] lg:hidden"
        >
          <ul className="mx-auto max-w-[86rem] px-4 pb-4 sm:px-6">
            {[...NAV, { label: "Let's talk", href: '/contact' }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-b border-[var(--hairline)] py-4 text-body text-[var(--fg)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

/** Wheat-ear mark. Replace with public/brand/logo-mark.svg when supplied. */
function WheatMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 22V9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse
            cx="8.6"
            cy={8 + i * 3.4}
            rx="2.5"
            ry="1.5"
            transform={`rotate(-38 8.6 ${8 + i * 3.4})`}
            fill={i % 2 === 0 ? 'var(--accent)' : 'var(--gold)'}
            opacity={0.95 - i * 0.1}
          />
          <ellipse
            cx="15.4"
            cy={8 + i * 3.4}
            rx="2.5"
            ry="1.5"
            transform={`rotate(38 15.4 ${8 + i * 3.4})`}
            fill={i % 2 === 0 ? 'var(--accent)' : 'var(--gold)'}
            opacity={0.95 - i * 0.1}
          />
        </g>
      ))}
      <path d="M12 7.5V3.8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
