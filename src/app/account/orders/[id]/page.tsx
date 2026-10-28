"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Package, CheckCircle2, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderDetail {
  orderId: string;
  createdAt: string;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    packSize: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/account/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found.");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] flex items-center justify-center">
        <p className="text-sm uppercase tracking-widest text-brand-charcoal/60">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal flex flex-col items-center justify-center px-6">
        <h2 className="font-serif text-3xl mb-3 text-brand-charcoal">Order Not Found</h2>
        <p className="text-sm text-brand-charcoal/60 mb-6">{error || "Could not retrieve order details."}</p>
        <Link
          href="/account/orders"
          className="px-6 py-3 bg-brand-charcoal text-brand-ivory text-xs uppercase tracking-widest font-semibold rounded hover:bg-brand-gold hover:text-brand-charcoal transition-colors"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-charcoal/60 hover:text-brand-gold transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-1">
                Order <span className="font-sans font-bold">{order.orderId}</span>
              </h1>
              <p className="text-xs text-brand-charcoal/60">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 text-xs uppercase tracking-widest font-bold border border-emerald-200">
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E9E1D2] rounded-xl p-6">
              <h2 className="font-serif text-lg mb-4 pb-3 border-b border-brand-charcoal/10">Ordered Items</h2>
              <div className="divide-y divide-brand-charcoal/10">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#FAF7F2] rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-brand-charcoal/40" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-brand-charcoal/60">Pack Size: {item.packSize} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity, "INR")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white border border-[#E9E1D2] rounded-xl p-6">
              <h2 className="font-serif text-lg mb-4 pb-3 border-b border-brand-charcoal/10 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-gold" />
                Payment Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brand-charcoal/70">
                  <span>Payment Method</span>
                  <span className="font-medium text-brand-charcoal">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-brand-charcoal/70">
                  <span>Payment Status</span>
                  <span className="font-medium text-emerald-700">{order.paymentStatus}</span>
                </div>
                <div className="pt-3 border-t border-brand-charcoal/10 flex justify-between font-bold text-base">
                  <span>Total Paid</span>
                  <span className="text-brand-gold">{formatCurrency(order.totalAmount, "INR")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="bg-white border border-[#E9E1D2] rounded-xl p-6 sticky top-28">
              <h2 className="font-serif text-lg mb-4 pb-3 border-b border-brand-charcoal/10 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-gold" />
                Delivery Address
              </h2>
              <div className="text-sm space-y-1 text-brand-charcoal/80">
                <p className="font-semibold text-brand-charcoal">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-2 text-xs text-brand-charcoal/60">Phone: {order.shippingAddress.phone}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-brand-charcoal/10 flex items-center gap-2 text-emerald-700 text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verified in MongoDB Database</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
