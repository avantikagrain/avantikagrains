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
    await connectToDatabase();

    // Verify order status directly with Cashfree
    const cfOrder = await getCashfreeOrder(orderId);

    if (cfOrder.order_status === "PAID") {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: "COMPLETED",
          orderStatus: "CONFIRMED",
        }
      );

      return NextResponse.redirect(`${baseUrl}/order-confirmation?orderId=${encodeURIComponent(orderId)}`);
    } else {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: "FAILED",
        }
      );

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

