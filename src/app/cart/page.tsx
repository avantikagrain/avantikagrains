"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal">
      <div className="container mx-auto px-6 md:px-12 max-w-6xl">
        <h1 className="font-serif text-4xl mb-8 tracking-tight">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E9E1D2] rounded-xl">
            <h2 className="font-serif text-2xl mb-4">Your cart is empty</h2>
            <p className="text-brand-charcoal/60 mb-8 max-w-md mx-auto">
              Looks like you haven&apos;t added any premium grains or pulses to your cart yet.
            </p>
            <Link 
              href="/products"
              className="inline-block px-8 py-3 bg-brand-gold text-brand-charcoal text-sm uppercase tracking-widest font-medium hover:bg-brand-charcoal hover:text-brand-ivory transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-white border border-[#E9E1D2] rounded-xl">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                    <Image 
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-serif text-xl">{item.product.name}</h3>
                        {item.product.packSize && (
                          <span className="text-xs text-brand-charcoal/60">Pack Size: {item.product.packSize}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-brand-charcoal/40 hover:text-red-500 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-brand-charcoal/20 rounded">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-brand-charcoal/60 hover:bg-brand-charcoal/5 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-4 py-1 text-sm font-medium border-x border-brand-charcoal/20">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-brand-charcoal/60 hover:bg-brand-charcoal/5 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-medium">
                        {formatCurrency((item.product.price || 0) * item.quantity, item.product.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-[#E9E1D2] rounded-xl p-8 sticky top-32">
                <h3 className="font-serif text-2xl mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-brand-charcoal/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice, "INR")}</span>
                  </div>
                  <div className="flex justify-between text-brand-charcoal/70">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-brand-charcoal/10 pt-4 flex justify-between font-serif text-xl mt-4">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice, "INR")}</span>
                  </div>
                </div>

                <Link href="/checkout" className="w-full py-4 bg-brand-charcoal text-brand-ivory uppercase tracking-widest text-xs font-semibold hover:bg-brand-gold hover:text-brand-charcoal transition-colors flex items-center justify-center gap-2 group">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
