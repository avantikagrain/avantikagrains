"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Package, MapPin, Heart, User as UserIcon, Shield } from "lucide-react";

export default function AccountDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal flex items-center justify-center">
        <p className="text-sm uppercase tracking-widest text-brand-charcoal/60">Loading account...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/account/login");
  };

  const menuItems = [
    { title: "My Orders", desc: "Track, return, or buy things again", icon: Package, href: "/account/orders" },
    { title: "Saved Addresses", desc: "Edit addresses for orders and gifts", icon: MapPin, href: "/account/addresses" },
    { title: "Wishlist", desc: "View and manage your saved items", icon: Heart, href: "/account/wishlist" },
    { title: "Profile Info", desc: "Edit your name, mobile number, or email", icon: UserIcon, href: "/account/profile" },
    { title: "Security", desc: "Change password and manage verification", icon: Shield, href: "/account/security" },
  ];

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-charcoal/10 pb-8">
          <div>
            <span className="text-brand-gold font-serif text-xs uppercase tracking-[0.25em] font-semibold mb-2 block">
              MY ACCOUNT
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-brand-charcoal tracking-tight">
              Welcome back, <span className="italic">{user?.firstName}</span>
            </h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-charcoal/60 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {!user?.isVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-lg mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">Email Verification Required</h3>
              <p className="text-xs text-yellow-800/80">Please verify your email address to access all features.</p>
            </div>
            <button className="px-4 py-2 bg-yellow-600 text-white text-xs uppercase tracking-widest rounded hover:bg-yellow-700 transition-colors">
              Resend Link
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className="group bg-white border border-[#E9E1D2] p-8 rounded-xl hover:border-brand-gold/50 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-full flex items-center justify-center mb-6 group-hover:bg-brand-gold/10 transition-colors">
                <item.icon className="w-5 h-5 text-brand-charcoal group-hover:text-brand-gold transition-colors" />
              </div>
              <h3 className="font-serif text-xl mb-2 group-hover:text-brand-gold transition-colors">{item.title}</h3>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
