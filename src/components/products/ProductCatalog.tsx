"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/data/products";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCatalogProps {
  products: Product[];
}

const CATEGORIES = ["All", "Grains", "Pulses", "Seeds", "Combo Packs"];

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const { addToCart } = useCart();

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.mainCategory === activeCategory);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-12 border-b border-brand-charcoal/10 pb-6">
        {CATEGORIES.map(category => (
          <button 
            key={category} 
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-6 py-2 rounded-full border border-brand-charcoal text-sm tracking-wider uppercase transition-colors",
              activeCategory === category 
                ? "bg-brand-charcoal text-brand-ivory" 
                : "hover:bg-brand-charcoal hover:text-brand-ivory text-brand-charcoal bg-transparent"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {filteredProducts.map((product) => (
          <Link 
            href={`/products/${product.slug}`} 
            key={product.slug}
            className="group flex flex-col h-full"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream mb-6">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${product.image})` }}
              />
            </div>
            <div className="flex flex-col flex-1 h-full">
              <div className="w-full mb-3">
                <div className="flex justify-between items-center w-full mb-2">
                  <span className="text-brand-gold text-xs tracking-widest uppercase">
                    {product.category}
                  </span>
                  {product.packSize && (
                    <span className="text-brand-charcoal text-xs font-medium bg-brand-charcoal/5 px-2 py-1 rounded">
                      {product.packSize}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-2xl text-brand-charcoal mb-2">
                  {product.name}
                  {product.localName && (
                    <span className="font-serif font-normal text-base text-brand-charcoal/60 ml-2 italic">
                      ({product.localName})
                    </span>
                  )}
                </h2>
                <p className="text-brand-charcoal/70 text-sm line-clamp-2">{product.desc}</p>
              </div>

              <div className="w-full mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-lg text-brand-charcoal font-medium">
                    {formatCurrency(product.price || 0, product.currency)}
                  </span>
                  {product.mrp && product.price && product.mrp > product.price && (
                    <>
                      <span className="text-xs text-brand-charcoal/50 line-through">
                        MRP {formatCurrency(product.mrp, product.currency)}
                      </span>
                      <span className="text-[10px] text-[#28a745] font-medium bg-[#28a745]/10 px-2 py-0.5 rounded ml-auto">
                        SAVE {formatCurrency(product.mrp - product.price, product.currency)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full mt-auto">
                <button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    addToCart(product, 1);
                  }}
                  className="w-full py-2.5 bg-transparent border border-brand-charcoal/20 text-brand-charcoal text-xs tracking-widest uppercase hover:bg-brand-charcoal hover:border-brand-charcoal hover:text-brand-ivory transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </Link>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-brand-charcoal/60">
            No products found in this category.
          </div>
        )}
      </div>
    </>
  );
}
