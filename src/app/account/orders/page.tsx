"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Package, ArrowRight, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data for display purposes
const mockOrders = [
  {
    id: "AVT-2026-00124",
    date: "23 September 2026",
    status: "SHIPPED",
    total: 598,
    items: [
      { name: "Pumpkin Seeds", quantity: 2, size: "250 g" },
      { name: "Moong Dal", quantity: 1, size: "1 KG" }
    ]
  },
  {
    id: "AVT-2026-00089",
    date: "12 August 2026",
    status: "DELIVERED",
    total: 1250,
    items: [
      { name: "Quinoa", quantity: 1, size: "1 KG" },
      { name: "Premium Pulses Combo", quantity: 1, size: "Combo" }
    ]
  }
];

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] flex items-center justify-center">
        <p className="text-sm uppercase tracking-widest text-brand-charcoal/60">Loading orders...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-green-100 text-green-800 border-green-200";
      case "SHIPPED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <div className="mb-10">
          <Link href="/account" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-charcoal/60 hover:text-brand-gold transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-serif text-4xl mb-2 tracking-tight">My Orders</h1>
          <p className="text-sm text-brand-charcoal/60">View and track your previous purchases.</p>
        </div>

        <div className="space-y-6">
          {mockOrders.map((order) => (
            <div key={order.id} className="bg-white border border-[#E9E1D2] rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              
              {/* Order Header */}
              <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E9E1D2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 font-semibold mb-1">Order Placed</p>
                  <p className="text-sm font-medium">{order.date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 font-semibold mb-1">Total</p>
                  <p className="text-sm font-medium">{formatCurrency(order.total, "INR")}</p>
                </div>
                <div className="sm:ml-auto text-right">
                  <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/60 font-semibold mb-1">Order #</p>
                  <p className="font-serif text-lg">{order.id}</p>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <Link 
                    href={`/account/orders/${order.id}`}
                    className="text-xs uppercase tracking-widest text-brand-gold hover:text-brand-charcoal font-semibold transition-colors flex items-center gap-1 group"
                  >
                    View Details
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-sm">
                      <div className="w-10 h-10 bg-[#FAF7F2] rounded flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-brand-charcoal/40" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-brand-charcoal/60">Pack Size: {item.size} | Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
