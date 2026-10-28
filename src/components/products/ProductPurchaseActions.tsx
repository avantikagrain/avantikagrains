"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingCart, 
  Check, 
  Plus, 
  Minus, 
  Zap, 
  ArrowRight 
} from "lucide-react";

interface ProductPurchaseActionsProps {
  product: Product;
}

export function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { items, addToCart, updateQuantity } = useCart();
  const [selectedPackSize, setSelectedPackSize] = useState(
    product.packSize || (product.packSizes && product.packSizes[0]) || "1 KG"
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const cartItem = items.find((i) => i.id === product.slug);
  const inCartQty = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="bg-white border border-[#E9E1D2] rounded-2xl p-6 md:p-8 mb-12 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
      {/* Price Header */}
      <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-[#E9E1D2]">
        <span className="font-serif text-3xl md:text-4xl font-bold text-brand-charcoal">
          {formatCurrency(product.price || 0, product.currency)}
        </span>
        {product.mrp && product.price && product.mrp > product.price && (
          <>
            <span className="text-base text-brand-charcoal/40 line-through">
              MRP {formatCurrency(product.mrp, product.currency)}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              SAVE {formatCurrency(product.mrp - product.price, product.currency)}
            </span>
          </>
        )}
      </div>

      {/* Pack Size Selector (if available) */}
      {product.packSizes && product.packSizes.length > 0 && (
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-brand-charcoal/70 font-semibold mb-3">
            Select Pack Size
          </label>
          <div className="flex flex-wrap gap-2.5">
            {product.packSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedPackSize(size)}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  selectedPackSize === size
                    ? "bg-brand-charcoal text-brand-ivory shadow-sm"
                    : "border border-brand-charcoal/20 text-brand-charcoal hover:border-brand-charcoal bg-transparent"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Actions Row */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between border border-brand-charcoal/20 rounded-xl bg-[#FAF7F2] px-2 py-1.5 sm:w-36">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2 text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5 rounded-lg transition-colors"
              title="Decrease quantity"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm text-brand-charcoal px-3">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10}
              className="p-2 text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-black/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={quantity >= 10 ? "Maximum limit of 10 reached" : "Increase quantity"}
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-4 px-6 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
              isAdded
                ? "bg-emerald-600 text-white"
                : "bg-brand-gold hover:bg-brand-charcoal text-brand-charcoal hover:text-brand-ivory"
            }`}
          >
            {isAdded ? (
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
        </div>

        {/* Buy Now Button (Direct to Checkout) */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="w-full py-4 px-6 bg-brand-charcoal hover:bg-brand-charcoal/90 text-brand-ivory rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Zap className="w-4 h-4 text-brand-gold fill-brand-gold" />
          <span>Buy Now • Instant Checkout</span>
        </button>

        {/* In-Cart Status & Direct Cart Link */}
        {inCartQty > 0 && (
          <div className="pt-3 flex items-center justify-between text-xs text-brand-charcoal/70 border-t border-[#E9E1D2]/60">
            <span>Currently in your cart: <strong className="text-brand-charcoal">{inCartQty}</strong></span>
            <Link
              href="/cart"
              className="font-semibold text-brand-gold hover:text-brand-charcoal uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
