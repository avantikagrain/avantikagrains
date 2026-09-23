"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function OrderConfirmationPage() {
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Generate a fake order ID for the mockup
    const randomId = Math.floor(10000 + Math.random() * 90000);
    setOrderId(`AVT-2026-${randomId}`);
    
    // Clear the cart when reaching the success page
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal flex flex-col items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4 text-brand-charcoal">
          Order Confirmed
        </h1>
        
        <p className="text-brand-charcoal/70 mb-8 max-w-md mx-auto leading-relaxed">
          Thank you for choosing Avantika Grain Mills. Your order has been successfully placed and is being processed for premium delivery.
        </p>
        
        <div className="bg-white border border-[#E9E1D2] rounded-xl p-8 mb-10 max-w-md mx-auto text-left shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-brand-charcoal/10">
            <Package className="w-6 h-6 text-brand-gold" />
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-charcoal/60 mb-1">Order Number</p>
              <p className="font-serif text-xl">{orderId || "Processing..."}</p>
            </div>
          </div>
          
          <div className="space-y-4 text-sm text-brand-charcoal/80">
            <p>You will receive an email confirmation shortly with your complete order details and tracking information.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/account/orders"
            className="w-full sm:w-auto px-8 py-4 border border-brand-charcoal text-brand-charcoal text-xs uppercase tracking-widest font-semibold hover:bg-brand-charcoal hover:text-brand-ivory transition-colors flex items-center justify-center gap-2"
          >
            Track Order
          </Link>
          
          <Link 
            href="/products"
            className="w-full sm:w-auto px-8 py-4 bg-brand-gold text-brand-charcoal text-xs uppercase tracking-widest font-semibold hover:bg-brand-charcoal hover:text-brand-ivory transition-colors flex items-center justify-center gap-2 group"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
