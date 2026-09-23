"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "auth" | null>(
    isAuthenticated ? "auth" : null
  );

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing delay
    setTimeout(() => {
      router.push("/order-confirmation");
    }, 1500);
  };

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <h1 className="font-serif text-4xl mb-10 tracking-tight">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Checkout Flow */}
          <div className="lg:col-span-2">
            {!checkoutMode && (
              <div className="bg-white border border-[#E9E1D2] p-8 rounded-xl space-y-6">
                <h2 className="font-serif text-2xl mb-2">How would you like to checkout?</h2>
                <p className="text-sm text-brand-charcoal/60 mb-8">
                  Sign in to use your saved addresses, or easily continue as a guest.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link 
                    href="/account/login"
                    className="py-4 border border-brand-charcoal flex flex-col items-center justify-center text-center hover:bg-brand-charcoal hover:text-brand-ivory transition-colors group"
                  >
                    <span className="font-semibold text-sm uppercase tracking-widest mb-1">Login</span>
                    <span className="text-xs text-brand-charcoal/60 group-hover:text-brand-ivory/60 transition-colors">Use saved details</span>
                  </Link>

                  <button 
                    onClick={() => setCheckoutMode("guest")}
                    className="py-4 border border-brand-charcoal/20 flex flex-col items-center justify-center text-center hover:border-brand-gold hover:bg-brand-gold/5 transition-colors"
                  >
                    <span className="font-semibold text-sm uppercase tracking-widest mb-1">Guest Checkout</span>
                    <span className="text-xs text-brand-charcoal/60">No account required</span>
                  </button>
                </div>
              </div>
            )}

            {checkoutMode === "guest" && !isAuthenticated && (
              <div className="bg-white border border-[#E9E1D2] p-8 rounded-xl">
                <h2 className="font-serif text-2xl mb-6">Guest Checkout</h2>
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-2">Full Name</label>
                      <input type="text" className="w-full border-b border-brand-charcoal/20 py-2 focus:outline-none focus:border-brand-gold bg-transparent" required />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-2">Email</label>
                      <input type="email" className="w-full border-b border-brand-charcoal/20 py-2 focus:outline-none focus:border-brand-gold bg-transparent" required />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-2">Phone</label>
                      <input type="tel" className="w-full border-b border-brand-charcoal/20 py-2 focus:outline-none focus:border-brand-gold bg-transparent" required />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-brand-charcoal/10">
                    <h3 className="font-serif text-xl mb-4">Delivery Address</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-2">Address Line 1</label>
                        <input type="text" className="w-full border-b border-brand-charcoal/20 py-2 focus:outline-none focus:border-brand-gold bg-transparent" required />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-2">City</label>
                          <input type="text" className="w-full border-b border-brand-charcoal/20 py-2 focus:outline-none focus:border-brand-gold bg-transparent" required />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-brand-charcoal/60 mb-2">PIN Code</label>
                          <input type="text" className="w-full border-b border-brand-charcoal/20 py-2 focus:outline-none focus:border-brand-gold bg-transparent" required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full py-4 bg-brand-gold text-brand-charcoal font-semibold text-sm uppercase tracking-widest hover:bg-brand-charcoal hover:text-brand-ivory transition-colors mt-8 disabled:opacity-50"
                  >
                    {isProcessing ? "Processing Payment..." : "Continue to Payment"}
                  </button>
                </form>
              </div>
            )}

            {checkoutMode === "auth" && isAuthenticated && (
              <div className="bg-white border border-[#E9E1D2] p-8 rounded-xl">
                <div className="flex items-center justify-between mb-6 border-b border-brand-charcoal/10 pb-4">
                  <h2 className="font-serif text-2xl">Delivery Details</h2>
                  <span className="text-sm font-medium text-brand-charcoal/60">{user?.email}</span>
                </div>
                
                <p className="text-sm text-brand-charcoal/60 mb-6">
                  Select a saved address from your account.
                </p>
                
                {/* Placeholder for saved addresses */}
                <div className="border border-brand-gold bg-brand-gold/5 p-4 rounded mb-6 flex justify-between items-start cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold bg-brand-gold px-2 py-0.5 rounded text-brand-charcoal mb-2 inline-block uppercase tracking-wider">HOME</span>
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-brand-charcoal/70 mt-1">
                      123 Premium Lane, Near Square<br/>
                      Indore, Madhya Pradesh, 452001
                    </p>
                  </div>
                  <input type="radio" name="address" checked readOnly className="accent-brand-gold w-4 h-4 mt-1" />
                </div>

                <button className="text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-gold font-medium mb-8">
                  + Add New Address
                </button>

                <form onSubmit={handlePayment}>
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full py-4 bg-brand-gold text-brand-charcoal font-semibold text-sm uppercase tracking-widest hover:bg-brand-charcoal hover:text-brand-ivory transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Processing Payment..." : "Continue to Payment"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E9E1D2] rounded-xl p-6 sticky top-32">
              <h3 className="font-serif text-xl mb-4 border-b border-brand-charcoal/10 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-brand-charcoal/60">{item.quantity} ×</span>
                      <span className="truncate max-w-[120px]">{item.product.name}</span>
                    </div>
                    <span>{formatCurrency((item.product.price || 0) * item.quantity, "INR")}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 text-sm border-t border-brand-charcoal/10 pt-4">
                <div className="flex justify-between text-brand-charcoal/70">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalPrice, "INR")}</span>
                </div>
                <div className="flex justify-between text-brand-charcoal/70">
                  <span>Shipping</span>
                  <span>Calculated next</span>
                </div>
                <div className="border-t border-brand-charcoal/10 pt-4 flex justify-between font-serif text-xl mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice, "INR")}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
