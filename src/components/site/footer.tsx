import Link from 'next/link';

const COLUMNS = [
  {
    heading: 'Catalogue',
    links: [
      { label: 'All products', href: '/products' },
      { label: 'Grains', href: '/products?category=grains' },
      { label: 'Pulses', href: '/products?category=pulses' },
      { label: 'Seeds', href: '/products?category=seeds' },
      { label: 'Combo packs', href: '/products?category=combo-packs' },
    ],
  },
  {
    heading: 'The mill',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Milling', href: '/manufacturing' },
      { label: 'Grading', href: '/quality' },
      { label: 'Bulk & wholesale', href: '/bulk-orders' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Terms',
    links: [
      { label: 'Shipping', href: '/policies/shipping' },
      { label: 'Returns and refunds', href: '/policies/returns' },
      { label: 'Privacy', href: '/policies/privacy' },
      { label: 'Terms of sale', href: '/policies/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--hairline)] bg-[var(--bg-raised)]">
      <div className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-12">
          <div>
            <p className="display text-[1.8rem] leading-none text-[var(--fg)]">Avantika</p>
            <p className="mt-2 text-spec text-[var(--fg-faint)]">
              Grain Mills Private Limited
            </p>
            <address className="measure mt-6 text-spec not-italic leading-relaxed text-[var(--fg-muted)]">
              Gram Navda Dhar Road, Navdapanth, Kalaria,
              <br />
              Depalpur, Indore, Madhya Pradesh 453001
            </address>
            <a
              href="mailto:avantikagrain@gmail.com"
              className="mt-4 inline-block text-spec text-[var(--accent)] underline decoration-1 underline-offset-4"
            >
              avantikagrain@gmail.com
            </a>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-labelledby={`footer-${column.heading}`}>
              <h2
                id={`footer-${column.heading}`}
                className="label"
              >
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-spec text-[var(--fg-muted)] transition-colors duration-[var(--t-fast)] hover:text-[var(--accent-bright)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-[var(--hairline)] pt-6">
          <p className="text-spec text-[var(--fg-faint)]">
            © {new Date().getFullYear()} Avantika Grain Mills Private Limited
          </p>
          {/* FSSAI licence number is statutory on a food retailer's site and
              is rendered here from store settings once the business supplies
              it. It is deliberately absent rather than a placeholder. */}
          <p className="text-spec text-[var(--fg-faint)]">
            Prices inclusive of GST
          </p>
        </div>
      </div>
    </footer>
  );
}
