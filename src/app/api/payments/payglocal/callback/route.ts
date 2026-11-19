import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

async function handleCallback(request: Request) {
  const { searchParams } = new URL(request.url);
  let orderId = searchParams.get("order_id") || searchParams.get("merchantTxnId") || searchParams.get("orderId");
  let status = searchParams.get("status");

  // In case PayGlocal sent a POST body
  if (request.method === "POST") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await request.json();
        orderId = body.merchantTxnId || body.orderId || body.merchantUniqueId || orderId;
        status = body.status || status;
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        orderId = (formData.get("merchantTxnId") as string) || (formData.get("orderId") as string) || orderId;
        status = (formData.get("status") as string) || status;
      }
    } catch {
      // Ignore body parse errors if query parameters exist
    }
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "avantikagrains.com";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/checkout?error=Missing+order+reference+from+PayGlocal`);
  }

  const isSuccess = !status || status.toUpperCase() === "SUCCESS" || status.toUpperCase() === "COMPLETED";

  try {
    await connectToDatabase();

    if (isSuccess) {
      try {
        await Order.findOneAndUpdate(
          { orderId },
          {
            $set: {
              paymentStatus: "COMPLETED",
              orderStatus: "CONFIRMED",
            },
          },
          { upsert: true, new: true }
        );
      } catch (dbErr: any) {
        console.error("MongoDB order confirmation update notice (PayGlocal):", dbErr.message);
      }

      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderId=${encodeURIComponent(orderId)}`);
    } else {
      try {
        await Order.findOneAndUpdate(
          { orderId },
          {
            $set: {
              paymentStatus: "FAILED",
            },
          }
        );
      } catch (dbErr: any) {
        console.error("MongoDB failed order update notice (PayGlocal):", dbErr.message);
      }

      return NextResponse.redirect(
        `${baseUrl}/checkout?error=PayGlocal+payment+could+not+be+completed.+Please+try+again.&orderId=${encodeURIComponent(orderId)}`
      );
    }
  } catch (error: any) {
    console.error("PayGlocal callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=${encodeURIComponent(error.message || "Payment verification failed.")}`
    );
  }
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}
