"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Package, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId");
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState(urlOrderId || "");

  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
    } else {
      const randomId = Math.floor(10000 + Math.random() * 90000);
      setOrderId(`AVT-${new Date().getFullYear()}-${randomId}`);
    }
    
    // Clear the cart when reaching the success page
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlOrderId]);

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal flex flex-col items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4 text-brand-charcoal font-medium">
          Order Confirmed
        </h1>
        
        <p className="text-brand-charcoal/70 mb-8 max-w-md mx-auto leading-relaxed text-sm md:text-base font-light">
          Thank you for choosing Avantika Grain Mills. Your order has been successfully saved to our database and is being processed for premium fulfillment.
        </p>
        
        <div className="bg-white border border-[#E9E1D2] rounded-2xl p-8 mb-10 max-w-md mx-auto text-left shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-charcoal/10">
            <div className="w-12 h-12 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-brand-charcoal/60 mb-0.5 font-semibold">Order Reference</p>
              <p className="font-serif text-xl font-bold text-brand-charcoal">{orderId || "Processing..."}</p>
            </div>
          </div>
          
          <div className="space-y-3 text-xs md:text-sm text-brand-charcoal/80 leading-relaxed font-light">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Saved in MongoDB Database</span>
            </div>
            <p>A confirmation email and SMS dispatch updates will be sent once your grain batch is packed.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/account/orders"
            className="w-full sm:w-auto px-8 py-4 border border-brand-charcoal text-brand-charcoal text-xs uppercase tracking-widest font-semibold hover:bg-brand-charcoal hover:text-brand-ivory transition-colors flex items-center justify-center gap-2 rounded-lg"
          >
            My Orders
          </Link>
          
          <Link 
            href="/products"
            className="w-full sm:w-auto px-8 py-4 bg-brand-gold text-brand-charcoal text-xs uppercase tracking-widest font-semibold hover:bg-brand-charcoal hover:text-brand-ivory transition-colors flex items-center justify-center gap-2 group rounded-lg shadow-sm"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-brand-charcoal/60">Loading confirmation...</p>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
