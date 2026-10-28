"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/data/products";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import {
  ShoppingCart,
  Check,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  X,
} from "lucide-react";

interface ProductCatalogProps {
  products: Product[];
}

const CATEGORIES = ["All", "Grains", "Pulses", "Seeds", "Combo Packs"];

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const { items, addToCart, updateQuantity, totalItems, totalPrice } = useCart();
  const [justAddedSlug, setJustAddedSlug] = useState<string | null>(null);
  const [toastItem, setToastItem] = useState<Product | null>(null);

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.mainCategory === activeCategory);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setJustAddedSlug(product.slug);
    setToastItem(product);

    setTimeout(() => {
      setJustAddedSlug((current) => (current === product.slug ? null : current));
    }, 2200);
  };

  return (
    <>
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-3 mb-12 border-b border-brand-charcoal/10 pb-6">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-6 py-2.5 rounded-full border text-xs tracking-widest uppercase font-medium transition-all duration-200",
              activeCategory === category
                ? "bg-brand-charcoal border-brand-charcoal text-brand-ivory shadow-sm"
                : "border-brand-charcoal/20 text-brand-charcoal/80 bg-white hover:border-brand-charcoal hover:text-brand-charcoal"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {filteredProducts.map((product) => {
          const cartItem = items.find((i) => i.id === product.slug);
          const quantityInCart = cartItem?.quantity || 0;
          const isJustAdded = justAddedSlug === product.slug;

          return (
            <div
              key={product.slug}
              className="group bg-white border border-[#E9E1D2] hover:border-brand-gold/70 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full relative"
            >
              {/* Product Image Link */}
              <Link
                href={`/products/${product.slug}`}
                className="relative aspect-[4/5] overflow-hidden rounded-xl bg-brand-cream/40 mb-5 block border border-black/5"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              {/* Product Info */}
              <div className="flex flex-col flex-1">
                {/* Category & Pack Size Badge */}
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-brand-gold text-xs tracking-widest uppercase font-semibold font-serif">
                    {product.category}
                  </span>
                  {product.packSize && (
                    <span className="text-brand-charcoal/80 text-[11px] font-medium bg-[#FAF7F2] border border-[#E9E1D2] px-2.5 py-0.5 rounded-full">
                      {product.packSize}
                    </span>
                  )}
                </div>

                {/* Title & Local Name */}
                <Link
                  href={`/products/${product.slug}`}
                  className="group-hover:text-brand-gold transition-colors block mb-2"
                >
                  <h2 className="font-serif text-2xl text-brand-charcoal tracking-tight font-medium">
                    {product.name}
                    {product.localName && (
                      <span className="font-serif font-normal text-base text-brand-charcoal/50 ml-2 italic">
                        ({product.localName})
                      </span>
                    )}
                  </h2>
                </Link>

                {/* Short Description */}
                <p className="text-brand-charcoal/70 text-xs md:text-sm line-clamp-2 leading-relaxed mb-4">
                  {product.desc}
                </p>

                {/* Pricing & Savings */}
                <div className="flex items-center gap-3 mb-6 mt-auto">
                  <span className="text-xl text-brand-charcoal font-semibold font-serif">
                    {formatCurrency(product.price || 0, product.currency)}
                  </span>
                  {product.mrp && product.price && product.mrp > product.price && (
                    <>
                      <span className="text-xs text-brand-charcoal/40 line-through">
                        MRP {formatCurrency(product.mrp, product.currency)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full ml-auto">
                        SAVE {formatCurrency(product.mrp - product.price, product.currency)}
                      </span>
                    </>
                  )}
                </div>

                {/* Action Area: Functional & Navigatable */}
                <div className="pt-2 border-t border-[#E9E1D2]/60">
                  {quantityInCart > 0 ? (
                    <div className="flex items-center gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-brand-charcoal/20 rounded-lg bg-[#FAF7F2] overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            updateQuantity(product.slug, quantityInCart - 1);
                          }}
                          className="p-2 text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5 transition-colors"
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-brand-charcoal min-w-[28px] text-center">
                          {quantityInCart}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (quantityInCart < 10) {
                              updateQuantity(product.slug, quantityInCart + 1);
                            }
                          }}
                          disabled={quantityInCart >= 10}
                          className="p-2 text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={quantityInCart >= 10 ? "Maximum limit of 10 reached" : "Increase quantity"}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* View Cart Direct Navigation Button */}
                      <Link
                        href="/cart"
                        className="flex-1 py-2.5 px-4 bg-brand-charcoal hover:bg-brand-gold text-brand-ivory hover:text-brand-charcoal rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>View Cart</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className={cn(
                        "w-full py-3 rounded-lg text-xs tracking-widest uppercase font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer",
                        isJustAdded
                          ? "bg-emerald-600 text-white border border-emerald-600 scale-[0.99]"
                          : "bg-transparent border border-brand-charcoal/30 text-brand-charcoal hover:bg-brand-charcoal hover:border-brand-charcoal hover:text-brand-ivory"
                      )}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-4 h-4 animate-in zoom-in" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-brand-charcoal/60 bg-white border border-[#E9E1D2] rounded-2xl">
            <ShoppingBag className="w-10 h-10 mx-auto text-brand-charcoal/30 mb-3" />
            <p className="font-serif text-lg mb-1">No products found in this category.</p>
            <p className="text-xs text-brand-charcoal/50">Please select another category above.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Toast Notification when an item is added */}
      {toastItem && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-brand-charcoal text-brand-ivory p-4 rounded-xl shadow-2xl border border-brand-gold/30 animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10"
            style={{ backgroundImage: `url(${toastItem.image})` }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-brand-gold text-[10px] uppercase font-bold tracking-wider mb-0.5">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Added to Cart</span>
            </div>
            <p className="text-xs font-serif font-medium truncate text-white">{toastItem.name}</p>
            <p className="text-[11px] text-white/60">
              {formatCurrency(toastItem.price || 0, toastItem.currency)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="px-3 py-1.5 bg-brand-gold text-brand-charcoal text-[11px] font-bold uppercase tracking-wider rounded hover:bg-white transition-colors shrink-0"
            >
              Cart
            </Link>
            <button
              onClick={() => setToastItem(null)}
              className="text-white/40 hover:text-white p-1"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar when Cart has items (if toast is closed) */}
      {totalItems > 0 && !toastItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-brand-charcoal/95 backdrop-blur-md text-brand-ivory px-6 py-3.5 rounded-full shadow-2xl border border-brand-gold/30 flex items-center gap-6 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
              {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
            </span>
            <span className="text-xs text-white/50">•</span>
            <span className="text-sm font-serif font-bold text-white">
              {formatCurrency(totalPrice, "INR")}
            </span>
          </div>

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 px-5 py-2 bg-brand-gold text-brand-charcoal hover:bg-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-md group"
          >
            <span>View Cart & Checkout</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </>
  );
}
