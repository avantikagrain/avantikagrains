import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/product/product-card';
import { listCategories, listProducts } from '@/server/catalogue';

export const revalidate = 3600;

/**
 * Finished artwork for the unfiltered collection page.
 *
 * Lowercase and hyphenated on purpose: a filename with spaces has to be
 * percent-encoded in the URL, and one stray un-encoded space is a 404 that
 * only shows up in production.
 */
const COLLECTION_BANNER = '/brand/collection-banner.png';

export const metadata: Metadata = {
  title: 'Grains',
  description:
    'Heritage cereals, pulses and super seeds from Avantika Grain Mills — optically graded and cold-milled at Depalpur, Indore.',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [{ items, total, limit }, categories] = await Promise.all([
    listProducts({ categorySlug: params.category, page, limit: 24 }),
    listCategories(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const active = params.category;
  const activeName = categories.find((c) => c.slug === active)?.name;

  return (
    <>
      {activeName ? (
        /*
          A filtered view — Grains, Pulses, Seeds.

          The artwork below says "The collection" and counts thirty-one
          products, both of which are wrong once a filter is on. So a
          filtered page gets the plain wheat texture instead and sets its
          own heading over it. `hero.webp` carries no type of its own,
          which is exactly why it can.
        */
        <header className="relative isolate overflow-hidden">
          <Image
            src="/brand/hero.webp"
            alt=""
            fill
            sizes="100vw"
            priority
            quality={82}
            className="-z-10 object-cover"
          />

          {/*
            Scrim. Cream type over a mid-tone photograph fails contrast
            without one, and the gradient is weighted to the bottom because
            that is where the text sits — a flat overlay would mute the
            photograph everywhere to fix one corner of it.
          */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(14_38_25/0.88)] via-[rgb(14_38_25/0.6)] to-[rgb(14_38_25/0.3)]"
          />

          <div className="mx-auto max-w-[86rem] px-5 pb-12 pt-36 sm:px-8 sm:pb-16 sm:pt-44">
            <h1 className="display text-h1 text-[var(--color-cream-50)]">{activeName}</h1>
            <p className="measure mt-6 text-lead leading-relaxed text-[var(--color-cream-100)]/85">
              {activeName} milled and packed at Depalpur.
            </p>
          </div>
        </header>
      ) : (
        /*
          The unfiltered collection page, which has its own finished
          artwork.

          The headline, the standfirst and the four badges are drawn into
          the image, so nothing is written over it — an HTML heading on top
          would simply say the same thing twice. The page still needs a real
          h1 for search engines and screen readers, so one is rendered and
          hidden visually, and the image carries alt text that says what the
          artwork says rather than what it looks like.

          Two ratios, for the same reason as the homepage hero: shown whole
          at 390px this is about 180px tall and its type is unreadable.
          Everything that matters sits in the left portion of the artwork,
          so phones get a 1.15:1 window anchored there.
        */
        <header className="bg-[var(--bg-sunken)] pt-20 sm:pt-24">
          <h1 className="sr-only">The collection</h1>
          <div className="relative aspect-[1.15/1] sm:aspect-[1840/855]">
            <Image
              src={COLLECTION_BANNER}
              alt="The collection — thirty-one products across cereals, pulses, seeds and curated boxes, each graded on the same line, to the same threshold. 100% natural, healthy families, premium quality, pan-India delivery."
              fill
              sizes="100vw"
              // The banner is the page's LCP element, so it must not wait
              // for layout to discover it.
              priority
              quality={82}
              className="object-cover object-left sm:object-center"
            />
          </div>
        </header>
      )}

      {/*
        Filters sit below the banner on a solid ground rather than on the
        photograph. They are controls, and a control that has to be read
        against moving texture is harder to use than one that does not.
      */}
      <nav
        aria-label="Categories"
        className="border-b border-[var(--hairline)] bg-[var(--bg-raised)]"
      >
        <div className="mx-auto max-w-[86rem] px-5 py-4 sm:px-8">
          <ul className="flex flex-wrap items-baseline gap-x-7 gap-y-3">
            <li>
              <Filter href="/products" label="Everything" active={!active} />
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Filter
                  href={`/products?category=${category.slug}`}
                  label={category.name}
                  active={active === category.slug}
                />
              </li>
            ))}
            <li className="ml-auto tabular-nums text-spec text-[var(--fg-faint)]">
              {total} {total === 1 ? 'product' : 'products'}
            </li>
          </ul>
        </div>
      </nav>

      <div className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 sm:py-16">
        {items.length === 0 ? (
          <div className="border border-dashed border-[var(--hairline-strong)] p-12">
            <p className="text-[var(--fg-muted)]">
              Nothing published{activeName ? ` in ${activeName.toLowerCase()}` : ''} yet.
            </p>
            <Link
              href="/products"
              className="mt-3 inline-block text-spec text-[var(--accent)] underline decoration-1 underline-offset-4"
            >
              See everything
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {items.map((product, i) => (
                <ProductCard key={product.slug} product={product} priority={i < 4} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-16 flex items-baseline gap-5 border-t border-[var(--hairline)] pt-6"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={{
                      pathname: '/products',
                      query: { ...(active ? { category: active } : {}), page: n },
                    }}
                    aria-current={n === page ? 'page' : undefined}
                    className={`tabular-nums text-spec transition-colors duration-[var(--t-fast)] ${
                      n === page
                        ? 'text-[var(--fg)] underline decoration-[var(--accent)] decoration-2 underline-offset-4'
                        : 'text-[var(--fg-muted)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {String(n).padStart(2, '0')}
                  </Link>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Filter({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`text-spec transition-colors duration-[var(--t-fast)] ${
        active
          ? 'text-[var(--fg)] underline decoration-[var(--accent)] decoration-2 underline-offset-4'
          : 'text-[var(--fg-muted)] hover:text-[var(--accent)]'
      }`}
    >
      {label}
    </Link>
  );
}