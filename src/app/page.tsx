import Link from 'next/link';
import { ArrowRight, Leaf, ShieldCheck, Truck, Wheat } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { HeroBanners } from '@/components/site/hero-banners';
import { ProcessStages } from '@/components/site/process-stages';
import { getFeaturedProducts, listCategories } from '@/server/catalogue';

export const revalidate = 3600;

const TRUST = [
  { Icon: Leaf, title: '100% natural', body: 'Pure and unadulterated. No chemical washes at any stage.' },
  { Icon: ShieldCheck, title: 'Premium quality', body: 'Optically graded kernel by kernel, benchmarked per batch.' },
  { Icon: Wheat, title: 'Cold-milled', body: 'Temperature-controlled, so germ oils and fibre survive.' },
  { Icon: Truck, title: 'Pan-India delivery', body: 'Retail packs and bulk, shipped across the country.' },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    // Twelve rather than eight: a retail homepage's job is to put stock in
    // front of people, and three full rows reads as a shop rather than a
    // teaser.
    getFeaturedProducts(12),
    listCategories(),
  ]);

  return (
    <>
      <HeroBanners />

      {/*
        Products sit directly under the hero.

        Anything placed between the two — a brand statement, a trust strip —
        pushes the first product below the fold, which is the one thing a
        storefront homepage cannot afford. The brand copy and the process
        story still appear, further down, where someone who is reading
        rather than shopping will reach them.

        The page's h1 lives here so it is both the SEO heading and the
        shopping headline, instead of occupying a section of its own.
      */}
      <section className="mx-auto max-w-[86rem] px-4 pt-12 pb-20 sm:px-6 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <p className="label">Pure grains · Healthy families · Brighter tomorrows</p>
            <h1 className="display mt-3 text-h2">
              Premium grains. <span className="text-[var(--gold)]">Precisely refined.</span>
            </h1>
          </div>

          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-spec font-medium text-[var(--accent)]"
          >
            View all 31 products
            <ArrowRight
              size={15}
              className="transition-transform duration-[var(--t-base)] ease-[var(--ease-lux)] group-hover:translate-x-1"
            />
          </Link>
        </div>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="pill pill-plain transition-colors duration-[var(--t-fast)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}

        {products.length === 0 ? (
          <div className="panel mt-8 rounded-[var(--radius-panel-lg)] p-12 text-center">
            <p className="text-[var(--fg-muted)]">No products are published yet.</p>
            <p className="mt-2 text-spec text-[var(--fg-faint)]">
              Run <code className="text-[var(--accent)]">npm run seed:products</code>, then{' '}
              <code className="text-[var(--accent)]">npm run seed:demo</code>.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product, i) => (
              // The first row is above the fold on most screens and must
              // not be lazy-loaded.
              <ProductCard key={product.slug} product={product} priority={i < 4} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/products" className="btn btn-outline">
            Browse all products
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Trust — below the shelf, where it reassures rather than delays. */}
      <section className="border-y border-[var(--hairline)] bg-[var(--bg-sunken)]">
        <div className="mx-auto max-w-[86rem] px-4 py-14 sm:px-6">
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {TRUST.map(({ Icon, title, body }) => (
              <li key={title} className="panel reveal rounded-[var(--radius-panel)] p-5">
                <span
                  aria-hidden
                  className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-forest-100)] text-[var(--accent)]"
                >
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <h2 className="mt-3.5 text-body font-medium">{title}</h2>
                <p className="mt-1.5 text-spec leading-relaxed text-[var(--fg-muted)]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The milling story, for anyone still reading. */}
      <ProcessStages />

      <section className="mx-auto max-w-[86rem] px-4 py-20 sm:px-6">
        <div className="panel gold-edge reveal overflow-hidden rounded-[var(--radius-panel-lg)] px-6 py-14 text-center sm:px-14">
          <p className="label">Bulk &amp; wholesale</p>
          <h2 className="display mx-auto mt-4 max-w-2xl text-h2">Supply, by the tonne.</h2>
          <p className="measure mx-auto mt-5 text-[var(--fg-muted)]">
            Volume, private label, or a specification you need the mill to hit. Tell us
            what you need and we will say plainly whether we can meet it.
          </p>
          <Link href="/bulk-orders" className="btn btn-primary mt-8">
            Start an enquiry
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}