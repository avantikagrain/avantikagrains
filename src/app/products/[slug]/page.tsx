import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/product/add-to-cart';
import { getProductBySlug } from '@/server/catalogue';
import { formatPaise, savingsPercent } from '@/lib/format';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Not found' };

  return {
    title: product.seo?.title ?? product.name,
    description: product.seo?.description ?? product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const primary = product.variants[0];
  const discount = primary ? savingsPercent(primary.pricePaise, primary.mrpPaise) : null;
  const disclosures = product.foodDisclosures;

  return (
    <article className="pb-28 lg:pb-0">
      <div className="mx-auto max-w-[86rem] px-5 pt-32 sm:px-8 sm:pt-36">
        <nav aria-label="Breadcrumb" className="text-spec text-[var(--fg-faint)]">
          <Link href="/products" className="transition-colors hover:text-[var(--accent)]">
            Collection
          </Link>
          {product.category && (
            <>
              <span> / </span>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="transition-colors hover:text-[var(--accent)]"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="mx-auto grid max-w-[86rem] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-14">
        <figure className="m-0">
          <div className="media border border-[var(--hairline)]">
            {product.images[0] && (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"

                priority
                className="object-cover"
              />
            )}
          </div>

        </figure>

        <div>
          <h1 className="display text-h1 leading-[1.03]">{product.name}</h1>

          {product.localName && (
            <p className="display mt-2 text-h3 italic text-[var(--fg-faint)]">
              {product.localName}
            </p>
          )}

          <p className="measure mt-7 text-lead leading-relaxed text-[var(--fg-muted)]">
            {product.shortDescription}
          </p>

          {primary && (
            <div className="mt-9 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-[var(--hairline-strong)] pt-6">
              <span className="display tabular-nums text-figure leading-none">
                {formatPaise(primary.pricePaise)}
              </span>
              {discount !== null && (
                <span className="tabular-nums text-spec text-[var(--fg-faint)]">
                  <s>{formatPaise(primary.mrpPaise)}</s>
                  <span className="ml-2 text-[var(--accent)]">−{discount}%</span>
                </span>
              )}
              <span className="w-full text-spec text-[var(--fg-faint)]">
                Inclusive of GST · {primary.packSize}
              </span>
            </div>
          )}

          <AddToCart product={product} />

          {product.longDescription && (
            <p className="measure mt-10 border-t border-[var(--hairline)] pt-8 leading-relaxed text-[var(--fg-muted)]">
              {product.longDescription}
            </p>
          )}
        </div>
      </div>

      <section className="border-t border-[var(--hairline)] bg-[var(--bg-raised)]">
        <div className="mx-auto grid max-w-[86rem] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[22rem_1fr] lg:gap-16 lg:py-16">
          <h2 className="display text-h2">Product information</h2>

          <dl>
            {disclosures.countryOfOrigin && (
              <div className="spec">
                <dt>Country of origin</dt>
                <dd>{disclosures.countryOfOrigin}</dd>
              </div>
            )}
            {disclosures.isVegetarian !== undefined && (
              <div className="spec">
                <dt>Dietary</dt>
                <dd>{disclosures.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}</dd>
              </div>
            )}
            {disclosures.shelfLifeDays && (
              <div className="spec">
                <dt>Shelf life</dt>
                <dd className="tabular-nums">{disclosures.shelfLifeDays} days from packing</dd>
              </div>
            )}
            {disclosures.storageInstructions && (
              <div className="spec">
                <dt>Storage</dt>
                <dd>{disclosures.storageInstructions}</dd>
              </div>
            )}
            {disclosures.manufacturerName && (
              <div className="spec">
                <dt>Manufactured and packed by</dt>
                <dd>{disclosures.manufacturerName}</dd>
              </div>
            )}
            {product.specifications.length > 0 &&
              product.specifications.map((spec) => (
                <div key={spec.label} className="spec">
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            <div className="spec">
              <dt>Grading</dt>
              <dd>
                Optically sorted to the mill&rsquo;s 99.98% threshold —{' '}
                <Link
                  href="/quality"
                  className="text-[var(--accent)] underline decoration-1 underline-offset-2"
                >
                  how grading works
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </article>
  );
}
