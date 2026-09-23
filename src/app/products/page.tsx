import Link from "next/link";
import { AnimatedText } from "@/components/shared/AnimatedText";
import { ProductCatalog } from "@/components/products/ProductCatalog";

import { products } from "@/data/products";

export const metadata = {
  title: "Products | Avantika Grain Mills",
  description: "Explore our premium collection of refined grains and flours.",
};

export default function ProductsPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <header className="mb-24 mt-12 text-center md:text-left">
          <span className="text-brand-gold font-serif tracking-widest uppercase mb-4 block">Our Portfolio</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="THE AVANTIKA COLLECTION" />
          </h1>
          <p className="text-brand-charcoal/70 text-lg max-w-2xl">
            Sourced from the finest farms and processed using state-of-the-art European milling technology. Our products represent the pinnacle of purity and consistency.
          </p>
        </header>

        {/* Interactive Product Catalog */}
        <ProductCatalog products={products} />
      </div>
    </div>
  );
}
