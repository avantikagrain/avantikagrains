"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck, AlertCircle, ShoppingBag, ArrowLeft, Check, CreditCard, Truck } from "lucide-react";

interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  general?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  
  // Checkout mode: "auth" for logged in, "guest" for non-logged in, null for initial choice
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "auth" | null>(
    isAuthenticated ? "auth" : null
  );

  // Delivery & Customer Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Indore");
  const [state, setState] = useState("Madhya Pradesh");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "CASH_ON_DELIVERY">("ONLINE");

  // Sync user details if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setCheckoutMode("auth");
      if (!fullName) {
        setFullName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      }
      if (!email) {
        setEmail(user.email || "");
      }
      if (!phone && user.phone) {
        setPhone(user.phone);
      }
    }
  }, [isAuthenticated, user]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // 1. Full Name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "Full name is required.";
    } else if (trimmedName.length < 3) {
      errors.fullName = "Full name must be at least 3 characters.";
    } else if (!/^[a-zA-Z\s.]+$/.test(trimmedName)) {
      errors.fullName = "Please enter a valid name using letters only.";
    }

    // 2. Email
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    // 3. Phone (Strict Indian 10-digit mobile)
    const rawPhone = phone.replace(/\D/g, "");
    const cleanPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
    if (!cleanPhone) {
      errors.phone = "Mobile number is required.";
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
    }

    // 4. Address Line 1
    const trimmedAddr1 = addressLine1.trim();
    if (!trimmedAddr1) {
      errors.addressLine1 = "Street address is required (Flat/House No., building, street).";
    } else if (trimmedAddr1.length < 5) {
      errors.addressLine1 = "Address must be at least 5 characters for accurate delivery.";
    }

    // 5. City
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      errors.city = "City is required.";
    } else if (trimmedCity.length < 2) {
      errors.city = "Please enter a valid city name.";
    }

    // 6. State
    const trimmedState = state.trim();
    if (!trimmedState) {
      errors.state = "State is required.";
    }

    // 7. PIN Code (Strict 6 digits)
    const cleanPin = postalCode.trim();
    if (!cleanPin) {
      errors.postalCode = "PIN code is required.";
    } else if (!/^\d{6}$/.test(cleanPin)) {
      errors.postalCode = "Please enter a valid 6-digit postal PIN code.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    // Empty cart check
    if (items.length === 0) {
      setGeneralError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    // Validate all required customer & delivery fields
    const isValid = validateForm();
    if (!isValid) {
      setGeneralError("Please complete all mandatory delivery and contact fields highlighted below.");
      return;
    }

    setIsProcessing(true);

    const rawPhone = phone.replace(/\D/g, "");
    const cleanPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;

    const payload = {
      customer: {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        userId: user?.id || null,
      },
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: "India",
      },
      items: items.map((i) => ({
        id: i.product.id || i.product.slug,
        name: i.product.name,
        packSize: i.product.packSize || "1 KG",
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image || "",
      })),
      totalAmount: totalPrice,
      paymentMethod,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.validationErrors) {
          // Map backend validation errors back to frontend fields
          const mappedErrors: ValidationErrors = {};
          if (data.validationErrors["customer.name"]) mappedErrors.fullName = data.validationErrors["customer.name"];
          if (data.validationErrors["customer.email"]) mappedErrors.email = data.validationErrors["customer.email"];
          if (data.validationErrors["customer.phone"]) mappedErrors.phone = data.validationErrors["customer.phone"];
          if (data.validationErrors["shippingAddress.addressLine1"]) mappedErrors.addressLine1 = data.validationErrors["shippingAddress.addressLine1"];
          if (data.validationErrors["shippingAddress.city"]) mappedErrors.city = data.validationErrors["shippingAddress.city"];
          if (data.validationErrors["shippingAddress.state"]) mappedErrors.state = data.validationErrors["shippingAddress.state"];
          if (data.validationErrors["shippingAddress.postalCode"]) mappedErrors.postalCode = data.validationErrors["shippingAddress.postalCode"];
          setFieldErrors(mappedErrors);
        }
        throw new Error(data.error || "Failed to process order. Please verify your details.");
      }

      // Success: Route to order confirmation with real MongoDB orderId
      router.push(`/order-confirmation?orderId=${data.orderId}`);
    } catch (err: any) {
      console.error("Order submission error:", err);
      setGeneralError(err.message || "An error occurred while saving your order. Please try again.");
      setIsProcessing(false);
    }
  };

  // Render empty cart state
  if (items.length === 0) {
    return (
      <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-brand-gold/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-brand-gold" />
          </div>
          <h1 className="font-serif text-3xl mb-3">Your Cart is Empty</h1>
          <p className="text-sm text-brand-charcoal/70 mb-8">
            Add your favourite authentic flours, pulses, and grains before proceeding to checkout.
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-4 bg-brand-charcoal text-brand-ivory text-xs uppercase tracking-widest font-semibold rounded-lg hover:bg-brand-gold hover:text-brand-charcoal transition-colors"
          >
            Explore Grains
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-header-theme="light" className="min-h-screen pt-32 pb-24 bg-[#FAF7F2] text-brand-charcoal">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-charcoal/60 hover:text-brand-gold transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Checkout & Delivery</h1>
          <p className="text-xs md:text-sm text-brand-charcoal/60 mt-1">
            Complete your delivery details. All fields marked with * are required.
          </p>
        </div>

        {generalError && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold">Unable to place order</p>
              <p className="text-xs mt-0.5">{generalError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            {!checkoutMode && (
              <div className="bg-white border border-[#E9E1D2] p-8 rounded-xl shadow-sm space-y-6">
                <h2 className="font-serif text-2xl mb-2">How would you like to continue?</h2>
                <p className="text-sm text-brand-charcoal/60 mb-6">
                  Sign in to access your account, or continue as a guest with direct delivery details.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/account/login"
                    className="p-5 border border-brand-charcoal rounded-xl flex flex-col items-center justify-center text-center hover:bg-brand-charcoal hover:text-brand-ivory transition-colors group"
                  >
                    <span className="font-semibold text-sm uppercase tracking-widest mb-1">Customer Login</span>
                    <span className="text-xs text-brand-charcoal/60 group-hover:text-brand-ivory/60 transition-colors">
                      Sign in with saved email
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setCheckoutMode("guest")}
                    className="p-5 border border-brand-gold bg-brand-gold/5 rounded-xl flex flex-col items-center justify-center text-center hover:bg-brand-gold hover:text-brand-charcoal transition-colors group"
                  >
                    <span className="font-semibold text-sm uppercase tracking-widest mb-1">Guest Checkout</span>
                    <span className="text-xs text-brand-charcoal/60 group-hover:text-brand-charcoal transition-colors">
                      No account password required
                    </span>
                  </button>
                </div>
              </div>
            )}

            {checkoutMode && (
              <div className="bg-white border border-[#E9E1D2] p-6 md:p-8 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-charcoal/10">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h2 className="font-serif text-xl md:text-2xl">
                      {checkoutMode === "auth" ? "Account Delivery Details" : "Delivery & Contact Information"}
                    </h2>
                  </div>

                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => setCheckoutMode(null)}
                      className="text-xs uppercase tracking-widest text-brand-gold hover:underline font-semibold"
                    >
                      Change Mode
                    </button>
                  )}
                </div>

                <form onSubmit={handlePayment} className="space-y-6" noValidate>
                  {/* Customer Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                        className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                          fieldErrors.fullName ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                        }`}
                        placeholder="e.g. Ramesh Patel"
                        required
                      />
                      {fieldErrors.fullName && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.fullName}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                          fieldErrors.email ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                        }`}
                        placeholder="e.g. ramesh@example.com"
                        required
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                        10-Digit Mobile Number * (For Delivery SMS & Updates)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold px-2.5 py-2 bg-brand-charcoal/5 rounded border border-brand-charcoal/10 text-brand-charcoal/70">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setPhone(val);
                            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                            fieldErrors.phone ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                          }`}
                          placeholder="9876543210"
                          required
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="pt-6 border-t border-brand-charcoal/10">
                    <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
                      <span>Delivery Address</span>
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                          House/Flat No., Building, Street *
                        </label>
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => {
                            setAddressLine1(e.target.value);
                            if (fieldErrors.addressLine1) setFieldErrors((prev) => ({ ...prev, addressLine1: undefined }));
                          }}
                          className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                            fieldErrors.addressLine1 ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                          }`}
                          placeholder="e.g. 104, Shreemad Residency, Race Course Road"
                          required
                        />
                        {fieldErrors.addressLine1 && (
                          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.addressLine1}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                          Apartment, Suite, Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="w-full border-b border-brand-charcoal/20 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-gold transition-colors"
                          placeholder="e.g. Near Navda Dhar Square"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                            }}
                            className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                              fieldErrors.city ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                            }`}
                            placeholder="e.g. Indore"
                            required
                          />
                          {fieldErrors.city && (
                            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{fieldErrors.city}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => {
                              setState(e.target.value);
                              if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: undefined }));
                            }}
                            className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                              fieldErrors.state ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                            }`}
                            placeholder="e.g. Madhya Pradesh"
                            required
                          />
                          {fieldErrors.state && (
                            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{fieldErrors.state}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-widest font-semibold text-brand-charcoal/80 mb-2">
                            PIN Code * (6 Digits)
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={postalCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setPostalCode(val);
                              if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: undefined }));
                            }}
                            className={`w-full border-b py-2 text-sm bg-transparent focus:outline-none transition-colors ${
                              fieldErrors.postalCode ? "border-red-500 text-red-900" : "border-brand-charcoal/20 focus:border-brand-gold"
                            }`}
                            placeholder="452001"
                            required
                          />
                          {fieldErrors.postalCode && (
                            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{fieldErrors.postalCode}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-6 border-t border-brand-charcoal/10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <h3 className="font-serif text-xl">Select Payment Method</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label
                        className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                          paymentMethod === "ONLINE"
                            ? "border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold"
                            : "border-brand-charcoal/20 hover:border-brand-gold/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="ONLINE"
                          checked={paymentMethod === "ONLINE"}
                          onChange={() => setPaymentMethod("ONLINE")}
                          className="accent-brand-gold mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                              Paytm / UPI / Cards
                            </span>
                            <CreditCard className="w-4 h-4 text-brand-gold" />
                          </div>
                          <p className="text-[11px] text-brand-charcoal/60 leading-relaxed">
                            Pay securely via Paytm gateway, UPI (Google Pay/PhonePe), or Netbanking.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                          paymentMethod === "CASH_ON_DELIVERY"
                            ? "border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold"
                            : "border-brand-charcoal/20 hover:border-brand-gold/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH_ON_DELIVERY"
                          checked={paymentMethod === "CASH_ON_DELIVERY"}
                          onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                          className="accent-brand-gold mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                              Cash on Delivery (COD)
                            </span>
                            <Truck className="w-4 h-4 text-brand-charcoal/60" />
                          </div>
                          <p className="text-[11px] text-brand-charcoal/60 leading-relaxed">
                            Pay in cash when your farm-fresh grain batch is delivered to your doorstep.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 bg-brand-gold text-brand-charcoal font-semibold text-xs uppercase tracking-widest hover:bg-brand-charcoal hover:text-brand-ivory transition-all duration-300 disabled:opacity-50 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <span>Processing & Validating Order...</span>
                      ) : (
                        <span>
                          {paymentMethod === "ONLINE"
                            ? `Pay Now • ${formatCurrency(totalPrice, "INR")}`
                            : `Confirm Order (Cash on Delivery) • ${formatCurrency(totalPrice, "INR")}`}
                        </span>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-brand-charcoal/50 mt-3">
                      By placing this order, you agree to Avantika Grain Mills&apos; terms & delivery policy.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E9E1D2] rounded-xl p-6 sticky top-32 shadow-sm">
              <h3 className="font-serif text-xl mb-4 border-b border-brand-charcoal/10 pb-4">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs bg-brand-charcoal/5 px-2 py-1 rounded text-brand-charcoal/80">
                        {item.quantity}×
                      </span>
                      <div>
                        <p className="font-medium text-xs leading-snug line-clamp-1">{item.product.name}</p>
                        <p className="text-[10px] text-brand-charcoal/60">{item.product.packSize || "1 KG"}</p>
                      </div>
                    </div>
                    <span className="font-medium text-xs">
                      {formatCurrency((item.product.price || 0) * item.quantity, "INR")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 text-sm border-t border-brand-charcoal/10 pt-4">
                <div className="flex justify-between text-brand-charcoal/70 text-xs">
                  <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span>{formatCurrency(totalPrice, "INR")}</span>
                </div>
                <div className="flex justify-between text-brand-charcoal/70 text-xs">
                  <span>Estimated Delivery</span>
                  <span className="text-emerald-700 font-semibold uppercase tracking-wider">Free Shipping</span>
                </div>
                <div className="border-t border-brand-charcoal/10 pt-4 flex justify-between font-serif text-xl mt-2 text-brand-charcoal font-semibold">
                  <span>Total Payable</span>
                  <span className="text-brand-gold">{formatCurrency(totalPrice, "INR")}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-charcoal/10 space-y-2 text-xs text-brand-charcoal/70">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct from Mill to Home</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lab Tested & 100% Adulteration Free</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-brand-charcoal/5 text-[11px] text-brand-charcoal/50">
                  <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>SSL Encrypted & MongoDB Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
