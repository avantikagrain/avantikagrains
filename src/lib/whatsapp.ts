import { siteContact } from '@/config/site';
import { formatPaise } from '@/lib/format';

export interface WhatsappLinkOptions {
  message: string;
  phone?: string;
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(1);
  return digits;
}

export function buildWhatsappLink({ message, phone }: WhatsappLinkOptions): string | null {
  const target = normalisePhone(phone ?? siteContact.whatsappNumber);
  if (target.length < 11) return null;
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function quickChatMessage(context?: string): string {
  const lines = [`Hello ${siteContact.tradingName}, I would like to know more.`];
  if (context) lines.push('', `Regarding: ${context}`);
  return lines.join('\n');
}

export interface BulkEnquiryMessageInput {
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  city?: string;
  productInterest: string;
  estimatedQuantity: string;
  frequency?: string;
  message?: string;
  referenceId?: string;
}

export function bulkEnquiryMessage(input: BulkEnquiryMessageInput): string {
  const rows: string[] = [
    `Bulk order enquiry — ${siteContact.tradingName}`,
    '',
    `Company: ${input.companyName}`,
    `Contact: ${input.contactName}`,
    `Phone: ${input.phone}`,
  ];

  if (input.email) rows.push(`Email: ${input.email}`);
  if (input.city) rows.push(`City: ${input.city}`);

  rows.push(
    `Product: ${input.productInterest}`,
    `Quantity: ${input.estimatedQuantity}`,
  );

  if (input.frequency) rows.push(`Frequency: ${input.frequency}`);
  if (input.message) rows.push('', `Notes: ${input.message}`);
  if (input.referenceId) rows.push('', `Reference: ${input.referenceId}`);

  return rows.join('\n');
}

export interface OrderChatInput {
  orderNumber: string;
  totalPaise: number;
  status: string;
}

export function orderSupportMessage(input: OrderChatInput): string {
  return [
    `Hello ${siteContact.tradingName}, I need help with an order.`,
    '',
    `Order: ${input.orderNumber}`,
    `Amount: ${formatPaise(input.totalPaise)}`,
    `Status: ${input.status.replace(/_/g, ' ')}`,
  ].join('\n');
}

export function productEnquiryMessage(productName: string, packSize?: string): string {
  const subject = packSize ? `${productName} (${packSize})` : productName;
  return [
    `Hello ${siteContact.tradingName}, I would like to enquire about ${subject}.`,
  ].join('\n');
}
