import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { createCashfreeOrder } from "@/lib/cashfree";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { customer, shippingAddress, items, totalAmount } = body;
    const errors: Record<string, string> = {};

    // 1. Customer Details Validation
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer information is required.", validationErrors: { customer: "Missing customer object" } },
        { status: 400 }
      );
    }

    const customerName = (customer.name || "").trim();
    if (!customerName || customerName.length < 3) {
      errors["customer.name"] = "Full name must be at least 3 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const customerEmail = (customer.email || "").trim().toLowerCase();
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      errors["customer.email"] = "A valid email address is required (e.g. name@example.com).";
    }

    const rawCustomerPhone = (customer.phone || "").replace(/\D/g, "");
    const customerPhone = rawCustomerPhone.length > 10 ? rawCustomerPhone.slice(-10) : rawCustomerPhone;
    if (!customerPhone || customerPhone.length !== 10 || !/^[6-9]\d{9}$/.test(customerPhone)) {
      errors["customer.phone"] = "A valid 10-digit Indian mobile number is required.";
    }

    // 2. Shipping Address Validation
    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: "Shipping address is required.", validationErrors: { shippingAddress: "Missing shippingAddress object" } },
        { status: 400 }
      );
    }

    const shippingFullName = (shippingAddress.fullName || customerName).trim();
    if (!shippingFullName || shippingFullName.length < 3) {
      errors["shippingAddress.fullName"] = "Recipient name must be at least 3 characters.";
    }

    const rawShippingPhone = (shippingAddress.phone || customerPhone || "").replace(/\D/g, "");
    const shippingPhone = rawShippingPhone.length > 10 ? rawShippingPhone.slice(-10) : rawShippingPhone;
    if (!shippingPhone || shippingPhone.length !== 10 || !/^[6-9]\d{9}$/.test(shippingPhone)) {
      errors["shippingAddress.phone"] = "Recipient contact number must be a valid 10-digit mobile number.";
    }

    const addressLine1 = (shippingAddress.addressLine1 || "").trim();
    if (!addressLine1 || addressLine1.length < 5) {
      errors["shippingAddress.addressLine1"] = "Street address (Flat/House No., building, street) must be at least 5 characters.";
    }

    const city = (shippingAddress.city || "").trim();
    if (!city || city.length < 2) {
      errors["shippingAddress.city"] = "City is required.";
    }

    const state = (shippingAddress.state || "").trim();
    if (!state || state.length < 2) {
      errors["shippingAddress.state"] = "State is required.";
    }

    const rawPin = (shippingAddress.postalCode || "").toString().trim();
    if (!rawPin || !/^\d{6}$/.test(rawPin)) {
      errors["shippingAddress.postalCode"] = "A valid 6-digit Indian PIN code is required.";
    }

    // 3. Items & Order Breakdown Validation
    if (!Array.isArray(items) || items.length === 0) {
      errors["items"] = "Your cart is empty. At least one item is required to place an order.";
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemName = (item.product?.name || item.name || "").trim();
        const itemPrice = Number(item.product?.price || item.price || 0);
        const itemQty = Number(item.quantity || 0);

        if (!itemName) {
          errors[`items[${i}].name`] = "Item name is missing.";
        }
        if (isNaN(itemPrice) || itemPrice <= 0) {
          errors[`items[${i}].price`] = `Invalid price for item "${itemName || i + 1}".`;
        }
        if (isNaN(itemQty) || itemQty < 1 || !Number.isInteger(itemQty)) {
          errors[`items[${i}].quantity`] = `Quantity must be at least 1 for "${itemName || i + 1}".`;
        } else if (itemQty > 10) {
          errors[`items[${i}].quantity`] = `Maximum limit is 10 units per item. "${itemName || i + 1}" exceeds this limit.`;
        }
      }
    }

    // 4. Total Amount Validation
    const parsedTotal = Number(totalAmount || 0);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      errors["totalAmount"] = "Total order amount must be greater than ₹0.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Mandatory checkout validation failed. Please correct the highlighted errors.",
          validationErrors: errors,
        },
        { status: 400 }
      );
    }

    // Generate human-friendly order identifier: AVT-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `AVT-${year}-${randomSuffix}`;

    // Determine host origin dynamically
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "avantikagrains.com";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const returnUrl = `${baseUrl}/api/payments/cashfree/callback?order_id={order_id}`;
    const notifyUrl = `${baseUrl}/api/payments/cashfree/webhook`;

    // 1. Create order in Cashfree FIRST (takes ~200-300ms)
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      orderAmount: parsedTotal,
      orderCurrency: "INR",
      customer: {
        customerId: customer.userId || `cust_${customerPhone}`,
        customerName,
        customerEmail,
        customerPhone,
      },
      returnUrl,
      notifyUrl,
    });

    // 2. Persist order in MongoDB (safe non-blocking)
    try {
      await connectToDatabase();
      await Order.create({
        orderId,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          userId: customer.userId || null,
        },
        shippingAddress: {
          fullName: shippingFullName,
          phone: shippingPhone,
          addressLine1,
          addressLine2: (shippingAddress.addressLine2 || "").trim(),
          city,
          state,
          postalCode: rawPin,
          country: (shippingAddress.country || "India").trim(),
        },
        items: items.map((item: any) => ({
          id: item.id || item.product?.slug || item.product?.id || `item-${Date.now()}`,
          name: (item.product?.name || item.name).trim(),
          packSize: item.product?.packSize || item.packSize || "1 KG",
          price: Number(item.product?.price || item.price || 0),
          quantity: Number(item.quantity || 1),
          image: item.product?.image || item.image || "",
        })),
        totalAmount: parsedTotal,
        currency: "INR",
        paymentMethod: "ONLINE",
        paymentStatus: "PENDING",
        orderStatus: "PROCESSING",
      });
    } catch (dbErr: any) {
      console.warn("MongoDB pre-save notice:", dbErr.message);
      // We proceed because the Cashfree order session was created successfully.
      // When the customer completes payment, callback/webhook will persist the confirmed order.
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentSessionId: cashfreeOrder.payment_session_id,
      cfOrderId: cashfreeOrder.cf_order_id,
    });
  } catch (error: any) {
    console.error("Cashfree create session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize payment session." },
      { status: 500 }
    );
  }
}
