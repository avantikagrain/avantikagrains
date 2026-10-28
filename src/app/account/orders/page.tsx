"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Package, ArrowRight, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  packSize?: string;
  size?: string;
}

interface OrderDisplay {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = React.useState<OrderDisplay[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = React.useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) {
        setIsFetchingOrders(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const formatted = data.orders.map((o: any) => ({
            id: o.orderId || o._id,
            date: new Date(o.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: o.orderStatus || "CONFIRMED",
            total: o.totalAmount || 0,
            items: (o.items || []).map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              packSize: item.packSize || "1 KG",
            })),
          }));
          setOrders(formatted);
        }
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setIsFetchingOrders(false);
      }
    }

    if (isAuthenticated && user?.email) {
      loadOrders();
    }
  }, [isAuthenticated, user?.email]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] flex items-center justify-center">
        <p className="text-sm uppercase tracking-widest text-brand-charcoal/60">Loading orders...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED": return "bg-green-100 text-green-800 border-green-200";
      case "SHIPPED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "CONFIRMED":
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

        {isFetchingOrders ? (
          <div className="py-12 text-center text-brand-charcoal/60 text-sm">
            Fetching your order history...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#E9E1D2] rounded-xl p-12 text-center">
            <Package className="w-12 h-12 text-brand-charcoal/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2">No orders placed yet</h3>
            <p className="text-sm text-brand-charcoal/60 mb-6">
              You haven&apos;t placed any orders yet. Explore our fresh grains and pulses!
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-brand-charcoal text-brand-ivory text-xs uppercase tracking-widest font-semibold hover:bg-brand-gold hover:text-brand-charcoal transition-colors rounded"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
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
                        <p className="text-xs text-brand-charcoal/60">Pack Size: {item.packSize || item.size || "Standard"} | Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
