import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = body?.data?.order?.order_id || body?.data?.order_id || body?.order_id;
    const paymentStatus = body?.data?.payment?.payment_status || body?.type;

    if (!orderId) {
      return NextResponse.json({ status: "IGNORED", message: "No order_id present" }, { status: 200 });
    }

    await connectToDatabase();

    if (paymentStatus === "SUCCESS" || body?.type === "PAYMENT_SUCCESS_WEBHOOK") {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: "COMPLETED",
          orderStatus: "CONFIRMED",
        }
      );
    } else if (paymentStatus === "FAILED" || body?.type === "PAYMENT_FAILED_WEBHOOK") {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: "FAILED",
        }
      );
    }

    return NextResponse.json({ status: "OK" }, { status: 200 });
  } catch (error: any) {
    console.error("Cashfree webhook error:", error);
    return NextResponse.json({ status: "ERROR", error: error.message }, { status: 500 });
  }
}

