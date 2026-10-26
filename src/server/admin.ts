import 'server-only';

import { connectDB } from '@/lib/db';
import {
  BulkEnquiry,
  Order,
  Product,
  User,
  type EnquiryStatus,
  type OrderStatus,
} from '@/models';

export interface DashboardMetrics {
  ordersToday: number;
  revenueTodayPaise: number;
  ordersThisMonth: number;
  revenueThisMonthPaise: number;
  awaitingAction: number;
  pendingPayment: number;
  newEnquiries: number;
  lowStockCount: number;
  customerCount: number;
}

const REVENUE_STATUSES: OrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const ACTION_STATUSES: OrderStatus[] = ['confirmed', 'processing'];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function sumRevenue(since: Date): Promise<{ count: number; totalPaise: number }> {
  const [row] = await Order.aggregate<{ count: number; totalPaise: number }>([
    { $match: { placedAt: { $gte: since }, status: { $in: REVENUE_STATUSES } } },
    { $group: { _id: null, count: { $sum: 1 }, totalPaise: { $sum: '$totalPaise' } } },
  ]);

  return { count: row?.count ?? 0, totalPaise: row?.totalPaise ?? 0 };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await connectDB();

  const [today, month, awaitingAction, pendingPayment, newEnquiries, customerCount] =
    await Promise.all([
      sumRevenue(startOfToday()),
      sumRevenue(startOfMonth()),
      Order.countDocuments({ status: { $in: ACTION_STATUSES } }),
      Order.countDocuments({ status: 'pending_payment' }),
      BulkEnquiry.countDocuments({ status: 'new' }),
      User.countDocuments({ role: 'customer' }),
    ]);

  const lowStock = await Product.aggregate<{ count: number }>([
    { $unwind: '$variants' },
    {
      $match: {
        'variants.isActive': true,
        $expr: { $lte: ['$variants.availableQty', '$variants.lowStockThreshold'] },
      },
    },
    { $count: 'count' },
  ]);

  return {
    ordersToday: today.count,
    revenueTodayPaise: today.totalPaise,
    ordersThisMonth: month.count,
    revenueThisMonthPaise: month.totalPaise,
    awaitingAction,
    pendingPayment,
    newEnquiries,
    lowStockCount: lowStock[0]?.count ?? 0,
    customerCount,
  };
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerContact: string;
  itemCount: number;
  totalPaise: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  placedAt: string;
}

export interface OrderListFilters {
  status?: OrderStatus;
  search?: string;
  page: number;
  limit: number;
}

export interface OrderListResult {
  rows: AdminOrderRow[];
  total: number;
  totalPages: number;
}

export async function listOrders(filters: OrderListFilters): Promise<OrderListResult> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(safe, 'i');
      query.$or = [
        { orderNumber: pattern },
        { guestEmail: pattern },
        { 'shippingAddress.fullName': pattern },
        { 'shippingAddress.phone': pattern },
      ];
    }
  }

  const [docs, total] = await Promise.all([
    Order.find(query)
      .sort({ placedAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .select(
        'orderNumber shippingAddress guestEmail items totalPaise status paymentMethod paymentStatus placedAt',
      )
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    rows: docs.map((doc) => ({
      id: String(doc._id),
      orderNumber: doc.orderNumber,
      customerName: doc.shippingAddress?.fullName ?? '—',
      customerContact: doc.shippingAddress?.phone ?? doc.guestEmail ?? '—',
      itemCount: doc.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      totalPaise: doc.totalPaise,
      status: doc.status,
      paymentMethod: doc.paymentMethod,
      paymentStatus: doc.paymentStatus,
      placedAt: doc.placedAt.toISOString(),
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
  };
}

export async function getOrderDetail(orderNumber: string) {
  await connectDB();

  const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() })
    .populate<{ user: { email: string; firstName?: string; lastName?: string } | null }>(
      'user',
      'email firstName lastName',
    )
    .lean();

  return order;
}

export interface EnquiryListFilters {
  status?: EnquiryStatus;
  page: number;
  limit: number;
}

export async function listEnquiries(filters: EnquiryListFilters) {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;

  const [docs, total] = await Promise.all([
    BulkEnquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .lean(),
    BulkEnquiry.countDocuments(query),
  ]);

  return {
    rows: docs,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
  };
}

export interface ProductListFilters {
  search?: string;
  page: number;
  limit: number;
}

export async function listProducts(filters: ProductListFilters) {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters.search?.trim()) {
    const safe = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safe, 'i');
    query.$or = [{ name: pattern }, { slug: pattern }, { 'variants.sku': pattern }];
  }

  const [docs, total] = await Promise.all([
    Product.find(query)
      .sort({ updatedAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .select('name slug status isFeatured variants images category')
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    rows: docs,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
  };
}

export interface CustomerListFilters {
  search?: string;
  page: number;
  limit: number;
}

export async function listCustomers(filters: CustomerListFilters) {
  await connectDB();

  const query: Record<string, unknown> = { role: 'customer' };
  if (filters.search?.trim()) {
    const safe = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safe, 'i');
    query.$or = [{ email: pattern }, { phone: pattern }, { firstName: pattern }, { lastName: pattern }];
  }

  const [docs, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .select('email phone firstName lastName createdAt emailVerifiedAt')
      .lean(),
    User.countDocuments(query),
  ]);

  const ids = docs.map((doc) => doc._id);
  const orderStats = await Order.aggregate<{
    _id: typeof ids[number];
    orders: number;
    totalPaise: number;
  }>([
    { $match: { user: { $in: ids }, status: { $in: REVENUE_STATUSES } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, totalPaise: { $sum: '$totalPaise' } } },
  ]);

  const statsById = new Map(orderStats.map((row) => [String(row._id), row]));

  return {
    rows: docs.map((doc) => {
      const stats = statsById.get(String(doc._id));
      return {
        id: String(doc._id),
        email: doc.email,
        phone: doc.phone,
        name: [doc.firstName, doc.lastName].filter(Boolean).join(' ') || '—',
        createdAt: doc.createdAt,
        emailVerified: Boolean(doc.emailVerifiedAt),
        orderCount: stats?.orders ?? 0,
        lifetimeValuePaise: stats?.totalPaise ?? 0,
      };
    }),
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
  };
}
