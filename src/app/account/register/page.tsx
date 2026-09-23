"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the Terms & Privacy Policy.");
      setIsLoading(false);
      return;
    }

    const parts = formData.fullName.split(" ");
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || "";

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/account/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name,
          last_name,
          phone: formData.phone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Simple error handling
        const errorMessage = Object.values(data)[0] || "Registration failed. Please try again.";
        setError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
        setIsLoading(false);
        return;
      }

      login(data.access, {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        phone: data.user.phone || "",
        isVerified: false,
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
      <div className="w-full max-w-lg px-6">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2 text-brand-gold uppercase">Create Your Account</h2>
          <p className="text-sm text-brand-ivory/60 uppercase tracking-widest">Join the Avantika family</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
              required 
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
              required 
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Mobile Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
                required 
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-brand-ivory/60 mb-2">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-brand-ivory/20 px-0 py-3 text-brand-ivory focus:border-brand-gold focus:outline-none transition-colors"
                required 
              />
            </div>
          </div>

          <div className="flex items-center pt-2 gap-3">
            <input 
              type="checkbox" 
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-gold bg-transparent border-brand-ivory/20"
            />
            <label htmlFor="agreeTerms" className="text-xs text-brand-ivory/60">
              I agree to the <Link href="/terms-and-conditions" className="text-brand-gold hover:underline">Terms</Link> & <Link href="/privacy-policy" className="text-brand-gold hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 mt-4 bg-brand-gold text-brand-charcoal text-sm tracking-wider uppercase font-semibold hover:bg-brand-ivory transition-colors disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-brand-ivory/60">
          Already have an account?{" "}
          <Link href="/account/login" className="text-brand-gold hover:text-brand-ivory transition-colors uppercase tracking-widest text-xs ml-2">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
