import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getProductBySlug } from "@/data/products";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-[#F9F7F3] min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-12">
          <Link href="/#products" className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-brand-charcoal hover:text-brand-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Product Hero Image */}
          <div className="relative aspect-[4/5] lg:sticky lg:top-32 w-full border border-brand-charcoal/10 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${product.image})` }}
            />
            {/* Subtle Overlay for grain/texture */}
            <div className="absolute inset-0 bg-[#F9F7F3]/10 mix-blend-overlay pointer-events-none" />
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <span className="text-brand-gold font-serif text-sm tracking-widest uppercase mb-4 block">
              {product.category}
            </span>
            <div className="mb-8">
              <h1 className="font-serif text-4xl md:text-6xl text-brand-charcoal uppercase tracking-tight mb-2">
                {product.name}
              </h1>
              {product.localName && (
                <span className="text-brand-charcoal/40 font-serif text-2xl md:text-3xl italic">
                  {product.localName}
                </span>
              )}
            </div>
            
            <p className="text-brand-charcoal/80 text-lg md:text-xl leading-relaxed mb-12 font-light">
              {product.desc}
            </p>

            {/* Key Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl text-brand-charcoal mb-6 uppercase tracking-wider">Key Characteristics</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-3 text-brand-charcoal/80">
                      <CheckCircle2 className="w-5 h-5 text-brand-gold" />
                      <span className="font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="mb-12">
                <h3 className="font-serif text-2xl text-brand-charcoal mb-6 uppercase tracking-wider">Technical Specifications</h3>
                <div className="bg-transparent border border-brand-charcoal/10">
                  {product.specifications.map((spec: {label: string, value: string}, idx: number) => (
                    <div key={idx} className="flex justify-between px-6 py-4 border-b border-brand-charcoal/10 last:border-0">
                      <span className="font-medium text-brand-charcoal/90">{spec.label}</span>
                      <span className="text-brand-charcoal/60 font-light">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packaging */}
            {product.packSizes && product.packSizes.length > 0 && (
              <div className="mb-16">
                <h3 className="font-serif text-2xl text-brand-charcoal mb-6 uppercase tracking-wider">Available Packaging</h3>
                <div className="flex flex-wrap gap-3">
                  {product.packSizes.map((size: string, idx: number) => (
                    <span key={idx} className="px-6 py-3 border border-brand-charcoal/20 rounded-sm text-sm uppercase tracking-wider font-medium text-brand-charcoal/80">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Business Enquiry CTA */}
            <div className="bg-brand-charcoal text-[#F9F7F3] p-8 md:p-12 text-center mt-auto">
              <h3 className="font-serif text-3xl mb-4">REQUIRE BULK SUPPLY?</h3>
              <p className="text-[#F9F7F3]/70 mb-8 font-light">
                Discuss your business requirements with our sales team for custom specifications and volume pricing.
              </p>
              <Link href="/contact" className="inline-block px-8 py-4 bg-brand-gold text-brand-charcoal font-medium uppercase tracking-wider hover:bg-[#F9F7F3] transition-colors">
                Business Enquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
