import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { getCashfreeOrder } from "@/lib/cashfree";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "avantikagrains.com";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/checkout?error=Invalid+order+reference`);
  }

  try {
    // 1. Verify order status directly with Cashfree
    const cfOrder = await getCashfreeOrder(orderId);

    if (cfOrder.order_status === "PAID") {
      try {
        await connectToDatabase();
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
        console.error("MongoDB order confirmation update notice:", dbErr.message);
      }

      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderId=${encodeURIComponent(orderId)}`);
    } else {
      try {
        await connectToDatabase();
        await Order.findOneAndUpdate(
          { orderId },
          {
            $set: {
              paymentStatus: "FAILED",
            },
          }
        );
      } catch (dbErr: any) {
        console.error("MongoDB failed order update notice:", dbErr.message);
      }

      return NextResponse.redirect(
        `${baseUrl}/checkout?error=Payment+could+not+be+completed.+Please+try+again.&orderId=${encodeURIComponent(orderId)}`
      );
    }
  } catch (error: any) {
    console.error("Cashfree callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=${encodeURIComponent(error.message || "Payment verification failed.")}`
    );
  }
}
