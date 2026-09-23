"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/account/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      login(data.access, {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        phone: data.user.phone || "",
        isVerified: data.user.is_verified || false,
      });

      router.push("/account");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again later.");
      setIsLoading(false);
    }
  };

  return (
    <div data-header-theme="dark" className="min-h-screen pt-32 pb-24 bg-brand-charcoal text-brand-ivory flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2 text-brand-gold">WELCOME BACK</h2>
          <p className="text-sm text-brand-ivory/60 uppercase tracking-widest">Login to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
              required 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
              required 
            />
          </div>

          <div className="flex justify-end pt-2">
            <Link href="/account/forgot-password" className="text-xs text-brand-ivory/60 hover:text-brand-gold transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-brand-gold text-brand-charcoal text-sm tracking-wider uppercase font-semibold hover:bg-brand-ivory transition-colors disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-brand-ivory/60">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="text-brand-gold hover:text-brand-ivory transition-colors uppercase tracking-widest text-xs ml-2">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
