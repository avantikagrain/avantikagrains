/**
 * Cashfree Payments Gateway Integration Helper
 * Avantika Grain Mills
 */

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const CASHFREE_ENV = (process.env.CASHFREE_ENV || "production").toLowerCase();
const CASHFREE_API_VERSION = "2023-08-01";

export function getCashfreeBaseUrl(): string {
  if (CASHFREE_ENV === "sandbox" || CASHFREE_ENV === "test") {
    return "https://sandbox.cashfree.com/pg";
  }
  return "https://api.cashfree.com/pg";
}

function getHeaders() {
  return {
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
    "x-api-version": CASHFREE_API_VERSION,
    "Content-Type": "application/json",
  };
}

export interface CreateOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customer: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  returnUrl: string;
  notifyUrl?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  payment_session_id: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED";
  order_amount: number;
  order_currency: string;
}

/**
 * Creates an order in Cashfree and returns the payment_session_id
 */
export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeOrderResponse> {
  const baseUrl = getCashfreeBaseUrl();

  // Cashfree requires customer_phone to be 10 digits
  const cleanPhone = params.customer.customerPhone.replace(/\D/g, "").slice(-10);
  // customer_id must be alphanumeric and underscore/hyphen only
  const cleanCustomerId = (params.customer.customerId || `cust_${cleanPhone}`).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 45);

  const payload = {
    order_id: params.orderId,
    order_amount: Number(params.orderAmount.toFixed(2)),
    order_currency: params.orderCurrency || "INR",
    customer_details: {
      customer_id: cleanCustomerId || "cust_guest",
      customer_name: params.customer.customerName.trim().slice(0, 100),
      customer_email: params.customer.customerEmail.trim().toLowerCase(),
      customer_phone: cleanPhone,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl || undefined,
    },
    order_note: "Avantika Grain Mills Order",
  };

  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Cashfree order creation failed:", data);
    throw new Error(data.message || data.error || "Failed to initialize Cashfree payment.");
  }

  return data as CashfreeOrderResponse;
}

/**
 * Retrieves the latest order details and status from Cashfree
 */
export async function getCashfreeOrder(orderId: string): Promise<any> {
  const baseUrl = getCashfreeBaseUrl();

  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Failed to fetch Cashfree order [${orderId}]:`, data);
    throw new Error(data.message || `Cashfree order ${orderId} not found.`);
  }

  return data;
}

/**
 * Retrieves all payment transactions for an order from Cashfree
 */
export async function getCashfreeOrderPayments(orderId: string): Promise<any[]> {
  const baseUrl = getCashfreeBaseUrl();

  const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

