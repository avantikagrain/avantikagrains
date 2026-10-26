import 'server-only';
import { connectDB } from '@/lib/db';
import { Order, type OrderStatus } from '@/models';

export interface OrderListItem {
  orderNumber: string;
  placedAt: string;
  status: OrderStatus;
  paymentMethod: 'razorpay' | 'cod';
  totalPaise: number;
  itemCount: number;

  preview: { name: string; packSize: string; quantity: number; imageUrl?: string }[];
}

export async function listOrdersForUser(
  userId: string,
  limit = 25,
): Promise<OrderListItem[]> {
  await connectDB();

  const docs = await Order.find({ user: userId })
    .sort({ placedAt: -1 })
    .limit(limit)
    .select('orderNumber placedAt status paymentMethod totalPaise items')
    .lean();

  return docs.map((doc) => {
    const items = (doc.items ?? []) as {
      name: string;
      packSize: string;
      quantity: number;
      imageUrl?: string;
    }[];

    return {
      orderNumber: doc.orderNumber,

      placedAt: new Date(doc.placedAt).toISOString(),
      status: doc.status,
      paymentMethod: doc.paymentMethod,
      totalPaise: doc.totalPaise,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      preview: items.slice(0, 3).map((item) => ({
        name: item.name,
        packSize: item.packSize,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      })),
    };
  });
}

export interface OrderDetailItem {
  name: string;
  packSize: string;
  sku: string;
  quantity: number;
  unitPricePaise: number;
  lineSubtotalPaise: number;
  imageUrl?: string;
}

export interface OrderDetail {
  orderNumber: string;
  placedAt: string;
  status: OrderStatus;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: string;
  items: OrderDetailItem[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  couponCode?: string;
  customerNote?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  timeline: { status: OrderStatus; at: string; note?: string }[];
}

export async function getOrderForUser(
  userId: string,
  orderNumber: string,
): Promise<OrderDetail | null> {
  await connectDB();

  const doc = await Order.findOne({
    user: userId,
    orderNumber: orderNumber.trim().toUpperCase(),
  })
    .select(
      'orderNumber placedAt status paymentMethod paymentStatus items subtotalPaise discountPaise shippingPaise codFeePaise taxPaise totalPaise couponCode customerNote shippingAddress statusHistory',
    )
    .lean();

  if (!doc) return null;

  return {
    orderNumber: doc.orderNumber,
    placedAt: new Date(doc.placedAt).toISOString(),
    status: doc.status,
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    items: (doc.items ?? []).map((item) => ({
      name: item.name,
      packSize: item.packSize,
      sku: item.sku,
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      lineSubtotalPaise: item.lineSubtotalPaise,
      imageUrl: item.imageUrl,
    })),
    subtotalPaise: doc.subtotalPaise,
    discountPaise: doc.discountPaise,
    shippingPaise: doc.shippingPaise,
    codFeePaise: doc.codFeePaise,
    taxPaise: doc.taxPaise,
    totalPaise: doc.totalPaise,
    couponCode: doc.couponCode,
    customerNote: doc.customerNote,
    shippingAddress: {
      fullName: doc.shippingAddress.fullName,
      phone: doc.shippingAddress.phone,
      line1: doc.shippingAddress.line1,
      line2: doc.shippingAddress.line2,
      landmark: doc.shippingAddress.landmark,
      city: doc.shippingAddress.city,
      state: doc.shippingAddress.state,
      pincode: doc.shippingAddress.pincode,
    },
    timeline: (doc.statusHistory ?? []).map((event) => ({
      status: event.status,
      at: new Date(event.at).toISOString(),
      note: event.note,
    })),
  };
}
