export const LAST_ORDER_KEY = 'ag_last_order';

export interface PlacedOrderItem {
  name: string;
  packSize: string;
  quantity: number;
  unitPricePaise: number;
  lineSubtotalPaise: number;
}

export interface PlacedOrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PlacedOrder {
  orderNumber: string;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: string;
  status?: string;
  totalPaise: number;
  subtotalPaise?: number;
  discountPaise?: number;
  shippingPaise?: number;
  codFeePaise?: number;
  taxPaise?: number;
  placedAt?: string;
  email?: string;
  items: PlacedOrderItem[];
  shippingAddress?: PlacedOrderAddress;
}
