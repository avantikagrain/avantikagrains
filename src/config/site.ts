export interface SiteContact {
  legalName: string;
  tradingName: string;
  supportEmail: string;
  salesEmail: string;
  phoneDisplay: string;
  whatsappNumber: string;
  addressLines: string[];
  gstin: string;
  businessHours: string;
}

function fromEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export const siteContact: SiteContact = {
  legalName: fromEnv('NEXT_PUBLIC_LEGAL_NAME', 'Avantika Grain Mills Pvt. Ltd.'),
  tradingName: fromEnv('NEXT_PUBLIC_TRADING_NAME', 'Avantika Grains'),
  supportEmail: fromEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@avantikagrains.com'),
  salesEmail: fromEnv('NEXT_PUBLIC_SALES_EMAIL', 'sales@avantikagrains.com'),
  phoneDisplay: fromEnv('NEXT_PUBLIC_PHONE_DISPLAY', ''),
  whatsappNumber: fromEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', ''),
  addressLines: fromEnv('NEXT_PUBLIC_ADDRESS', 'Depalpur, Indore, Madhya Pradesh')
    .split('|')
    .map((line) => line.trim())
    .filter(Boolean),
  gstin: fromEnv('NEXT_PUBLIC_GSTIN', ''),
  businessHours: fromEnv('NEXT_PUBLIC_BUSINESS_HOURS', 'Mon–Sat, 9:30am – 6:30pm IST'),
};

export const isWhatsappConfigured = siteContact.whatsappNumber.length > 0;
